// libs/shared-utils/payment/campay.service.ts

import axios, { AxiosInstance } from 'axios';
import { logger, ErrorFactory } from '../../shared-utils';

interface CampayAuthResponse {
  token: string;
  expires_at: string;
}

interface CampayPaymentRequest {
  amount: number;
  currency: 'XAF';
  from: string; // Phone number
  description: string;
  external_reference: string;
}

interface CampayPaymentResponse {
  reference: string;
  ussd_code?: string;
  status: 'PENDING' | 'SUCCESSFUL' | 'FAILED';
  operator: string;
  description: string;
}

/**
 * Campay Payment Gateway Integration for Cameroon
 * Supports Mobile Money: MTN, Orange, Nexttel
 */
export class CampayService {
  private client: AxiosInstance;
  private baseURL: string;
  private username: string;
  private password: string;
  private appKey: string;
  private token: string | null = null;
  private tokenExpiresAt: Date | null = null;

  constructor() {
    this.baseURL = process.env.CAMPAY_BASE_URL || 'https://api.campay.net/v1';
    this.username = process.env.CAMPAY_USERNAME || '';
    this.password = process.env.CAMPAY_PASSWORD || '';
    this.appKey = process.env.CAMPAY_APP_KEY || '';

    if (!this.username || !this.password || !this.appKey) {
      logger.warn('Campay credentials not configured');
    }

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Authenticate and get access token
   */
  private async authenticate(): Promise<string> {
    // Return cached token if still valid
    if (this.token && this.tokenExpiresAt && new Date() < this.tokenExpiresAt) {
      return this.token;
    }

    try {
      const response = await this.client.post<CampayAuthResponse>('/auth/token', {
        username: this.username,
        password: this.password,
      }, {
        headers: {
          'X-API-KEY': this.appKey,
        },
      });

      this.token = response.data.token;
      this.tokenExpiresAt = new Date(response.data.expires_at);

      logger.info('Campay authentication successful');
      return this.token;
    } catch (error: any) {
      logger.error('Campay authentication failed', { error: error.message });
      throw ErrorFactory.serviceUnavailable('Payment service temporarily unavailable');
    }
  }

  /**
   * Initiate mobile money collection
   */
  async collectPayment(
    phoneNumber: string,
    amount: number,
    description: string,
    externalReference: string
  ): Promise<CampayPaymentResponse> {
    const token = await this.authenticate();

    // Validate phone number (Cameroon format)
    const validatedPhone = this.validatePhoneNumber(phoneNumber);

    try {
      const payload: CampayPaymentRequest = {
        amount,
        currency: 'XAF',
        from: validatedPhone,
        description,
        external_reference: externalReference,
      };

      const response = await this.client.post<CampayPaymentResponse>(
        '/collect',
        payload,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-API-KEY': this.appKey,
          },
        }
      );

      logger.info('Campay payment initiated', {
        reference: response.data.reference,
        externalReference,
        amount,
      });

      return response.data;
    } catch (error: any) {
      logger.error('Campay payment collection failed', {
        error: error.response?.data || error.message,
        phoneNumber: validatedPhone,
        amount,
      });

      if (error.response?.status === 400) {
        throw ErrorFactory.badRequest(
          error.response.data?.message || 'Invalid payment request'
        );
      }

      throw ErrorFactory.serviceUnavailable('Payment processing failed');
    }
  }

  /**
   * Check payment status
   */
  async getPaymentStatus(reference: string): Promise<CampayPaymentResponse> {
    const token = await this.authenticate();

    try {
      const response = await this.client.get<CampayPaymentResponse>(
        `/transaction/${reference}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-API-KEY': this.appKey,
          },
        }
      );

      return response.data;
    } catch (error: any) {
      logger.error('Failed to get Campay payment status', {
        error: error.message,
        reference,
      });
      throw ErrorFactory.serviceUnavailable('Unable to check payment status');
    }
  }

  /**
   * Initiate mobile money disbursement (payout)
   */
  async disbursePayment(
    phoneNumber: string,
    amount: number,
    description: string,
    externalReference: string
  ): Promise<CampayPaymentResponse> {
    const token = await this.authenticate();
    const validatedPhone = this.validatePhoneNumber(phoneNumber);

    try {
      const payload = {
        amount,
        currency: 'XAF',
        to: validatedPhone,
        description,
        external_reference: externalReference,
      };

      const response = await this.client.post<CampayPaymentResponse>(
        '/disburse',
        payload,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-API-KEY': this.appKey,
          },
        }
      );

      logger.info('Campay disbursement initiated', {
        reference: response.data.reference,
        externalReference,
        amount,
      });

      return response.data;
    } catch (error: any) {
      logger.error('Campay disbursement failed', {
        error: error.response?.data || error.message,
        phoneNumber: validatedPhone,
        amount,
      });

      throw ErrorFactory.serviceUnavailable('Disbursement processing failed');
    }
  }

  /**
   * Validate and format Cameroonian phone number
   */
  private validatePhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');

    // Handle different formats
    if (cleaned.startsWith('237')) {
      cleaned = cleaned.substring(3);
    } else if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }

    // Validate length (should be 9 digits after country code)
    if (cleaned.length !== 9) {
      throw ErrorFactory.badRequest('Invalid Cameroonian phone number format');
    }

    // Validate operator prefix (6 for MTN/Orange, 67/68 for mobile)
    const prefix = cleaned.substring(0, 2);
    const validPrefixes = ['67', '68', '65', '69', '62', '63', '64', '66'];
    
    if (!validPrefixes.includes(prefix)) {
      throw ErrorFactory.badRequest('Unsupported mobile operator');
    }

    // Return in format: 237XXXXXXXXX
    return `237${cleaned}`;
  }

  /**
   * Get operator from phone number
   */
  getOperator(phoneNumber: string): 'MTN' | 'ORANGE' | 'UNKNOWN' {
    const cleaned = phoneNumber.replace(/\D/g, '');
    const prefix = cleaned.substring(cleaned.length - 9, cleaned.length - 7);

    // MTN prefixes: 67, 650-656, 68
    if (['67', '68', '65'].includes(prefix)) {
      return 'MTN';
    }

    // Orange prefixes: 69, 655-659
    if (['69'].includes(prefix)) {
      return 'ORANGE';
    }

    return 'UNKNOWN';
  }

  /**
   * Webhook signature verification
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    // Implement Campay webhook signature verification
    // This depends on Campay's documentation for webhook security
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', this.appKey)
      .update(payload)
      .digest('hex');

    return expectedSignature === signature;
  }
}

// Export singleton instance
export const campayService = new CampayService();