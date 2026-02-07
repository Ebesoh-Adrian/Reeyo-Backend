// apps/vendor-api/src/middleware/error.middleware.ts

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../../libs/shared-utils/errors/app-error';
import { logger } from '../../../libs/shared-utils/logger';

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    stack?: string;
  };
  timestamp: string;
  path: string;
}

/**
 * Global error handling middleware
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Default error values
  let statusCode = 500;
  let errorCode = 'INTERNAL_SERVER_ERROR';
  let message = 'An unexpected error occurred';
  let details: any = undefined;

  // Handle custom AppError
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    errorCode = err.code;
    message = err.message;
    details = err.details;
  }

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    message = err.message;
  }

  if (err.name === 'CastError') {
    statusCode = 400;
    errorCode = 'INVALID_DATA_TYPE';
    message = 'Invalid data type provided';
  }

  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorCode = 'INVALID_TOKEN';
    message = 'Invalid authentication token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    errorCode = 'TOKEN_EXPIRED';
    message = 'Authentication token has expired';
  }

  // Handle DynamoDB errors
  if (err.name === 'ResourceNotFoundException') {
    statusCode = 404;
    errorCode = 'RESOURCE_NOT_FOUND';
    message = 'Requested resource not found';
  }

  if (err.name === 'ConditionalCheckFailedException') {
    statusCode = 409;
    errorCode = 'CONFLICT';
    message = 'Resource conflict or condition not met';
  }

  // Log error
  const errorLog = {
    code: errorCode,
    message: message,
    statusCode,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    vendor: (req as any).vendor?.vendorId,
    stack: err.stack,
  };

  if (statusCode >= 500) {
    logger.error('Internal server error:', errorLog);
  } else if (statusCode >= 400) {
    logger.warn('Client error:', errorLog);
  }

  // Build error response
  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      code: errorCode,
      message: message,
      ...(details && { details }),
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
    timestamp: new Date().toISOString(),
    path: req.path,
  };

  // Send error response
  res.status(statusCode).json(errorResponse);
};

/**
 * Handle 404 - Not Found
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const error = new AppError(
    `Route not found: ${req.method} ${req.path}`,
    404,
    'NOT_FOUND'
  );
  next(error);
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};