// libs/core-db/repositories/user.repository.ts

import { BaseRepository } from './base.repository';
import { UserModel } from '../models/user.model';

export class UserRepository extends BaseRepository<UserModel> {
  constructor() {
    super('User');
  }

  /**
   * Create a new user
   */
  async createUser(user: UserModel): Promise<UserModel> {
    return this.create(user);
  }

  /**
   * Find user by ID
   */
  async findById(userId: string): Promise<UserModel | null> {
    return this.findByKey({
      PK: `USER#${userId}`,
      SK: 'PROFILE',
    });
  }

  /**
   * Find user by email (for login)
   */
  async findByEmail(email: string): Promise<UserModel | null> {
    const result = await this.db.query<UserModel>(
      'GSI1PK = :gsi1pk',
      { ':gsi1pk': `USER#${email.toLowerCase()}` },
      { indexName: 'GSI1' }
    );

    return result.items[0] || null;
  }

  /**
   * Find user by phone number
   */
  async findByPhone(phone: string): Promise<UserModel | null> {
    const result = await this.db.query<UserModel>(
      'phone = :phone',
      { ':phone': phone },
      { indexName: 'GSI1' }
    );

    return result.items[0] || null;
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    updates: Partial<UserModel>
  ): Promise<UserModel> {
    return this.update(
      {
        PK: `USER#${userId}`,
        SK: 'PROFILE',
      },
      updates
    );
  }

  /**
   * Add delivery address to user profile
   */
  async addAddress(
    userId: string,
    address: UserModel['addresses'][0]
  ): Promise<UserModel> {
    const user = await this.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const addresses = [...(user.addresses || []), address];

    return this.update(
      {
        PK: `USER#${userId}`,
        SK: 'PROFILE',
      },
      { addresses }
    );
  }

  /**
   * Update specific address
   */
  async updateAddress(
    userId: string,
    addressId: string,
    updates: Partial<UserModel['addresses'][0]>
  ): Promise<UserModel> {
    const user = await this.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const addresses = user.addresses.map((addr) =>
      addr.id === addressId ? { ...addr, ...updates } : addr
    );

    return this.update(
      {
        PK: `USER#${userId}`,
        SK: 'PROFILE',
      },
      { addresses }
    );
  }

  /**
   * Delete address from user profile
   */
  async deleteAddress(userId: string, addressId: string): Promise<UserModel> {
    const user = await this.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const addresses = user.addresses.filter((addr) => addr.id !== addressId);

    return this.update(
      {
        PK: `USER#${userId}`,
        SK: 'PROFILE',
      },
      { addresses }
    );
  }

  /**
   * Update last login timestamp
   */
  async updateLastLogin(userId: string): Promise<void> {
    await this.update(
      {
        PK: `USER#${userId}`,
        SK: 'PROFILE',
      },
      { lastLoginAt: new Date().toISOString() }
    );
  }

  /**
   * Verify user email
   */
  async verifyEmail(userId: string): Promise<UserModel> {
    return this.update(
      {
        PK: `USER#${userId}`,
        SK: 'PROFILE',
      },
      { emailVerified: true }
    );
  }

  /**
   * Verify user phone
   */
  async verifyPhone(userId: string): Promise<UserModel> {
    return this.update(
      {
        PK: `USER#${userId}`,
        SK: 'PROFILE',
      },
      { phoneVerified: true }
    );
  }

  /**
   * Suspend user account
   */
  async suspend(userId: string, reason?: string): Promise<UserModel> {
    return this.update(
      {
        PK: `USER#${userId}`,
        SK: 'PROFILE',
      },
      { 
        status: 'SUSPENDED',
        updatedAt: new Date().toISOString(),
      }
    );
  }

  /**
   * Reactivate suspended account
   */
  async reactivate(userId: string): Promise<UserModel> {
    return this.update(
      {
        PK: `USER#${userId}`,
        SK: 'PROFILE',
      },
      { status: 'ACTIVE' }
    );
  }

  /**
   * Soft delete user account
   */
  async softDelete(userId: string): Promise<UserModel> {
    return this.update(
      {
        PK: `USER#${userId}`,
        SK: 'PROFILE',
      },
      {
        status: 'DELETED',
        deletedAt: new Date().toISOString(),
      }
    );
  }

  /**
   * Add device token for push notifications
   */
  async addDeviceToken(userId: string, token: string): Promise<void> {
    const user = await this.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const deviceTokens = [...(user.deviceTokens || [])];
    if (!deviceTokens.includes(token)) {
      deviceTokens.push(token);
    }

    await this.update(
      {
        PK: `USER#${userId}`,
        SK: 'PROFILE',
      },
      { deviceTokens }
    );
  }

  /**
   * Remove device token (on logout)
   */
  async removeDeviceToken(userId: string, token: string): Promise<void> {
    const user = await this.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const deviceTokens = (user.deviceTokens || []).filter((t) => t !== token);

    await this.update(
      {
        PK: `USER#${userId}`,
        SK: 'PROFILE',
      },
      { deviceTokens }
    );
  }
}