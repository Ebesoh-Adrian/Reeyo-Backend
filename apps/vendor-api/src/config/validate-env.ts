// apps/vendor-api/src/config/validate-env.ts

import { logger } from '../../../../libs/shared-utils/logger';

interface RequiredEnvVars {
  [key: string]: {
    required: boolean;
    default?: string;
    validator?: (value: string) => boolean;
  };
}

const envSchema: RequiredEnvVars = {
  NODE_ENV: {
    required: true,
    validator: (val) => ['development', 'production', 'test'].includes(val),
  },
  PORT: {
    required: false,
    default: '3002',
    validator: (val) => !isNaN(parseInt(val, 10)),
  },
  AWS_REGION: {
    required: true,
  },
  DYNAMODB_TABLE: {
    required: true,
  },
  JWT_SECRET: {
    required: true,
    validator: (val) => val.length >= 32,
  },
  REDIS_HOST: {
    required: true,
  },
  CAMPAY_BASE_URL: {
    required: true,
  },
  CAMPAY_USERNAME: {
    required: true,
  },
  CAMPAY_PASSWORD: {
    required: true,
  },
  CAMPAY_APP_KEY: {
    required: true,
  },
  S3_BUCKET_NAME: {
    required: true,
  },
};

export function validateEnv(): void {
  const errors: string[] = [];
  const warnings: string[] = [];

  Object.entries(envSchema).forEach(([key, config]) => {
    const value = process.env[key];

    // Check if required variable is missing
    if (config.required && !value) {
      if (config.default) {
        process.env[key] = config.default;
        warnings.push(`${key} not set, using default: ${config.default}`);
      } else {
        errors.push(`Missing required environment variable: ${key}`);
      }
    }

    // Validate value if validator provided
    if (value && config.validator && !config.validator(value)) {
      errors.push(`Invalid value for ${key}: ${value}`);
    }
  });

  // Log warnings
  if (warnings.length > 0) {
    warnings.forEach((warning) => logger.warn(warning));
  }

  // Throw error if critical variables missing
  if (errors.length > 0) {
    logger.error('Environment validation failed:');
    errors.forEach((error) => logger.error(`  - ${error}`));
    throw new Error('Invalid environment configuration');
  }

  // Security checks
  if (process.env.NODE_ENV === 'production') {
    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters in production');
    }

    if (!process.env.ALLOWED_ORIGINS || process.env.ALLOWED_ORIGINS === '*') {
      throw new Error('ALLOWED_ORIGINS must be explicitly set in production');
    }
  }

  logger.info('✅ Environment validation passed');
}

/**
 * Get typed environment variable
 */
export function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (!value) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Environment variable ${key} is not set`);
  }
  return value;
}

/**
 * Get number environment variable
 */
export function getEnvNumber(key: string, defaultValue?: number): number {
  const value = process.env[key];
  if (!value) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Environment variable ${key} is not set`);
  }
  const num = parseInt(value, 10);
  if (isNaN(num)) {
    throw new Error(`Environment variable ${key} must be a number`);
  }
  return num;
}

/**
 * Get boolean environment variable
 */
export function getEnvBoolean(key: string, defaultValue?: boolean): boolean {
  const value = process.env[key];
  if (!value) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Environment variable ${key} is not set`);
  }
  return value.toLowerCase() === 'true';
}