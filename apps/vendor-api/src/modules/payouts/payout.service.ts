// apps/vendor-api/src/modules/payouts/payouts.service.ts

import { v4 as uuidv4 } from 'uuid';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import { AppError } from '../../../../../libs/shared-utils/errors/app-error';
import { logger } from '../../../../../libs/shared-utils/logger';
import { OrderRepository } from '../../../../../libs/shared-utils/core-db/repositories/order.repository';

interface Payout {
  payoutId: string;
  vendorId: string;
  amount: number;
  bankDetails: {
    accountName: string;
    accountNumber: string;
    bankName: string;
  };
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  requestedAt: string;
  processedAt?: string;
  completedAt?: string;
  failureReason?: string;
}

export class PayoutsService {
  private docClient: DynamoDBDocumentClient;
  private tableName: string;
  private orderRepo: OrderRepository;
  private minimumPayout: number;

  constructor() {
    const client = new DynamoDBClient({
      region: process.env.AWS_REGION || 'us-east-1',
    });
    this.docClient = DynamoDBDocumentClient.from(client);
    this.tableName = `${process.env.DYNAMODB_TABLE_PREFIX || 'reeyo'}-payouts`;
    this.orderRepo = new OrderRepository();
    this.minimumPayout = parseInt(process.env.MINIMUM_PAYOUT_AMOUNT || '50000', 10);
  }

  async requestPayout(
    vendorId: string,
    data: { amount: number; bankDetails: any }
  ): Promise<Payout> {
    if (data.amount < this.minimumPayout) {
      throw new AppError(
        `Minimum payout amount is ${this.minimumPayout} XAF`,
        400,
        'PAYOUT_5001'
      );
    }

    const availableBalance = await this.getAvailableBalance(vendorId);

    if (data.amount > availableBalance) {
      throw new AppError('Insufficient balance', 400, 'PAYOUT_5002');
    }

    const payoutId = `payout_${uuidv4()}`;

    const payout: Payout = {
      payoutId,
      vendorId,
      amount: data.amount,
      bankDetails: data.bankDetails,
      status: 'PENDING',
      requestedAt: new Date().toISOString(),
    };

    await this.docClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: payout,
      })
    );

    logger.info('Payout requested', { vendorId, payoutId, amount: data.amount });

    return payout;
  }

  async getPayouts(vendorId: string): Promise<Payout[]> {
    const result = await this.docClient.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: 'VendorIndex',
        KeyConditionExpression: 'vendorId = :vendorId',
        ExpressionAttributeValues: {
          ':vendorId': vendorId,
        },
      })
    );

    const payouts = (result.Items as Payout[]) || [];

    payouts.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());

    return payouts;
  }

  async getPayout(vendorId: string, payoutId: string): Promise<Payout> {
    const result = await this.docClient.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { payoutId },
      })
    );

    const payout = result.Item as Payout;

    if (!payout) {
      throw new AppError('Payout not found', 404, 'PAYOUT_5003');
    }

    if (payout.vendorId !== vendorId) {
      throw new AppError('Access denied', 403, 'PAYOUT_5004');
    }

    return payout;
  }

  private async getAvailableBalance(vendorId: string): Promise<number> {
    const orders = await this.orderRepo.findByVendor(vendorId);
    const completedOrders = orders.filter((o) => o.status === 'DELIVERED');

    const commissionRate = parseFloat(process.env.COMMISSION_RATE || '0.15');

    const totalEarnings = completedOrders.reduce((sum, order) => {
      const netEarnings = order.subtotal * (1 - commissionRate);
      return sum + netEarnings;
    }, 0);

    const payouts = await this.getPayouts(vendorId);
    const paidOut = payouts
      .filter((p) => p.status === 'COMPLETED')
      .reduce((sum, p) => sum + p.amount, 0);

    const pendingPayouts = payouts
      .filter((p) => p.status === 'PENDING' || p.status === 'PROCESSING')
      .reduce((sum, p) => sum + p.amount, 0);

    return totalEarnings - paidOut - pendingPayouts;
  }
}

