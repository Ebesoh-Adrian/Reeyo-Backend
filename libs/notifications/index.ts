// ============================================================================
// libs/notifications/index.ts
// ============================================================================

export { PushService } from './push.service';
export { SMSService } from './sms.service';
export { EmailService } from './email.service';

// Singleton instances
export const pushService = new PushService();
export const smsService = new SMSService();
export const emailService = new EmailService();