// ============================================================================
// libs/socket-server/handlers/user.handler.ts
// ============================================================================

import { Server, Socket } from 'socket.io';

interface ExtendedSocket extends Socket {
  user?: {
    userId: string;
    email: string;
    userType: string;
  };
}

export class UserHandler {
  static handleConnection(io: Server, socket: ExtendedSocket): void {
    const userId = socket.user?.userId;
    if (!userId) return;

    console.log(`[UserHandler] User connected: ${userId}`);

    // Join user's personal room
    socket.join(`user:${userId}`);
    socket.join('user'); // Join general user room

    // Subscribe to order updates
    socket.on('subscribe_order', (orderId: string) => {
      socket.join(`order:${orderId}`);
      console.log(`[UserHandler] User ${userId} subscribed to order ${orderId}`);
    });

    // Unsubscribe from order updates
    socket.on('unsubscribe_order', (orderId: string) => {
      socket.leave(`order:${orderId}`);
      console.log(`[UserHandler] User ${userId} unsubscribed from order ${orderId}`);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`[UserHandler] User disconnected: ${userId}`);
    });
  }
}

