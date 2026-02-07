import { Router } from 'express';
import { body, param } from 'express-validator';
import { PayoutsController } from './payouts.controller';
import { validate } from '../../middleware/validation.middleware';
import { authenticateRider, requireVerifiedRider } from '../../middleware/auth.middleware';

const router = Router();
const payoutsController = new PayoutsController();

/**
 * @route   POST /api/v1/payouts/request
 * @desc    Request a payout
 * @access  Private (Verified Rider)
 */
router.post(
  '/request',
  authenticateRider,
  requireVerifiedRider,
  validate([
    body('amount')
      .notEmpty()
      .withMessage('Amount is required')
      .isFloat({ min: 1 })
      .withMessage('Amount must be greater than 0'),
    body('bankDetails.accountName')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Account name is required'),
    body('bankDetails.accountNumber')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Account number is required'),
    body('bankDetails.bankName')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Bank name is required'),
  ]),
  payoutsController.requestPayout
);

/**
 * @route   GET /api/v1/payouts
 * @desc    Get payout history
 * @access  Private (Rider)
 */
router.get('/', authenticateRider, payoutsController.getPayoutHistory);

/**
 * @route   GET /api/v1/payouts/balance
 * @desc    Get available balance for payout
 * @access  Private (Rider)
 */
router.get('/balance', authenticateRider, payoutsController.getAvailableBalance);

/**
 * @route   GET /api/v1/payouts/:payoutId
 * @desc    Get payout details
 * @access  Private (Rider)
 */
router.get(
  '/:payoutId',
  authenticateRider,
  validate([param('payoutId').notEmpty().withMessage('Payout ID is required')]),
  payoutsController.getPayoutDetails
);

export default router;
