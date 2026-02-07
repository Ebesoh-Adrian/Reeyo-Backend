import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../../../../../libs/shared-utils/jwt.helper';
import { RiderRepository } from '../../../../../libs/core-db/repositories/rider.repository';
import { AppError } from '../../../../../libs/shared-utils/error-handler';
import { logger } from '../../../../../libs/shared-utils/logger';

/**
 * Extended Request interface with authenticated rider
 */
export interface AuthenticatedRequest extends Request {
  rider?: {
    riderId: string;
    phone: string;
    email?: string;
    role: 'RIDER';
  };
}

/**
 * Middleware to authenticate rider using JWT
 */
export const authenticateRider = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401, 'AUTH_1000');
    }

    const token = authHeader.split(' ')[1];

    // Verify JWT token
    const decoded = verifyToken(token);

    // Verify role is RIDER
    if (decoded.role !== 'RIDER') {
      throw new AppError('Invalid token - not a rider token', 403, 'AUTH_1005');
    }

    // Verify rider exists in database
    const riderRepo = new RiderRepository();
    const rider = await riderRepo.findById(decoded.userId);

    if (!rider) {
      throw new AppError('Rider not found', 404, 'AUTH_1002');
    }

    // Attach rider info to request
    req.rider = {
      riderId: rider.riderId,
      phone: rider.phone,
      email: rider.email,
      role: 'RIDER',
    };

    logger.info('Rider authenticated', {
      riderId: rider.riderId,
      endpoint: req.path,
    });

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else if ((error as any).name === 'JsonWebTokenError') {
      next(new AppError('Invalid token', 401, 'AUTH_1001'));
    } else if ((error as any).name === 'TokenExpiredError') {
      next(new AppError('Token expired', 401, 'AUTH_1003'));
    } else {
      logger.error('Authentication error', { error });
      next(new AppError('Authentication failed', 401, 'AUTH_1004'));
    }
  }
};

/**
 * Middleware to check if rider is verified
 */
export const requireVerifiedRider = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.rider) {
      throw new AppError('Unauthorized', 401, 'AUTH_1000');
    }

    const riderRepo = new RiderRepository();
    const rider = await riderRepo.findById(req.rider.riderId);

    if (!rider) {
      throw new AppError('Rider not found', 404, 'RIDER_3000');
    }

    if (rider.verificationStatus !== 'VERIFIED') {
      throw new AppError(
        'Account not verified. Please complete verification process.',
        403,
        'RIDER_3003'
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check if rider is approved and active
 */
export const requireActiveRider = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.rider) {
      throw new AppError('Unauthorized', 401, 'AUTH_1000');
    }

    const riderRepo = new RiderRepository();
    const rider = await riderRepo.findById(req.rider.riderId);

    if (!rider) {
      throw new AppError('Rider not found', 404, 'RIDER_3000');
    }

    if (rider.verificationStatus !== 'VERIFIED') {
      throw new AppError('Account not verified', 403, 'RIDER_3003');
    }

    if (rider.approvalStatus !== 'APPROVED') {
      throw new AppError(
        'Account not approved. Your application is under review.',
        403,
        'RIDER_3004'
      );
    }

    if (rider.status !== 'ACTIVE') {
      throw new AppError('Account is inactive', 403, 'RIDER_3005');
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to verify rider ownership of a resource
 */
export const verifyRiderOwnership = (resourceIdParam: string = 'id') => {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.rider) {
        throw new AppError('Unauthorized', 401, 'AUTH_1000');
      }

      const resourceId = req.params[resourceIdParam];
      const riderId = req.rider.riderId;

      // This is a basic ownership check - implement specific logic based on resource type
      if (resourceId !== riderId) {
        throw new AppError('Access forbidden', 403, 'AUTH_1006');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
