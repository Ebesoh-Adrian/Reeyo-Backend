// apps/vendor-api/src/modules/settings/settings.service.ts
import { VendorRepository } from '../../../../../libs/core-db/repositories/vendor.repository';

export class SettingsService {
  private vendorRepo: VendorRepository;
  constructor() { this.vendorRepo = new VendorRepository(); }

  async updateBusinessHours(vendorId: string, businessHours: any) {
    return await this.vendorRepo.updateProfile(vendorId, { businessHours });
  }

  async toggleOnlineStatus(vendorId: string, isOnline: boolean) {
    return await this.vendorRepo.toggleOnlineStatus(vendorId, isOnline);
  }

  async updateBankDetails(vendorId: string, bankDetails: any) {
    return await this.vendorRepo.updateProfile(vendorId, { bankDetails });
  }
}