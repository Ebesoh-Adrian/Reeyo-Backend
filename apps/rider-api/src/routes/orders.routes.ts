import { Router } from 'express';
import { body, param } from 'express-validator';
import { OrdersController } from './orders.controller';
import { validate } from '../../middleware/validation.middleware';
import { authenticateRider, requireActiveRider } from '../../middleware/auth.middleware';

const router = Router();
const ordersController = new OrdersController();

/**
 * @route   GET /api/v1/orders/available
 * @desc    Get available orders for pickup
 * @access  Private (Active Rider)
 */
router.get('/available', authenticateRider, requireActiveRider, ordersController.getAvailableOrders);

/**
 * @route   GET /api/v1/orders/active
 * @desc    Get rider's active orders
 * @access  Private (Rider)
 */
router.get('/active', authenticateRider, ordersController.getActiveOrders);

/**
 * @route   GET /api/v1/orders/history
 * @desc    Get rider's order history
 * @access  Private (Rider)
 */
router.get('/history', authenticateRider, ordersController.getOrderHistory);

/**
 * @route   GET /api/v1/orders/:orderId
 * @desc    Get order details
 * @access  Private (Rider)
 */
router.get(
  '/:orderId',
  authenticateRider,
  validate([param('orderId').notEmpty().withMessage('Order ID is required')]),
  ordersController.getOrderDetails
);

/**
 * @route   POST /api/v1/orders/:orderId/accept
 * @desc    Accept an order
 * @access  Private (Active Rider)
 */
router.post(
  '/:orderId/accept',
  authenticateRider,
  requireActiveRider,
  validate([param('orderId').notEmpty().withMessage('Order ID is required')]),
  ordersController.acceptOrder
);

/**
 * @route   POST /api/v1/orders/:orderId/arrive-pickup
 * @desc    Mark arrival at pickup location
 * @access  Private (Active Rider)
 */
router.post(
  '/:orderId/arrive-pickup',
  authenticateRider,
  requireActiveRider,
  validate([param('orderId').notEmpty().withMessage('Order ID is required')]),
  ordersController.arriveAtPickup
);

/**
 * @route   POST /api/v1/orders/:orderId/confirm-pickup
 * @desc    Confirm order pickup from vendor
 * @access  Private (Active Rider)
 */
router.post(
  '/:orderId/confirm-pickup',
  authenticateRider,
  requireActiveRider,
  validate([param('orderId').notEmpty().withMessage('Order ID is required')]),
  ordersController.confirmPickup
);

/**
 * @route   POST /api/v1/orders/:orderId/arrive-delivery
 * @desc    Mark arrival at delivery location
 * @access  Private (Active Rider)
 */
router.post(
  '/:orderId/arrive-delivery',
  authenticateRider,
  requireActiveRider,
  validate([param('orderId').notEmpty().withMessage('Order ID is required')]),
  ordersController.arriveAtDelivery
);

/**
 * @route   POST /api/v1/orders/:orderId/complete
 * @desc    Complete delivery
 * @access  Private (Active Rider)
 */
router.post(
  '/:orderId/complete',
  authenticateRider,
  requireActiveRider,
  validate([
    param('orderId').notEmpty().withMessage('Order ID is required'),
    body('verificationCode')
      .optional()
      .isLength({ min: 4, max: 6 })
      .withMessage('Verification code must be 4-6 characters'),
  ]),
  ordersController.completeDelivery
);

/**
 * @route   POST /api/v1/orders/:orderId/report-issue
 * @desc    Report an issue with an order
 * @access  Private (Rider)
 */
router.post(
  '/:orderId/report-issue',
  authenticateRider,
  validate([
    param('orderId').notEmpty().withMessage('Order ID is required'),
    body('issueType')
      .notEmpty()
      .withMessage('Issue type is required')
      .isIn(['CUSTOMER_NOT_AVAILABLE', 'WRONG_ADDRESS', 'DAMAGED_ITEMS', 'OTHER'])
      .withMessage('Invalid issue type'),
    body('description')
      .trim()
      .notEmpty()
      .withMessage('Description is required')
      .isLength({ min: 10, max: 500 })
      .withMessage('Description must be between 10 and 500 characters'),
  ]),
  ordersController.reportIssue
);

export default router;
