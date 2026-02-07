// libs/core-db/client.ts

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand,
  BatchGetCommand,
  BatchWriteCommand,
  TransactWriteCommand,
  TransactGetCommand,
} from '@aws-sdk/lib-dynamodb';
import { logger } from '@reeyo/shared-utils';

// DynamoDB Client Configuration
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  ...(process.env.DYNAMODB_ENDPOINT && {
    endpoint: process.env.DYNAMODB_ENDPOINT,
  }),
  ...(process.env.AWS_ACCESS_KEY_ID && {
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
  }),
});

// Document Client for easier JavaScript object handling
const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    convertEmptyValues: false,
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  },
  unmarshallOptions: {
    wrapNumbers: false,
  },
});

export const TABLE_NAME = process.env.DYNAMODB_TABLE || 'ReeYo-Development';

/**
 * DynamoDB Client Wrapper
 * Provides typed methods for common DynamoDB operations
 */
export class DynamoDBService {
  private tableName: string;

  constructor(tableName?: string) {
    this.tableName = tableName || TABLE_NAME;
  }

  /**
   * Get single item
   */
  async get<T = any>(key: Record<string, any>): Promise<T | null> {
    try {
      const response = await docClient.send(
        new GetCommand({
          TableName: this.tableName,
          Key: key,
        })
      );

      return (response.Item as T) || null;
    } catch (error) {
      logger.error('DynamoDB Get Error:', error);
      throw error;
    }
  }

  /**
   * Put item (create or replace)
   */
  async put<T = any>(item: T): Promise<T> {
    try {
      await docClient.send(
        new PutCommand({
          TableName: this.tableName,
          Item: item as Record<string, any>,
        })
      );

      return item;
    } catch (error) {
      logger.error('DynamoDB Put Error:', error);
      throw error;
    }
  }

  /**
   * Update item
   */
  async update<T = any>(
    key: Record<string, any>,
    updates: Record<string, any>,
    conditions?: string
  ): Promise<T> {
    try {
      // Build update expression
      const updateExpressions: string[] = [];
      const expressionAttributeNames: Record<string, string> = {};
      const expressionAttributeValues: Record<string, any> = {};

      Object.entries(updates).forEach(([key, value], index) => {
        const nameKey = `#attr${index}`;
        const valueKey = `:val${index}`;
        
        updateExpressions.push(`${nameKey} = ${valueKey}`);
        expressionAttributeNames[nameKey] = key;
        expressionAttributeValues[valueKey] = value;
      });

      const response = await docClient.send(
        new UpdateCommand({
          TableName: this.tableName,
          Key: key,
          UpdateExpression: `SET ${updateExpressions.join(', ')}`,
          ExpressionAttributeNames: expressionAttributeNames,
          ExpressionAttributeValues: expressionAttributeValues,
          ...(conditions && { ConditionExpression: conditions }),
          ReturnValues: 'ALL_NEW',
        })
      );

      return response.Attributes as T;
    } catch (error) {
      logger.error('DynamoDB Update Error:', error);
      throw error;
    }
  }

  /**
   * Delete item
   */
  async delete(key: Record<string, any>): Promise<void> {
    try {
      await docClient.send(
        new DeleteCommand({
          TableName: this.tableName,
          Key: key,
        })
      );
    } catch (error) {
      logger.error('DynamoDB Delete Error:', error);
      throw error;
    }
  }

  /**
   * Query items
   */
  async query<T = any>(
    keyCondition: string,
    expressionValues: Record<string, any>,
    options?: {
      indexName?: string;
      filterExpression?: string;
      limit?: number;
      scanIndexForward?: boolean;
      exclusiveStartKey?: Record<string, any>;
    }
  ): Promise<{ items: T[]; lastKey?: Record<string, any> }> {
    try {
      const response = await docClient.send(
        new QueryCommand({
          TableName: this.tableName,
          KeyConditionExpression: keyCondition,
          ExpressionAttributeValues: expressionValues,
          ...(options?.indexName && { IndexName: options.indexName }),
          ...(options?.filterExpression && {
            FilterExpression: options.filterExpression,
          }),
          ...(options?.limit && { Limit: options.limit }),
          ...(options?.scanIndexForward !== undefined && {
            ScanIndexForward: options.scanIndexForward,
          }),
          ...(options?.exclusiveStartKey && {
            ExclusiveStartKey: options.exclusiveStartKey,
          }),
        })
      );

      return {
        items: (response.Items as T[]) || [],
        lastKey: response.LastEvaluatedKey,
      };
    } catch (error) {
      logger.error('DynamoDB Query Error:', error);
      throw error;
    }
  }

  /**
   * Scan table (use sparingly, prefer query)
   */
  async scan<T = any>(options?: {
    filterExpression?: string;
    expressionValues?: Record<string, any>;
    limit?: number;
    exclusiveStartKey?: Record<string, any>;
  }): Promise<{ items: T[]; lastKey?: Record<string, any> }> {
    try {
      const response = await docClient.send(
        new ScanCommand({
          TableName: this.tableName,
          ...(options?.filterExpression && {
            FilterExpression: options.filterExpression,
          }),
          ...(options?.expressionValues && {
            ExpressionAttributeValues: options.expressionValues,
          }),
          ...(options?.limit && { Limit: options.limit }),
          ...(options?.exclusiveStartKey && {
            ExclusiveStartKey: options.exclusiveStartKey,
          }),
        })
      );

      return {
        items: (response.Items as T[]) || [],
        lastKey: response.LastEvaluatedKey,
      };
    } catch (error) {
      logger.error('DynamoDB Scan Error:', error);
      throw error;
    }
  }

  /**
   * Batch get items
   */
  async batchGet<T = any>(keys: Record<string, any>[]): Promise<T[]> {
    try {
      const response = await docClient.send(
        new BatchGetCommand({
          RequestItems: {
            [this.tableName]: {
              Keys: keys,
            },
          },
        })
      );

      return (response.Responses?.[this.tableName] as T[]) || [];
    } catch (error) {
      logger.error('DynamoDB BatchGet Error:', error);
      throw error;
    }
  }

  /**
   * Transact write items (ACID transactions)
   */
  async transactWrite(items: Array<{
    operation: 'Put' | 'Update' | 'Delete';
    item?: any;
    key?: Record<string, any>;
    updateExpression?: string;
    expressionAttributeNames?: Record<string, string>;
    expressionAttributeValues?: Record<string, any>;
    conditionExpression?: string;
  }>): Promise<void> {
    try {
      const transactItems = items.map((item) => {
        if (item.operation === 'Put') {
          return {
            Put: {
              TableName: this.tableName,
              Item: item.item,
              ...(item.conditionExpression && {
                ConditionExpression: item.conditionExpression,
              }),
            },
          };
        } else if (item.operation === 'Update') {
          return {
            Update: {
              TableName: this.tableName,
              Key: item.key,
              UpdateExpression: item.updateExpression,
              ...(item.expressionAttributeNames && {
                ExpressionAttributeNames: item.expressionAttributeNames,
              }),
              ...(item.expressionAttributeValues && {
                ExpressionAttributeValues: item.expressionAttributeValues,
              }),
              ...(item.conditionExpression && {
                ConditionExpression: item.conditionExpression,
              }),
            },
          };
        } else {
          return {
            Delete: {
              TableName: this.tableName,
              Key: item.key,
              ...(item.conditionExpression && {
                ConditionExpression: item.conditionExpression,
              }),
            },
          };
        }
      });

      await docClient.send(
        new TransactWriteCommand({
          TransactItems: transactItems,
        })
      );
    } catch (error) {
      logger.error('DynamoDB TransactWrite Error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const dynamoDB = new DynamoDBService();

// Export raw clients for advanced use cases
export { client as rawClient, docClient };