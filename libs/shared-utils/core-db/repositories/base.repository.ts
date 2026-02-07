// libs/core-db/repositories/base.repository.ts

import { DynamoDBService } from '../client';
import { logger } from '@reeyo/shared-utils';

/**
 * Base Repository Pattern
 * Provides common CRUD operations with type safety
 */
export abstract class BaseRepository<T> {
  protected db: DynamoDBService;
  protected entityName: string;

  constructor(entityName: string) {
    this.db = new DynamoDBService();
    this.entityName = entityName;
  }

  /**
   * Create entity
   */
  async create(entity: T): Promise<T> {
    try {
      await this.db.put(entity);
      logger.info(`${this.entityName} created successfully`);
      return entity;
    } catch (error) {
      logger.error(`Failed to create ${this.entityName}:`, error);
      throw error;
    }
  }

  /**
   * Find by primary key
   */
  async findByKey(key: Record<string, any>): Promise<T | null> {
    try {
      return await this.db.get<T>(key);
    } catch (error) {
      logger.error(`Failed to find ${this.entityName}:`, error);
      throw error;
    }
  }

  /**
   * Update entity
   */
  async update(
    key: Record<string, any>,
    updates: Partial<T>,
    conditions?: string
  ): Promise<T> {
    try {
      const updated = await this.db.update<T>(
        key,
        {
          ...updates,
          updatedAt: new Date().toISOString(),
        },
        conditions
      );
      logger.info(`${this.entityName} updated successfully`);
      return updated;
    } catch (error) {
      logger.error(`Failed to update ${this.entityName}:`, error);
      throw error;
    }
  }

  /**
   * Delete entity
   */
  async delete(key: Record<string, any>): Promise<void> {
    try {
      await this.db.delete(key);
      logger.info(`${this.entityName} deleted successfully`);
    } catch (error) {
      logger.error(`Failed to delete ${this.entityName}:`, error);
      throw error;
    }
  }

  /**
   * Query with pagination
   */
  async queryWithPagination(
    keyCondition: string,
    expressionValues: Record<string, any>,
    options?: {
      indexName?: string;
      limit?: number;
      lastKey?: Record<string, any>;
      sortAscending?: boolean;
    }
  ): Promise<{
    items: T[];
    lastKey?: Record<string, any>;
    hasMore: boolean;
  }> {
    try {
      const result = await this.db.query<T>(
        keyCondition,
        expressionValues,
        {
          indexName: options?.indexName,
          limit: options?.limit,
          exclusiveStartKey: options?.lastKey,
          scanIndexForward: options?.sortAscending ?? false,
        }
      );

      return {
        items: result.items,
        lastKey: result.lastKey,
        hasMore: !!result.lastKey,
      };
    } catch (error) {
      logger.error(`Failed to query ${this.entityName}:`, error);
      throw error;
    }
  }

  /**
   * Check if entity exists
   */
  async exists(key: Record<string, any>): Promise<boolean> {
    const entity = await this.findByKey(key);
    return entity !== null;
  }
}