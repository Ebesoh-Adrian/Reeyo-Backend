import { v4 as uuidv4 } from 'uuid';
import { RiderRepository } from '../../../../../libs/core-db/repositories/rider.repository';
import { WalletRepository } from '../../../../../libs/core-db/repositories/wallet.repository';
import { hashPassword, comparePassword } from '../../../../../libs/shared-utils/password.helper';
import { generateToken } from '../../../../../libs/shared-utils/jwt.helper';
import { AppError } from '../../../../../libs/shared-utils/error-handler';
import { logger } from '../../../../../libs/shared-utils/logger';
import { SMSService } from '../../../../../libs/notifications/sms.service';
import { Rider } from '../../../../../libs/core-db/models/rider.model';

interface RegisterRiderDTO {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  password: string;
  vehicleType: 'MOTORCYCLE' | 'BICYCLE' | 'CAR' | 'VAN';
  vehicleDetails: {
    brand?: string;
    model?: string;
    plateNumber: string;
    color?: string;
  };
  documents: {
    idCardUrl: string;
    drivingLicenseUrl: string;
    vehicleRegistrationUrl: string;
    insuranceUrl?: string;
  };
  bankDetails: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    bankCode?: string;
  };
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
}

interface LoginDTO {
  phone: string;
  password: string;
}

interface UpdateProfileDTO {
  firstName?: string;
  lastName?: string;
  email?: string;
  profilePicture?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
}

export class AuthService {
  private riderRepo: RiderRepository;
  private walletRepo: WalletRepository;
  private smsService: SMSService;

  constructor() {
    this.riderRepo = new RiderRepository();
    this.walletRepo = new WalletRepository();
    this.smsService = new SMSService();
  }

  /**
   * Register a new rider
   */
  async register(data: RegisterRiderDTO): Promise<{ rider: Rider; token: string }> {
    logger.info('Registering new rider', { phone: data.phone });

    // Check if phone already exists
    const existingRider = await this.riderRepo.findByPhone(data.phone);
    if (existingRider) {
      throw new AppError('Phone number already registered', 409, 'RIDER_1000');
    }

    // Check if email exists (if provided)
    if (data.email) {
      const existingEmail = await this.riderRepo.findByEmail(data.email);
      if (existingEmail) {
        throw new AppError('Email already registered', 409, 'RIDER_1001');
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(data.password);

    // Generate rider ID
    const riderId = `rider_${uuidv4()}`;

    // Create rider
    const rider = await this.riderRepo.create({
      riderId,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      email: data.email,
      password: hashedPassword,
      vehicleType: data.vehicleType,
      vehicleDetails: data.vehicleDetails,
      documents: data.documents,
      bankDetails: data.bankDetails,
      emergencyContact: data.emergencyContact,
      verificationStatus: 'PENDING',
      approvalStatus: 'PENDING',
      status: 'INACTIVE',
      isOnline: false,
      rating: 0,
      totalDeliveries: 0,
      completedDeliveries: 0,
      cancelledDeliveries: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Create wallet for rider
    await this.walletRepo.createWallet('RIDER', riderId, 0);

    // Generate verification OTP (for SMS)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await this.riderRepo.update(riderId, {
      verificationOTP: otp,
      verificationOTPExpiry: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
    });

    // Send SMS OTP
    try {
      await this.smsService.sendSMS(
        data.phone,
        `Your Reeyo verification code is: ${otp}. Valid for 10 minutes.`
      );
    } catch (error) {
      logger.error('Failed to send SMS OTP', { error, phone: data.phone });
      // Don't fail registration if SMS fails
    }

    // Generate JWT token
    const token = generateToken({
      userId: riderId,
      role: 'RIDER',
    });

    logger.info('Rider registered successfully', { riderId });

    return {
      rider: this.sanitizeRider(rider),
      token,
    };
  }

  /**
   * Login rider
   */
  async login(data: LoginDTO): Promise<{ rider: Rider; token: string }> {
    logger.info('Rider login attempt', { phone: data.phone });

    // Find rider by phone
    const rider = await this.riderRepo.findByPhone(data.phone);
    if (!rider) {
      throw new AppError('Invalid phone or password', 401, 'AUTH_2000');
    }

    // Verify password
    const isPasswordValid = await comparePassword(data.password, rider.password);
    if (!isPasswordValid) {
      throw new AppError('Invalid phone or password', 401, 'AUTH_2000');
    }

    // Check if rider is suspended
    if (rider.status === 'SUSPENDED') {
      throw new AppError('Account suspended. Contact support.', 403, 'RIDER_3002');
    }

    // Update last login
    await this.riderRepo.update(rider.riderId, {
      lastLogin: new Date().toISOString(),
    });

    // Generate JWT token
    const token = generateToken({
      userId: rider.riderId,
      role: 'RIDER',
    });

    logger.info('Rider logged in successfully', { riderId: rider.riderId });

    return {
      rider: this.sanitizeRider(rider),
      token,
    };
  }

  /**
   * Get rider profile
   */
  async getProfile(riderId: string): Promise<Rider> {
    const rider = await this.riderRepo.findById(riderId);
    if (!rider) {
      throw new AppError('Rider not found', 404, 'RIDER_3000');
    }

    return this.sanitizeRider(rider);
  }

  /**
   * Update rider profile
   */
  async updateProfile(riderId: string, data: UpdateProfileDTO): Promise<Rider> {
    logger.info('Updating rider profile', { riderId });

    const rider = await this.riderRepo.findById(riderId);
    if (!rider) {
      throw new AppError('Rider not found', 404, 'RIDER_3000');
    }

    // Check if email is being changed and if it's already taken
    if (data.email && data.email !== rider.email) {
      const existingEmail = await this.riderRepo.findByEmail(data.email);
      if (existingEmail && existingEmail.riderId !== riderId) {
        throw new AppError('Email already in use', 409, 'RIDER_1001');
      }
    }

    // Update rider
    const updatedRider = await this.riderRepo.update(riderId, {
      ...data,
      updatedAt: new Date().toISOString(),
    });

    logger.info('Rider profile updated', { riderId });

    return this.sanitizeRider(updatedRider!);
  }

  /**
   * Verify phone with OTP
   */
  async verifyPhone(riderId: string, otp: string): Promise<Rider> {
    logger.info('Verifying phone OTP', { riderId });

    const rider = await this.riderRepo.findById(riderId);
    if (!rider) {
      throw new AppError('Rider not found', 404, 'RIDER_3000');
    }

    if (rider.verificationStatus === 'VERIFIED') {
      throw new AppError('Phone already verified', 400, 'RIDER_4000');
    }

    if (!rider.verificationOTP || !rider.verificationOTPExpiry) {
      throw new AppError('No verification OTP found', 400, 'RIDER_4001');
    }

    if (new Date() > new Date(rider.verificationOTPExpiry)) {
      throw new AppError('Verification OTP expired', 400, 'RIDER_4002');
    }

    if (rider.verificationOTP !== otp) {
      throw new AppError('Invalid verification OTP', 400, 'RIDER_4003');
    }

    // Update verification status
    const updatedRider = await this.riderRepo.update(riderId, {
      verificationStatus: 'VERIFIED',
      verificationOTP: undefined,
      verificationOTPExpiry: undefined,
      updatedAt: new Date().toISOString(),
    });

    logger.info('Phone verified successfully', { riderId });

    return this.sanitizeRider(updatedRider!);
  }

  /**
   * Resend verification OTP
   */
  async resendVerificationOTP(riderId: string): Promise<void> {
    logger.info('Resending verification OTP', { riderId });

    const rider = await this.riderRepo.findById(riderId);
    if (!rider) {
      throw new AppError('Rider not found', 404, 'RIDER_3000');
    }

    if (rider.verificationStatus === 'VERIFIED') {
      throw new AppError('Phone already verified', 400, 'RIDER_4000');
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await this.riderRepo.update(riderId, {
      verificationOTP: otp,
      verificationOTPExpiry: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    });

    // Send SMS
    await this.smsService.sendSMS(
      rider.phone,
      `Your Reeyo verification code is: ${otp}. Valid for 10 minutes.`
    );

    logger.info('Verification OTP resent', { riderId });
  }

  /**
   * Change password
   */
  async changePassword(
    riderId: string,
    oldPassword: string,
    newPassword: string
  ): Promise<void> {
    logger.info('Changing password', { riderId });

    const rider = await this.riderRepo.findById(riderId);
    if (!rider) {
      throw new AppError('Rider not found', 404, 'RIDER_3000');
    }

    // Verify old password
    const isPasswordValid = await comparePassword(oldPassword, rider.password);
    if (!isPasswordValid) {
      throw new AppError('Invalid current password', 401, 'AUTH_2001');
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await this.riderRepo.update(riderId, {
      password: hashedPassword,
      updatedAt: new Date().toISOString(),
    });

    logger.info('Password changed successfully', { riderId });
  }

  /**
   * Remove sensitive data from rider object
   */
  private sanitizeRider(rider: Rider): Rider {
    const { password, verificationOTP, verificationOTPExpiry, ...sanitized } = rider as any;
    return sanitized;
  }
}
