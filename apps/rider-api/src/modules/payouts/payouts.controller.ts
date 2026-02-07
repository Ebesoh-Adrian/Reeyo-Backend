import { Response } from 'express';
import { PayoutsService } from './payouts.service';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { asyncHandler } from '../../middleware/error.middleware';

export class PayoutsController {
  private payoutsService: PayoutsService;

  constructor() {
    this.payoutsService = new PayoutsService();
  }

  /**
   * Request a payout
   * POST /api/v1/payouts/request
   */
  requestPayout = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.rider) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const payout = await this.payoutsService.requestPayout(req.rider.riderId, req.body);

    res.status(201).json({
      success: true,
      message: 'Payout requested successfully',
      data: payout,
    });
  });

  /**
   * Get payout history
   * GET /api/v1/payouts
   */
  getPayoutHistory = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.rider) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await this.payoutsService.getPayoutHistory(req.rider.riderId, page, limit);

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  /**
   * Get payout details
   * GET /api/v1/payouts/:payoutId
   */
  getPayoutDetails = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.rider) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const { payoutId } = req.params;
    const payout = await this.payoutsService.getPayoutDetails(req.rider.riderId, payoutId);

    res.status(200).json({
      success: true,
      data: payout,
    });
  });

  /**
   * Get available balance
   * GET /api/v1/payouts/balance
   */
  getAvailableBalance = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.rider) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const balance = await this.payoutsService.getAvailableBalance(req.rider.riderId);

    res.status(200).json({
      success: true,
      data: balance,
    });
  });
}
