// ============================================================================
// libs/wallet-engine/payout.service.ts
// ============================================================================

import { WalletRepository, PayoutRequest } from '../core-db';
import { PayoutStatus, logger, ErrorFactory } from '../shared-utils';
import { v4 as uuidv4 } from 'uuid';

export class PayoutService {
  private walletRepo: WalletRepository;

  constructor() {
    this.walletRepo = new WalletRepository();
  }

  /**
   * Create payout request
   */
  async createPayoutRequest(
    entityType: 'VENDOR' | 'RIDER',
    entityId: string,
    amount: number,
    bankDetails: PayoutRequest['bankDetails']
  ): Promise<PayoutRequest> {
    // Get wallet balance
    const wallet = await this.walletRepo.getOrCreateWallet(entityType, entityId);

    // Validate amount
    if (amount > wallet.availableBalance) {
      throw ErrorFactory.badRequest('Insufficient balance for payout');
    }

    if (amount < 50000) {
      throw ErrorFactory.badRequest('Minimum payout amount is 50,000 XAF');
    }

    const payoutId = `pay_${uuidv4()}`;
    const timestamp = new Date().toISOString();

    // Create payout request and move funds to pending atomically
    await this.walletRepo.db.transactWrite([
      {
        operation: 'Put' as const,
        item: {
          PK: `PAYOUT#${payoutId}`,
          SK: 'REQUEST',
          GSI1PK: `ENTITY#${entityType}#${entityId}#PAYOUTS`,
          GSI1SK: `PAYOUT#${PayoutStatus.PENDING}#${timestamp}`,
          payoutId,
          entityType,
          entityId,
          amount,
          status: PayoutStatus.PENDING,
          bankDetails,
          requestedAt: timestamp,
        },
      },
      {
        operation: 'Update' as const,
        key: { PK: `WALLET#${entityType}#${entityId}`, SK: 'BALANCE' },
        updateExpression: 'ADD availableBalance :negative, pendingBalance :positive SET updatedAt = :timestamp',
        expressionAttributeValues: {
          ':negative': -amount,
          ':positive': amount,
          ':timestamp': timestamp,
        },
        conditionExpression: 'availableBalance >= :amount',
      },
    ]);

    logger.info('Payout request created', { payoutId, entityType, entityId, amount });

    return this.walletRepo.getPayoutRequest(payoutId) as Promise<PayoutRequest>;
  }

  /**
   * Approve payout request (Admin only)
   */
  async approvePayout(
    payoutId: string,
    adminId: string,
    transactionReference: string
  ): Promise<void> {
    const payout = await this.walletRepo.getPayoutRequest(payoutId);
    if (!payout) {
      throw ErrorFactory.notFound('Payout request', payoutId);
    }

    if (payout.status !== PayoutStatus.PENDING) {
      throw ErrorFactory.badRequest('Payout already processed');
    }

    const timestamp = new Date().toISOString();

    // Update payout status and deduct from pending balance atomically
    await this.walletRepo.db.transactWrite([
      {
        operation: 'Update' as const,
        key: { PK: `PAYOUT#${payoutId}`, SK: 'REQUEST' },
        updateExpression: 'SET #status = :status, processedAt = :timestamp, processedBy = :adminId, transactionReference = :ref, GSI1SK = :gsi1sk',
        expressionAttributeNames: { '#status': 'status' },
        expressionAttributeValues: {
          ':status': PayoutStatus.APPROVED,
          ':timestamp': timestamp,
          ':adminId': adminId,
          ':ref': transactionReference,
          ':gsi1sk': `PAYOUT#${PayoutStatus.APPROVED}#${payout.requestedAt}`,
        },
      },
      {
        operation: 'Update' as const,
        key: { PK: `WALLET#${payout.entityType}#${payout.entityId}`, SK: 'BALANCE' },
        updateExpression: 'ADD pendingBalance :negative SET updatedAt = :timestamp',
        expressionAttributeValues: {
          ':negative': -payout.amount,
          ':timestamp': timestamp,
        },
      },
    ]);

    logger.info('Payout approved', { payoutId, adminId });
  }

  /**
   * Reject payout request (Admin only)
   */
  async rejectPayout(
    payoutId: string,
    adminId: string,
    reason: string
  ): Promise<void> {
    const payout = await this.walletRepo.getPayoutRequest(payoutId);
    if (!payout) {
      throw ErrorFactory.notFound('Payout request', payoutId);
    }

    if (payout.status !== PayoutStatus.PENDING) {
      throw ErrorFactory.badRequest('Payout already processed');
    }

    const timestamp = new Date().toISOString();

    // Update payout status and return funds to available balance atomically
    await this.walletRepo.db.transactWrite([
      {
        operation: 'Update' as const,
        key: { PK: `PAYOUT#${payoutId}`, SK: 'REQUEST' },
        updateExpression: 'SET #status = :status, processedAt = :timestamp, processedBy = :adminId, rejectionReason = :reason, GSI1SK = :gsi1sk',
        expressionAttributeNames: { '#status': 'status' },
        expressionAttributeValues: {
          ':status': PayoutStatus.REJECTED,
          ':timestamp': timestamp,
          ':adminId': adminId,
          ':reason': reason,
          ':gsi1sk': `PAYOUT#${PayoutStatus.REJECTED}#${payout.requestedAt}`,
        },
      },
      {
        operation: 'Update' as const,
        key: { PK: `WALLET#${payout.entityType}#${payout.entityId}`, SK: 'BALANCE' },
        updateExpression: 'ADD pendingBalance :negative, availableBalance :positive SET updatedAt = :timestamp',
        expressionAttributeValues: {
          ':negative': -payout.amount,
          ':positive': payout.amount,
          ':timestamp': timestamp,
        },
      },
    ]);

    logger.info('Payout rejected', { payoutId, adminId, reason });
  }
}