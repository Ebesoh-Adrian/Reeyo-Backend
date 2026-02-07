import { Response } from 'express';
import { AuthService } from './auth.service';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { asyncHandler } from '../../middleware/error.middleware';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  register = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { user, token } = await this.authService.register(req.body);
    res.status(201).json({
      success: true,
      message: 'Registration successful. Please verify your phone.',
      data: { user, token },
    });
  });

  login = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { user, token } = await this.authService.login(req.body);
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: { user, token },
    });
  });

  getProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const user = await this.authService.getProfile(req.user.userId);
    res.status(200).json({ success: true, data: user });
  });

  updateProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const user = await this.authService.updateProfile(req.user.userId, req.body);
    res.status(200).json({ success: true, message: 'Profile updated', data: user });
  });

  verifyPhone = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const { otp } = req.body;
    const user = await this.authService.verifyPhone(req.user.userId, otp);
    res.status(200).json({ success: true, message: 'Phone verified', data: user });
  });

  resendOTP = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    await this.authService.resendVerificationOTP(req.user.userId);
    res.status(200).json({ success: true, message: 'OTP sent successfully' });
  });

  changePassword = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const { oldPassword, newPassword } = req.body;
    await this.authService.changePassword(req.user.userId, oldPassword, newPassword);
    res.status(200).json({ success: true, message: 'Password changed successfully' });
  });

  addAddress = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const user = await this.authService.addAddress(req.user.userId, req.body);
    res.status(201).json({ success: true, message: 'Address added', data: user });
  });

  updateAddress = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const { addressId } = req.params;
    const user = await this.authService.updateAddress(req.user.userId, addressId, req.body);
    res.status(200).json({ success: true, message: 'Address updated', data: user });
  });

  deleteAddress = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const { addressId } = req.params;
    const user = await this.authService.deleteAddress(req.user.userId, addressId);
    res.status(200).json({ success: true, message: 'Address deleted', data: user });
  });
}
