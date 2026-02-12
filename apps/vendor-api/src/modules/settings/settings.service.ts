// apps/vendor-api/src/modules/settings/settings.service.ts

import { AppError } from '../../../../../libs/shared-utils/errors/app-error';
import { logger } from '../../../../../libs/shared-utils/logger';
import { VendorRepository } from '../../../../../libs/shared-utils/core-db/repositories/vendor.repository';

interface BusinessHours {
  monday?: { open: string; close: string; closed?: boolean };
  tuesday?: { open: string; close: string; closed?: boolean };
  wednesday?: { open: string; close: string; closed?: boolean };
  thursday?: { open: string; close: string; closed?: boolean };
  friday?: { open: string; close: string; closed?: boolean };
  saturday?: { open: string; close: string; closed?: boolean };
  sunday?: { open: string; close: string; closed?: boolean };
}

export class SettingsService {
  private vendorRepo: VendorRepository;

  constructor() {
    this.vendorRepo = new VendorRepository();
  }

  async updateBusinessHours(vendorId: string, businessHours: BusinessHours) {
    const vendor = await this.vendorRepo.findById(vendorId);

    if (!vendor) {
      throw new AppError('Vendor not found', 404, 'VENDOR_1007');
    }

    const updatedVendor = await this.vendorRepo.update(vendorId, {
      businessHours: businessHours as any,
    });

    logger.info('Business hours updated', { vendorId });

    const { password, otp, otpExpiry, resetToken, resetTokenExpiry, ...vendorData } = updatedVendor;

    return vendorData;
  }

  async toggleOnlineStatus(vendorId: string, isOnline: boolean) {
    const vendor = await this.vendorRepo.findById(vendorId);

    if (!vendor) {
      throw new AppError('Vendor not found', 404, 'VENDOR_1007');
    }

    const updatedVendor = await this.vendorRepo.update(vendorId, {
      isOnline: isOnline as any,
    });

    logger.info('Online status toggled', { vendorId, isOnline });

    const { password, otp, otpExpiry, resetToken, resetTokenExpiry, ...vendorData } = updatedVendor;

    return vendorData;
  }

  async updateBankDetails(vendorId: string, bankDetails: any) {
    const vendor = await this.vendorRepo.findById(vendorId);

    if (!vendor) {
      throw new AppError('Vendor not found', 404, 'VENDOR_1007');
    }

    const updatedVendor = await this.vendorRepo.update(vendorId, {
      bankDetails,
    });

    logger.info('Bank details updated', { vendorId });

    const { password, otp, otpExpiry, resetToken, resetTokenExpiry, ...vendorData } = updatedVendor;

    return vendorData;
  }
}

