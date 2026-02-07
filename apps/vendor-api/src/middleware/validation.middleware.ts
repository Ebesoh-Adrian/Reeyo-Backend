// apps/vendor-api/src/middleware/validation.middleware.ts

import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { AppError } from '../../../libs/shared-utils/errors/app-error';

/**
 * Validate request using express-validator
 */
export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Run all validations
    await Promise.all(validations.map((validation) => validation.run(req)));

    // Check for errors
    const errors = validationResult(req);
    
    if (errors.isEmpty()) {
      return next();
    }

    // Format errors
    const formattedErrors = errors.array().map((err: any) => ({
      field: err.param,
      message: err.msg,
      value: err.value,
    }));

    next(
      new AppError(
        'Validation failed',
        400,
        'VALIDATION_ERROR',
        formattedErrors
      )
    );
  };
};