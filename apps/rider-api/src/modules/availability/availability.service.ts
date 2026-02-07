import { RiderRepository } from '../../../../../libs/core-db/repositories/rider.repository';
import { AppError } from '../../../../../libs/shared-utils/error-handler';
import { logger } from '../../../../../libs/shared-utils/logger';
import io from 'socket.io-client';

interface LocationUpdate {
  latitude: number;
  longitude: number;
}

export class AvailabilityService {
  private riderRepo: RiderRepository;
  private socket: any;

  constructor() {
    this.riderRepo = new RiderRepository();
    
    // Connect to Socket.io server for real-time location tracking
    if (process.env.SOCKET_SERVER_URL) {
      this.socket = io(process.env.SOCKET_SERVER_URL);
    }
  }

  /**
   * Toggle rider online/offline status
   */
  async toggleOnlineStatus(riderId: string, isOnline: boolean): Promise<any> {
    logger.info('Toggling rider online status', { riderId, isOnline });

    const rider = await this.riderRepo.findById(riderId);
    if (!rider) {
      throw new AppError('Rider not found', 404, 'RIDER_3000');
    }

    // Check if rider is verified and approved
    if (rider.verificationStatus !== 'VERIFIED') {
      throw new AppError('Account not verified', 403, 'RIDER_3003');
    }

    if (rider.approvalStatus !== 'APPROVED') {
      throw new AppError('Account not approved', 403, 'RIDER_3004');
    }

    if (rider.status !== 'ACTIVE') {
      throw new AppError('Account is inactive', 403, 'RIDER_3005');
    }

    // Update online status
    const updatedRider = await this.riderRepo.update(riderId, {
      isOnline,
      lastOnline: isOnline ? new Date().toISOString() : rider.lastOnline,
      updatedAt: new Date().toISOString(),
    });

    // Emit real-time event to socket server
    if (this.socket) {
      this.socket.emit('rider_status_changed', {
        riderId,
        isOnline,
        timestamp: new Date().toISOString(),
      });
    }

    logger.info('Rider status toggled', { riderId, isOnline });

    return {
      riderId,
      isOnline,
      status: isOnline ? 'online' : 'offline',
    };
  }

  /**
   * Update rider's current location
   */
  async updateLocation(riderId: string, location: LocationUpdate): Promise<void> {
    logger.debug('Updating rider location', { riderId });

    const rider = await this.riderRepo.findById(riderId);
    if (!rider) {
      throw new AppError('Rider not found', 404, 'RIDER_3000');
    }

    if (!rider.isOnline) {
      throw new AppError('Cannot update location while offline', 400, 'RIDER_5000');
    }

    // Update location in DynamoDB
    await this.riderRepo.update(riderId, {
      currentLocation: {
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: new Date().toISOString(),
      },
      updatedAt: new Date().toISOString(),
    });

    // Update location in Redis geospatial index via Socket.io
    if (this.socket) {
      this.socket.emit('rider_location_update', {
        riderId,
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: new Date().toISOString(),
      });
    }

    logger.debug('Rider location updated', { riderId });
  }

  /**
   * Get rider's current availability status
   */
  async getAvailabilityStatus(riderId: string): Promise<any> {
    const rider = await this.riderRepo.findById(riderId);
    if (!rider) {
      throw new AppError('Rider not found', 404, 'RIDER_3000');
    }

    return {
      riderId,
      isOnline: rider.isOnline,
      status: rider.isOnline ? 'online' : 'offline',
      currentLocation: rider.currentLocation,
      lastOnline: rider.lastOnline,
      verificationStatus: rider.verificationStatus,
      approvalStatus: rider.approvalStatus,
      accountStatus: rider.status,
    };
  }

  /**
   * Get rider's daily activity summary
   */
  async getDailyActivity(riderId: string): Promise<any> {
    const rider = await this.riderRepo.findById(riderId);
    if (!rider) {
      throw new AppError('Rider not found', 404, 'RIDER_3000');
    }

    // Calculate daily stats (this is a simplified version)
    // In production, you'd query order history for today
    const today = new Date().toISOString().split('T')[0];

    return {
      riderId,
      date: today,
      isOnline: rider.isOnline,
      totalDeliveries: rider.totalDeliveries || 0,
      completedDeliveries: rider.completedDeliveries || 0,
      rating: rider.rating || 0,
      // These would come from order queries in production
      todayDeliveries: 0,
      todayEarnings: 0,
      onlineHours: 0,
    };
  }
}
