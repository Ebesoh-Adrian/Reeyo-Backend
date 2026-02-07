// libs/core-db/repositories/rider.repository.ts

import { BaseRepository } from './base.repository';
import { RiderModel } from '../models/rider.model';
import { RiderStatus, RiderAvailability } from '../../constants';

export class RiderRepository extends BaseRepository<RiderModel> {
  constructor() {
    super('Rider');
  }

  /**
   * Create a new rider
   */
  async createRider(rider: RiderModel): Promise<RiderModel> {
    return this.create(rider);
  }

  /**
   * Find rider by ID
   */
  async findById(riderId: string): Promise<RiderModel | null> {
    return this.findByKey({
      PK: `RIDER#${riderId}`,
      SK: 'PROFILE',
    });
  }

  /**
   * Find rider by email
   */
  async findByEmail(email: string): Promise<RiderModel | null> {
    const result = await this.db.query<RiderModel>(
      'GSI1PK = :gsi1pk',
      { ':gsi1pk': `RIDER#EMAIL#${email.toLowerCase()}` },
      { indexName: 'GSI1' }
    );

    return result.items[0] || null;
  }

  /**
   * Find rider by phone
   */
  async findByPhone(phone: string): Promise<RiderModel | null> {
    const result = await this.db.query<RiderModel>(
      'phone = :phone',
      { ':phone': phone }
    );

    return result.items[0] || null;
  }

  /**
   * Update rider profile
   */
  async updateProfile(
    riderId: string,
    updates: Partial<RiderModel>
  ): Promise<RiderModel> {
    return this.update(
      {
        PK: `RIDER#${riderId}`,
        SK: 'PROFILE',
      },
      updates
    );
  }

  /**
   * Update rider status (PENDING, APPROVED, REJECTED, SUSPENDED)
   */
  async updateStatus(
    riderId: string,
    status: RiderStatus
  ): Promise<RiderModel> {
    const updates: any = { status };

    if (status === RiderStatus.APPROVED) {
      updates.approvedAt = new Date().toISOString();
    } else if (status === RiderStatus.REJECTED) {
      updates.rejectedAt = new Date().toISOString();
    } else if (status === RiderStatus.SUSPENDED) {
      updates.suspendedAt = new Date().toISOString();
    }

    return this.update(
      {
        PK: `RIDER#${riderId}`,
        SK: 'PROFILE',
      },
      updates
    );
  }

  /**
   * Update rider availability (ONLINE, OFFLINE, BUSY)
   */
  async updateAvailability(
    riderId: string,
    availability: RiderAvailability,
    location?: { lat: number; lng: number }
  ): Promise<RiderModel> {
    const updates: any = {
      availability,
      GSI1PK: `RIDER#${RiderStatus.ACTIVE}#${availability}`,
      lastActiveAt: new Date().toISOString(),
    };

    if (location) {
      updates.currentLocation = {
        lat: location.lat,
        lng: location.lng,
        updatedAt: new Date().toISOString(),
      };
    }

    return this.update(
      {
        PK: `RIDER#${riderId}`,
        SK: 'PROFILE',
      },
      updates
    );
  }

  /**
   * Update rider's current location
   */
  async updateLocation(
    riderId: string,
    location: {
      lat: number;
      lng: number;
      accuracy?: number;
      heading?: number;
      speed?: number;
    }
  ): Promise<void> {
    await this.update(
      {
        PK: `RIDER#${riderId}`,
        SK: 'PROFILE',
      },
      {
        currentLocation: {
          ...location,
          updatedAt: new Date().toISOString(),
        },
      }
    );
  }

  /**
   * Get all available riders (ONLINE status)
   */
  async findAvailable(options?: {
    limit?: number;
    lastKey?: Record<string, any>;
  }): Promise<{
    riders: RiderModel[];
    lastKey?: Record<string, any>;
  }> {
    const result = await this.queryWithPagination(
      'GSI1PK = :gsi1pk',
      {
        ':gsi1pk': `RIDER#${RiderStatus.ACTIVE}#${RiderAvailability.ONLINE}`,
      },
      {
        indexName: 'GSI1',
        limit: options?.limit,
        lastKey: options?.lastKey,
      }
    );

    return {
      riders: result.items,
      lastKey: result.lastKey,
    };
  }

  /**
   * Get riders by status
   */
  async findByStatus(
    status: RiderStatus,
    options?: {
      limit?: number;
      lastKey?: Record<string, any>;
    }
  ): Promise<{
    riders: RiderModel[];
    lastKey?: Record<string, any>;
  }> {
    const result = await this.queryWithPagination(
      'GSI1PK = :gsi1pk',
      { ':gsi1pk': `RIDER#${status}` },
      {
        indexName: 'GSI1',
        limit: options?.limit,
        lastKey: options?.lastKey,
      }
    );

    return {
      riders: result.items,
      lastKey: result.lastKey,
    };
  }

  /**
   * Update rider statistics
   */
  async updateStats(
    riderId: string,
    stats: Partial<RiderModel['stats']>
  ): Promise<void> {
    const rider = await this.findById(riderId);
    if (!rider) {
      throw new Error('Rider not found');
    }

    await this.update(
      {
        PK: `RIDER#${riderId}`,
        SK: 'PROFILE',
      },
      {
        stats: {
          ...rider.stats,
          ...stats,
        },
      }
    );
  }

  /**
   * Increment active deliveries count
   */
  async incrementActiveDeliveries(riderId: string): Promise<void> {
    const rider = await this.findById(riderId);
    if (!rider) {
      throw new Error('Rider not found');
    }

    await this.updateStats(riderId, {
      activeDeliveries: rider.stats.activeDeliveries + 1,
    });

    // Also update availability to BUSY if this is their first active delivery
    if (rider.stats.activeDeliveries === 0) {
      await this.updateAvailability(riderId, RiderAvailability.BUSY);
    }
  }

  /**
   * Decrement active deliveries count
   */
  async decrementActiveDeliveries(riderId: string): Promise<void> {
    const rider = await this.findById(riderId);
    if (!rider) {
      throw new Error('Rider not found');
    }

    const newCount = Math.max(0, rider.stats.activeDeliveries - 1);

    await this.updateStats(riderId, {
      activeDeliveries: newCount,
    });

    // Update availability back to ONLINE if no active deliveries
    if (newCount === 0 && rider.availability === RiderAvailability.BUSY) {
      await this.updateAvailability(riderId, RiderAvailability.ONLINE);
    }
  }

  /**
   * Update completion rate after delivery
   */
  async updateCompletionRate(
    riderId: string,
    completed: boolean
  ): Promise<void> {
    const rider = await this.findById(riderId);
    if (!rider) {
      throw new Error('Rider not found');
    }

    const totalDeliveries = rider.stats.totalDeliveries + 1;
    const successfulDeliveries = completed
      ? (rider.stats.completionRate / 100) * rider.stats.totalDeliveries + 1
      : (rider.stats.completionRate / 100) * rider.stats.totalDeliveries;

    const completionRate = (successfulDeliveries / totalDeliveries) * 100;

    await this.updateStats(riderId, {
      totalDeliveries,
      completionRate: Math.round(completionRate * 100) / 100, // Round to 2 decimals
    });
  }

  /**
   * Update rider rating
   */
  async updateRating(
    riderId: string,
    newRating: number,
    totalRatings: number
  ): Promise<void> {
    await this.updateStats(riderId, {
      rating: newRating,
      totalRatings,
    });
  }
}