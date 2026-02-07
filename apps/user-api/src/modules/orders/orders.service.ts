import { v4 as uuidv4 } from 'uuid';
import { OrderRepository } from '../../../../../libs/core-db/repositories/order.repository';
import { UserRepository } from '../../../../../libs/core-db/repositories/user.repository';
import { VendorRepository } from '../../../../../libs/core-db/repositories/vendor.repository';
import { WalletService } from '../../../../../libs/wallet-engine/wallet.service';
import { AppError } from '../../../../../libs/shared-utils/error-handler';
import { logger } from '../../../../../libs/shared-utils/logger';
import { PushNotificationService } from '../../../../../libs/notifications/push.service';
import io from 'socket.io-client';

interface OrderItemDTO {
  itemId: string;
  name: string;
  price: number;
  quantity: number;
  specialInstructions?: string;
}

interface PlaceOrderDTO {
  vendorId: string;
  items: OrderItemDTO[];
  deliveryAddressId: string;
  deliveryInstructions?: string;
  paymentMethod: 'WALLET' | 'MOBILE_MONEY' | 'CASH';
}

export class OrdersService {
  private orderRepo: OrderRepository;
  private userRepo: UserRepository;
  private vendorRepo: VendorRepository;
  private walletService: WalletService;
  private pushService: PushNotificationService;
  private socket: any;

  constructor() {
    this.orderRepo = new OrderRepository();
    this.userRepo = new UserRepository();
    this.vendorRepo = new VendorRepository();
    this.walletService = new WalletService();
    this.pushService = new PushNotificationService();

    if (process.env.SOCKET_SERVER_URL) {
      this.socket = io(process.env.SOCKET_SERVER_URL);
    }
  }

  async placeOrder(userId: string, data: PlaceOrderDTO): Promise<any> {
    logger.info('Placing order', { userId, vendorId: data.vendorId });

    const user = await this.userRepo.findById(userId);
    if (!user) throw new AppError('User not found', 404, 'USER_3000');

    const vendor = await this.vendorRepo.findById(data.vendorId);
    if (!vendor) throw new AppError('Vendor not found', 404, 'VENDOR_3000');
    if (!vendor.isOnline) throw new AppError('Vendor is currently offline', 400, 'ORDER_4000');

    const address = user.addresses?.find((a: any) => a.id === data.deliveryAddressId);
    if (!address) throw new AppError('Delivery address not found', 404, 'USER_3001');

    const subtotal = data.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const deliveryFee = this.calculateDeliveryFee(subtotal, vendor.location, address.coordinates);
    const total = subtotal + deliveryFee;

    if (subtotal < parseInt(process.env.MIN_ORDER_AMOUNT || '500', 10)) {
      throw new AppError('Order amount below minimum', 400, 'ORDER_4001');
    }

    const orderId = `order_${uuidv4()}`;
    const order = await this.orderRepo.create({
      orderId,
      userId,
      userName: `${user.firstName} ${user.lastName}`,
      userPhone: user.phone,
      vendorId: data.vendorId,
      vendorName: vendor.businessName,
      items: data.items,
      subtotal,
      deliveryFee,
      total,
      status: 'PENDING',
      paymentMethod: data.paymentMethod,
      paymentStatus: 'PENDING',
      deliveryAddress: address,
      deliveryInstructions: data.deliveryInstructions,
      pickupLocation: vendor.location,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    if (data.paymentMethod === 'WALLET') {
      try {
        await this.walletService.debitWallet('USER', userId, total, `Order #${orderId}`, orderId);
        await this.orderRepo.update(orderId, { paymentStatus: 'PAID' });
      } catch (error) {
        await this.orderRepo.update(orderId, { status: 'CANCELLED', cancelReason: 'Payment failed' });
        throw new AppError('Insufficient wallet balance', 400, 'WALLET_4000');
      }
    }

    if (this.socket) {
      this.socket.emit('new_order', { orderId, vendorId: data.vendorId });
    }

    try {
      await this.pushService.sendPushNotification(data.vendorId, 'New Order', `New order from ${user.firstName}`);
    } catch (error) {
      logger.error('Failed to send push notification', { error });
    }

    logger.info('Order placed successfully', { orderId });
    return order;
  }

  async getActiveOrders(userId: string): Promise<any[]> {
    const orders = await this.orderRepo.findByUserId(userId);
    return orders.filter(o => !['DELIVERED', 'CANCELLED', 'REFUNDED'].includes(o.status));
  }

  async getOrderHistory(userId: string, page: number = 1, limit: number = 20): Promise<any> {
    const orders = await this.orderRepo.findByUserId(userId);
    const completed = orders.filter(o => ['DELIVERED', 'CANCELLED', 'REFUNDED'].includes(o.status));
    completed.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const startIndex = (page - 1) * limit;
    const paginatedOrders = completed.slice(startIndex, startIndex + limit);

    return {
      orders: paginatedOrders,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(completed.length / limit),
        totalOrders: completed.length,
        hasNext: startIndex + limit < completed.length,
        hasPrev: page > 1,
      },
    };
  }

  async getOrderDetails(userId: string, orderId: string): Promise<any> {
    const order = await this.orderRepo.findById(orderId);
    if (!order) throw new AppError('Order not found', 404, 'ORDER_3000');
    if (order.userId !== userId) throw new AppError('Access forbidden', 403, 'ORDER_4002');
    return order;
  }

  async cancelOrder(userId: string, orderId: string, reason: string): Promise<any> {
    const order = await this.orderRepo.findById(orderId);
    if (!order) throw new AppError('Order not found', 404, 'ORDER_3000');
    if (order.userId !== userId) throw new AppError('Access forbidden', 403, 'ORDER_4002');
    if (!['PENDING', 'ACCEPTED'].includes(order.status)) {
      throw new AppError('Cannot cancel order at this stage', 400, 'ORDER_4003');
    }

    const updatedOrder = await this.orderRepo.update(orderId, {
      status: 'CANCELLED',
      cancelReason: reason,
      cancelledAt: new Date().toISOString(),
      cancelledBy: 'USER',
      updatedAt: new Date().toISOString(),
    });

    if (order.paymentMethod === 'WALLET' && order.paymentStatus === 'PAID') {
      await this.walletService.creditWallet('USER', userId, order.total, `Refund for order #${orderId}`, orderId);
    }

    if (this.socket) {
      this.socket.emit('order_cancelled', { orderId, vendorId: order.vendorId });
    }

    logger.info('Order cancelled', { orderId, reason });
    return updatedOrder;
  }

  async rateOrder(userId: string, orderId: string, rating: number, review?: string): Promise<any> {
    const order = await this.orderRepo.findById(orderId);
    if (!order) throw new AppError('Order not found', 404, 'ORDER_3000');
    if (order.userId !== userId) throw new AppError('Access forbidden', 403, 'ORDER_4002');
    if (order.status !== 'DELIVERED') throw new AppError('Can only rate delivered orders', 400, 'ORDER_4004');

    const updatedOrder = await this.orderRepo.update(orderId, {
      rating: { stars: rating, review, ratedAt: new Date().toISOString() },
      updatedAt: new Date().toISOString(),
    });

    logger.info('Order rated', { orderId, rating });
    return updatedOrder;
  }

  private calculateDeliveryFee(subtotal: number, vendorLocation: any, deliveryLocation: any): number {
    const freeDeliveryThreshold = parseInt(process.env.FREE_DELIVERY_THRESHOLD || '10000', 10);
    if (subtotal >= freeDeliveryThreshold) return 0;

    const distance = this.calculateDistance(
      vendorLocation.coordinates.lat,
      vendorLocation.coordinates.lng,
      deliveryLocation.lat,
      deliveryLocation.lng
    );

    const baseFee = parseInt(process.env.DELIVERY_FEE_BASE || '1000', 10);
    const perKmFee = parseInt(process.env.DELIVERY_FEE_PER_KM || '200', 10);
    return baseFee + Math.ceil(distance) * perKmFee;
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLng = (lng2 - lng1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}
