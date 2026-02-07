import { Response } from 'express';
import { OrdersService } from './orders.service';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { asyncHandler } from '../../middleware/error.middleware';

export class OrdersController {
  private ordersService: OrdersService;
  constructor() {
    this.ordersService = new OrdersService();
  }

  placeOrder = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const order = await this.ordersService.placeOrder(req.user.userId, req.body);
    res.status(201).json({ success: true, message: 'Order placed successfully', data: order });
  });

  getActiveOrders = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const orders = await this.ordersService.getActiveOrders(req.user.userId);
    res.status(200).json({ success: true, data: orders });
  });

  getOrderHistory = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await this.ordersService.getOrderHistory(req.user.userId, page, limit);
    res.status(200).json({ success: true, data: result });
  });

  getOrderDetails = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const { orderId } = req.params;
    const order = await this.ordersService.getOrderDetails(req.user.userId, orderId);
    res.status(200).json({ success: true, data: order });
  });

  cancelOrder = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const { orderId } = req.params;
    const { reason } = req.body;
    const order = await this.ordersService.cancelOrder(req.user.userId, orderId, reason);
    res.status(200).json({ success: true, message: 'Order cancelled', data: order });
  });

  rateOrder = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const { orderId } = req.params;
    const { rating, review } = req.body;
    const order = await this.ordersService.rateOrder(req.user.userId, orderId, rating, review);
    res.status(200).json({ success: true, message: 'Rating submitted', data: order });
  });
}
