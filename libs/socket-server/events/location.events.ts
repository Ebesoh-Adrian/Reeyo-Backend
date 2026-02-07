// ============================================================================
// libs/socket-server/events/location.events.ts
// ============================================================================

import { Server, Socket } from 'socket.io';
import { LocationUpdate } from '../types';
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
});

export class LocationEvents {
  /**
   * Handle rider location update
   */
  static async handleLocationUpdate(
    io: Server,
    riderId: string,
    location: LocationUpdate
  ): Promise<void> {
    const { lat, lng, orderId } = location;

    try {
      // Store in Redis geospatial index
      await redis.geoadd('riders:online', lng, lat, riderId);

      // Store detailed location
      await redis.setex(
        `rider:${riderId}:location`,
        300, // 5 minutes TTL
        JSON.stringify({
          lat,
          lng,
          accuracy: location.accuracy,
          heading: location.heading,
          speed: location.speed,
          timestamp: Date.now(),
        })
      );

      // Broadcast to order room if orderId provided
      if (orderId) {
        io.to(`order:${orderId}`).emit('rider_location_update', {
          riderId,
          location: { lat, lng },
          timestamp: new Date().toISOString(),
        });
      }

      console.log(`[LocationEvents] Rider ${riderId} location updated`);
    } catch (error) {
      console.error('[LocationEvents] Failed to update location:', error);
    }
  }

  /**
   * Get nearby riders
   */
  static async getNearbyRiders(
    lat: number,
    lng: number,
    radiusKm: number = 5
  ): Promise<Array<{ riderId: string; distance: number }>> {
    try {
      const results = await redis.georadius(
        'riders:online',
        lng,
        lat,
        radiusKm,
        'km',
        'WITHDIST',
        'ASC'
      );

      return results.map(([riderId, distance]) => ({
        riderId: riderId as string,
        distance: parseFloat(distance as string),
      }));
    } catch (error) {
      console.error('[LocationEvents] Failed to get nearby riders:', error);
      return [];
    }
  }

  /**
   * Remove rider from online list
   */
  static async removeRiderLocation(riderId: string): Promise<void> {
    try {
      await redis.zrem('riders:online', riderId);
      await redis.del(`rider:${riderId}:location`);
      console.log(`[LocationEvents] Rider ${riderId} removed from online list`);
    } catch (error) {
      console.error('[LocationEvents] Failed to remove rider:', error);
    }
  }
}

