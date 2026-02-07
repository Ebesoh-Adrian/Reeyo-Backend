import { Router } from 'express';
import { body } from 'express-validator';
import { AvailabilityController } from './availability.controller';
import { validate } from '../../middleware/validation.middleware';
import { authenticateRider, requireActiveRider } from '../../middleware/auth.middleware';

const router = Router();
const availabilityController = new AvailabilityController();

/**
 * @route   PATCH /api/v1/availability/status
 * @desc    Toggle online/offline status
 * @access  Private (Active Rider)
 */
router.patch(
  '/status',
  authenticateRider,
  requireActiveRider,
  validate([
    body('isOnline')
      .notEmpty()
      .withMessage('Online status is required')
      .isBoolean()
      .withMessage('Online status must be boolean'),
  ]),
  availabilityController.toggleStatus
);

/**
 * @route   POST /api/v1/availability/location
 * @desc    Update current location
 * @access  Private (Active Rider)
 */
router.post(
  '/location',
  authenticateRider,
  requireActiveRider,
  validate([
    body('latitude')
      .notEmpty()
      .withMessage('Latitude is required')
      .isFloat({ min: -90, max: 90 })
      .withMessage('Latitude must be between -90 and 90'),
    body('longitude')
      .notEmpty()
      .withMessage('Longitude is required')
      .isFloat({ min: -180, max: 180 })
      .withMessage('Longitude must be between -180 and 180'),
  ]),
  availabilityController.updateLocation
);

/**
 * @route   GET /api/v1/availability/status
 * @desc    Get availability status
 * @access  Private (Rider)
 */
router.get('/status', authenticateRider, availabilityController.getStatus);

/**
 * @route   GET /api/v1/availability/activity
 * @desc    Get daily activity summary
 * @access  Private (Rider)
 */
router.get('/activity', authenticateRider, availabilityController.getDailyActivity);

export default router;
