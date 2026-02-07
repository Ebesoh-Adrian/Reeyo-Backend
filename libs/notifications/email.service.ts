// ============================================================================
// libs/notifications/email.service.ts
// ============================================================================

import nodemailer, { Transporter } from 'nodemailer';
import { logger } from '../shared-utils';

export class EmailService {
  private transporter: Transporter;
  private fromEmail: string;

  constructor() {
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@reeyo.cm';

    // Configure based on environment
    if (process.env.SENDGRID_API_KEY) {
      // Use SendGrid
      this.transporter = nodemailer.createTransport({
        host: 'smtp.sendgrid.net',
        port: 587,
        auth: {
          user: 'apikey',
          pass: process.env.SENDGRID_API_KEY,
        },
      });
    } else if (process.env.SMTP_HOST) {
      // Use custom SMTP
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      });
    } else {
      logger.warn('Email service not configured');
      this.transporter = null as any;
    }
  }

  /**
   * Send email
   */
  async sendEmail(
    to: string,
    subject: string,
    html: string,
    text?: string
  ): Promise<void> {
    if (!this.transporter) {
      logger.warn('Email service not configured, skipping email send');
      return;
    }

    try {
      await this.transporter.sendMail({
        from: this.fromEmail,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
      });

      logger.info('Email sent successfully', { to, subject });
    } catch (error) {
      logger.error('Failed to send email', { error, to });
      throw error;
    }
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(to: string, name: string, userType: string): Promise<void> {
    const subject = 'Welcome to Reeyo!';
    const html = `
      <h1>Welcome to Reeyo, ${name}!</h1>
      <p>Thank you for joining Reeyo as a ${userType}.</p>
      <p>You can now start using our platform to ${
        userType === 'vendor' ? 'manage your business' :
        userType === 'rider' ? 'deliver orders' :
        'order food, groceries, and send packages'
      }.</p>
      <p>Best regards,<br>The Reeyo Team</p>
    `;

    await this.sendEmail(to, subject, html);
  }

  /**
   * Send order confirmation email
   */
  async sendOrderConfirmation(
    to: string,
    orderId: string,
    orderDetails: any
  ): Promise<void> {
    const subject = `Order Confirmation #${orderId}`;
    const html = `
      <h1>Order Confirmed</h1>
      <p>Thank you for your order!</p>
      <h2>Order #${orderId}</h2>
      <p><strong>Total:</strong> ${orderDetails.total} XAF</p>
      <p>Track your order in the Reeyo app.</p>
      <p>Best regards,<br>The Reeyo Team</p>
    `;

    await this.sendEmail(to, subject, html);
  }

  /**
   * Send payout notification email
   */
  async sendPayoutNotification(
    to: string,
    amount: number,
    status: 'approved' | 'rejected',
    reason?: string
  ): Promise<void> {
    const subject = `Payout ${status === 'approved' ? 'Approved' : 'Rejected'}`;
    const html = `
      <h1>Payout ${status === 'approved' ? 'Approved' : 'Rejected'}</h1>
      <p>Your payout request of ${amount} XAF has been ${status}.</p>
      ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
      ${status === 'approved' ? '<p>The funds will be transferred to your bank account within 1-3 business days.</p>' : ''}
      <p>Best regards,<br>The Reeyo Team</p>
    `;

    await this.sendEmail(to, subject, html);
  }
}