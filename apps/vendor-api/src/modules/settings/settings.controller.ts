// apps/vendor-api/src/modules/settings/settings.controller.ts
import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { AppError, asyncHandler } from '../../middleware/error.middleware';
import { SettingsService } from './settings.service';

export class SettingsController {
  private settingsService: SettingsService;
  constructor() { this.settingsService = new SettingsService(); }

  updateBusinessHours = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.vendor) throw new AppError('Unauthorized', 401, 'AUTH_1000');
    const vendor = await this.settingsService.updateBusinessHours(req.vendor.vendorId, req.body.businessHours);
    res.status(200).json({ success: true, message: 'Business hours updated', data: vendor });
  });

  toggleOnlineStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.vendor) throw new AppError('Unauthorized', 401, 'AUTH_1000');
    const vendor = await this.settingsService.toggleOnlineStatus(req.vendor.vendorId, req.body.isOnline);
    res.status(200).json({ success: true, message: `Vendor is now ${req.body.isOnline ? 'online' : 'offline'}`, data: vendor });
  });

  updateBankDetails = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.vendor) throw new AppError('Unauthorized', 401, 'AUTH_1000');
    const vendor = await this.settingsService.updateBankDetails(req.vendor.vendorId, req.body);
    res.status(200).json({ success: true, message: 'Bank details updated', data: vendor });
  });
}