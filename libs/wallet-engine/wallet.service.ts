// ============================================================================
// libs/wallet-engine/wallet.service.ts
// ============================================================================

import { WalletRepository, WalletBalance, Transaction, Order } from '../core-db';
import { TransactionType, TransactionCategory, logger } from '../shared-utils';
import { v4 as uuidv4 } from 'uuid';
import { CommissionCalculator } from './commission.calculator';

export class WalletService {
  private walletRepo: WalletRepository;
  private calculator: CommissionCalculator;

  constructor() {
    this.walletRepo = new WalletRepository();
    this.calculator = new CommissionCalculator();
  }

  /**
   * Get wallet balance
   */
  async getBalance(entityType: string, entityId: string): Promise<WalletBalance> {
    return this.walletRepo.getOrCreateWallet(entityType, entityId);
  }

  /**
   * Process order completion and distribute funds (ACID transaction)
   */
  async processOrderCompletion(order: Order): Promise<{
    success: boolean;
    transactions: Array<{ entityType: string; entityId: string; amount: number; txnId: string }>;
  }> {
    const { orderId, orderType, userId, vendorId, riderId, pricing } = order;
    const timestamp = new Date().toISOString();

    // Calculate split
    const split = this.calculator.calculateSplit(orderType as any, {
      subtotal: pricing.subtotal,
      deliveryFee: pricing.deliveryFee,
      total: pricing.total,
    });

    const { adminCut, vendorShare, riderFee } = split;

    // Get current balances
    const [adminBalance, vendorBalance, riderBalance] = await Promise.all([
      this.walletRepo.getOrCreateWallet('ADMIN', 'platform'),
      vendorId ? this.walletRepo.getOrCreateWallet('VENDOR', vendorId) : Promise.resolve(null),
      this.walletRepo.getOrCreateWallet('RIDER', riderId!),
    ]);

    // Generate transaction IDs
    const adminTxnId = uuidv4();
    const vendorTxnId = vendorId ? uuidv4() : null;
    const riderTxnId = uuidv4();

    // Build transaction items for atomic write
    const transactItems: any[] = [
      // 1. Credit admin wallet
      {
        operation: 'Update' as const,
        key: { PK: 'WALLET#ADMIN#platform', SK: 'BALANCE' },
        updateExpression: 'ADD availableBalance :amount, totalEarned :amount SET updatedAt = :timestamp',
        expressionAttributeValues: {
          ':amount': adminCut,
          ':timestamp': timestamp,
        },
      },
      // 2. Add admin transaction
      {
        operation: 'Put' as const,
        item: {
          PK: 'WALLET#ADMIN#platform',
          SK: `TXN#${timestamp}#${adminTxnId}`,
          GSI1PK: `ORDER#${orderId}#TRANSACTIONS`,
          GSI1SK: `TXN#${timestamp}`,
          transactionId: adminTxnId,
          type: TransactionType.CREDIT,
          category: TransactionCategory.ORDER_COMMISSION,
          amount: adminCut,
          orderId,
          description: `Commission from order ${orderId}`,
          balanceBefore: adminBalance.availableBalance,
          balanceAfter: adminBalance.availableBalance + adminCut,
          createdAt: timestamp,
        },
      },
      // 3. Credit rider wallet
      {
        operation: 'Update' as const,
        key: { PK: `WALLET#RIDER#${riderId}`, SK: 'BALANCE' },
        updateExpression: 'ADD availableBalance :amount, totalEarned :amount SET updatedAt = :timestamp',
        expressionAttributeValues: {
          ':amount': riderFee,
          ':timestamp': timestamp,
        },
      },
      // 4. Add rider transaction
      {
        operation: 'Put' as const,
        item: {
          PK: `WALLET#RIDER#${riderId}`,
          SK: `TXN#${timestamp}#${riderTxnId}`,
          GSI1PK: `ORDER#${orderId}#TRANSACTIONS`,
          GSI1SK: `TXN#${timestamp}`,
          transactionId: riderTxnId,
          type: TransactionType.CREDIT,
          category: TransactionCategory.DELIVERY_FEE,
          amount: riderFee,
          orderId,
          description: `Delivery fee for order ${orderId}`,
          balanceBefore: riderBalance.availableBalance,
          balanceAfter: riderBalance.availableBalance + riderFee,
          createdAt: timestamp,
        },
      },
    ];

    // Add vendor transactions if vendor exists
    if (vendorId && vendorShare > 0 && vendorBalance) {
      transactItems.push(
        {
          operation: 'Update' as const,
          key: { PK: `WALLET#VENDOR#${vendorId}`, SK: 'BALANCE' },
          updateExpression: 'ADD availableBalance :amount, totalEarned :amount SET updatedAt = :timestamp',
          expressionAttributeValues: {
            ':amount': vendorShare,
            ':timestamp': timestamp,
          },
        },
        {
          operation: 'Put' as const,
          item: {
            PK: `WALLET#VENDOR#${vendorId}`,
            SK: `TXN#${timestamp}#${vendorTxnId}`,
            GSI1PK: `ORDER#${orderId}#TRANSACTIONS`,
            GSI1SK: `TXN#${timestamp}`,
            transactionId: vendorTxnId,
            type: TransactionType.CREDIT,
            category: TransactionCategory.ORDER_PAYMENT,
            amount: vendorShare,
            orderId,
            description: `Payment for order ${orderId}`,
            balanceBefore: vendorBalance.availableBalance,
            balanceAfter: vendorBalance.availableBalance + vendorShare,
            createdAt: timestamp,
          },
        }
      );
    }

    // Execute atomic transaction
    try {
      await this.walletRepo.db.transactWrite(transactItems);

      logger.info('Order funds distributed successfully', { orderId, split });

      const transactions = [
        { entityType: 'ADMIN', entityId: 'platform', amount: adminCut, txnId: adminTxnId },
        { entityType: 'RIDER', entityId: riderId!, amount: riderFee, txnId: riderTxnId },
      ];

      if (vendorId && vendorTxnId) {
        transactions.push({ entityType: 'VENDOR', entityId: vendorId, amount: vendorShare, txnId: vendorTxnId });
      }

      return {
        success: true,
        transactions,
      };
    } catch (error) {
      logger.error('Failed to distribute order funds', { orderId, error });
      throw new Error('Transaction failed');
    }
  }

  /**
   * Deduct from user wallet
   */
  async deductFromUser(userId: string, amount: number, orderId: string): Promise<void> {
    const wallet = await this.walletRepo.getOrCreateWallet('USER', userId);

    if (wallet.availableBalance < amount) {
      throw new Error('Insufficient balance');
    }

    const timestamp = new Date().toISOString();
    const txnId = uuidv4();

    await this.walletRepo.db.transactWrite([
      {
        operation: 'Update' as const,
        key: { PK: `WALLET#USER#${userId}`, SK: 'BALANCE' },
        updateExpression: 'ADD availableBalance :negative, totalSpent :positive SET updatedAt = :timestamp',
        expressionAttributeValues: {
          ':negative': -amount,
          ':positive': amount,
          ':timestamp': timestamp,
        },
        conditionExpression: 'availableBalance >= :amount',
      },
      {
        operation: 'Put' as const,
        item: {
          PK: `WALLET#USER#${userId}`,
          SK: `TXN#${timestamp}#${txnId}`,
          GSI1PK: `ORDER#${orderId}#TRANSACTIONS`,
          GSI1SK: `TXN#${timestamp}`,
          transactionId: txnId,
          type: TransactionType.DEBIT,
          category: TransactionCategory.ORDER_PAYMENT,
          amount,
          orderId,
          description: `Payment for order ${orderId}`,
          balanceBefore: wallet.availableBalance,
          balanceAfter: wallet.availableBalance - amount,
          createdAt: timestamp,
        },
      },
    ]);
  }

  /**
   * Add funds to user wallet
   */
  async addFunds(userId: string, amount: number, paymentReference: string): Promise<void> {
    const wallet = await this.walletRepo.getOrCreateWallet('USER', userId);
    const timestamp = new Date().toISOString();
    const txnId = uuidv4();

    await this.walletRepo.db.transactWrite([
      {
        operation: 'Update' as const,
        key: { PK: `WALLET#USER#${userId}`, SK: 'BALANCE' },
        updateExpression: 'ADD availableBalance :amount SET updatedAt = :timestamp',
        expressionAttributeValues: {
          ':amount': amount,
          ':timestamp': timestamp,
        },
      },
      {
        operation: 'Put' as const,
        item: {
          PK: `WALLET#USER#${userId}`,
          SK: `TXN#${timestamp}#${txnId}`,
          transactionId: txnId,
          type: TransactionType.CREDIT,
          category: TransactionCategory.WALLET_TOPUP,
          amount,
          description: `Wallet top-up via ${paymentReference}`,
          balanceBefore: wallet.availableBalance,
          balanceAfter: wallet.availableBalance + amount,
          metadata: { paymentReference },
          createdAt: timestamp,
        },
      },
    ]);
  }
}
