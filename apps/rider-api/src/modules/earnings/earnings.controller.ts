import { Response } from 'express';
import { EarningsService } from './earnings.service';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { asyncHandler } from '../../middleware/error.middleware';

export class EarningsController {
  private earningsService: EarningsService;

  constructor() {
    this.earningsService = new EarningsService();
  }

  /**
   * Get earnings summary
   * GET /api/v1/earnings/summary
   */
  getSummary = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.rider) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const summary = await this.earningsService.getEarningsSummary(req.rider.riderId);

    res.status(200).json({
      success: true,
      data: summary,
    });
  });

  /**
   * Get transaction history
   * GET /api/v1/earnings/transactions
   */
  getTransactions = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.rider) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await this.earningsService.getTransactions(req.rider.riderId, page, limit);

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  /**
   * Get daily earnings
   * GET /api/v1/earnings/daily
   */
  getDailyEarnings = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.rider) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const days = parseInt(req.query.days as string) || 30;
    const earnings = await this.earningsService.getDailyEarnings(req.rider.riderId, days);

    res.status(200).json({
      success: true,
      data: earnings,
    });
  });

  /**
   * Get weekly earnings
   * GET /api/v1/earnings/weekly
   */
  getWeeklyEarnings = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.rider) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const weeks = parseInt(req.query.weeks as string) || 12;
    const earnings = await this.earningsService.getWeeklyEarnings(req.rider.riderId, weeks);

    res.status(200).json({
      success: true,
      data: earnings,
    });
  });

  /**
   * Get monthly earnings
   * GET /api/v1/earnings/monthly
   */
  getMonthlyEarnings = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.rider) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const months = parseInt(req.query.months as string) || 12;
    const earnings = await this.earningsService.getMonthlyEarnings(req.rider.riderId, months);

    res.status(200).json({
      success: true,
      data: earnings,
    });
  });
}
