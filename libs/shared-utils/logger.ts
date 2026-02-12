// libs/shared-utils/logger.ts

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import fs from 'fs';

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

/**
 * Custom log format for console output
 */
const consoleFormat = printf(({ level, message, timestamp, stack, ...metadata }) => {
  let log = `${timestamp} [${level}]: ${message}`;

  // Add metadata if exists (excluding service and environment)
  const { service, environment, ...relevantMetadata } = metadata;
  if (Object.keys(relevantMetadata).length > 0) {
    log += ` ${JSON.stringify(relevantMetadata)}`;
  }

  // Add stack trace for errors
  if (stack) {
    log += `\n${stack}`;
  }

  return log;
});

/**
 * Ensure logs directory exists
 */
const ensureLogDirectory = () => {
  const logDir = path.resolve(process.cwd(), 'logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
};

/**
 * Create Winston logger instance
 */
const createLogger = () => {
  const logLevel = process.env.LOG_LEVEL || 'info';
  const serviceName = process.env.SERVICE_NAME || 'reeyo-api';
  const nodeEnv = process.env.NODE_ENV || 'development';

  const loggerInstance = winston.createLogger({
    level: logLevel,
    format: combine(
      errors({ stack: true }),
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' })
    ),
    defaultMeta: {
      service: serviceName,
      environment: nodeEnv,
    },
    transports: [
      // Console transport (always enabled)
      new winston.transports.Console({
        format: combine(
          colorize({ all: true }),
          consoleFormat
        ),
      }),
    ],
    // Handle exceptions and rejections
    exceptionHandlers: [
      new winston.transports.Console({
        format: combine(colorize(), consoleFormat),
      }),
    ],
    rejectionHandlers: [
      new winston.transports.Console({
        format: combine(colorize(), consoleFormat),
      }),
    ],
  });

  // Add file transports in production
  if (nodeEnv === 'production') {
    ensureLogDirectory();

    // Error logs (only errors)
    loggerInstance.add(
      new DailyRotateFile({
        filename: path.resolve(process.cwd(), 'logs', 'error-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        level: 'error',
        maxSize: '20m',
        maxFiles: '14d',
        format: combine(timestamp(), json()),
        zippedArchive: true,
      })
    );

    // Combined logs (all levels)
    loggerInstance.add(
      new DailyRotateFile({
        filename: path.resolve(process.cwd(), 'logs', 'combined-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '14d',
        format: combine(timestamp(), json()),
        zippedArchive: true,
      })
    );

    // Exception and rejection logs
    loggerInstance.exceptions.handle(
      new DailyRotateFile({
        filename: path.resolve(process.cwd(), 'logs', 'exceptions-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '14d',
        format: combine(timestamp(), json()),
      })
    );

    loggerInstance.rejections.handle(
      new DailyRotateFile({
        filename: path.resolve(process.cwd(), 'logs', 'rejections-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '14d',
        format: combine(timestamp(), json()),
      })
    );
  }

  return loggerInstance;
};

// Create and export logger instance
export const logger = createLogger();

/**
 * Specialized logging method for order events
 */
export const logOrder = (
  action: string,
  orderId: string,
  metadata?: Record<string, any>
) => {
  logger.info('Order event', {
    eventType: 'order',
    action,
    orderId,
    ...metadata,
  });
};

/**
 * Specialized logging method for transaction events
 */
export const logTransaction = (
  transactionId: string,
  amount: number,
  type: string,
  metadata?: Record<string, any>
) => {
  logger.info('Transaction event', {
    eventType: 'transaction',
    transactionId,
    amount,
    type,
    ...metadata,
  });
};

/**
 * Specialized logging method for auth events
 */
export const logAuth = (
  action: string,
  userId: string,
  metadata?: Record<string, any>
) => {
  logger.info('Auth event', {
    eventType: 'auth',
    action,
    userId,
    ...metadata,
  });
};

/**
 * Specialized logging method for API requests
 */
export const logRequest = (
  method: string,
  path: string,
  statusCode: number,
  duration: number,
  metadata?: Record<string, any>
) => {
  const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
  
  logger.log(level, 'API Request', {
    eventType: 'api_request',
    method,
    path,
    statusCode,
    duration: `${duration}ms`,
    ...metadata,
  });
};

/**
 * Specialized logging method for performance metrics
 */
export const logPerformance = (
  operation: string,
  duration: number,
  metadata?: Record<string, any>
) => {
  logger.info('Performance metric', {
    eventType: 'performance',
    operation,
    duration: `${duration}ms`,
    ...metadata,
  });
};

/**
 * Specialized logging method for security events
 */
export const logSecurity = (
  event: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  metadata?: Record<string, any>
) => {
  const level = severity === 'critical' || severity === 'high' ? 'error' : 'warn';
  
  logger.log(level, 'Security event', {
    eventType: 'security',
    event,
    severity,
    ...metadata,
  });
};

// Export default logger
export default logger;

