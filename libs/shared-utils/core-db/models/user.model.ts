// libs/core-db/models/user.model.ts

export interface UserAddress {
  id: string;
  label: string;
  fullAddress: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  instructions?: string;
  isDefault?: boolean;
}

export interface UserModel {
  PK: string; // USER#userId
  SK: string; // PROFILE
  GSI1PK: string; // USER#email
  GSI1SK: string; // PROFILE
  userId: string;
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  addresses: UserAddress[];
  status: 'ACTIVE' | 'SUSPENDED' | 'DELETED';
  emailVerified: boolean;
  phoneVerified: boolean;
  profileImage?: string;
  deviceTokens?: string[]; // For push notifications
  preferences?: {
    notifications: boolean;
    promotions: boolean;
    language: string;
  };
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  deletedAt?: string;
}

