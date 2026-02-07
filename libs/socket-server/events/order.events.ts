// ============================================================================
// libs/socket-server/events/order.events.ts
// ============================================================================

import { Server, Socket } from 'socket.io';
import { OrderEvent } from '../types';

export class OrderEvents {
  /**
   * Emit new order to vendor
   */
  static emitNewOrder(io: Server, vendorId: string, orderData: OrderEvent): void {
    io.to(`vendor:${vendorId}`).emit('new_order', orderData);
    console.log(`[OrderEvents] New order ${orderData.orderId} sent to vendor ${vendorId}`);
  }

  /**
   * Emit order accepted to user
   */
  static emitOrderAccepted(io: Server, orderId: string, data: any): void {
    io.to(`order:${orderId}`).emit('order_accepted', {
      orderId,
      timestamp: new Date().toISOString(),
      ...data,
    });
    console.log(`[OrderEvents] Order ${orderId} accepted`);
  }

  /**
   * Emit order rejected to user
   */
  static emitOrderRejected(io: Server, orderId: string, reason: string): void {
    io.to(`order:${orderId}`).emit('order_rejected', {
      orderId,
      reason,
      timestamp: new Date().toISOString(),
    });
    console.log(`[OrderEvents] Order ${orderId} rejected: ${reason}`);
  }

  /**
   * Emit order status update
   */
  static emitStatusUpdate(io: Server, orderId: string, status: string, data?: any): void {
    io.to(`order:${orderId}`).emit('order_status_update', {
      orderId,
      status,
      timestamp: new Date().toISOString(),
      ...data,
    });
    console.log(`[OrderEvents] Order ${orderId} status: ${status}`);
  }

  /**
   * Emit order ready for pickup
   */
  static emitOrderReady(io: Server, orderId: string, riderId: string): void {
    // Notify rider
    io.to(`rider:${riderId}`).emit('order_ready_for_pickup', {
      orderId,
      timestamp: new Date().toISOString(),
    });

    // Notify user
    io.to(`order:${orderId}`).emit('order_status_update', {
      orderId,
      status: 'READY_FOR_PICKUP',
      timestamp: new Date().toISOString(),
    });

    console.log(`[OrderEvents] Order ${orderId} ready for rider ${riderId}`);
  }

  /**
   * Emit order delivered
   */
  static emitOrderDelivered(io: Server, orderId: string): void {
    io.to(`order:${orderId}`).emit('order_delivered', {
      orderId,
      timestamp: new Date().toISOString(),
    });
    console.log(`[OrderEvents] Order ${orderId} delivered`);
  }
}

