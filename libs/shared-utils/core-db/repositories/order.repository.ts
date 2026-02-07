// libs/core-db/repositories/order.repository.ts

import { BaseRepository } from './base.repository';
import { OrderModel } from '../models/order.model';
import { OrderStatus } from '../../constants';

export class OrderRepository extends BaseRepository<OrderModel> {
  constructor() {
    super('Order');
  }

  /**
   * Create a new order
   */
  async createOrder(order: OrderModel): Promise<OrderModel> {
    return this.create(order);
  }

  /**
   * Find order by ID
   */
  async findById(orderId: string): Promise<OrderModel | null> {
    return this.findByKey({
      PK: `ORDER#${orderId}`,
      SK: 'METADATA',
    });
  }

  /**
   * Update order status with timeline tracking
   */
  async updateStatus(
    orderId: string,
    status: OrderStatus,
    note?: string,
    location?: { lat: number; lng: number }
  ): Promise<OrderModel> {
    const order = await this.findById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    // Add to timeline
    const timeline = [
      ...order.timeline,
      {
        status,
        timestamp: new Date().toISOString(),
        ...(note && { note }),
        ...(location && { location }),
      },
    ];

    const updates: any = {
      status,
      timeline,
      GSI2SK: `ORDER#${status}#${order.createdAt}`,
    };

    // Set specific timestamp fields based on status
    switch (status) {
      case OrderStatus.ACCEPTED:
        updates.acceptedAt = new Date().toISOString();
        break;
      case OrderStatus.PREPARING:
        updates.preparingAt = new Date().toISOString();
        break;
      case OrderStatus.READY_FOR_PICKUP:
        updates.readyAt = new Date().toISOString();
        break;
      case OrderStatus.PICKED_UP:
        updates.pickedUpAt = new Date().toISOString();
        break;
      case OrderStatus.DELIVERED:
        updates.deliveredAt = new Date().toISOString();
        break;
      case OrderStatus.CANCELLED:
        updates.cancelledAt = new Date().toISOString();
        break;
      case OrderStatus.REJECTED:
        updates.rejectedAt = new Date().toISOString();
        break;
    }

    return this.update(
      {
        PK: `ORDER#${orderId}`,
        SK: 'METADATA',
      },
      updates
    );
  }

  /**
   * Assign rider to order
   */
  async assignRider(
    orderId: string,
    riderId: string,
    estimatedTime?: number
  ): Promise<OrderModel> {
    const updates: any = {
      riderId,
      GSI2PK: `RIDER#${riderId}#DELIVERIES`,
      status: OrderStatus.RIDER_ASSIGNED,
    };

    if (estimatedTime) {
      updates.estimatedDeliveryTime = new Date(
        Date.now() + estimatedTime * 60000
      ).toISOString();
    }

    return this.update(
      {
        PK: `ORDER#${orderId}`,
        SK: 'METADATA',
      },
      updates
    );
  }

  /**
   * Get orders for a specific user
   */
  async findByUser(
    userId: string,
    options?: {
      status?: OrderStatus;
      limit?: number;
      lastKey?: Record<string, any>;
    }
  ): Promise<{
    orders: OrderModel[];
    lastKey?: Record<string, any>;
  }> {
    let filterExpression: string | undefined;
    const expressionValues: any = { ':gsi1pk': `USER#${userId}#ORDERS` };

    if (options?.status) {
      filterExpression = '#status = :status';
      expressionValues[':status'] = options.status;
    }

    const result = await this.queryWithPagination(
      'GSI1PK = :gsi1pk',
      expressionValues,
      {
        indexName: 'GSI1',
        limit: options?.limit,
        lastKey: options?.lastKey,
      }
    );

    return {
      orders: result.items,
      lastKey: result.lastKey,
    };
  }

  /**
   * Get orders for a specific vendor
   */
  async findByVendor(
    vendorId: string,
    options?: {
      status?: OrderStatus;
      limit?: number;
      lastKey?: Record<string, any>;
    }
  ): Promise<{
    orders: OrderModel[];
    lastKey?: Record<string, any>;
  }> {
    let keyCondition = 'GSI2PK = :gsi2pk';
    const expressionValues: any = {
      ':gsi2pk': `VENDOR#${vendorId}#ORDERS`,
    };

    if (options?.status) {
      keyCondition += ' AND begins_with(GSI2SK, :gsi2sk)';
      expressionValues[':gsi2sk'] = `ORDER#${options.status}`;
    }

    const result = await this.queryWithPagination(
      keyCondition,
      expressionValues,
      {
        indexName: 'GSI2',
        limit: options?.limit,
        lastKey: options?.lastKey,
      }
    );

    return {
      orders: result.items,
      lastKey: result.lastKey,
    };
  }

  /**
   * Get orders for a specific rider
   */
  async findByRider(
    riderId: string,
    options?: {
      status?: OrderStatus;
      limit?: number;
      lastKey?: Record<string, any>;
    }
  ): Promise<{
    orders: OrderModel[];
    lastKey?: Record<string, any>;
  }> {
    let keyCondition = 'GSI2PK = :gsi2pk';
    const expressionValues: any = {
      ':gsi2pk': `RIDER#${riderId}#DELIVERIES`,
    };

    if (options?.status) {
      keyCondition += ' AND begins_with(GSI2SK, :gsi2sk)';
      expressionValues[':gsi2sk'] = `ORDER#${options.status}`;
    }

    const result = await this.queryWithPagination(
      keyCondition,
      expressionValues,
      {
        indexName: 'GSI2',
        limit: options?.limit,
        lastKey: options?.lastKey,
      }
    );

    return {
      orders: result.items,
      lastKey: result.lastKey,
    };
  }

  /**
   * Get active orders for rider (RIDER_ASSIGNED, PICKED_UP, IN_TRANSIT)
   */
  async findActiveOrdersByRider(riderId: string): Promise<OrderModel[]> {
    const result = await this.db.query<OrderModel>(
      'GSI2PK = :gsi2pk',
      { ':gsi2pk': `RIDER#${riderId}#DELIVERIES` },
      {
        indexName: 'GSI2',
        filterExpression: '#status IN (:status1, :status2, :status3)',
      }
    );

    return result.items;
  }

  /**
   * Update order pricing (after order completion)
   */
  async updatePricing(
    orderId: string,
    pricing: Partial<OrderModel['pricing']>
  ): Promise<OrderModel> {
    const order = await this.findById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    return this.update(
      {
        PK: `ORDER#${orderId}`,
        SK: 'METADATA',
      },
      {
        pricing: {
          ...order.pricing,
          ...pricing,
        },
      }
    );
  }

  /**
   * Add rating to order
   */
  async addRating(
    orderId: string,
    rating: OrderModel['rating']
  ): Promise<OrderModel> {
    return this.update(
      {
        PK: `ORDER#${orderId}`,
        SK: 'METADATA',
      },
      { rating }
    );
  }

  /**
   * Update cancellation reason
   */
  async updateCancellationReason(
    orderId: string,
    reason: string
  ): Promise<OrderModel> {
    return this.update(
      {
        PK: `ORDER#${orderId}`,
        SK: 'METADATA',
      },
      {
        cancellationReason: reason,
        status: OrderStatus.CANCELLED,
        cancelledAt: new Date().toISOString(),
      }
    );
  }

  /**
   * Update rejection reason
   */
  async updateRejectionReason(
    orderId: string,
    reason: string
  ): Promise<OrderModel> {
    return this.update(
      {
        PK: `ORDER#${orderId}`,
        SK: 'METADATA',
      },
      {
        rejectionReason: reason,
        status: OrderStatus.REJECTED,
        rejectedAt: new Date().toISOString(),
      }
    );
  }

  /**
   * Add verification code for delivery
   */
  async setVerificationCode(
    orderId: string,
    code: string
  ): Promise<OrderModel> {
    return this.update(
      {
        PK: `ORDER#${orderId}`,
        SK: 'METADATA',
      },
      { verificationCode: code }
    );
  }

  /**
   * Add delivery photos
   */
  async addPhotos(
    orderId: string,
    photos: { pickup?: string[]; delivery?: string[] }
  ): Promise<OrderModel> {
    const order = await this.findById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    return this.update(
      {
        PK: `ORDER#${orderId}`,
        SK: 'METADATA',
      },
      {
        photos: {
          pickup: photos.pickup || order.photos?.pickup || [],
          delivery: photos.delivery || order.photos?.delivery || [],
        },
      }
    );
  }
}