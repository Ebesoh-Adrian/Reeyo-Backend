// libs/core-db/index.ts

// Client
export { DynamoDBService, dynamoDB, TABLE_NAME, rawClient, docClient } from './client';

// Models
export * from './models';

// Repositories
export { BaseRepository } from './repositories/base.repository';
export { UserRepository } from './repositories/user.repository';
export { VendorRepository } from './repositories/vendor.repository';
export { RiderRepository } from './repositories/rider.repository';
export { OrderRepository } from './repositories/order.repository';
export { WalletRepository } from './repositories/wallet.repository';