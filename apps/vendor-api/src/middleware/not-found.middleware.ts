// apps/vendor-api/src/middleware/not-found.middleware.ts

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../../libs/shared-utils/errors/app-error';

export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const error = new AppError(
    `Endpoint not found: ${req.method} ${req.originalUrl}`,
    404,
    'NOT_FOUND'
  );
  next(error);
};