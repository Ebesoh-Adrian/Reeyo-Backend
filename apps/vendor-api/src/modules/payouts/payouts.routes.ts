// apps/vendor-api/src/modules/payouts/payouts.routes.ts
import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../../middleware/validation.middleware';
import { authenticateVendor, requireActiveVendor } from '../../middleware/auth.middleware';
import { PayoutsController } from './payouts.controller';

const router = Router();
const payoutsController = new PayoutsController();

// All routes require authentication
router.use(authenticateVendor);
router.use(requireActiveVendor);

router.post(
  '/request',
  validate([
    body('amount').isFloat({ min: 50000 }).withMessage('Minimum payout is 50,000 XAF'),
    body('bankDetails.accountName').trim().notEmpty().withMessage('Account name is required'),
    body('bankDetails.accountNumber').trim().notEmpty().withMessage('Account number is required'),
    body('bankDetails.bankName').trim().notEmpty().withMessage('Bank name is required'),
  ]),
  payoutsController.requestPayout
);

router.get('/', payoutsController.getPayouts);
router.get('/:payoutId', payoutsController.getPayout);

export default router;  // ✅ Changed to default export