import { v4 as uuidv4 } from 'uuid';
import { PayoutService as WalletPayoutService } from '../../../../../libs/wallet-engine/payout.service';
import { WalletRepository } from '../../../../../libs/core-db/repositories/wallet.repository';
import { RiderRepository } from '../../../../../libs/core-db/repositories/rider.repository';
import { AppError } from '../../../../../libs/shared-utils/error-handler';
import { logger } from '../../../../../libs/shared-utils/logger';

interface PayoutRequestDTO {
  amount: number;
  bankDetails?: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    bankCode?: string;
  };
}

export class PayoutsService {
  private walletPayoutService: WalletPayoutService;
  private walletRepo: WalletRepository;
  private riderRepo: RiderRepository;

  constructor() {
    this.walletPayoutService = new WalletPayoutService();
    this.walletRepo = new WalletRepository();
    this.riderRepo = new RiderRepository();
  }

  /**
   * Request a payout
   */
  async requestPayout(riderId: string, data: PayoutRequestDTO): Promise<any> {
    logger.info('Requesting payout', { riderId, amount: data.amount });

    // Get rider
    const rider = await this.riderRepo.findById(riderId);
    if (!rider) {
      throw new AppError('Rider not found', 404, 'RIDER_3000');
    }

    // Check if rider is verified
    if (rider.verificationStatus !== 'VERIFIED') {
      throw new AppError('Account not verified', 403, 'RIDER_3003');
    }

    // Get wallet balance
    const balance = await this.walletRepo.getBalance('RIDER', riderId);

    // Check minimum payout amount
    const minPayout = parseInt(process.env.MIN_EARNINGS_FOR_PAYOUT || '5000', 10);
    if (data.amount < minPayout) {
      throw new AppError(
        `Minimum payout amount is ${minPayout} XAF`,
        400,
        'PAYOUT_4000'
      );
    }

    // Check if rider has sufficient balance
    if (balance < data.amount) {
      throw new AppError('Insufficient balance', 400, 'PAYOUT_4001');
    }

    // Use bank details from request or rider's stored details
    const bankDetails = data.bankDetails || rider.bankDetails;
    if (!bankDetails) {
      throw new AppError('Bank details required', 400, 'PAYOUT_4002');
    }

    // Create payout request using wallet engine
    const payout = await this.walletPayoutService.createPayoutRequest(
      riderId,
      data.amount,
      {
        accountName: bankDetails.accountName,
        accountNumber: bankDetails.accountNumber,
        bankName: bankDetails.bankName,
        bankCode: bankDetails.bankCode,
      }
    );

    logger.info('Payout requested successfully', { riderId, payoutId: payout.payoutId });

    return payout;
  }

  /**
   * Get payout history
   */
  async getPayoutHistory(
    riderId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<any> {
    logger.info('Getting payout history', { riderId, page, limit });

    // Get all transactions
    const transactions = await this.walletRepo.getTransactions('RIDER', riderId);

    // Filter payout transactions
    const payouts = transactions.filter(
      tx => tx.type === 'DEBIT' && tx.category === 'PAYOUT'
    );

    // Sort by date (most recent first)
    payouts.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Paginate
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedPayouts = payouts.slice(startIndex, endIndex);

    return {
      payouts: paginatedPayouts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(payouts.length / limit),
        totalPayouts: payouts.length,
        hasNext: endIndex < payouts.length,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Get payout details
   */
  async getPayoutDetails(riderId: string, payoutId: string): Promise<any> {
    logger.info('Getting payout details', { riderId, payoutId });

    // Get all transactions
    const transactions = await this.walletRepo.getTransactions('RIDER', riderId);

    // Find the specific payout
    const payout = transactions.find(
      tx =>
        tx.transactionId === payoutId &&
        tx.type === 'DEBIT' &&
        tx.category === 'PAYOUT'
    );

    if (!payout) {
      throw new AppError('Payout not found', 404, 'PAYOUT_3000');
    }

    return payout;
  }

  /**
   * Get available balance for payout
   */
  async getAvailableBalance(riderId: string): Promise<any> {
    const balance = await this.walletRepo.getBalance('RIDER', riderId);
    const minPayout = parseInt(process.env.MIN_EARNINGS_FOR_PAYOUT || '5000', 10);

    return {
      availableBalance: balance,
      minimumPayout: minPayout,
      canRequestPayout: balance >= minPayout,
    };
  }
}
