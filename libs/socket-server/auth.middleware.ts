// ============================================================================
// libs/socket-server/auth.middleware.ts
// ============================================================================

import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { SocketUser } from './types';

interface ExtendedSocket extends Socket {
  user?: SocketUser;
}

/**
 * Socket authentication middleware
 */
export const socketAuthMiddleware = (requiredUserType?: string) => {
  return async (socket: ExtendedSocket, next: (err?: Error) => void) => {
    try {
      // Get token from auth or headers
      const token = 
        socket.handshake.auth.token || 
        socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      // Verify JWT token
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        return next(new Error('JWT_SECRET not configured'));
      }

      const decoded = jwt.verify(token, jwtSecret) as SocketUser & { userType: string };

      // Check user type if required
      if (requiredUserType && decoded.userType !== requiredUserType) {
        return next(new Error(`Invalid user type. Expected ${requiredUserType}`));
      }

      // Attach user to socket
      socket.user = {
        userId: decoded.userId,
        email: decoded.email,
        userType: decoded.userType as any,
      };

      next();
    } catch (error: any) {
      if (error instanceof jwt.JsonWebTokenError) {
        return next(new Error('Invalid token'));
      }
      if (error instanceof jwt.TokenExpiredError) {
        return next(new Error('Token expired'));
      }
      return next(new Error('Authentication failed'));
    }
  };
};

