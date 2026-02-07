// apps/vendor-api/src/modules/orders/orders.controller.ts

import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { AppError, asyncHandler } from '../../middleware/error.middleware';
import { OrdersService } from './orders.service';

export class OrdersController {
  private ordersService: OrdersService;

  constructor() {
    this.ordersService = new OrdersService();
  }

  /**
   * Get all orders with filters
   * GET /api/v1/orders
   */
  getOrders = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.vendor) {
      throw new AppError('Unauthorized', 401, 'AUTH_1000');
    }

    const { status, page = '1', limit = '20' } = req.query;

    const result = await this.ordersService.getOrders(req.vendor.vendorId, {
      status: status as string,
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  /**
   * Get pending orders
   * GET /api/v1/orders/pending
   */
  getPendingOrders = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.vendor) {
      throw new AppError('Unauthorized', 401, 'AUTH_1000');
    }

    const orders = await this.ordersService.getPendingOrders(req.vendor.vendorId);

    res.status(200).json({
      success: true,
      data: {
        orders,
        total: orders.length,
      },
    });
  });

  /**
   * Get active orders
   * GET /api/v1/orders/active
   */
  getActiveOrders = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.vendor) {
      throw new AppError('Unauthorized', 401, 'AUTH_1000');
    }

    const orders = await this.ordersService.getActiveOrders(req.vendor.vendorId);

    res.status(200).json({
      success: true,
      data: {
        orders,
        total: orders.length,
      },
    });
  });

  /**
   * Get order history
   * GET /api/v1/orders/history
   */
  getOrderHistory = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.vendor) {
      throw new AppError('Unauthorized', 401, 'AUTH_1000');
    }

    const { startDate, endDate } = req.query;

    const orders = await this.ordersService.getOrderHistory(req.vendor.vendorId, {
      startDate: startDate as string,
      endDate: endDate as string,
    });

    res.status(200).json({
      success: true,
      data: {
        orders,
        total: orders.length,
      },
    });
  });

  /**
   * Get single order
   * GET /api/v1/orders/:orderId
   */
  getOrder = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.vendor) {
      throw new AppError('Unauthorized', 401, 'AUTH_1000');
    }

    const { orderId } = req.params;

    const order = await this.ordersService.getOrder(
      req.vendor.vendorId,
      orderId
    );

    res.status(200).json({
      success: true,
      data: order,
    });
  });

  /**
   * Accept order
   * PUT /api/v1/orders/:orderId/accept
   */
  acceptOrder = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.vendor) {
      throw new AppError('Unauthorized', 401, 'AUTH_1000');
    }

    const { orderId } = req.params;
    const { preparationTime } = req.body;

    const order = await this.ordersService.acceptOrder(
      req.vendor.vendorId,
      orderId,
      preparationTime
    );

    res.status(200).json({
      success: true,
      message: 'Order accepted successfully',
      data: order,
    });
  });

  /**
   * Reject order
   * PUT /api/v1/orders/:orderId/reject
   */
  rejectOrder = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.vendor) {
      throw new AppError('Unauthorized', 401, 'AUTH_1000');
    }

    const { orderId } = req.params;
    const { reason } = req.body;

    const order = await this.ordersService.rejectOrder(
      req.vendor.vendorId,
      orderId,
      reason
    );

    res.status(200).json({
      success: true,
      message: 'Order rejected',
      data: order,
    });
  });

  /**
   * Mark order ready for pickup
   * PUT /api/v1/orders/:orderId/ready
   */
  markOrderReady = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.vendor) {
      throw new AppError('Unauthorized', 401, 'AUTH_1000');
    }

    const { orderId } = req.params;

    const order = await this.ordersService.markOrderReady(
      req.vendor.vendorId,
      orderId
    );

    res.status(200).json({
      success: true,
      message: 'Order marked as ready for pickup',
      data: order,
    });
  });

  /**
   * Get order statistics
   * GET /api/v1/orders/stats/summary
   */
  getOrderStats = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.vendor) {
      throw new AppError('Unauthorized', 401, 'AUTH_1000');
    }

    const { period = 'today' } = req.query;

    const stats = await this.ordersService.getOrderStats(
      req.vendor.vendorId,
      period as string
    );

    res.status(200).json({
      success: true,
      data: stats,
    });
  });
}