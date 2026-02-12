// apps/vendor-api/src/modules/orders/orders.service.ts

import { AppError } from '../../../../../libs/shared-utils/errors/app-error';
import { logger } from '../../../../../libs/shared-utils/logger';
import { OrderRepository, Order, OrderStatus } from '../../../../../libs/shared-utils/core-db/repositories/order.repository';

interface OrderFilters {
  status?: string;
  page: number;
  limit: number;
}

interface OrderHistoryFilters {
  startDate?: string;
  endDate?: string;
}

export class OrdersService {
  private orderRepo: OrderRepository;

  constructor() {
    this.orderRepo = new OrderRepository();
  }

  async getOrders(vendorId: string, filters: OrderFilters) {
    const status = filters.status as OrderStatus | undefined;
    const orders = await this.orderRepo.findByVendor(vendorId, status);

    // Sort by createdAt (newest first)
    orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Pagination
    const startIndex = (filters.page - 1) * filters.limit;
    const endIndex = startIndex + filters.limit;
    const paginatedOrders = orders.slice(startIndex, endIndex);

    return {
      orders: paginatedOrders,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: orders.length,
        totalPages: Math.ceil(orders.length / filters.limit),
      },
    };
  }

  async getPendingOrders(vendorId: string): Promise<Order[]> {
    const orders = await this.orderRepo.findByVendor(vendorId, 'PENDING');

    orders.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    return orders;
  }

  async getActiveOrders(vendorId: string): Promise<Order[]> {
    const allOrders = await this.orderRepo.findByVendor(vendorId);

    const activeStatuses: OrderStatus[] = ['ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'RIDER_ASSIGNED', 'IN_TRANSIT'];

    const activeOrders = allOrders.filter((order) => activeStatuses.includes(order.status));

    activeOrders.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    return activeOrders;
  }

  async getOrderHistory(vendorId: string, filters: OrderHistoryFilters): Promise<Order[]> {
    const allOrders = await this.orderRepo.findByVendor(vendorId);

    const completedStatuses: OrderStatus[] = ['DELIVERED', 'CANCELLED'];

    let orders = allOrders.filter((order) => completedStatuses.includes(order.status));

    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      orders = orders.filter((order) => new Date(order.createdAt) >= startDate);
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      orders = orders.filter((order) => new Date(order.createdAt) <= endDate);
    }

    orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return orders;
  }

  async getOrder(vendorId: string, orderId: string): Promise<Order> {
    const order = await this.orderRepo.findById(orderId);

    if (!order) {
      throw new AppError('Order not found', 404, 'ORDER_4001');
    }

    if (order.vendorId !== vendorId) {
      throw new AppError('Access denied', 403, 'ORDER_4002');
    }

    return order;
  }

  async acceptOrder(vendorId: string, orderId: string, preparationTime?: number): Promise<Order> {
    const order = await this.getOrder(vendorId, orderId);

    if (order.status !== 'PENDING') {
      throw new AppError('Order cannot be accepted in current state', 400, 'ORDER_4003');
    }

    const updates: Partial<Order> = {
      status: 'ACCEPTED',
      acceptedAt: new Date().toISOString(),
    };

    if (preparationTime) {
      updates.preparationTime = preparationTime;
    }

    const updatedOrder = await this.orderRepo.update(orderId, updates);

    logger.info('Order accepted', { vendorId, orderId });

    return updatedOrder;
  }

  async rejectOrder(vendorId: string, orderId: string, reason: string): Promise<Order> {
    const order = await this.getOrder(vendorId, orderId);

    if (order.status !== 'PENDING') {
      throw new AppError('Order cannot be rejected in current state', 400, 'ORDER_4004');
    }

    const updatedOrder = await this.orderRepo.update(orderId, {
      status: 'CANCELLED',
      rejectionReason: reason,
    });

    logger.info('Order rejected', { vendorId, orderId, reason });

    return updatedOrder;
  }

  async markOrderReady(vendorId: string, orderId: string): Promise<Order> {
    const order = await this.getOrder(vendorId, orderId);

    const validStatuses: OrderStatus[] = ['ACCEPTED', 'PREPARING'];

    if (!validStatuses.includes(order.status)) {
      throw new AppError('Order cannot be marked ready in current state', 400, 'ORDER_4005');
    }

    const updatedOrder = await this.orderRepo.update(orderId, {
      status: 'READY_FOR_PICKUP',
      readyAt: new Date().toISOString(),
    });

    logger.info('Order marked ready', { vendorId, orderId });

    return updatedOrder;
  }

  async getOrderStats(vendorId: string, period: string) {
    const allOrders = await this.orderRepo.findByVendor(vendorId);

    let startDate: Date;
    const now = new Date();

    switch (period) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        startDate = new Date(now.setHours(0, 0, 0, 0));
    }

    const periodOrders = allOrders.filter((order) => new Date(order.createdAt) >= startDate);

    const stats = {
      total: periodOrders.length,
      pending: periodOrders.filter((o) => o.status === 'PENDING').length,
      accepted: periodOrders.filter((o) => o.status === 'ACCEPTED').length,
      preparing: periodOrders.filter((o) => o.status === 'PREPARING').length,
      ready: periodOrders.filter((o) => o.status === 'READY_FOR_PICKUP').length,
      completed: periodOrders.filter((o) => o.status === 'DELIVERED').length,
      cancelled: periodOrders.filter((o) => o.status === 'CANCELLED').length,
      totalRevenue: periodOrders
        .filter((o) => o.status === 'DELIVERED')
        .reduce((sum, o) => sum + o.subtotal, 0),
      averageOrderValue: 0,
    };

    if (stats.completed > 0) {
      stats.averageOrderValue = stats.totalRevenue / stats.completed;
    }

    return stats;
  }
}


