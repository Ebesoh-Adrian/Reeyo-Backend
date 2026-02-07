import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../../../../../libs/shared-utils/jwt.helper';
import { UserRepository } from '../../../../../libs/core-db/repositories/user.repository';
import { AppError } from '../../../../../libs/shared-utils/error-handler';
import { logger } from '../../../../../libs/shared-utils/logger';

/**
 * Extended Request interface with authenticated user
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    phone: string;
    email?: string;
    role: 'USER';
  };
}

/**
 * Middleware to authenticate user using JWT
 */
export const authenticateUser = async (
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

    // Verify role is USER
    if (decoded.role !== 'USER') {
      throw new AppError('Invalid token - not a user token', 403, 'AUTH_1005');
    }

    // Verify user exists in database
    const userRepo = new UserRepository();
    const user = await userRepo.findById(decoded.userId);

    if (!user) {
      throw new AppError('User not found', 404, 'AUTH_1002');
    }

    // Attach user info to request
    req.user = {
      userId: user.userId,
      phone: user.phone,
      email: user.email,
      role: 'USER',
    };

    logger.info('User authenticated', {
      userId: user.userId,
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
 * Middleware to check if user is verified
 */
export const requireVerifiedUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Unauthorized', 401, 'AUTH_1000');
    }

    const userRepo = new UserRepository();
    const user = await userRepo.findById(req.user.userId);

    if (!user) {
      throw new AppError('User not found', 404, 'USER_3000');
    }

    if (!user.isPhoneVerified) {
      throw new AppError(
        'Phone not verified. Please verify your phone number.',
        403,
        'USER_3003'
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check if user is active
 */
export const requireActiveUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Unauthorized', 401, 'AUTH_1000');
    }

    const userRepo = new UserRepository();
    const user = await userRepo.findById(req.user.userId);

    if (!user) {
      throw new AppError('User not found', 404, 'USER_3000');
    }

    if (user.status === 'SUSPENDED') {
      throw new AppError('Account suspended. Contact support.', 403, 'USER_3004');
    }

    if (user.status === 'INACTIVE') {
      throw new AppError('Account inactive', 403, 'USER_3005');
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to verify user ownership of a resource
 */
export const verifyUserOwnership = (resourceIdParam: string = 'id') => {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401, 'AUTH_1000');
      }

      const resourceId = req.params[resourceIdParam];
      const userId = req.user.userId;

      // This is a basic ownership check - implement specific logic based on resource type
      if (resourceId !== userId) {
        throw new AppError('Access forbidden', 403, 'AUTH_1006');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
