// libs/core-db/repositories/vendor.repository.ts

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  UpdateCommand,
  QueryCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';
import { AppError } from '../..//errors/app-error';

export interface Vendor {
  vendorId: string;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  password: string;
  serviceType: 'FOOD' | 'MART';
  location: {
    address: string;
    city: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  bankDetails: {
    accountName: string;
    accountNumber: string;
    bankName: string;
  };
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  status: 'PENDING_VERIFICATION' | 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
  otp?: string;
  otpExpiry?: string;
  resetToken?: string;
  resetTokenExpiry?: string;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export class VendorRepository {
  private docClient: DynamoDBDocumentClient;
  private tableName: string;

  constructor() {
    const client = new DynamoDBClient({
      region: process.env.AWS_REGION || 'us-east-1',
    });
    this.docClient = DynamoDBDocumentClient.from(client);
    this.tableName = `${process.env.DYNAMODB_TABLE_PREFIX || 'reeyo'}-vendors`;
  }

  async create(vendor: Vendor): Promise<Vendor> {
    try {
      await this.docClient.send(
        new PutCommand({
          TableName: this.tableName,
          Item: vendor,
          ConditionExpression: 'attribute_not_exists(vendorId)',
        })
      );
      return vendor;
    } catch (error: any) {
      if (error.name === 'ConditionalCheckFailedException') {
        throw new AppError('Vendor already exists', 409, 'VENDOR_2001');
      }
      throw error;
    }
  }

  async findById(vendorId: string): Promise<Vendor | null> {
    const result = await this.docClient.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { vendorId },
      })
    );

    return (result.Item as Vendor) || null;
  }

  async findByEmail(email: string): Promise<Vendor | null> {
    const result = await this.docClient.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: 'EmailIndex',
        KeyConditionExpression: 'email = :email',
        ExpressionAttributeValues: {
          ':email': email,
        },
        Limit: 1,
      })
    );

    return result.Items?.[0] as Vendor || null;
  }

  async findByPhone(phone: string): Promise<Vendor | null> {
    const result = await this.docClient.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: 'PhoneIndex',
        KeyConditionExpression: 'phone = :phone',
        ExpressionAttributeValues: {
          ':phone': phone,
        },
        Limit: 1,
      })
    );

    return result.Items?.[0] as Vendor || null;
  }

  async findByResetToken(resetToken: string): Promise<Vendor | null> {
    const result = await this.docClient.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: 'ResetTokenIndex',
        KeyConditionExpression: 'resetToken = :resetToken',
        ExpressionAttributeValues: {
          ':resetToken': resetToken,
        },
        Limit: 1,
      })
    );

    return result.Items?.[0] as Vendor || null;
  }

  async update(vendorId: string, updates: Partial<Vendor>): Promise<Vendor> {
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

    // Always update updatedAt
    updateExpressions.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    const result = await this.docClient.send(
      new UpdateCommand({
        TableName: this.tableName,
        Key: { vendorId },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW',
      })
    );

    if (!result.Attributes) {
      throw new AppError('Vendor not found', 404, 'VENDOR_2002');
    }

    return result.Attributes as Vendor;
  }

  async delete(vendorId: string): Promise<void> {
    await this.docClient.send(
      new DeleteCommand({
        TableName: this.tableName,
        Key: { vendorId },
      })
    );
  }
}