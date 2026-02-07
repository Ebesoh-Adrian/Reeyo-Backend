import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

interface EnvironmentVariables {
  NODE_ENV: string;
  PORT: number;
  API_VERSION: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  AWS_REGION: string;
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;
  DYNAMODB_ENDPOINT?: string;
  DYNAMODB_TABLE_PREFIX: string;
  REDIS_HOST: string;
  REDIS_PORT: number;
  SOCKET_SERVER_URL: string;
  LOG_LEVEL: string;
  CORS_ORIGIN: string;
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;
  SUPER_ADMIN_EMAIL: string;
  SUPER_ADMIN_PASSWORD: string;
  MAX_LOGIN_ATTEMPTS: number;
  ACCOUNT_LOCKOUT_DURATION: number;
}

export function validateEnv(): EnvironmentVariables {
  const requiredEnvVars = [
    'NODE_ENV', 'PORT', 'JWT_SECRET', 'AWS_REGION', 'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY', 'DYNAMODB_TABLE_PREFIX', 'REDIS_HOST',
    'SUPER_ADMIN_EMAIL', 'SUPER_ADMIN_PASSWORD'
  ];

  const missingVars = requiredEnvVars.filter(v => !process.env[v]);
  if (missingVars.length > 0) {
    throw new Error(`Missing: ${missingVars.join(', ')}`);
  }

  if (process.env.JWT_SECRET!.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters');
  }

  return {
    NODE_ENV: process.env.NODE_ENV!,
    PORT: parseInt(process.env.PORT!, 10),
    API_VERSION: process.env.API_VERSION || 'v1',
    JWT_SECRET: process.env.JWT_SECRET!,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
    AWS_REGION: process.env.AWS_REGION!,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID!,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY!,
    DYNAMODB_ENDPOINT: process.env.DYNAMODB_ENDPOINT,
    DYNAMODB_TABLE_PREFIX: process.env.DYNAMODB_TABLE_PREFIX!,
    REDIS_HOST: process.env.REDIS_HOST!,
    REDIS_PORT: parseInt(process.env.REDIS_PORT!, 10),
    SOCKET_SERVER_URL: process.env.SOCKET_SERVER_URL!,
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
    CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
    RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS!, 10) || 900000,
    RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS!, 10) || 1000,
    SUPER_ADMIN_EMAIL: process.env.SUPER_ADMIN_EMAIL!,
    SUPER_ADMIN_PASSWORD: process.env.SUPER_ADMIN_PASSWORD!,
    MAX_LOGIN_ATTEMPTS: parseInt(process.env.MAX_LOGIN_ATTEMPTS!, 10) || 5,
    ACCOUNT_LOCKOUT_DURATION: parseInt(process.env.ACCOUNT_LOCKOUT_DURATION!, 10) || 1800000,
  };
}

export const config = validateEnv();
