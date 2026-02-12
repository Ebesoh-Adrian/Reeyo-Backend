// apps/vendor-api/src/modules/earnings/earnings.controller.ts

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { AppError } from '../../../../../libs/shared-utils/errors/app-error';
import { asyncHandler } from '../../middleware/error.middleware';
import { EarningsService } from './earnings.service';

export class EarningsController {
  private earningsService: EarningsService;

  constructor() {
    this.earningsService = new EarningsService();
  }

  getEarningsSummary = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.vendor) {
      throw new AppError('Unauthorized', 401, 'AUTH_1000');
    }

    const summary = await this.earningsService.getEarningsSummary(req.vendor.vendorId);

    res.status(200).json({
      success: true,
      data: summary,
    });
  });

  getTransactions = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.vendor) {
      throw new AppError('Unauthorized', 401, 'AUTH_1000');
    }

    const { page = '1', limit = '20', type } = req.query;

    const result = await this.earningsService.getTransactions(req.vendor.vendorId, {
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
      type: type as 'CREDIT' | 'DEBIT' | undefined,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  getDailyEarnings = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.vendor) {
      throw new AppError('Unauthorized', 401, 'AUTH_1000');
    }

    const { startDate, endDate } = req.query;

    const earnings = await this.earningsService.getDailyEarnings(req.vendor.vendorId, {
      startDate: startDate as string,
      endDate: endDate as string,
    });

    res.status(200).json({
      success: true,
      data: earnings,
    });
  });

  getWeeklyEarnings = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.vendor) {
      throw new AppError('Unauthorized', 401, 'AUTH_1000');
    }

    const earnings = await this.earningsService.getWeeklyEarnings(req.vendor.vendorId);

    res.status(200).json({
      success: true,
      data: earnings,
    });
  });

  getMonthlyEarnings = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.vendor) {
      throw new AppError('Unauthorized', 401, 'AUTH_1000');
    }

    const { year } = req.query;

    const earnings = await this.earningsService.getMonthlyEarnings(
      req.vendor.vendorId,
      year ? parseInt(year as string, 10) : undefined
    );

    res.status(200).json({
      success: true,
      data: earnings,
    });
  });
}

