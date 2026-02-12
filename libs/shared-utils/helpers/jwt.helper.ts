// libs/shared-utils/helpers/jwt.helper.ts

import jwt from 'jsonwebtoken';

export type UserType = 'VENDOR' | 'USER' | 'RIDER' | 'ADMIN';

export interface JWTPayload {
  vendorId?: string;
  userId?: string;
  riderId?: string;
  adminId?: string;
  email: string;
  userType: UserType;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class JWTHelper {
  private static readonly JWT_SECRET = process.env.JWT_SECRET || '';
  private static readonly JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || '';
  private static readonly ACCESS_TOKEN_EXPIRY = process.env.JWT_EXPIRES_IN || '7d';
  private static readonly REFRESH_TOKEN_EXPIRY = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

  /**
   * Validate JWT secret is configured
   */
  private static validateSecret(): void {
    if (!this.JWT_SECRET || this.JWT_SECRET.length < 32) {
      throw new Error('JWT_SECRET must be configured and at least 32 characters');
    }
  }

  /**
   * Generate access token
   */
  static generateAccessToken(payload: JWTPayload): string {
    this.validateSecret();

    return jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.ACCESS_TOKEN_EXPIRY,
      issuer: 'reeyo-platform',
      audience: 'reeyo-api',
    });
  }

  /**
   * Generate refresh token
   */
  static generateRefreshToken(payload: JWTPayload): string {
    this.validateSecret();

    return jwt.sign(
      { ...payload, type: 'refresh' },
      this.JWT_REFRESH_SECRET,
      {
        expiresIn: this.REFRESH_TOKEN_EXPIRY,
        issuer: 'reeyo-platform',
        audience: 'reeyo-api',
      }
    );
  }

  /**
   * Generate token pair (access + refresh)
   */
  static generateTokenPair(payload: JWTPayload): TokenPair {
    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);

    // Get expiry time in seconds
    const decoded = jwt.decode(accessToken) as any;
    const expiresIn = decoded?.exp ? decoded.exp - Math.floor(Date.now() / 1000) : 0;

    return {
      accessToken,
      refreshToken,
      expiresIn,
    };
  }

  /**
   * Verify access token
   */
  static verifyAccessToken(token: string): JWTPayload {
    this.validateSecret();

    try {
      const decoded = jwt.verify(token, this.JWT_SECRET, {
        issuer: 'reeyo-platform',
        audience: 'reeyo-api',
      }) as JWTPayload & { type?: string };

      // Ensure it's not a refresh token
      if (decoded.type === 'refresh') {
        throw new Error('Invalid token type');
      }

      return {
        vendorId: decoded.vendorId,
        userId: decoded.userId,
        riderId: decoded.riderId,
        adminId: decoded.adminId,
        email: decoded.email,
        userType: decoded.userType,
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid token');
      }
      throw error;
    }
  }

  /**
   * Verify refresh token
   */
  static verifyRefreshToken(token: string): JWTPayload {
    this.validateSecret();

    try {
      const decoded = jwt.verify(token, this.JWT_REFRESH_SECRET, {
        issuer: 'reeyo-platform',
        audience: 'reeyo-api',
      }) as JWTPayload & { type?: string };

      // Ensure it's a refresh token
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      return {
        vendorId: decoded.vendorId,
        userId: decoded.userId,
        riderId: decoded.riderId,
        adminId: decoded.adminId,
        email: decoded.email,
        userType: decoded.userType,
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Refresh token expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid refresh token');
      }
      throw error;
    }
  }

  /**
   * Decode token without verification (for debugging only)
   */
  static decode(token: string): any {
    return jwt.decode(token);
  }

  /**
   * Get token expiry date
   */
  static getExpiryDate(token: string): Date | null {
    const decoded = jwt.decode(token) as any;
    if (!decoded?.exp) return null;
    return new Date(decoded.exp * 1000);
  }

  /**
   * Check if token is expired
   */
  static isExpired(token: string): boolean {
    const expiryDate = this.getExpiryDate(token);
    if (!expiryDate) return true;
    return expiryDate < new Date();
  }
}

// Export convenience functions for backward compatibility
export function generateToken(payload: JWTPayload): string {
  return JWTHelper.generateAccessToken(payload);
}

export function generateRefreshToken(payload: JWTPayload): string {
  return JWTHelper.generateRefreshToken(payload);
}

export function verifyToken(token: string): JWTPayload {
  return JWTHelper.verifyAccessToken(token);
}

export function generateTokenPair(payload: JWTPayload): TokenPair {
  return JWTHelper.generateTokenPair(payload);
}

