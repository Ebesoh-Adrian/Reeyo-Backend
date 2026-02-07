// apps/vendor-api/src/modules/orders/orders.routes.ts

import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { validate } from '../../middleware/validation.middleware';
import { authenticateVendor, requireActiveVendor } from '../../middleware/auth.middleware';
import { OrdersController } from './orders.controller';

const router = Router();
const ordersController = new OrdersController();

// All order routes require authentication
router.use(authenticateVendor);
router.use(requireActiveVendor);

/**
 * GET /api/v1/orders
 * Get all orders with filters
 */
router.get(
  '/',
  validate([
    query('status')
      .optional()
      .isIn(['PENDING', 'ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'COMPLETED', 'CANCELLED'])
      .withMessage('Invalid status'),
    
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
  ]),
  ordersController.getOrders
);

/**
 * GET /api/v1/orders/pending
 * Get pending orders (awaiting vendor acceptance)
 */
router.get(
  '/pending',
  ordersController.getPendingOrders
);

/**
 * GET /api/v1/orders/active
 * Get active orders (accepted but not completed)
 */
router.get(
  '/active',
  ordersController.getActiveOrders
);

/**
 * GET /api/v1/orders/history
 * Get completed/cancelled orders
 */
router.get(
  '/history',
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
  ordersController.getOrderHistory
);

/**
 * GET /api/v1/orders/:orderId
 * Get single order details
 */
router.get(
  '/:orderId',
  validate([
    param('orderId')
      .notEmpty()
      .withMessage('Order ID is required'),
  ]),
  ordersController.getOrder
);

/**
 * PUT /api/v1/orders/:orderId/accept
 * Accept order
 */
router.put(
  '/:orderId/accept',
  validate([
    param('orderId')
      .notEmpty()
      .withMessage('Order ID is required'),
    
    body('preparationTime')
      .optional()
      .isInt({ min: 1, max: 120 })
      .withMessage('Preparation time must be 1-120 minutes'),
  ]),
  ordersController.acceptOrder
);

/**
 * PUT /api/v1/orders/:orderId/reject
 * Reject order
 */
router.put(
  '/:orderId/reject',
  validate([
    param('orderId')
      .notEmpty()
      .withMessage('Order ID is required'),
    
    body('reason')
      .trim()
      .isLength({ min: 10, max: 200 })
      .withMessage('Rejection reason must be 10-200 characters'),
  ]),
  ordersController.rejectOrder
);

/**
 * PUT /api/v1/orders/:orderId/ready
 * Mark order ready for pickup
 */
router.put(
  '/:orderId/ready',
  validate([
    param('orderId')
      .notEmpty()
      .withMessage('Order ID is required'),
  ]),
  ordersController.markOrderReady
);

/**
 * GET /api/v1/orders/stats/summary
 * Get order statistics summary
 */
router.get(
  '/stats/summary',
  validate([
    query('period')
      .optional()
      .isIn(['today', 'week', 'month', 'year'])
      .withMessage('Period must be one of: today, week, month, year'),
  ]),
  ordersController.getOrderStats
);

export default router;