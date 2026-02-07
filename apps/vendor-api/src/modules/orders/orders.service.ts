// apps/vendor-api/src/modules/orders/orders.service.ts

import { OrderRepository } from '../../../../../libs/core-db/repositories/order.repository';
import { VendorRepository } from '../../../../../libs/core-db/repositories/vendor.repository';
import { AppError } from '../../middleware/error.middleware';

export class OrdersService {
  private orderRepo: OrderRepository;
  private vendorRepo: VendorRepository;

  constructor() {
    this.orderRepo = new OrderRepository();
    this.vendorRepo = new VendorRepository();
  }

  /**
   * Get orders with filters
   */
  async getOrders(
    vendorId: string,
    filters: {
      status?: string;
      page: number;
      limit: number;
    }
  ) {
    const { status, page, limit } = filters;

    const result = await this.orderRepo.findByVendor(vendorId, {
      status: status as any,
      limit,
    });

    return {
      orders: result.orders,
      pagination: {
        page,
        limit,
        total: result.orders.length,
      },
    };
  }

  /**
   * Get pending orders
   */
  async getPendingOrders(vendorId: string) {
    const result = await this.orderRepo.findByVendor(vendorId, {
      status: 'PENDING' as any,
    });

    return result.orders;
  }

  /**
   * Get active orders
   */
  async getActiveOrders(vendorId: string) {
    const result = await this.orderRepo.findByVendor(vendorId, {});

    // Filter active orders (accepted but not completed/cancelled)
    const activeStatuses = ['ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'RIDER_ASSIGNED'];
    return result.orders.filter(order => 
      activeStatuses.includes(order.status)
    );
  }

  /**
   * Get order history
   */
  async getOrderHistory(
    vendorId: string,
    filters: {
      startDate?: string;
      endDate?: string;
    }
  ) {
    const result = await this.orderRepo.findByVendor(vendorId, {});

    let orders = result.orders.filter(order => 
      order.status === 'DELIVERED' || order.status === 'CANCELLED'
    );

    // Apply date filters
    if (filters.startDate) {
      orders = orders.filter(order => order.createdAt >= filters.startDate!);
    }

    if (filters.endDate) {
      orders = orders.filter(order => order.createdAt <= filters.endDate!);
    }

    return orders;
  }

  /**
   * Get single order
   */
  async getOrder(vendorId: string, orderId: string) {
    const order = await this.orderRepo.findById(orderId);

    if (!order) {
      throw new AppError('Order not found', 404, 'ORDER_5000');
    }

    // Verify order belongs to vendor
    if (order.vendorId !== vendorId) {
      throw new AppError(
        'You can only access your own orders',
        403,
        'AUTH_1006'
      );
    }

    return order;
  }

  /**
   * Accept order
   */
  async acceptOrder(
    vendorId: string,
    orderId: string,
    preparationTime?: number
  ) {
    const order = await this.getOrder(vendorId, orderId);

    // Validate order status
    if (order.status !== 'PENDING') {
      throw new AppError(
        'Only pending orders can be accepted',
        400,
        'ORDER_5003'
      );
    }

    // Update order status
    const updatedOrder = await this.orderRepo.updateStatus(
      orderId,
      'ACCEPTED' as any,
      `Order accepted by vendor${preparationTime ? ` - Prep time: ${preparationTime} minutes` : ''}`
    );

    // Increment vendor order count
    await this.vendorRepo.incrementOrderCount(vendorId);

    // TODO: Send real-time notification to user via Socket.io
    // TODO: Send push notification to user

    return updatedOrder;
  }

  /**
   * Reject order
   */
  async rejectOrder(vendorId: string, orderId: string, reason: string) {
    const order = await this.getOrder(vendorId, orderId);

    // Validate order status
    if (order.status !== 'PENDING') {
      throw new AppError(
        'Only pending orders can be rejected',
        400,
        'ORDER_5003'
      );
    }

    // Update order status
    const updatedOrder = await this.orderRepo.updateRejectionReason(
      orderId,
      reason
    );

    // TODO: Send notification to user
    // TODO: Refund user if payment was made

    return updatedOrder;
  }

  /**
   * Mark order ready for pickup
   */
  async markOrderReady(vendorId: string, orderId: string) {
    const order = await this.getOrder(vendorId, orderId);

    // Validate order status
    if (order.status !== 'ACCEPTED' && order.status !== 'PREPARING') {
      throw new AppError(
        'Order must be accepted or preparing to mark as ready',
        400,
        'ORDER_5003'
      );
    }

    // Update order status
    const updatedOrder = await this.orderRepo.updateStatus(
      orderId,
      'READY_FOR_PICKUP' as any,
      'Order ready for pickup'
    );

    // TODO: Notify rider via Socket.io
    // TODO: Send push notification to rider

    return updatedOrder;
  }

  /**
   * Get order statistics
   */
  async getOrderStats(vendorId: string, period: string) {
    const now = new Date();
    let startDate: Date;

    // Calculate start date based on period
    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }

    const result = await this.orderRepo.findByVendor(vendorId, {});
    const orders = result.orders.filter(
      order => new Date(order.createdAt) >= startDate
    );

    // Calculate statistics
    const stats = {
      total: orders.length,
      pending: orders.filter(o => o.status === 'PENDING').length,
      accepted: orders.filter(o => o.status === 'ACCEPTED').length,
      completed: orders.filter(o => o.status === 'DELIVERED').length,
      cancelled: orders.filter(o => o.status === 'CANCELLED').length,
      rejected: orders.filter(o => o.status === 'REJECTED').length,
      totalRevenue: orders
        .filter(o => o.status === 'DELIVERED')
        .reduce((sum, o) => sum + (o.pricing?.vendorShare || 0), 0),
      averageOrderValue: 0,
      period,
    };

    stats.averageOrderValue = stats.completed > 0 
      ? stats.totalRevenue / stats.completed 
      : 0;

    return stats;
  }
}