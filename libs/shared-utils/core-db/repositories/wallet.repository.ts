// libs/core-db/repositories/wallet.repository.ts

import { BaseRepository } from './base.repository';
import { WalletBalanceModel, TransactionModel, PayoutRequestModel } from '../models/wallet.model';
import { PayoutStatus, TransactionType, TransactionCategory } from '../../constants';

export class WalletRepository extends BaseRepository<WalletBalanceModel> {
  constructor() {
    super('Wallet');
  }

  /**
   * Get wallet balance for entity
   */
  async getBalance(
    entityType: string,
    entityId: string
  ): Promise<WalletBalanceModel | null> {
    return this.findByKey({
      PK: `WALLET#${entityType}#${entityId}`,
      SK: 'BALANCE',
    });
  }

  /**
   * Create new wallet
   */
  async createWallet(wallet: WalletBalanceModel): Promise<WalletBalanceModel> {
    return this.create(wallet);
  }

  /**
   * Get wallet or create if doesn't exist
   */
  async getOrCreateWallet(
    entityType: string,
    entityId: string
  ): Promise<WalletBalanceModel> {
    let wallet = await this.getBalance(entityType, entityId);

    if (!wallet) {
      wallet = await this.createWallet({
        PK: `WALLET#${entityType}#${entityId}`,
        SK: 'BALANCE',
        entityType: entityType as any,
        entityId,
        availableBalance: 0,
        pendingBalance: 0,
        totalEarned: 0,
        totalSpent: 0,
        currency: 'XAF',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    return wallet;
  }

  /**
   * Add transaction record
   */
  async addTransaction(transaction: TransactionModel): Promise<TransactionModel> {
    await this.db.put(transaction);
    return transaction;
  }

  /**
   * Get transaction history for entity
   */
  async getTransactions(
    entityType: string,
    entityId: string,
    options?: {
      category?: TransactionCategory;
      type?: TransactionType;
      limit?: number;
      lastKey?: Record<string, any>;
    }
  ): Promise<{
    transactions: TransactionModel[];
    lastKey?: Record<string, any>;
  }> {
    let filterExpression: string | undefined;
    const expressionAttributeValues: any = {};

    if (options?.category) {
      filterExpression = 'category = :category';
      expressionAttributeValues[':category'] = options.category;
    }

    if (options?.type) {
      const typeFilter = '#type = :type';
      filterExpression = filterExpression
        ? `${filterExpression} AND ${typeFilter}`
        : typeFilter;
      expressionAttributeValues[':type'] = options.type;
    }

    const result = await this.db.query<TransactionModel>(
      'PK = :pk AND begins_with(SK, :sk)',
      {
        ':pk': `WALLET#${entityType}#${entityId}`,
        ':sk': 'TXN#',
        ...expressionAttributeValues,
      },
      {
        filterExpression,
        limit: options?.limit || 50,
        exclusiveStartKey: options?.lastKey,
        scanIndexForward: false, // Most recent first
      }
    );

    return {
      transactions: result.items,
      lastKey: result.lastKey,
    };
  }

  /**
   * Get all transactions for a specific order
   */
  async getOrderTransactions(orderId: string): Promise<TransactionModel[]> {
    const result = await this.db.query<TransactionModel>(
      'GSI1PK = :gsi1pk',
      { ':gsi1pk': `ORDER#${orderId}#TRANSACTIONS` },
      { indexName: 'GSI1' }
    );

    return result.items;
  }

  /**
   * Get transaction by ID
   */
  async getTransactionById(
    entityType: string,
    entityId: string,
    transactionId: string
  ): Promise<TransactionModel | null> {
    const transactions = await this.db.query<TransactionModel>(
      'PK = :pk AND contains(SK, :txnId)',
      {
        ':pk': `WALLET#${entityType}#${entityId}`,
        ':txnId': transactionId,
      }
    );

    return transactions.items[0] || null;
  }

  /**
   * Create payout request
   */
  async createPayoutRequest(payout: PayoutRequestModel): Promise<PayoutRequestModel> {
    await this.db.put(payout);
    return payout;
  }

  /**
   * Get payout request by ID
   */
  async getPayoutRequest(payoutId: string): Promise<PayoutRequestModel | null> {
    return this.db.get<PayoutRequestModel>({
      PK: `PAYOUT#${payoutId}`,
      SK: 'REQUEST',
    });
  }

  /**
   * Update payout status
   */
  async updatePayoutStatus(
    payoutId: string,
    status: PayoutStatus,
    processedBy?: string,
    rejectionReason?: string,
    transactionReference?: string,
    notes?: string
  ): Promise<PayoutRequestModel> {
    const payout = await this.getPayoutRequest(payoutId);
    if (!payout) {
      throw new Error('Payout request not found');
    }

    const updates: any = {
      status,
      GSI1SK: `PAYOUT#${status}#${payout.requestedAt}`,
      processedAt: new Date().toISOString(),
    };

    if (processedBy) updates.processedBy = processedBy;
    if (rejectionReason) updates.rejectionReason = rejectionReason;
    if (transactionReference) updates.transactionReference = transactionReference;
    if (notes) updates.notes = notes;

    return this.db.update<PayoutRequestModel>(
      {
        PK: `PAYOUT#${payoutId}`,
        SK: 'REQUEST',
      },
      updates
    );
  }

  /**
   * Get payout requests for entity
   */
  async getPayoutRequests(
    entityType: string,
    entityId: string,
    options?: {
      status?: PayoutStatus;
      limit?: number;
      lastKey?: Record<string, any>;
    }
  ): Promise<{
    payouts: PayoutRequestModel[];
    lastKey?: Record<string, any>;
  }> {
    let keyCondition = 'GSI1PK = :gsi1pk';
    const expressionValues: any = {
      ':gsi1pk': `ENTITY#${entityType}#${entityId}#PAYOUTS`,
    };

    if (options?.status) {
      keyCondition += ' AND begins_with(GSI1SK, :gsi1sk)';
      expressionValues[':gsi1sk'] = `PAYOUT#${options.status}`;
    }

    const result = await this.db.query<PayoutRequestModel>(
      keyCondition,
      expressionValues,
      {
        indexName: 'GSI1',
        limit: options?.limit,
        exclusiveStartKey: options?.lastKey,
        scanIndexForward: false, // Most recent first
      }
    );

    return {
      payouts: result.items,
      lastKey: result.lastKey,
    };
  }

  /**
   * Get all pending payouts (Admin view)
   */
  async getPendingPayouts(options?: {
    entityType?: 'VENDOR' | 'RIDER';
    limit?: number;
    lastKey?: Record<string, any>;
  }): Promise<{
    payouts: PayoutRequestModel[];
    lastKey?: Record<string, any>;
  }> {
    let filterExpression = '#status = :status';
    const expressionValues: any = { ':status': PayoutStatus.PENDING };

    if (options?.entityType) {
      filterExpression += ' AND entityType = :entityType';
      expressionValues[':entityType'] = options.entityType;
    }

    const result = await this.db.scan<PayoutRequestModel>({
      filterExpression,
      expressionValues,
      limit: options?.limit,
      exclusiveStartKey: options?.lastKey,
    });

    return {
      payouts: result.items,
      lastKey: result.lastKey,
    };
  }

  /**
   * Get payouts by status
   */
  async getPayoutsByStatus(
    status: PayoutStatus,
    options?: {
      limit?: number;
      lastKey?: Record<string, any>;
    }
  ): Promise<{
    payouts: PayoutRequestModel[];
    lastKey?: Record<string, any>;
  }> {
    const result = await this.db.scan<PayoutRequestModel>({
      filterExpression: '#status = :status',
      expressionValues: { ':status': status },
      limit: options?.limit,
      exclusiveStartKey: options?.lastKey,
    });

    return {
      payouts: result.items,
      lastKey: result.lastKey,
    };
  }

  /**
   * Get total earnings for entity
   */
  async getTotalEarnings(entityType: string, entityId: string): Promise<number> {
    const wallet = await this.getOrCreateWallet(entityType, entityId);
    return wallet.totalEarned;
  }

  /**
   * Get available balance
   */
  async getAvailableBalance(entityType: string, entityId: string): Promise<number> {
    const wallet = await this.getOrCreateWallet(entityType, entityId);
    return wallet.availableBalance;
  }

  /**
   * Check if entity has sufficient balance
   */
  async hasSufficientBalance(
    entityType: string,
    entityId: string,
    amount: number
  ): Promise<boolean> {
    const wallet = await this.getOrCreateWallet(entityType, entityId);
    return wallet.availableBalance >= amount;
  }

  /**
   * Get transaction summary statistics
   */
  async getTransactionSummary(
    entityType: string,
    entityId: string,
    startDate?: string,
    endDate?: string
  ): Promise<{
    totalCredits: number;
    totalDebits: number;
    transactionCount: number;
    averageTransaction: number;
  }> {
    const transactions = await this.getTransactions(entityType, entityId, {
      limit: 1000, // Adjust based on needs
    });

    let totalCredits = 0;
    let totalDebits = 0;
    let count = 0;

    transactions.transactions.forEach((txn) => {
      // Filter by date if provided
      if (startDate && txn.createdAt < startDate) return;
      if (endDate && txn.createdAt > endDate) return;

      if (txn.type === TransactionType.CREDIT) {
        totalCredits += txn.amount;
      } else {
        totalDebits += txn.amount;
      }
      count++;
    });

    return {
      totalCredits,
      totalDebits,
      transactionCount: count,
      averageTransaction: count > 0 ? (totalCredits + totalDebits) / count : 0,
    };
  }
}