// libs/shared-utils/helpers/password.helper.ts

import bcrypt from 'bcrypt';

export class PasswordHelper {
  private static readonly SALT_ROUNDS = parseInt(
    process.env.BCRYPT_ROUNDS || '12',
    10
  );

  /**
   * Hash password using bcrypt
   */
  static async hash(password: string): Promise<string> {
    if (!password || password.length === 0) {
      throw new Error('Password cannot be empty');
    }

    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * Compare plain password with hashed password
   */
  static async compare(password: string, hash: string): Promise<boolean> {
    if (!password || !hash) {
      return false;
    }

    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      // Invalid hash format or other bcrypt errors
      return false;
    }
  }

  /**
   * Validate password strength
   */
  static validateStrength(password: string): {
    isValid: boolean;
    errors: string[];
    score: number; // 0-5
  } {
    const errors: string[] = [];
    let score = 0;

    if (!password) {
      return {
        isValid: false,
        errors: ['Password is required'],
        score: 0,
      };
    }

    // Length check
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    } else if (password.length >= 8 && password.length < 12) {
      score += 1;
    } else if (password.length >= 12) {
      score += 2;
    }

    // Lowercase check
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    } else {
      score += 1;
    }

    // Uppercase check
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    } else {
      score += 1;
    }

    // Number check
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    } else {
      score += 1;
    }

    // Special character check
    if (!/[@$!%*?&#]/.test(password)) {
      errors.push('Password must contain at least one special character (@$!%*?&#)');
    } else {
      score += 1;
    }

    return {
      isValid: errors.length === 0,
      errors,
      score: Math.min(score, 5),
    };
  }

  /**
   * Generate random secure password
   */
  static generateRandom(length: number = 16): string {
    if (length < 8) {
      throw new Error('Password length must be at least 8 characters');
    }

    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const special = '@$!%*?&#';
    const all = lowercase + uppercase + numbers + special;

    let password = '';

    // Ensure at least one of each required type
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];

    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
      password += all[Math.floor(Math.random() * all.length)];
    }

    // Shuffle the password to randomize positions
    return password
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');
  }

  /**
   * Check if password has been compromised (basic check)
   */
  static isCommonPassword(password: string): boolean {
    const commonPasswords = [
      'password',
      '12345678',
      '123456789',
      'qwerty',
      'abc123',
      'password123',
      'admin',
      'letmein',
      'welcome',
      'monkey',
      'dragon',
      'master',
      'sunshine',
      'princess',
      'football',
      'iloveyou',
    ];

    const lowerPassword = password.toLowerCase();
    return commonPasswords.some((common) => lowerPassword.includes(common));
  }

  /**
   * Get password strength description
   */
  static getStrengthDescription(score: number): string {
    switch (score) {
      case 0:
      case 1:
        return 'Very Weak';
      case 2:
        return 'Weak';
      case 3:
        return 'Fair';
      case 4:
        return 'Strong';
      case 5:
        return 'Very Strong';
      default:
        return 'Unknown';
    }
  }
}

// Export convenience functions for backward compatibility
export async function hashPassword(password: string): Promise<string> {
  return PasswordHelper.hash(password);
}

export async function comparePassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return PasswordHelper.compare(plainPassword, hashedPassword);
}

export function validatePasswordStrength(password: string) {
  return PasswordHelper.validateStrength(password);
}

export function generateRandomPassword(length: number = 16): string {
  return PasswordHelper.generateRandom(length);
}

