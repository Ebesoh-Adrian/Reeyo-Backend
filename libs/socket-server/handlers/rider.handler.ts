// ============================================================================
// libs/socket-server/handlers/rider.handler.ts
// ============================================================================

import { Server, Socket } from 'socket.io';
import { LocationEvents } from '../events/location.events';
import { OrderEvents } from '../events/order.events';
import { LocationUpdate, DeliveryRequest } from '../types';
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
});

interface ExtendedSocket extends Socket {
  user?: {
    userId: string;
    email: string;
    userType: string;
  };
}

export class RiderHandler {
  static handleConnection(io: Server, socket: ExtendedSocket): void {
    const riderId = socket.user?.userId;
    if (!riderId) return;

    console.log(`[RiderHandler] Rider connected: ${riderId}`);

    // Join rider's personal room
    socket.join(`rider:${riderId}`);
    socket.join('rider');

    // Handle location updates
    socket.on('location_update', async (location: LocationUpdate) => {
      await LocationEvents.handleLocationUpdate(io, riderId, location);
    });

    // Handle availability status
    socket.on('set_availability', async (data: { available: boolean; location?: LocationUpdate }) => {
      const { available, location } = data;

      try {
        await redis.hset(`rider:${riderId}:status`, {
          available: available ? '1' : '0',
          updatedAt: Date.now(),
        });

        if (available && location) {
          await LocationEvents.handleLocationUpdate(io, riderId, location);
        } else if (!available) {
          await LocationEvents.removeRiderLocation(riderId);
        }

        console.log(`[RiderHandler] Rider ${riderId} availability: ${available}`);
      } catch (error) {
        console.error('[RiderHandler] Failed to update availability:', error);
      }
    });

    // Handle delivery acceptance
    socket.on('accept_delivery', (data: { orderId: string; estimatedTime: number }) => {
      const { orderId, estimatedTime } = data;

      // Join order room for location updates
      socket.join(`order:${orderId}`);

      OrderEvents.emitStatusUpdate(io, orderId, 'RIDER_ASSIGNED', {
        riderId,
        estimatedTime,
      });

      console.log(`[RiderHandler] Rider ${riderId} accepted delivery ${orderId}`);
    });

    // Handle delivery rejection
    socket.on('reject_delivery', (data: { orderId: string; reason: string }) => {
      console.log(`[RiderHandler] Rider ${riderId} rejected delivery ${data.orderId}`);
      // Implement retry logic or find another rider
    });

    // Handle arrival at pickup
    socket.on('arrive_pickup', (orderId: string) => {
      OrderEvents.emitStatusUpdate(io, orderId, 'RIDER_ARRIVED', { riderId });
      console.log(`[RiderHandler] Rider ${riderId} arrived at pickup for ${orderId}`);
    });

    // Handle pickup completion
    socket.on('pickup_complete', (data: { orderId: string; photo?: string }) => {
      const { orderId, photo } = data;
      OrderEvents.emitStatusUpdate(io, orderId, 'PICKED_UP', { riderId, photo });
      console.log(`[RiderHandler] Rider ${riderId} picked up order ${orderId}`);
    });

    // Handle arrival at dropoff
    socket.on('arrive_dropoff', (orderId: string) => {
      OrderEvents.emitStatusUpdate(io, orderId, 'ARRIVED', { riderId });
      console.log(`[RiderHandler] Rider ${riderId} arrived at dropoff for ${orderId}`);
    });

    // Handle delivery completion
    socket.on('complete_delivery', (data: { orderId: string; photo?: string; verificationCode?: string }) => {
      const { orderId, photo, verificationCode } = data;
      
      OrderEvents.emitOrderDelivered(io, orderId);
      
      // Leave order room
      socket.leave(`order:${orderId}`);
      
      console.log(`[RiderHandler] Rider ${riderId} completed delivery ${orderId}`);
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      await LocationEvents.removeRiderLocation(riderId);
      console.log(`[RiderHandler] Rider disconnected: ${riderId}`);
    });
  }

  /**
   * Broadcast delivery request to nearby riders
   */
  static async broadcastDeliveryRequest(
    io: Server,
    orderData: DeliveryRequest,
    location: { lat: number; lng: number },
    radiusKm: number = 5
  ): Promise<void> {
    const nearbyRiders = await LocationEvents.getNearbyRiders(
      location.lat,
      location.lng,
      radiusKm
    );

    console.log(`[RiderHandler] Broadcasting delivery to ${nearbyRiders.length} nearby riders`);

    nearbyRiders.forEach(({ riderId, distance }) => {
      io.to(`rider:${riderId}`).emit('delivery_request', {
        ...orderData,
        distance: distance.toFixed(2),
        expiresIn: 60, // 60 seconds to accept
      });
    });
  }
}



