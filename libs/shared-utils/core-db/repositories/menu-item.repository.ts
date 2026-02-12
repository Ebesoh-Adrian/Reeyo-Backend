// libs/core-db/repositories/menu-item.repository.ts

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  UpdateCommand,
  QueryCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';
import { AppError } from '../../errors/app-error';

export interface MenuItem {
  itemId: string;
  vendorId: string;
  name: string;
  description: string;
  category: string;
  price: number;
  preparationTime: number;
  available: boolean;
  images: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export class MenuItemRepository {
  private docClient: DynamoDBDocumentClient;
  private tableName: string;

  constructor() {
    const client = new DynamoDBClient({
      region: process.env.AWS_REGION || 'us-east-1',
    });
    this.docClient = DynamoDBDocumentClient.from(client);
    this.tableName = `${process.env.DYNAMODB_TABLE_PREFIX || 'reeyo'}-menu-items`;
  }

  async create(item: MenuItem): Promise<MenuItem> {
    await this.docClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: item,
      })
    );
    return item;
  }

  async findById(itemId: string): Promise<MenuItem | null> {
    const result = await this.docClient.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { itemId },
      })
    );

    return (result.Item as MenuItem) || null;
  }

  async findByVendor(vendorId: string): Promise<MenuItem[]> {
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

    return (result.Items as MenuItem[]) || [];
  }

  async update(itemId: string, updates: Partial<MenuItem>): Promise<MenuItem> {
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
        Key: { itemId },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW',
      })
    );

    if (!result.Attributes) {
      throw new AppError('Menu item not found', 404, 'INVENTORY_3001');
    }

    return result.Attributes as MenuItem;
  }

  async delete(itemId: string): Promise<void> {
    await this.docClient.send(
      new DeleteCommand({
        TableName: this.tableName,
        Key: { itemId },
      })
    );
  }
}