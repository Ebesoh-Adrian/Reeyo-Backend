// apps/vendor-api/src/modules/earnings/earnings.controller.ts

import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { AppError, asyncHandler } from '../../middleware/error.middleware';
import { EarningsService } from './earnings.service';

export class EarningsController {
  private earningsService: EarningsService;

  constructor() {
    this.earningsService = new EarningsService();
  }

  getEarningsSummary = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.vendor) throw new AppError('Unauthorized', 401, 'AUTH_1000');

    const summary = await this.earningsService.getEarningsSummary(req.vendor.vendorId);

    res.status(200).json({ success: true, data: summary });
  });

  getTransactions = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.vendor) throw new AppError('Unauthorized', 401, 'AUTH_1000');

    const { page = '1', limit = '20', type } = req.query;

    const result = await this.earningsService.getTransactions(req.vendor.vendorId, {
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
      type: type as string,
    });

    res.status(200).json({ success: true, data: result });
  });

  getDailyEarnings = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.vendor) throw new AppError('Unauthorized', 401, 'AUTH_1000');

    const { startDate, endDate } = req.query;

    const earnings = await this.earningsService.getDailyEarnings(req.vendor.vendorId, {
      startDate: startDate as string,
      endDate: endDate as string,
    });

    res.status(200).json({ success: true, data: earnings });
  });

  getWeeklyEarnings = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.vendor) throw new AppError('Unauthorized', 401, 'AUTH_1000');

    const earnings = await this.earningsService.getWeeklyEarnings(req.vendor.vendorId);

    res.status(200).json({ success: true, data: earnings });
  });

  getMonthlyEarnings = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.vendor) throw new AppError('Unauthorized', 401, 'AUTH_1000');

    const { year } = req.query;

    const earnings = await this.earningsService.getMonthlyEarnings(
      req.vendor.vendorId,
      year ? parseInt(year as string, 10) : new Date().getFullYear()
    );

    res.status(200).json({ success: true, data: earnings });
  });
}

// apps/vendor-api/src/modules/earnings/earnings.service.ts

import { WalletRepository } from '../../../../../libs/core-db/repositories/wallet.repository';

export class EarningsService {
  private walletRepo: WalletRepository;

  constructor() {
    this.walletRepo = new WalletRepository();
  }

  async getEarningsSummary(vendorId: string) {
    const wallet = await this.walletRepo.getOrCreateWallet('VENDOR', vendorId);
    const summary = await this.walletRepo.getTransactionSummary('VENDOR', vendorId);

    return {
      availableBalance: wallet.availableBalance,
      pendingBalance: wallet.pendingBalance,
      totalEarned: wallet.totalEarned,
      totalSpent: wallet.totalSpent,
      currency: wallet.currency,
      statistics: {
        totalCredits: summary.totalCredits,
        totalDebits: summary.totalDebits,
        transactionCount: summary.transactionCount,
        averageTransaction: summary.averageTransaction,
      },
    };
  }

  async getTransactions(vendorId: string, filters: any) {
    const result = await this.walletRepo.getTransactions('VENDOR', vendorId, {
      type: filters.type,
      limit: filters.limit,
    });

    return {
      transactions: result.transactions,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: result.transactions.length,
      },
    };
  }

  async getDailyEarnings(vendorId: string, filters: any) {
    const result = await this.walletRepo.getTransactions('VENDOR', vendorId, {
      limit: 1000,
    });

    const transactions = result.transactions.filter(txn => {
      if (filters.startDate && txn.createdAt < filters.startDate) return false;
      if (filters.endDate && txn.createdAt > filters.endDate) return false;
      return txn.type === 'CREDIT';
    });

    const dailyData: { [key: string]: number } = {};
    transactions.forEach(txn => {
      const date = txn.createdAt.split('T')[0];
      dailyData[date] = (dailyData[date] || 0) + txn.amount;
    });

    return Object.entries(dailyData).map(([date, amount]) => ({ date, amount }));
  }

  async getWeeklyEarnings(vendorId: string) {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    return this.getDailyEarnings(vendorId, {
      startDate: sevenDaysAgo.toISOString(),
      endDate: now.toISOString(),
    });
  }

  async getMonthlyEarnings(vendorId: string, year: number) {
    const result = await this.walletRepo.getTransactions('VENDOR', vendorId, {
      limit: 1000,
    });

    const transactions = result.transactions.filter(txn => {
      const txnYear = new Date(txn.createdAt).getFullYear();
      return txnYear === year && txn.type === 'CREDIT';
    });

    const monthlyData: { [key: string]: number } = {};
    transactions.forEach(txn => {
      const month = new Date(txn.createdAt).getMonth();
      monthlyData[month] = (monthlyData[month] || 0) + txn.amount;
    });

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map((month, index) => ({
      month,
      amount: monthlyData[index] || 0,
    }));
  }
}