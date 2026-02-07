import { Response } from 'express';
import { AuthService } from './auth.service';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { asyncHandler } from '../../middleware/error.middleware';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  /**
   * Register a new rider
   * POST /api/v1/auth/register
   */
  register = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { rider, token } = await this.authService.register(req.body);

    res.status(201).json({
      success: true,
      message: 'Rider registered successfully. Please verify your phone.',
      data: {
        rider,
        token,
      },
    });
  });

  /**
   * Login rider
   * POST /api/v1/auth/login
   */
  login = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { rider, token } = await this.authService.login(req.body);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        rider,
        token,
      },
    });
  });

  /**
   * Get current rider profile
   * GET /api/v1/auth/me
   */
  getProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.rider) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const rider = await this.authService.getProfile(req.rider.riderId);

    res.status(200).json({
      success: true,
      data: rider,
    });
  });

  /**
   * Update rider profile
   * PUT /api/v1/auth/profile
   */
  updateProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.rider) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const rider = await this.authService.updateProfile(req.rider.riderId, req.body);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: rider,
    });
  });

  /**
   * Verify phone with OTP
   * POST /api/v1/auth/verify-phone
   */
  verifyPhone = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.rider) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const { otp } = req.body;
    const rider = await this.authService.verifyPhone(req.rider.riderId, otp);

    res.status(200).json({
      success: true,
      message: 'Phone verified successfully',
      data: rider,
    });
  });

  /**
   * Resend verification OTP
   * POST /api/v1/auth/resend-otp
   */
  resendOTP = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.rider) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    await this.authService.resendVerificationOTP(req.rider.riderId);

    res.status(200).json({
      success: true,
      message: 'Verification OTP sent successfully',
    });
  });

  /**
   * Change password
   * POST /api/v1/auth/change-password
   */
  changePassword = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.rider) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const { oldPassword, newPassword } = req.body;
    await this.authService.changePassword(req.rider.riderId, oldPassword, newPassword);

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  });
}
