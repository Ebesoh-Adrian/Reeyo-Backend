// apps/vendor-api/src/modules/auth/auth.service.ts

import { v4 as uuidv4 } from 'uuid';
import { AppError } from '../../../../../libs/shared-utils/errors/app-error';
import { hashPassword, comparePassword } from '../../../../../libs/shared-utils/helpers/password.helper';
import { generateToken, generateRefreshToken, verifyToken } from '../../../../../libs/shared-utils/helpers/jwt.helper';
import { logger } from '../../../../../libs/shared-utils/logger';
import { VendorRepository, Vendor } from '../../../../../libs/shared-utils/core-db/repositories/vendor.repository';

interface RegisterDTO {
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  password: string;
  serviceType: 'FOOD' | 'MART';
  location: {
    address: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  bankDetails: {
    accountName: string;
    accountNumber: string;
    bankName: string;
  };
}

export class AuthService {
  private vendorRepo: VendorRepository;

  constructor() {
    this.vendorRepo = new VendorRepository();
  }

  async register(data: RegisterDTO) {
    const existingVendor = await this.vendorRepo.findByEmail(data.email);
    if (existingVendor) {
      throw new AppError('Email already registered', 409, 'VENDOR_1001');
    }

    const existingPhone = await this.vendorRepo.findByPhone(data.phone);
    if (existingPhone) {
      throw new AppError('Phone number already registered', 409, 'VENDOR_1013');
    }

    const hashedPassword = await hashPassword(data.password);
    const vendorId = `vendor_${uuidv4()}`;
    const otp = this.generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const vendor: Vendor = {
      vendorId,
      businessName: data.businessName,
      ownerName: data.ownerName,
      email: data.email,
      phone: data.phone,
      password: hashedPassword,
      serviceType: data.serviceType,
      location: {
        address: data.location.address,
        city: 'Douala',
        coordinates: data.location.coordinates,
      },
      bankDetails: data.bankDetails,
      isEmailVerified: false,
      isPhoneVerified: false,
      status: 'PENDING_VERIFICATION',
      otp,
      otpExpiry,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.vendorRepo.create(vendor);

    logger.info('Vendor registered', { vendorId, email: data.email });

    const token = generateToken({
      vendorId,
      email: data.email,
      userType: 'VENDOR',
    });

    const { password: _, otp: __, otpExpiry: ___, ...vendorWithoutSensitive } = vendor;

    return {
      vendor: vendorWithoutSensitive,
      token,
    };
  }

  async login(email: string, password: string) {
    const vendor = await this.vendorRepo.findByEmail(email);

    if (!vendor) {
      throw new AppError('Invalid credentials', 401, 'VENDOR_1002');
    }

    const isPasswordValid = await comparePassword(password, vendor.password);
    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401, 'VENDOR_1002');
    }

    if (vendor.status === 'SUSPENDED') {
      throw new AppError('Account suspended. Contact support.', 403, 'VENDOR_1003');
    }

    if (vendor.status === 'INACTIVE') {
      throw new AppError('Account inactive. Please contact support.', 403, 'VENDOR_1004');
    }

    const token = generateToken({
      vendorId: vendor.vendorId,
      email: vendor.email,
      userType: 'VENDOR',
    });

    const refreshToken = generateRefreshToken({
      vendorId: vendor.vendorId,
      email: vendor.email,
      userType: 'VENDOR',
    });

    await this.vendorRepo.update(vendor.vendorId, {
      lastLogin: new Date().toISOString(),
    });

    logger.info('Vendor logged in', { vendorId: vendor.vendorId });

    const { password: _, otp, otpExpiry, resetToken, resetTokenExpiry, ...vendorData } = vendor;

    return {
      vendor: vendorData,
      token,
      refreshToken,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const decoded = verifyToken(refreshToken);

      if (decoded.userType !== 'VENDOR') {
        throw new AppError('Invalid token', 401, 'VENDOR_1005');
      }

      const vendor = await this.vendorRepo.findById(decoded.vendorId!);
      if (!vendor || vendor.status === 'SUSPENDED') {
        throw new AppError('Invalid token', 401, 'VENDOR_1005');
      }

      const newToken = generateToken({
        vendorId: decoded.vendorId!,
        email: decoded.email,
        userType: 'VENDOR',
      });

      const newRefreshToken = generateRefreshToken({
        vendorId: decoded.vendorId!,
        email: decoded.email,
        userType: 'VENDOR',
      });

      return {
        token: newToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      throw new AppError('Invalid refresh token', 401, 'VENDOR_1006');
    }
  }

  async getVendorProfile(vendorId: string) {
    const vendor = await this.vendorRepo.findById(vendorId);

    if (!vendor) {
      throw new AppError('Vendor not found', 404, 'VENDOR_1007');
    }

    const { password, otp, otpExpiry, resetToken, resetTokenExpiry, ...vendorData } = vendor;

    return vendorData;
  }

  async changePassword(vendorId: string, currentPassword: string, newPassword: string) {
    const vendor = await this.vendorRepo.findById(vendorId);

    if (!vendor) {
      throw new AppError('Vendor not found', 404, 'VENDOR_1007');
    }

    const isValid = await comparePassword(currentPassword, vendor.password);
    if (!isValid) {
      throw new AppError('Current password is incorrect', 400, 'VENDOR_1008');
    }

    const newHashedPassword = await hashPassword(newPassword);

    await this.vendorRepo.update(vendorId, { password: newHashedPassword });

    logger.info('Password changed', { vendorId });
  }

  async forgotPassword(email: string) {
    const vendor = await this.vendorRepo.findByEmail(email);

    if (!vendor) {
      logger.warn('Password reset requested for non-existent email', { email });
      return;
    }

    const resetToken = uuidv4();
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    await this.vendorRepo.update(vendor.vendorId, { resetToken, resetTokenExpiry });

    logger.info('Password reset token generated', { vendorId: vendor.vendorId });
  }

  async resetPassword(resetToken: string, newPassword: string) {
    const vendor = await this.vendorRepo.findByResetToken(resetToken);

    if (!vendor) {
      throw new AppError('Invalid or expired reset token', 400, 'VENDOR_1009');
    }

    if (!vendor.resetTokenExpiry || new Date(vendor.resetTokenExpiry) < new Date()) {
      throw new AppError('Reset token expired', 400, 'VENDOR_1009');
    }

    const hashedPassword = await hashPassword(newPassword);

    await this.vendorRepo.update(vendor.vendorId, {
      password: hashedPassword,
      resetToken: undefined,
      resetTokenExpiry: undefined,
    });

    logger.info('Password reset successful', { vendorId: vendor.vendorId });
  }

  async verifyOTP(vendorId: string, otp: string) {
    const vendor = await this.vendorRepo.findById(vendorId);

    if (!vendor) {
      throw new AppError('Vendor not found', 404, 'VENDOR_1007');
    }

    if (vendor.otp !== otp) {
      throw new AppError('Invalid OTP', 400, 'VENDOR_1010');
    }

    if (!vendor.otpExpiry || new Date(vendor.otpExpiry) < new Date()) {
      throw new AppError('OTP expired', 400, 'VENDOR_1011');
    }

    await this.vendorRepo.update(vendorId, {
      isEmailVerified: true,
      status: 'ACTIVE',
      otp: undefined,
      otpExpiry: undefined,
    });

    logger.info('Email verified', { vendorId });
  }

  async resendOTP(vendorId: string) {
    const vendor = await this.vendorRepo.findById(vendorId);

    if (!vendor) {
      throw new AppError('Vendor not found', 404, 'VENDOR_1007');
    }

    if (vendor.isEmailVerified) {
      throw new AppError('Email already verified', 400, 'VENDOR_1012');
    }

    const otp = this.generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await this.vendorRepo.update(vendorId, { otp, otpExpiry });

    logger.info('OTP resent', { vendorId });
  }

  async updateProfile(vendorId: string, updates: Partial<Vendor>) {
    const vendor = await this.vendorRepo.findById(vendorId);

    if (!vendor) {
      throw new AppError('Vendor not found', 404, 'VENDOR_1007');
    }

    delete (updates as any).password;
    delete (updates as any).vendorId;
    delete (updates as any).status;
    delete (updates as any).otp;
    delete (updates as any).otpExpiry;

    const updatedVendor = await this.vendorRepo.update(vendorId, updates);

    logger.info('Profile updated', { vendorId });

    const { password, otp, otpExpiry, resetToken, resetTokenExpiry, ...vendorData } = updatedVendor;

    return vendorData;
  }

  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}

