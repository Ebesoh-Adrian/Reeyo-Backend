// apps/vendor-api/src/modules/payouts/payouts.controller.ts
import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { AppError, asyncHandler } from '../../middleware/error.middleware';
import { PayoutsService } from './payouts.service';

export class PayoutsController {
  private payoutsService: PayoutsService;
  constructor() { this.payoutsService = new PayoutsService(); }

  requestPayout = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.vendor) throw new AppError('Unauthorized', 401, 'AUTH_1000');
    const payout = await this.payoutsService.requestPayout(req.vendor.vendorId, req.body);
    res.status(201).json({ success: true, message: 'Payout requested successfully', data: payout });
  });

  getPayouts = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.vendor) throw new AppError('Unauthorized', 401, 'AUTH_1000');
    const payouts = await this.payoutsService.getPayouts(req.vendor.vendorId);
    res.status(200).json({ success: true, data: { payouts, total: payouts.length } });
  });

  getPayout = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.vendor) throw new AppError('Unauthorized', 401, 'AUTH_1000');
    const payout = await this.payoutsService.getPayout(req.vendor.vendorId, req.params.payoutId);
    res.status(200).json({ success: true, data: payout });
  });
}