// apps/vendor-api/src/modules/payouts/payouts.controller.ts

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { AppError } from '../../../../../libs/shared-utils/errors/app-error';
import { asyncHandler } from '../../middleware/error.middleware';
import { PayoutsService } from './payouts.service';

export class PayoutsController {
  private payoutsService: PayoutsService;

  constructor() {
    this.payoutsService = new PayoutsService();
  }

  requestPayout = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.vendor) {
      throw new AppError('Unauthorized', 401, 'AUTH_1000');
    }

    const { amount, bankDetails } = req.body;

    const payout = await this.payoutsService.requestPayout(req.vendor.vendorId, {
      amount,
      bankDetails,
    });

    res.status(201).json({
      success: true,
      message: 'Payout request submitted successfully',
      data: payout,
    });
  });

  getPayouts = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.vendor) {
      throw new AppError('Unauthorized', 401, 'AUTH_1000');
    }

    const payouts = await this.payoutsService.getPayouts(req.vendor.vendorId);

    res.status(200).json({
      success: true,
      data: {
        payouts,
        total: payouts.length,
      },
    });
  });

  getPayout = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.vendor) {
      throw new AppError('Unauthorized', 401, 'AUTH_1000');
    }

    const { payoutId } = req.params;

    const payout = await this.payoutsService.getPayout(req.vendor.vendorId, payoutId);

    res.status(200).json({
      success: true,
      data: payout,
    });
  });
}

