// libs/shared-utils/index.ts

// Logger
export { logger, logOrder, logTransaction, logAuth } from './logger';

// Errors
export { AppError, ErrorFactory } from './errors/app-error';
export { ErrorCodes } from './errors/error-codes';
export type { ErrorCode } from './errors/error-codes';

// Constants
export {
  UserType,
  ServiceType,
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  TransactionType,
  TransactionCategory,
  PayoutStatus,
  VendorStatus,
  RiderStatus,
  RiderAvailability,
  VehicleType,
  PackageCategory,
  NotificationType,
  DayOfWeek,
  PlatformConstants,
} from './constants';

// Validators
export * from './validators/schemas';

// Helpers
export { JWTHelper } from './helpers/jwt.helper';
export type { JWTPayload, TokenPair } from './helpers/jwt.helper';
export { PasswordHelper } from './helpers/password.helper';