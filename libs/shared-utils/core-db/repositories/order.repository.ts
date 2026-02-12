// libs/core-db/repositories/order.repository.ts

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  UpdateCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import { AppError } from '../../errors/app-error';

export type OrderStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'RIDER_ASSIGNED'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'CANCELLED';

export interface Order {
  orderId: string;
  userId: string;
  vendorId: string;
  riderId?: string;
  items: Array<{
    itemId: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  paymentMethod: 'WALLET' | 'MOBILE_MONEY' | 'CASH';
  paymentStatus: 'PENDING' | 'PAID' | 'REFUNDED';
  deliveryAddress: any;
  pickupLocation: any;
  preparationTime?: number;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  acceptedAt?: string;
  readyAt?: string;
  deliveredAt?: string;
}

export class OrderRepository {
  private docClient: DynamoDBDocumentClient;
  private tableName: string;

  constructor() {
    const client = new DynamoDBClient({
      region: process.env.AWS_REGION || 'us-east-1',
    });
    this.docClient = DynamoDBDocumentClient.from(client);
    this.tableName = `${process.env.DYNAMODB_TABLE_PREFIX || 'reeyo'}-orders`;
  }

  async create(order: Order): Promise<Order> {
    await this.docClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: order,
      })
    );
    return order;
  }

  async findById(orderId: string): Promise<Order | null> {
    const result = await this.docClient.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { orderId },
      })
    );

    return (result.Item as Order) || null;
  }

  async findByVendor(
    vendorId: string,
    status?: OrderStatus
  ): Promise<Order[]> {
    const params: any = {
      TableName: this.tableName,
      IndexName: 'VendorIndex',
      KeyConditionExpression: 'vendorId = :vendorId',
      ExpressionAttributeValues: {
        ':vendorId': vendorId,
      },
    };

    if (status) {
      params.FilterExpression = '#status = :status';
      params.ExpressionAttributeNames = { '#status': 'status' };
      params.ExpressionAttributeValues[':status'] = status;
    }

    const result = await this.docClient.send(new QueryCommand(params));

    return (result.Items as Order[]) || [];
  }

  async update(orderId: string, updates: Partial<Order>): Promise<Order> {
    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    Object.entries(updates).forEach(([key, value], index) => {
      const attrName = `#attr${index}`;
      const attrValue = `:val${index}`;
      updateExpressions.push(`${attrName} = ${attrValue}`);
      expressionAttributeNames[attrName] = key;
      expressionAttributeValues[attrValue] = value;
    });

    updateExpressions.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    const result = await this.docClient.send(
      new UpdateCommand({
        TableName: this.tableName,
        Key: { orderId },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW',
      })
    );

    if (!result.Attributes) {
      throw new AppError('Order not found', 404, 'ORDER_4001');
    }

    return result.Attributes as Order;
  }
}