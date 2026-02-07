import { Router } from 'express';
import { body, param } from 'express-validator';
import { AuthController } from './auth.controller';
import { validate } from '../../middleware/validation.middleware';
import { authenticateUser } from '../../middleware/auth.middleware';

const router = Router();
const authController = new AuthController();

// Register
router.post('/register', validate([
  body('firstName').trim().notEmpty().isLength({ min: 2, max: 50 }),
  body('lastName').trim().notEmpty().isLength({ min: 2, max: 50 }),
  body('phone').trim().matches(/^\+237[0-9]{9}$/),
  body('email').optional().isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])/),
]), authController.register);

// Login
router.post('/login', validate([
  body('phone').trim().matches(/^\+237[0-9]{9}$/),
  body('password').notEmpty(),
]), authController.login);

// Get profile
router.get('/me', authenticateUser, authController.getProfile);

// Update profile
router.put('/profile', authenticateUser, validate([
  body('firstName').optional().trim().isLength({ min: 2, max: 50 }),
  body('lastName').optional().trim().isLength({ min: 2, max: 50 }),
  body('email').optional().isEmail().normalizeEmail(),
]), authController.updateProfile);

// Verify phone
router.post('/verify-phone', authenticateUser, validate([
  body('otp').isLength({ min: 6, max: 6 }).isNumeric(),
]), authController.verifyPhone);

// Resend OTP
router.post('/resend-otp', authenticateUser, authController.resendOTP);

// Change password
router.post('/change-password', authenticateUser, validate([
  body('oldPassword').notEmpty(),
  body('newPassword').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])/),
]), authController.changePassword);

// Address management
router.post('/addresses', authenticateUser, validate([
  body('label').trim().notEmpty(),
  body('address').trim().notEmpty(),
  body('city').trim().notEmpty(),
  body('coordinates.lat').isFloat({ min: -90, max: 90 }),
  body('coordinates.lng').isFloat({ min: -180, max: 180 }),
]), authController.addAddress);

router.put('/addresses/:addressId', authenticateUser, authController.updateAddress);
router.delete('/addresses/:addressId', authenticateUser, authController.deleteAddress);

export default router;
