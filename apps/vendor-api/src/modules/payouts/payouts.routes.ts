// apps/vendor-api/src/modules/payouts/payouts.routes.ts
import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../../middleware/validation.middleware';
import { authenticateVendor, requireActiveVendor } from '../../middleware/auth.middleware';
import { PayoutsController } from './payouts.controller';

const payoutsRouter = Router();
const payoutsController = new PayoutsController();

payoutsRouter.use(authenticateVendor);
payoutsRouter.use(requireActiveVendor);

payoutsRouter.post(
  '/request',
  validate([
    body('amount').isFloat({ min: 50000 }).withMessage('Minimum payout is 50,000 XAF'),
    body('bankDetails.accountName').trim().notEmpty(),
    body('bankDetails.accountNumber').trim().notEmpty(),
    body('bankDetails.bankName').trim().notEmpty(),
  ]),
  payoutsController.requestPayout
);

payoutsRouter.get('/', payoutsController.getPayouts);
payoutsRouter.get('/:payoutId', payoutsController.getPayout);

export { payoutsRouter };