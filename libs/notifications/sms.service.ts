// ============================================================================
// libs/notifications/sms.service.ts
// ============================================================================

import { Twilio } from 'twilio';
import { logger } from '../shared-utils';

export class SMSService {
  private client: Twilio;
  private fromNumber: string;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER || '';

    if (!accountSid || !authToken) {
      logger.warn('Twilio credentials not configured');
      this.client = null as any;
    } else {
      this.client = new Twilio(accountSid, authToken);
    }
  }

  /**
   * Send SMS
   */
  async sendSMS(to: string, message: string): Promise<void> {
    if (!this.client) {
      logger.warn('SMS service not configured, skipping SMS send');
      return;
    }

    try {
      await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to,
      });

      logger.info('SMS sent successfully', { to });
    } catch (error) {
      logger.error('Failed to send SMS', { error, to });
      throw error;
    }
  }

  /**
   * Send OTP SMS
   */
  async sendOTP(to: string, otp: string): Promise<void> {
    const message = `Your Reeyo verification code is: ${otp}. Valid for 10 minutes.`;
    await this.sendSMS(to, message);
  }

  /**
   * Send order notification SMS
   */
  async sendOrderNotification(
    to: string,
    orderId: string,
    status: string
  ): Promise<void> {
    const message = `Reeyo: Your order #${orderId} is now ${status}. Track it on the app.`;
    await this.sendSMS(to, message);
  }

  /**
   * Send delivery completion SMS
   */
  async sendDeliveryComplete(to: string, orderId: string): Promise<void> {
    const message = `Reeyo: Order #${orderId} has been delivered. Thank you for using Reeyo!`;
    await this.sendSMS(to, message);
  }
}