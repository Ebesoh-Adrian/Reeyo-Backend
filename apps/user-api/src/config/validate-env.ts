import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

interface EnvironmentVariables {
  // Server
  NODE_ENV: string;
  PORT: number;
  API_VERSION: string;

  // JWT
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;

  // AWS
  AWS_REGION: string;
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;

  // DynamoDB
  DYNAMODB_ENDPOINT?: string;
  DYNAMODB_TABLE_PREFIX: string;

  // Redis
  REDIS_HOST: string;
  REDIS_PORT: number;
  REDIS_PASSWORD?: string;

  // Socket.io
  SOCKET_SERVER_URL: string;

  // Logging
  LOG_LEVEL: string;
  LOG_FILE_PATH: string;

  // CORS
  CORS_ORIGIN: string;

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;

  // Campay
  CAMPAY_APP_USERNAME: string;
  CAMPAY_APP_PASSWORD: string;
  CAMPAY_API_URL: string;

  // Twilio
  TWILIO_ACCOUNT_SID: string;
  TWILIO_AUTH_TOKEN: string;
  TWILIO_PHONE_NUMBER: string;

  // SendGrid
  SENDGRID_API_KEY: string;
  SENDGRID_FROM_EMAIL: string;

  // AWS SNS
  SNS_PLATFORM_APPLICATION_ARN: string;

  // File Upload
  MAX_FILE_SIZE: number;
  ALLOWED_FILE_TYPES: string;

  // Business Configuration
  DELIVERY_FEE_BASE: number;
  DELIVERY_FEE_PER_KM: number;
  MIN_ORDER_AMOUNT: number;
  MAX_ORDER_AMOUNT: number;
  FREE_DELIVERY_THRESHOLD: number;
  PLATFORM_COMMISSION_PERCENTAGE: number;
}

/**
 * Validate and parse environment variables
 */
export function validateEnv(): EnvironmentVariables {
  const requiredEnvVars = [
    'NODE_ENV',
    'PORT',
    'JWT_SECRET',
    'AWS_REGION',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'DYNAMODB_TABLE_PREFIX',
    'REDIS_HOST',
    'REDIS_PORT',
    'SOCKET_SERVER_URL',
    'CAMPAY_APP_USERNAME',
    'CAMPAY_APP_PASSWORD',
    'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN',
    'SENDGRID_API_KEY',
    'SNS_PLATFORM_APPLICATION_ARN',
  ];

  // Check for missing required variables
  const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}\n` +
        `Please check your .env file in apps/user-api/`
    );
  }

  // Validate JWT_SECRET strength
  if (process.env.JWT_SECRET!.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long for security');
  }

  // Validate NODE_ENV
  const validEnvironments = ['development', 'staging', 'production'];
  if (!validEnvironments.includes(process.env.NODE_ENV!)) {
    throw new Error(
      `NODE_ENV must be one of: ${validEnvironments.join(', ')}. Got: ${process.env.NODE_ENV}`
    );
  }

  return {
    // Server
    NODE_ENV: process.env.NODE_ENV!,
    PORT: parseInt(process.env.PORT!, 10),
    API_VERSION: process.env.API_VERSION || 'v1',

    // JWT
    JWT_SECRET: process.env.JWT_SECRET!,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '30d',

    // AWS
    AWS_REGION: process.env.AWS_REGION!,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID!,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY!,

    // DynamoDB
    DYNAMODB_ENDPOINT: process.env.DYNAMODB_ENDPOINT,
    DYNAMODB_TABLE_PREFIX: process.env.DYNAMODB_TABLE_PREFIX!,

    // Redis
    REDIS_HOST: process.env.REDIS_HOST!,
    REDIS_PORT: parseInt(process.env.REDIS_PORT!, 10),
    REDIS_PASSWORD: process.env.REDIS_PASSWORD,

    // Socket.io
    SOCKET_SERVER_URL: process.env.SOCKET_SERVER_URL!,

    // Logging
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
    LOG_FILE_PATH: process.env.LOG_FILE_PATH || './logs/user-api.log',

    // CORS
    CORS_ORIGIN: process.env.CORS_ORIGIN || '*',

    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS!, 10) || 900000,
    RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS!, 10) || 100,

    // Campay
    CAMPAY_APP_USERNAME: process.env.CAMPAY_APP_USERNAME!,
    CAMPAY_APP_PASSWORD: process.env.CAMPAY_APP_PASSWORD!,
    CAMPAY_API_URL: process.env.CAMPAY_API_URL!,

    // Twilio
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID!,
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN!,
    TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER!,

    // SendGrid
    SENDGRID_API_KEY: process.env.SENDGRID_API_KEY!,
    SENDGRID_FROM_EMAIL: process.env.SENDGRID_FROM_EMAIL!,

    // AWS SNS
    SNS_PLATFORM_APPLICATION_ARN: process.env.SNS_PLATFORM_APPLICATION_ARN!,

    // File Upload
    MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE!, 10) || 5242880,
    ALLOWED_FILE_TYPES: process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/jpg',

    // Business Configuration
    DELIVERY_FEE_BASE: parseInt(process.env.DELIVERY_FEE_BASE!, 10) || 1000,
    DELIVERY_FEE_PER_KM: parseInt(process.env.DELIVERY_FEE_PER_KM!, 10) || 200,
    MIN_ORDER_AMOUNT: parseInt(process.env.MIN_ORDER_AMOUNT!, 10) || 500,
    MAX_ORDER_AMOUNT: parseInt(process.env.MAX_ORDER_AMOUNT!, 10) || 500000,
    FREE_DELIVERY_THRESHOLD: parseInt(process.env.FREE_DELIVERY_THRESHOLD!, 10) || 10000,
    PLATFORM_COMMISSION_PERCENTAGE:
      parseInt(process.env.PLATFORM_COMMISSION_PERCENTAGE!, 10) || 15,
  };
}

// Export validated config
export const config = validateEnv();
