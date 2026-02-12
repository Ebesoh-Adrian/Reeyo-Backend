// apps/vendor-api/src/modules/settings/settings.routes.ts
import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../../middleware/validation.middleware';
import { authenticateVendor, requireActiveVendor } from '../../middleware/auth.middleware';
import { SettingsController } from './settings.controller';

const router = Router();
const settingsController = new SettingsController();

// All routes require authentication
router.use(authenticateVendor);
router.use(requireActiveVendor);

router.put(
  '/business-hours',
  validate([
    body('businessHours').isObject().withMessage('Business hours must be an object'),
  ]),
  settingsController.updateBusinessHours
);

router.patch(
  '/online-status',
  validate([
    body('isOnline').isBoolean().withMessage('isOnline must be a boolean'),
  ]),
  settingsController.toggleOnlineStatus
);

router.put('/bank-details', settingsController.updateBankDetails);

export default router;  // ✅ Changed to default export