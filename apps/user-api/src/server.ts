import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { config } from './config/validate-env';
import { logger } from '../../../libs/shared-utils/logger';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import routes from './routes';

const createApp = (): Application => {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: config.CORS_ORIGIN.split(','), credentials: true }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(compression());
  app.use((req, res, next) => {
    logger.info('Incoming request', { method: req.method, path: req.path, ip: req.ip });
    next();
  });
  app.use(`/api/${config.API_VERSION}`, routes);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
};

const startServer = async (): Promise<void> => {
  try {
    const app = createApp();
    app.listen(config.PORT, () => {
      logger.info('🚀 Reeyo User API started', { port: config.PORT, environment: config.NODE_ENV });
      logger.info(`📍 Server running at http://localhost:${config.PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
};

process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason: any) => {
  logger.error('Unhandled Rejection', { reason });
  process.exit(1);
});

startServer();
