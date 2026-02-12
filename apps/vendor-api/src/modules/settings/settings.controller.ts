// apps/vendor-api/src/modules/settings/settings.controller.ts

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { AppError } from '../../../../../libs/shared-utils/errors/app-error';
import { asyncHandler } from '../../middleware/error.middleware';
import { SettingsService } from './settings.service';

export class SettingsController {
  private settingsService: SettingsService;

  constructor() {
    this.settingsService = new SettingsService();
  }

  updateBusinessHours = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.vendor) {
      throw new AppError('Unauthorized', 401, 'AUTH_1000');
    }

    const { businessHours } = req.body;

    const vendor = await this.settingsService.updateBusinessHours(
      req.vendor.vendorId,
      businessHours
    );

    res.status(200).json({
      success: true,
      message: 'Business hours updated successfully',
      data: vendor,
    });
  });

  toggleOnlineStatus = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.vendor) {
      throw new AppError('Unauthorized', 401, 'AUTH_1000');
    }

    const { isOnline } = req.body;

    const vendor = await this.settingsService.toggleOnlineStatus(
      req.vendor.vendorId,
      isOnline
    );

    res.status(200).json({
      success: true,
      message: `Vendor is now ${isOnline ? 'online' : 'offline'}`,
      data: vendor,
    });
  });

  updateBankDetails = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.vendor) {
      throw new AppError('Unauthorized', 401, 'AUTH_1000');
    }

    const vendor = await this.settingsService.updateBankDetails(
      req.vendor.vendorId,
      req.body
    );

    res.status(200).json({
      success: true,
      message: 'Bank details updated successfully',
      data: vendor,
    });
  });
}
