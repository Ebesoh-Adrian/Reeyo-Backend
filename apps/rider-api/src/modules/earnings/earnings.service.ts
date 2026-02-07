import { WalletRepository } from '../../../../../libs/core-db/repositories/wallet.repository';
import { OrderRepository } from '../../../../../libs/core-db/repositories/order.repository';
import { AppError } from '../../../../../libs/shared-utils/error-handler';
import { logger } from '../../../../../libs/shared-utils/logger';

export class EarningsService {
  private walletRepo: WalletRepository;
  private orderRepo: OrderRepository;

  constructor() {
    this.walletRepo = new WalletRepository();
    this.orderRepo = new OrderRepository();
  }

  /**
   * Get earnings summary
   */
  async getEarningsSummary(riderId: string): Promise<any> {
    logger.info('Getting earnings summary', { riderId });

    // Get wallet balance
    const balance = await this.walletRepo.getBalance('RIDER', riderId);

    // Get all completed orders
    const orders = await this.orderRepo.findByRiderId(riderId);
    const completedOrders = orders.filter(order => order.status === 'DELIVERED');

    // Calculate total earnings
    const totalEarnings = completedOrders.reduce((sum, order) => {
      return sum + (order.deliveryFee || 0);
    }, 0);

    // Calculate this week's earnings
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const weeklyEarnings = completedOrders
      .filter(order => new Date(order.deliveredAt!) >= oneWeekAgo)
      .reduce((sum, order) => sum + (order.deliveryFee || 0), 0);

    // Calculate this month's earnings
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const monthlyEarnings = completedOrders
      .filter(order => new Date(order.deliveredAt!) >= oneMonthAgo)
      .reduce((sum, order) => sum + (order.deliveryFee || 0), 0);

    return {
      currentBalance: balance,
      totalEarnings,
      weeklyEarnings,
      monthlyEarnings,
      totalDeliveries: completedOrders.length,
    };
  }

  /**
   * Get transaction history
   */
  async getTransactions(
    riderId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<any> {
    logger.info('Getting transactions', { riderId, page, limit });

    const transactions = await this.walletRepo.getTransactions('RIDER', riderId);

    // Sort by date (most recent first)
    transactions.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Paginate
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedTransactions = transactions.slice(startIndex, endIndex);

    return {
      transactions: paginatedTransactions,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(transactions.length / limit),
        totalTransactions: transactions.length,
        hasNext: endIndex < transactions.length,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Get daily earnings
   */
  async getDailyEarnings(riderId: string, days: number = 30): Promise<any[]> {
    logger.info('Getting daily earnings', { riderId, days });

    const orders = await this.orderRepo.findByRiderId(riderId);
    const completedOrders = orders.filter(order => order.status === 'DELIVERED');

    // Group by date
    const dailyEarnings: { [key: string]: number } = {};
    const dailyDeliveries: { [key: string]: number } = {};

    completedOrders.forEach(order => {
      if (order.deliveredAt) {
        const date = order.deliveredAt.split('T')[0]; // Get YYYY-MM-DD
        dailyEarnings[date] = (dailyEarnings[date] || 0) + (order.deliveryFee || 0);
        dailyDeliveries[date] = (dailyDeliveries[date] || 0) + 1;
      }
    });

    // Generate array for last N days
    const result = [];
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      result.push({
        date: dateStr,
        earnings: dailyEarnings[dateStr] || 0,
        deliveries: dailyDeliveries[dateStr] || 0,
      });
    }

    return result;
  }

  /**
   * Get weekly earnings
   */
  async getWeeklyEarnings(riderId: string, weeks: number = 12): Promise<any[]> {
    logger.info('Getting weekly earnings', { riderId, weeks });

    const orders = await this.orderRepo.findByRiderId(riderId);
    const completedOrders = orders.filter(order => order.status === 'DELIVERED');

    // Group by week
    const weeklyEarnings: { [key: string]: number } = {};
    const weeklyDeliveries: { [key: string]: number } = {};

    completedOrders.forEach(order => {
      if (order.deliveredAt) {
        const date = new Date(order.deliveredAt);
        const weekStart = this.getWeekStart(date);
        const weekKey = weekStart.toISOString().split('T')[0];

        weeklyEarnings[weekKey] = (weeklyEarnings[weekKey] || 0) + (order.deliveryFee || 0);
        weeklyDeliveries[weekKey] = (weeklyDeliveries[weekKey] || 0) + 1;
      }
    });

    // Generate array for last N weeks
    const result = [];
    const today = new Date();
    for (let i = weeks - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i * 7);
      const weekStart = this.getWeekStart(date);
      const weekKey = weekStart.toISOString().split('T')[0];

      result.push({
        weekStart: weekKey,
        earnings: weeklyEarnings[weekKey] || 0,
        deliveries: weeklyDeliveries[weekKey] || 0,
      });
    }

    return result;
  }

  /**
   * Get monthly earnings
   */
  async getMonthlyEarnings(riderId: string, months: number = 12): Promise<any[]> {
    logger.info('Getting monthly earnings', { riderId, months });

    const orders = await this.orderRepo.findByRiderId(riderId);
    const completedOrders = orders.filter(order => order.status === 'DELIVERED');

    // Group by month
    const monthlyEarnings: { [key: string]: number } = {};
    const monthlyDeliveries: { [key: string]: number } = {};

    completedOrders.forEach(order => {
      if (order.deliveredAt) {
        const date = new Date(order.deliveredAt);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        monthlyEarnings[monthKey] = (monthlyEarnings[monthKey] || 0) + (order.deliveryFee || 0);
        monthlyDeliveries[monthKey] = (monthlyDeliveries[monthKey] || 0) + 1;
      }
    });

    // Generate array for last N months
    const result = [];
    const today = new Date();
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      result.push({
        month: monthKey,
        earnings: monthlyEarnings[monthKey] || 0,
        deliveries: monthlyDeliveries[monthKey] || 0,
      });
    }

    return result;
  }

  /**
   * Helper: Get start of week (Monday)
   */
  private getWeekStart(date: Date): Date {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(date.setDate(diff));
  }
}
