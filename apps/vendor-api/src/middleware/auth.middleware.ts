// apps/vendor-api/src/middleware/auth.middleware.ts

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../../../libs/shared-utils/errors/app-error';
import { logger } from '../../../libs/shared-utils/logger';

// Extend Express Request type
export interface AuthRequest extends Request {
  vendor?: {
    vendorId: string;
    email: string;
    userType: 'VENDOR';
    iat: number;
    exp: number;
  };
}

interface JWTPayload {
  vendorId: string;
  email: string;
  userType: 'VENDOR';
  iat: number;
  exp: number;
}

/**
 * Verify JWT token and authenticate vendor
 */
export const authenticateVendor = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401, 'UNAUTHORIZED');
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw new AppError('Invalid token format', 401, 'UNAUTHORIZED');
    }

    // Verify token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;

    // Validate user type
    if (decoded.userType !== 'VENDOR') {
      throw new AppError(
        'Invalid token: not a vendor token',
        403,
        'FORBIDDEN'
      );
    }

    // Check if token is expired
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < now) {
      throw new AppError('Token expired', 401, 'TOKEN_EXPIRED');
    }

    // Attach vendor info to request
    req.vendor = {
      vendorId: decoded.vendorId,
      email: decoded.email,
      userType: decoded.userType,
      iat: decoded.iat,
      exp: decoded.exp,
    };

    // Log authentication
    logger.debug(`Vendor authenticated: ${decoded.vendorId}`);

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new AppError('Invalid token', 401, 'INVALID_TOKEN'));
    }
    if (error instanceof jwt.TokenExpiredError) {
      return next(new AppError('Token expired', 401, 'TOKEN_EXPIRED'));
    }
    next(error);
  }
};

/**
 * Optional authentication - doesn't fail if no token
 */
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const jwtSecret = process.env.JWT_SECRET!;
      const decoded = jwt.verify(token, jwtSecret) as JWTPayload;

      if (decoded.userType === 'VENDOR') {
        req.vendor = decoded;
      }
    }

    next();
  } catch (error) {
    // Don't throw error for optional auth
    next();
  }
};

/**
 * Check if vendor account is active
 */
export const requireActiveVendor = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.vendor) {
      throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
    }

    // TODO: Check vendor status from database
    // For now, assume all authenticated vendors are active
    // In production, you'd query DynamoDB here

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Verify vendor ownership of resource
 */
export const verifyVendorOwnership = (resourceIdParam: string) => {
  return async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.vendor) {
        throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
      }

      const resourceId = req.params[resourceIdParam];
      
      // Check if resource belongs to vendor
      if (resourceId !== req.vendor.vendorId) {
        throw new AppError(
          'Access denied: resource does not belong to this vendor',
          403,
          'FORBIDDEN'
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};