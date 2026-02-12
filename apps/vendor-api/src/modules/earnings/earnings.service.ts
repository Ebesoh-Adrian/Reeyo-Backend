// apps/vendor-api/src/modules/earnings/earnings.service.ts

import { AppError } from '../../../../../libs/shared-utils/errors/app-error';
import { logger } from '../../../../../libs/shared-utils/logger';
import { OrderRepository } from '../../../../../libs/shared-utils/core-db/repositories/order.repository';

interface Transaction {
  transactionId: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  description: string;
  orderId?: string;
  timestamp: string;
}

export class EarningsService {
  private orderRepo: OrderRepository;
  private commissionRate: number = 0.15; // 15% platform commission

  constructor() {
    this.orderRepo = new OrderRepository();
    this.commissionRate = parseFloat(process.env.COMMISSION_RATE || '0.15');
  }

  async getEarningsSummary(vendorId: string) {
    const orders = await this.orderRepo.findByVendor(vendorId);
    const completedOrders = orders.filter((o) => o.status === 'DELIVERED');

    const totalGross = completedOrders.reduce((sum, order) => sum + order.subtotal, 0);
    const totalCommission = totalGross * this.commissionRate;
    const totalNet = totalGross - totalCommission;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayOrders = completedOrders.filter((o) => new Date(o.deliveredAt!) >= today);
    const todayGross = todayOrders.reduce((sum, order) => sum + order.subtotal, 0);
    const todayNet = todayGross * (1 - this.commissionRate);

    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - 7);

    const weekOrders = completedOrders.filter((o) => new Date(o.deliveredAt!) >= weekStart);
    const weekGross = weekOrders.reduce((sum, order) => sum + order.subtotal, 0);
    const weekNet = weekGross * (1 - this.commissionRate);

    const monthStart = new Date(today);
    monthStart.setMonth(today.getMonth() - 1);

    const monthOrders = completedOrders.filter((o) => new Date(o.deliveredAt!) >= monthStart);
    const monthGross = monthOrders.reduce((sum, order) => sum + order.subtotal, 0);
    const monthNet = monthGross * (1 - this.commissionRate);

    return {
      lifetime: {
        totalOrders: completedOrders.length,
        grossEarnings: totalGross,
        commission: totalCommission,
        netEarnings: totalNet,
      },
      today: {
        orders: todayOrders.length,
        grossEarnings: todayGross,
        netEarnings: todayNet,
      },
      week: {
        orders: weekOrders.length,
        grossEarnings: weekGross,
        netEarnings: weekNet,
      },
      month: {
        orders: monthOrders.length,
        grossEarnings: monthGross,
        netEarnings: monthNet,
      },
      commissionRate: this.commissionRate,
    };
  }

  async getTransactions(
    vendorId: string,
    filters: { page: number; limit: number; type?: 'CREDIT' | 'DEBIT' }
  ) {
    const orders = await this.orderRepo.findByVendor(vendorId);
    const completedOrders = orders.filter((o) => o.status === 'DELIVERED');

    const transactions: Transaction[] = completedOrders.map((order) => {
      const grossAmount = order.subtotal;
      const netAmount = grossAmount * (1 - this.commissionRate);

      return {
        transactionId: `txn_${order.orderId}`,
        type: 'CREDIT' as const,
        amount: netAmount,
        description: `Payment for order #${order.orderId}`,
        orderId: order.orderId,
        timestamp: order.deliveredAt || order.updatedAt,
      };
    });

    transactions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    let filteredTransactions = transactions;
    if (filters.type) {
      filteredTransactions = transactions.filter((t) => t.type === filters.type);
    }

    const startIndex = (filters.page - 1) * filters.limit;
    const endIndex = startIndex + filters.limit;
    const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

    return {
      transactions: paginatedTransactions,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: filteredTransactions.length,
        totalPages: Math.ceil(filteredTransactions.length / filters.limit),
      },
    };
  }

  async getDailyEarnings(vendorId: string, filters: { startDate?: string; endDate?: string }) {
    const orders = await this.orderRepo.findByVendor(vendorId);
    const completedOrders = orders.filter((o) => o.status === 'DELIVERED');

    let filteredOrders = completedOrders;

    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      filteredOrders = filteredOrders.filter((o) => new Date(o.deliveredAt!) >= startDate);
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      filteredOrders = filteredOrders.filter((o) => new Date(o.deliveredAt!) <= endDate);
    }

    const dailyEarnings = new Map<string, { gross: number; net: number; orders: number }>();

    filteredOrders.forEach((order) => {
      const date = new Date(order.deliveredAt!).toISOString().split('T')[0];
      const existing = dailyEarnings.get(date) || { gross: 0, net: 0, orders: 0 };

      existing.gross += order.subtotal;
      existing.net += order.subtotal * (1 - this.commissionRate);
      existing.orders += 1;

      dailyEarnings.set(date, existing);
    });

    const result = Array.from(dailyEarnings.entries())
      .map(([date, data]) => ({
        date,
        ...data,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return result;
  }

  async getWeeklyEarnings(vendorId: string) {
    const now = new Date();
    const fourWeeksAgo = new Date(now);
    fourWeeksAgo.setDate(now.getDate() - 28);

    const dailyData = await this.getDailyEarnings(vendorId, {
      startDate: fourWeeksAgo.toISOString(),
      endDate: now.toISOString(),
    });

    const weeklyData: Array<{ week: string; gross: number; net: number; orders: number }> = [];

    for (let i = 0; i < 4; i++) {
      const weekStart = new Date(fourWeeksAgo);
      weekStart.setDate(fourWeeksAgo.getDate() + i * 7);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      const weekData = dailyData.filter((day) => {
        const dayDate = new Date(day.date);
        return dayDate >= weekStart && dayDate <= weekEnd;
      });

      const gross = weekData.reduce((sum, day) => sum + day.gross, 0);
      const net = weekData.reduce((sum, day) => sum + day.net, 0);
      const orders = weekData.reduce((sum, day) => sum + day.orders, 0);

      weeklyData.push({
        week: `Week ${i + 1}`,
        gross,
        net,
        orders,
      });
    }

    return weeklyData;
  }

  async getMonthlyEarnings(vendorId: string, year?: number) {
    const targetYear = year || new Date().getFullYear();

    const startDate = new Date(`${targetYear}-01-01`);
    const endDate = new Date(`${targetYear}-12-31`);

    const dailyData = await this.getDailyEarnings(vendorId, {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    const monthlyData: Array<{ month: string; gross: number; net: number; orders: number }> = [];

    for (let month = 0; month < 12; month++) {
      const monthData = dailyData.filter((day) => {
        const dayDate = new Date(day.date);
        return dayDate.getMonth() === month && dayDate.getFullYear() === targetYear;
      });

      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      const gross = monthData.reduce((sum, day) => sum + day.gross, 0);
      const net = monthData.reduce((sum, day) => sum + day.net, 0);
      const orders = monthData.reduce((sum, day) => sum + day.orders, 0);

      monthlyData.push({
        month: monthNames[month],
        gross,
        net,
        orders,
      });
    }

    return monthlyData;
  }
}

