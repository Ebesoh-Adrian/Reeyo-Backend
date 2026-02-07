// ============================================================================
// libs/core-db/models/config.model.ts
// ============================================================================

export interface ServiceConfig {
  enabled: boolean;
  commissionRate?: number;
  minOrderAmount?: number;
  deliveryFee?: number;
  baseFee?: number;
  feePerKm?: number;
  maxWeight?: number;
  maxDistance?: number;
}

export interface ConfigModel {
  PK: string; // CONFIG#GLOBAL
  SK: string; // SERVICES or SETTINGS
  services?: {
    food: ServiceConfig;
    mart: ServiceConfig;
    packages: ServiceConfig;
  };
  settings?: {
    maintenanceMode: boolean;
    appVersion: string;
    minAppVersion: string;
    features: {
      [key: string]: boolean;
    };
  };
  paymentMethods?: {
    campay: boolean;
    wallet: boolean;
    cash: boolean;
    card: boolean;
  };
  updatedAt: string;
  updatedBy: string;
}
