// ============================================================================
// libs/socket-server/events/notification.events.ts
// ============================================================================

import { Server } from 'socket.io';

export class NotificationEvents {
  /**
   * Send notification to specific user
   */
  static sendToUser(io: Server, userId: string, notification: any): void {
    io.to(`user:${userId}`).emit('notification', {
      ...notification,
      timestamp: new Date().toISOString(),
    });
    console.log(`[NotificationEvents] Notification sent to user ${userId}`);
  }

  /**
   * Send notification to vendor
   */
  static sendToVendor(io: Server, vendorId: string, notification: any): void {
    io.to(`vendor:${vendorId}`).emit('notification', {
      ...notification,
      timestamp: new Date().toISOString(),
    });
    console.log(`[NotificationEvents] Notification sent to vendor ${vendorId}`);
  }

  /**
   * Send notification to rider
   */
  static sendToRider(io: Server, riderId: string, notification: any): void {
    io.to(`rider:${riderId}`).emit('notification', {
      ...notification,
      timestamp: new Date().toISOString(),
    });
    console.log(`[NotificationEvents] Notification sent to rider ${riderId}`);
  }

  /**
   * Broadcast to all users of a type
   */
  static broadcast(io: Server, userType: 'user' | 'vendor' | 'rider', notification: any): void {
    io.to(userType).emit('broadcast', {
      ...notification,
      timestamp: new Date().toISOString(),
    });
    console.log(`[NotificationEvents] Broadcast sent to all ${userType}s`);
  }
}

