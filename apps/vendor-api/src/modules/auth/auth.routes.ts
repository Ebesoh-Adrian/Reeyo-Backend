// apps/vendor-api/src/modules/auth/auth.routes.ts
import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../../middleware/validation.middleware';
import { authenticateVendor, requireActiveVendor } from '../../middleware/auth.middleware';
import { AuthController } from './auth.controller';

const router = Router();
const authController = new AuthController();

// Public routes (no authentication)
router.post(
  '/register',
  validate([
    body('businessName').trim().notEmpty().withMessage('Business name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('phone').matches(/^\+237[0-9]{9}$/).withMessage('Valid Cameroon phone number required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])/).withMessage('Password must contain uppercase, lowercase, number, and special character'),
    body('businessType').isIn(['RESTAURANT', 'GROCERY', 'PHARMACY', 'OTHER']).withMessage('Invalid business type'),
    body('address').notEmpty().withMessage('Business address is required'),
    body('city').notEmpty().withMessage('City is required'),
  ]),
  authController.register
);

router.post(
  '/login',
  validate([
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ]),
  authController.login
);

router.post(
  '/verify-otp',
  validate([
    body('vendorId').notEmpty().withMessage('Vendor ID is required'),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  ]),
  authController.verifyOTP
);

router.post(
  '/resend-otp',
  validate([
    body('vendorId').notEmpty().withMessage('Vendor ID is required'),
  ]),
  authController.resendOTP
);

router.post(
  '/forgot-password',
  validate([
    body('email').isEmail().withMessage('Valid email is required'),
  ]),
  authController.forgotPassword
);

router.post(
  '/reset-password',
  validate([
    body('resetToken').notEmpty().withMessage('Reset token is required'),
    body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ]),
  authController.resetPassword
);

// Protected routes (authentication required)
router.use(authenticateVendor);

router.get('/me', authController.getProfile);

router.put(
  '/profile',
  requireActiveVendor,
  validate([
    body('businessName').optional().trim().notEmpty(),
    body('phone').optional().matches(/^\+237[0-9]{9}$/),
  ]),
  authController.updateProfile
);

router.post(
  '/change-password',
  requireActiveVendor,
  validate([
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
  ]),
  authController.changePassword
);

router.post('/logout', authController.logout);

export default router;