// apps/vendor-api/src/modules/settings/settings.routes.ts
import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../../middleware/validation.middleware';
import { authenticateVendor, requireActiveVendor } from '../../middleware/auth.middleware';
import { SettingsController } from './settings.controller';

const settingsRouter = Router();
const settingsController = new SettingsController();

settingsRouter.use(authenticateVendor);
settingsRouter.use(requireActiveVendor);

settingsRouter.put(
  '/business-hours',
  validate([
    body('businessHours').isObject().withMessage('Business hours must be an object'),
  ]),
  settingsController.updateBusinessHours
);

settingsRouter.patch(
  '/online-status',
  validate([
    body('isOnline').isBoolean().withMessage('isOnline must be a boolean'),
  ]),
  settingsController.toggleOnlineStatus
);

settingsRouter.put('/bank-details', settingsController.updateBankDetails);

export { settingsRouter };