import { v4 as uuidv4 } from 'uuid';
import { UserRepository } from '../../../../../libs/core-db/repositories/user.repository';
import { WalletRepository } from '../../../../../libs/core-db/repositories/wallet.repository';
import { hashPassword, comparePassword } from '../../../../../libs/shared-utils/password.helper';
import { generateToken } from '../../../../../libs/shared-utils/jwt.helper';
import { AppError } from '../../../../../libs/shared-utils/error-handler';
import { logger } from '../../../../../libs/shared-utils/logger';
import { SMSService } from '../../../../../libs/notifications/sms.service';
import { User } from '../../../../../libs/core-db/models/user.model';

interface RegisterUserDTO {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  password: string;
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
}

interface AddressDTO {
  label: string;
  address: string;
  city: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  instructions?: string;
}

export class AuthService {
  private userRepo: UserRepository;
  private walletRepo: WalletRepository;
  private smsService: SMSService;

  constructor() {
    this.userRepo = new UserRepository();
    this.walletRepo = new WalletRepository();
    this.smsService = new SMSService();
  }

  /**
   * Register a new user
   */
  async register(data: RegisterUserDTO): Promise<{ user: User; token: string }> {
    logger.info('Registering new user', { phone: data.phone });

    // Check if phone already exists
    const existingUser = await this.userRepo.findByPhone(data.phone);
    if (existingUser) {
      throw new AppError('Phone number already registered', 409, 'USER_1000');
    }

    // Check if email exists (if provided)
    if (data.email) {
      const existingEmail = await this.userRepo.findByEmail(data.email);
      if (existingEmail) {
        throw new AppError('Email already registered', 409, 'USER_1001');
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(data.password);

    // Generate user ID
    const userId = `user_${uuidv4()}`;

    // Create user
    const user = await this.userRepo.create({
      userId,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      email: data.email,
      password: hashedPassword,
      isPhoneVerified: false,
      isEmailVerified: false,
      status: 'ACTIVE',
      addresses: [],
      orderHistory: [],
      favoriteVendors: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Create wallet for user
    await this.walletRepo.createWallet('USER', userId, 0);

    // Generate verification OTP (for SMS)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await this.userRepo.update(userId, {
      phoneVerificationOTP: otp,
      phoneVerificationOTPExpiry: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
    });

    // Send SMS OTP
    try {
      await this.smsService.sendSMS(
        data.phone,
        `Welcome to Reeyo! Your verification code is: ${otp}. Valid for 10 minutes.`
      );
    } catch (error) {
      logger.error('Failed to send SMS OTP', { error, phone: data.phone });
      // Don't fail registration if SMS fails
    }

    // Generate JWT token
    const token = generateToken({
      userId,
      role: 'USER',
    });

    logger.info('User registered successfully', { userId });

    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  /**
   * Login user
   */
  async login(data: LoginDTO): Promise<{ user: User; token: string }> {
    logger.info('User login attempt', { phone: data.phone });

    // Find user by phone
    const user = await this.userRepo.findByPhone(data.phone);
    if (!user) {
      throw new AppError('Invalid phone or password', 401, 'AUTH_2000');
    }

    // Verify password
    const isPasswordValid = await comparePassword(data.password, user.password);
    if (!isPasswordValid) {
      throw new AppError('Invalid phone or password', 401, 'AUTH_2000');
    }

    // Check if user is suspended
    if (user.status === 'SUSPENDED') {
      throw new AppError('Account suspended. Contact support.', 403, 'USER_3004');
    }

    // Update last login
    await this.userRepo.update(user.userId, {
      lastLogin: new Date().toISOString(),
    });

    // Generate JWT token
    const token = generateToken({
      userId: user.userId,
      role: 'USER',
    });

    logger.info('User logged in successfully', { userId: user.userId });

    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  /**
   * Get user profile
   */
  async getProfile(userId: string): Promise<User> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_3000');
    }

    return this.sanitizeUser(user);
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, data: UpdateProfileDTO): Promise<User> {
    logger.info('Updating user profile', { userId });

    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_3000');
    }

    // Check if email is being changed and if it's already taken
    if (data.email && data.email !== user.email) {
      const existingEmail = await this.userRepo.findByEmail(data.email);
      if (existingEmail && existingEmail.userId !== userId) {
        throw new AppError('Email already in use', 409, 'USER_1001');
      }
    }

    // Update user
    const updatedUser = await this.userRepo.update(userId, {
      ...data,
      updatedAt: new Date().toISOString(),
    });

    logger.info('User profile updated', { userId });

    return this.sanitizeUser(updatedUser!);
  }

  /**
   * Verify phone with OTP
   */
  async verifyPhone(userId: string, otp: string): Promise<User> {
    logger.info('Verifying phone OTP', { userId });

    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_3000');
    }

    if (user.isPhoneVerified) {
      throw new AppError('Phone already verified', 400, 'USER_4000');
    }

    if (!user.phoneVerificationOTP || !user.phoneVerificationOTPExpiry) {
      throw new AppError('No verification OTP found', 400, 'USER_4001');
    }

    if (new Date() > new Date(user.phoneVerificationOTPExpiry)) {
      throw new AppError('Verification OTP expired', 400, 'USER_4002');
    }

    if (user.phoneVerificationOTP !== otp) {
      throw new AppError('Invalid verification OTP', 400, 'USER_4003');
    }

    // Update verification status
    const updatedUser = await this.userRepo.update(userId, {
      isPhoneVerified: true,
      phoneVerificationOTP: undefined,
      phoneVerificationOTPExpiry: undefined,
      updatedAt: new Date().toISOString(),
    });

    logger.info('Phone verified successfully', { userId });

    return this.sanitizeUser(updatedUser!);
  }

  /**
   * Resend verification OTP
   */
  async resendVerificationOTP(userId: string): Promise<void> {
    logger.info('Resending verification OTP', { userId });

    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_3000');
    }

    if (user.isPhoneVerified) {
      throw new AppError('Phone already verified', 400, 'USER_4000');
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await this.userRepo.update(userId, {
      phoneVerificationOTP: otp,
      phoneVerificationOTPExpiry: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    });

    // Send SMS
    await this.smsService.sendSMS(
      user.phone,
      `Your Reeyo verification code is: ${otp}. Valid for 10 minutes.`
    );

    logger.info('Verification OTP resent', { userId });
  }

  /**
   * Change password
   */
  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string
  ): Promise<void> {
    logger.info('Changing password', { userId });

    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_3000');
    }

    // Verify old password
    const isPasswordValid = await comparePassword(oldPassword, user.password);
    if (!isPasswordValid) {
      throw new AppError('Invalid current password', 401, 'AUTH_2001');
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await this.userRepo.update(userId, {
      password: hashedPassword,
      updatedAt: new Date().toISOString(),
    });

    logger.info('Password changed successfully', { userId });
  }

  /**
   * Add delivery address
   */
  async addAddress(userId: string, addressData: AddressDTO): Promise<User> {
    logger.info('Adding delivery address', { userId });

    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_3000');
    }

    const addresses = user.addresses || [];
    const newAddress = {
      id: `addr_${uuidv4()}`,
      ...addressData,
      createdAt: new Date().toISOString(),
    };

    addresses.push(newAddress);

    const updatedUser = await this.userRepo.update(userId, {
      addresses,
      updatedAt: new Date().toISOString(),
    });

    logger.info('Address added successfully', { userId, addressId: newAddress.id });

    return this.sanitizeUser(updatedUser!);
  }

  /**
   * Update delivery address
   */
  async updateAddress(
    userId: string,
    addressId: string,
    addressData: Partial<AddressDTO>
  ): Promise<User> {
    logger.info('Updating delivery address', { userId, addressId });

    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_3000');
    }

    const addresses = user.addresses || [];
    const addressIndex = addresses.findIndex((addr: any) => addr.id === addressId);

    if (addressIndex === -1) {
      throw new AppError('Address not found', 404, 'USER_3001');
    }

    addresses[addressIndex] = {
      ...addresses[addressIndex],
      ...addressData,
      updatedAt: new Date().toISOString(),
    };

    const updatedUser = await this.userRepo.update(userId, {
      addresses,
      updatedAt: new Date().toISOString(),
    });

    logger.info('Address updated successfully', { userId, addressId });

    return this.sanitizeUser(updatedUser!);
  }

  /**
   * Delete delivery address
   */
  async deleteAddress(userId: string, addressId: string): Promise<User> {
    logger.info('Deleting delivery address', { userId, addressId });

    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_3000');
    }

    const addresses = (user.addresses || []).filter((addr: any) => addr.id !== addressId);

    const updatedUser = await this.userRepo.update(userId, {
      addresses,
      updatedAt: new Date().toISOString(),
    });

    logger.info('Address deleted successfully', { userId, addressId });

    return this.sanitizeUser(updatedUser!);
  }

  /**
   * Remove sensitive data from user object
   */
  private sanitizeUser(user: User): User {
    const {
      password,
      phoneVerificationOTP,
      phoneVerificationOTPExpiry,
      emailVerificationToken,
      ...sanitized
    } = user as any;
    return sanitized;
  }
}
