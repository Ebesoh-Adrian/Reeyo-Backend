// apps/vendor-api/src/modules/earnings/earnings.routes.ts

import { Router } from 'express';
import { query } from 'express-validator';
import { validate } from '../../middleware/validation.middleware';
import { authenticateVendor, requireActiveVendor } from '../../middleware/auth.middleware';
import { EarningsController } from './earnings.controller';

const router = Router();
const earningsController = new EarningsController();

// All earnings routes require authentication
router.use(authenticateVendor);
router.use(requireActiveVendor);

/**
 * GET /api/v1/earnings/summary
 * Get earnings summary
 */
router.get(
  '/summary',
  earningsController.getEarningsSummary
);

/**
 * GET /api/v1/earnings/transactions
 * Get transaction history
 */
router.get(
  '/transactions',
  validate([
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    
    query('type')
      .optional()
      .isIn(['CREDIT', 'DEBIT'])
      .withMessage('Type must be CREDIT or DEBIT'),
  ]),
  earningsController.getTransactions
);

/**
 * GET /api/v1/earnings/daily
 * Get daily earnings
 */
router.get(
  '/daily',
  validate([
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be valid ISO 8601 date'),
    
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be valid ISO 8601 date'),
  ]),
  earningsController.getDailyEarnings
);

/**
 * GET /api/v1/earnings/weekly
 * Get weekly earnings
 */
router.get(
  '/weekly',
  earningsController.getWeeklyEarnings
);

/**
 * GET /api/v1/earnings/monthly
 * Get monthly earnings
 */
router.get(
  '/monthly',
  validate([
    query('year')
      .optional()
      .isInt({ min: 2020, max: 2100 })
      .withMessage('Year must be between 2020 and 2100'),
  ]),
  earningsController.getMonthlyEarnings
);

export default router;