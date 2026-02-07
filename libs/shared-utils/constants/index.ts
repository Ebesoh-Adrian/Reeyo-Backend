// libs/shared-utils/constants/index.ts

/**
 * User Types
 */
export enum UserType {
  USER = 'USER',
  VENDOR = 'VENDOR',
  RIDER = 'RIDER',
  ADMIN = 'ADMIN',
}

/**
 * Service Types
 */
export enum ServiceType {
  FOOD = 'FOOD',
  MART = 'MART',
  PACKAGE = 'PACKAGE',
}

/**
 * Order Status
 */
export enum OrderStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  PREPARING = 'PREPARING',
  READY_FOR_PICKUP = 'READY_FOR_PICKUP',
  RIDER_ASSIGNED = 'RIDER_ASSIGNED',
  RIDER_ARRIVED = 'RIDER_ARRIVED',
  PICKED_UP = 'PICKED_UP',
  IN_TRANSIT = 'IN_TRANSIT',
  ARRIVED = 'ARRIVED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REJECTED = 'REJECTED',
  FUNDS_DISTRIBUTED = 'FUNDS_DISTRIBUTED',
}

/**
 * Payment Status
 */
export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

/**
 * Payment Methods
 */
export enum PaymentMethod {
  WALLET = 'WALLET',
  CAMPAY = 'CAMPAY',
  CARD = 'CARD',
  CASH = 'CASH',
}

/**
 * Transaction Types
 */
export enum TransactionType {
  CREDIT = 'CREDIT',
  DEBIT = 'DEBIT',
}

/**
 * Transaction Categories
 */
export enum TransactionCategory {
  ORDER_PAYMENT = 'ORDER_PAYMENT',
  ORDER_COMMISSION = 'ORDER_COMMISSION',
  DELIVERY_FEE = 'DELIVERY_FEE',
  PAYOUT = 'PAYOUT',
  REFUND = 'REFUND',
  WALLET_TOPUP = 'WALLET_TOPUP',
}

/**
 * Payout Status
 */
export enum PayoutStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

/**
 * Vendor Status
 */
export enum VendorStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

/**
 * Rider Status
 */
export enum RiderStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

/**
 * Rider Availability
 */
export enum RiderAvailability {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  BUSY = 'BUSY',
}

/**
 * Vehicle Types
 */
export enum VehicleType {
  MOTORCYCLE = 'MOTORCYCLE',
  BICYCLE = 'BICYCLE',
  CAR = 'CAR',
}

/**
 * Package Categories
 */
export enum PackageCategory {
  DOCUMENT = 'DOCUMENT',
  PARCEL = 'PARCEL',
  FRAGILE = 'FRAGILE',
  ELECTRONICS = 'ELECTRONICS',
  FOOD_ITEMS = 'FOOD_ITEMS',
  CLOTHING = 'CLOTHING',
  OTHER = 'OTHER',
}

/**
 * Notification Types
 */
export enum NotificationType {
  ORDER_PLACED = 'ORDER_PLACED',
  ORDER_ACCEPTED = 'ORDER_ACCEPTED',
  ORDER_REJECTED = 'ORDER_REJECTED',
  ORDER_READY = 'ORDER_READY',
  RIDER_ASSIGNED = 'RIDER_ASSIGNED',
  RIDER_ARRIVED = 'RIDER_ARRIVED',
  ORDER_PICKED_UP = 'ORDER_PICKED_UP',
  ORDER_IN_TRANSIT = 'ORDER_IN_TRANSIT',
  ORDER_DELIVERED = 'ORDER_DELIVERED',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  PAYOUT_APPROVED = 'PAYOUT_APPROVED',
  PAYOUT_REJECTED = 'PAYOUT_REJECTED',
}

/**
 * Business Hours Days
 */
export enum DayOfWeek {
  MONDAY = 'monday',
  TUESDAY = 'tuesday',
  WEDNESDAY = 'wednesday',
  THURSDAY = 'thursday',
  FRIDAY = 'friday',
  SATURDAY = 'saturday',
  SUNDAY = 'sunday',
}

/**
 * Platform Constants
 */
export const PlatformConstants = {
  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,

  // File Upload
  MAX_IMAGE_SIZE_MB: 5,
  MAX_DOCUMENT_SIZE_MB: 10,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf'],

  // Business Rules
  MIN_ORDER_VALUE: 1000, // XAF
  MAX_ORDER_VALUE: 1000000, // XAF
  MIN_PAYOUT_AMOUNT: 50000, // XAF
  MAX_MENU_ITEMS: 500,
  MAX_ORDER_ITEMS: 50,

  // Timing (in minutes)
  ORDER_AUTO_CANCEL_TIME: 30,
  RIDER_ACCEPTANCE_TIME: 5,
  MAX_PREPARATION_TIME: 120,

  // Distance (in kilometers)
  MAX_DELIVERY_DISTANCE: 50,
  RIDER_SEARCH_RADIUS: 5,

  // Rate Limiting
  RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: 100,

  // JWT
  JWT_ACCESS_EXPIRY: '7d',
  JWT_REFRESH_EXPIRY: '30d',

  // Commission Rates (percentage)
  DEFAULT_FOOD_COMMISSION: 15,
  DEFAULT_MART_COMMISSION: 10,
  DEFAULT_PACKAGE_PLATFORM_FEE: 20,

  // Delivery Fees (XAF)
  BASE_DELIVERY_FEE: 1500,
  PACKAGE_BASE_FEE: 2000,
  PACKAGE_FEE_PER_KM: 500,
} as const;