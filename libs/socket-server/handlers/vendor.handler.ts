// ============================================================================
// libs/socket-server/handlers/vendor.handler.ts
// ============================================================================

import { Server, Socket } from 'socket.io';
import { OrderEvents } from '../events/order.events';

interface ExtendedSocket extends Socket {
  user?: {
    userId: string;
    email: string;
    userType: string;
  };
}

export class VendorHandler {
  static handleConnection(io: Server, socket: ExtendedSocket): void {
    const vendorId = socket.user?.userId;
    if (!vendorId) return;

    console.log(`[VendorHandler] Vendor connected: ${vendorId}`);

    // Join vendor's personal room
    socket.join(`vendor:${vendorId}`);
    socket.join('vendor');

    // Handle vendor accepting order
    socket.on('accept_order', (data: { orderId: string; preparationTime: number }) => {
      const { orderId, preparationTime } = data;
      OrderEvents.emitOrderAccepted(io, orderId, {
        vendorId,
        preparationTime,
      });
      console.log(`[VendorHandler] Vendor ${vendorId} accepted order ${orderId}`);
    });

    // Handle vendor rejecting order
    socket.on('reject_order', (data: { orderId: string; reason: string }) => {
      const { orderId, reason } = data;
      OrderEvents.emitOrderRejected(io, orderId, reason);
      console.log(`[VendorHandler] Vendor ${vendorId} rejected order ${orderId}`);
    });

    // Handle order ready for pickup
    socket.on('order_ready', (data: { orderId: string; riderId: string }) => {
      const { orderId, riderId } = data;
      OrderEvents.emitOrderReady(io, orderId, riderId);
      console.log(`[VendorHandler] Order ${orderId} ready for pickup`);
    });

    // Update online status
    socket.on('set_online_status', (isOnline: boolean) => {
      // This would typically update the database
      console.log(`[VendorHandler] Vendor ${vendorId} online status: ${isOnline}`);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`[VendorHandler] Vendor disconnected: ${vendorId}`);
    });
  }
}

