// apps/vendor-api/src/server.ts

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer, Server as HTTPServer } from 'http';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './modules/auth/auth.routes';
import inventoryRoutes from './modules/inventory/inventory.routes';
import ordersRoutes from './modules/orders/orders.routes';
import earningsRoutes from './modules/earnings/earnings.routes';
import payoutsRoutes from './modules/payouts/payouts.routes';
import settingsRoutes from './modules/settings/settings.routes';

// Import middleware
import { errorHandler } from './middleware/error.middleware';
import { notFoundHandler } from './middleware/not-found.middleware';
import { requestLogger } from './middleware/request-logger.middleware';

// Import utilities
import { logger } from '../../../libs/shared-utils/logger';
import { validateEnv } from './config/validate-env';

// Validate environment variables on startup
validateEnv();

class VendorAPIServer {
  private app: Application;
  private httpServer: HTTPServer;
  private port: number;

  constructor() {
    this.app = express();
    this.httpServer = createServer(this.app);
    this.port = parseInt(process.env.PORT || '3002', 10);

    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  /**
   * Initialize Express middleware
   */
  private initializeMiddleware(): void {
    // Security headers
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
    }));

    // CORS configuration
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
    this.app.use(cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }));

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Compression
    this.app.use(compression());

    // Request logging
    if (process.env.NODE_ENV === 'development') {
      this.app.use(morgan('dev'));
    }
    this.app.use(requestLogger);

    // Health check endpoint (no auth required)
    this.app.get('/health', (req: Request, res: Response) => {
      res.status(200).json({
        status: 'healthy',
        service: 'vendor-api',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      });
    });
  }

  /**
   * Initialize API routes
   */
  private initializeRoutes(): void {
    const apiPrefix = '/api/v1';

    // Mount routes
    this.app.use(`${apiPrefix}/auth`, authRoutes);
    this.app.use(`${apiPrefix}/inventory`, inventoryRoutes);
    this.app.use(`${apiPrefix}/orders`, ordersRoutes);
    this.app.use(`${apiPrefix}/earnings`, earningsRoutes);
    this.app.use(`${apiPrefix}/payouts`, payoutsRoutes);
    this.app.use(`${apiPrefix}/settings`, settingsRoutes);

    // API documentation route
    this.app.get(apiPrefix, (req: Request, res: Response) => {
      res.json({
        service: 'Reeyo Vendor API',
        version: '1.0.0',
        endpoints: {
          auth: `${apiPrefix}/auth`,
          inventory: `${apiPrefix}/inventory`,
          orders: `${apiPrefix}/orders`,
          earnings: `${apiPrefix}/earnings`,
          payouts: `${apiPrefix}/payouts`,
          settings: `${apiPrefix}/settings`,
        },
        documentation: 'https://docs.reeyo.cm/vendor-api',
      });
    });
  }

  /**
   * Initialize error handling
   */
  private initializeErrorHandling(): void {
    // 404 handler
    this.app.use(notFoundHandler);

    // Global error handler
    this.app.use(errorHandler);
  }

  /**
   * Start the server
   */
  public async start(): Promise<void> {
    try {
      this.httpServer.listen(this.port, () => {
        logger.info(`🚀 Vendor API server started on port ${this.port}`);
        logger.info(`📝 Environment: ${process.env.NODE_ENV}`);
        logger.info(`🔗 Health check: http://localhost:${this.port}/health`);
      });

      // Graceful shutdown
      this.setupGracefulShutdown();
    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  /**
   * Setup graceful shutdown
   */
  private setupGracefulShutdown(): void {
    const signals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT'];

    signals.forEach((signal) => {
      process.on(signal, async () => {
        logger.info(`${signal} received, starting graceful shutdown...`);

        this.httpServer.close(() => {
          logger.info('HTTP server closed');
          process.exit(0);
        });

        // Force shutdown after 10 seconds
        setTimeout(() => {
          logger.error('Forced shutdown due to timeout');
          process.exit(1);
        }, 10000);
      });
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });
  }

  /**
   * Get Express app instance (for testing)
   */
  public getApp(): Application {
    return this.app;
  }
}

// Initialize and start server
const server = new VendorAPIServer();

if (require.main === module) {
  server.start();
}

// Export for testing and serverless
export default server.getApp();