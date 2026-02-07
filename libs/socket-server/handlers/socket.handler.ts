// ============================================================================
// libs/socket-server/socket.handler.ts
// ============================================================================

import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import { socketAuthMiddleware } from '../auth.middleware';
import { UserHandler } from './user.handler';
import { VendorHandler } from './vendor.handler';
import { RiderHandler } from './rider.handler';

export class SocketHandler {
  private io: Server;

  constructor(httpServer: HTTPServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    this.initializeNamespaces();
    this.setupErrorHandling();
  }

  /**
   * Initialize separate namespaces for each user type
   */
  private initializeNamespaces(): void {
    // User namespace
    const userNamespace = this.io.of('/user');
    userNamespace.use(socketAuthMiddleware('USER'));
    userNamespace.on('connection', (socket) => {
      UserHandler.handleConnection(this.io, socket);
    });

    // Vendor namespace
    const vendorNamespace = this.io.of('/vendor');
    vendorNamespace.use(socketAuthMiddleware('VENDOR'));
    vendorNamespace.on('connection', (socket) => {
      VendorHandler.handleConnection(this.io, socket);
    });

    // Rider namespace
    const riderNamespace = this.io.of('/rider');
    riderNamespace.use(socketAuthMiddleware('RIDER'));
    riderNamespace.on('connection', (socket) => {
      RiderHandler.handleConnection(this.io, socket);
    });

    console.log('[SocketHandler] All namespaces initialized');
  }

  /**
   * Setup error handling
   */
  private setupErrorHandling(): void {
    this.io.on('connect_error', (error) => {
      console.error('[SocketHandler] Connection error:', error.message);
    });

    this.io.engine.on('connection_error', (error) => {
      console.error('[SocketHandler] Engine error:', error.message);
    });
  }

  /**
   * Get Socket.IO server instance
   */
  getIO(): Server {
    return this.io;
  }
}