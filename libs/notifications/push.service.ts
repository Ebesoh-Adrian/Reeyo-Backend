// ============================================================================
// libs/notifications/push.service.ts
// ============================================================================

import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { logger, NotificationType } from '../shared-utils';

interface PushNotification {
  title: string;
  body: string;
  data?: Record<string, any>;
}

export class PushService {
  private snsClient: SNSClient;

  constructor() {
    this.snsClient = new SNSClient({
      region: process.env.AWS_REGION || 'us-east-1',
    });
  }

  /**
   * Send push notification to device
   */
  async sendToDevice(
    deviceToken: string,
    notification: PushNotification
  ): Promise<void> {
    try {
      const message = JSON.stringify({
        default: notification.body,
        GCM: JSON.stringify({
          notification: {
            title: notification.title,
            body: notification.body,
          },
          data: notification.data || {},
        }),
        APNS: JSON.stringify({
          aps: {
            alert: {
              title: notification.title,
              body: notification.body,
            },
            sound: 'default',
          },
          ...notification.data,
        }),
      });

      await this.snsClient.send(
        new PublishCommand({
          TargetArn: deviceToken,
          Message: message,
          MessageStructure: 'json',
        })
      );

      logger.info('Push notification sent', { deviceToken });
    } catch (error) {
      logger.error('Failed to send push notification', { error, deviceToken });
      throw error;
    }
  }

  /**
   * Send notification to topic (broadcast)
   */
  async sendToTopic(
    topicArn: string,
    notification: PushNotification
  ): Promise<void> {
    try {
      await this.snsClient.send(
        new PublishCommand({
          TopicArn: topicArn,
          Message: JSON.stringify(notification),
          Subject: notification.title,
        })
      );

      logger.info('Push notification sent to topic', { topicArn });
    } catch (error) {
      logger.error('Failed to send push to topic', { error, topicArn });
      throw error;
    }
  }

  /**
   * Send order notification
   */
  async sendOrderNotification(
    deviceToken: string,
    type: NotificationType,
    orderId: string,
    details?: string
  ): Promise<void> {
    const notifications: Record<NotificationType, PushNotification> = {
      [NotificationType.ORDER_PLACED]: {
        title: 'New Order Received',
        body: `Order #${orderId} has been placed`,
        data: { orderId, type },
      },
      [NotificationType.ORDER_ACCEPTED]: {
        title: 'Order Accepted',
        body: `Your order #${orderId} has been accepted`,
        data: { orderId, type },
      },
      [NotificationType.ORDER_REJECTED]: {
        title: 'Order Rejected',
        body: `Order #${orderId} was rejected. ${details || ''}`,
        data: { orderId, type },
      },
      [NotificationType.ORDER_READY]: {
        title: 'Order Ready',
        body: `Your order #${orderId} is ready for pickup`,
        data: { orderId, type },
      },
      [NotificationType.RIDER_ASSIGNED]: {
        title: 'Rider Assigned',
        body: `A rider has been assigned to order #${orderId}`,
        data: { orderId, type },
      },
      [NotificationType.RIDER_ARRIVED]: {
        title: 'Rider Arrived',
        body: `Your rider has arrived for order #${orderId}`,
        data: { orderId, type },
      },
      [NotificationType.ORDER_PICKED_UP]: {
        title: 'Order Picked Up',
        body: `Order #${orderId} is on the way`,
        data: { orderId, type },
      },
      [NotificationType.ORDER_IN_TRANSIT]: {
        title: 'Order In Transit',
        body: `Your order #${orderId} is being delivered`,
        data: { orderId, type },
      },
      [NotificationType.ORDER_DELIVERED]: {
        title: 'Order Delivered',
        body: `Order #${orderId} has been delivered`,
        data: { orderId, type },
      },
      [NotificationType.PAYMENT_RECEIVED]: {
        title: 'Payment Received',
        body: details || `Payment received for order #${orderId}`,
        data: { orderId, type },
      },
      [NotificationType.PAYOUT_APPROVED]: {
        title: 'Payout Approved',
        body: details || 'Your payout request has been approved',
        data: { type },
      },
      [NotificationType.PAYOUT_REJECTED]: {
        title: 'Payout Rejected',
        body: details || 'Your payout request was rejected',
        data: { type },
      },
    };

    const notification = notifications[type];
    if (notification) {
      await this.sendToDevice(deviceToken, notification);
    }
  }
}