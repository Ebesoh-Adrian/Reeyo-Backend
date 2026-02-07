// libs/core-db/repositories/vendor.repository.ts

import { BaseRepository } from './base.repository';
import { VendorModel } from '../models/vendor.model';
import { VendorStatus, ServiceType } from '../../constants';

export class VendorRepository extends BaseRepository<VendorModel> {
  constructor() {
    super('Vendor');
  }

  /**
   * Create a new vendor
   */
  async createVendor(vendor: VendorModel): Promise<VendorModel> {
    return this.create(vendor);
  }

  /**
   * Find vendor by ID
   */
  async findById(vendorId: string): Promise<VendorModel | null> {
    return this.findByKey({
      PK: `VENDOR#${vendorId}`,
      SK: 'PROFILE',
    });
  }

  /**
   * Find vendor by email
   */
  async findByEmail(email: string): Promise<VendorModel | null> {
    const result = await this.db.query<VendorModel>(
      'GSI1PK = :gsi1pk',
      { ':gsi1pk': `VENDOR#EMAIL#${email.toLowerCase()}` },
      { indexName: 'GSI1' }
    );

    return result.items[0] || null;
  }

  /**
   * Update vendor profile
   */
  async updateProfile(
    vendorId: string,
    updates: Partial<VendorModel>
  ): Promise<VendorModel> {
    return this.update(
      {
        PK: `VENDOR#${vendorId}`,
        SK: 'PROFILE',
      },
      updates
    );
  }

  /**
   * Update vendor status (PENDING, APPROVED, REJECTED, SUSPENDED)
   */
  async updateStatus(
    vendorId: string,
    status: VendorStatus
  ): Promise<VendorModel> {
    const updates: any = {
      status,
      GSI1PK: `VENDOR#${status}`,
    };

    if (status === VendorStatus.APPROVED) {
      updates.approvedAt = new Date().toISOString();
    } else if (status === VendorStatus.REJECTED) {
      updates.rejectedAt = new Date().toISOString();
    } else if (status === VendorStatus.SUSPENDED) {
      updates.suspendedAt = new Date().toISOString();
    }

    return this.update(
      {
        PK: `VENDOR#${vendorId}`,
        SK: 'PROFILE',
      },
      updates
    );
  }

  /**
   * Toggle online/offline status
   */
  async toggleOnlineStatus(
    vendorId: string,
    isOnline: boolean
  ): Promise<VendorModel> {
    return this.update(
      {
        PK: `VENDOR#${vendorId}`,
        SK: 'PROFILE',
      },
      { isOnline }
    );
  }

  /**
   * Get vendors by status with pagination
   */
  async findByStatus(
    status: VendorStatus,
    options?: {
      limit?: number;
      lastKey?: Record<string, any>;
    }
  ): Promise<{
    vendors: VendorModel[];
    lastKey?: Record<string, any>;
  }> {
    const result = await this.queryWithPagination(
      'GSI1PK = :gsi1pk',
      { ':gsi1pk': `VENDOR#${status}` },
      {
        indexName: 'GSI1',
        limit: options?.limit,
        lastKey: options?.lastKey,
      }
    );

    return {
      vendors: result.items,
      lastKey: result.lastKey,
    };
  }

  /**
   * Find active vendors by service type near location
   * Uses Haversine formula to calculate distance
   */
  async findNearby(
    serviceType: ServiceType,
    lat: number,
    lng: number,
    radiusKm: number = 10
  ): Promise<VendorModel[]> {
    // Get all active vendors of this service type
    const result = await this.db.query<VendorModel>(
      'GSI1PK = :gsi1pk',
      { ':gsi1pk': `VENDOR#${VendorStatus.ACTIVE}` },
      {
        indexName: 'GSI1',
        filterExpression: 'serviceType = :serviceType AND isOnline = :isOnline',
      }
    );

    // Filter by distance using Haversine formula
    return result.items.filter((vendor) => {
      const distance = this.calculateDistance(
        lat,
        lng,
        vendor.location.coordinates.lat,
        vendor.location.coordinates.lng
      );
      return distance <= radiusKm;
    });
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   * Returns distance in kilometers
   */
  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Update vendor rating after a new review
   */
  async updateRating(
    vendorId: string,
    newRating: number,
    totalRatings: number
  ): Promise<void> {
    await this.update(
      {
        PK: `VENDOR#${vendorId}`,
        SK: 'PROFILE',
      },
      {
        rating: newRating,
        totalRatings,
      }
    );
  }

  /**
   * Increment total order count for vendor
   */
  async incrementOrderCount(vendorId: string): Promise<void> {
    const vendor = await this.findById(vendorId);
    if (!vendor) {
      throw new Error('Vendor not found');
    }

    await this.update(
      {
        PK: `VENDOR#${vendorId}`,
        SK: 'PROFILE',
      },
      {
        totalOrders: (vendor.totalOrders || 0) + 1,
      }
    );
  }
}