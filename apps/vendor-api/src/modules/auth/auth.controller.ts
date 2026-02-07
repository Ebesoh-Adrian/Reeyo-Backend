// apps/vendor-api/src/modules/auth/auth.routes.ts

import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../../middleware/validation.middleware';
import { AuthController } from './auth.controller';
import { authenticateVendor } from '../../middleware/auth.middleware';

const router = Router();
const authController = new AuthController();

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new vendor
 * @access  Public
 */
router.post(
  '/register',
  validate([
    body('businessName')
      .trim()
      .notEmpty()
      .withMessage('Business name is required')
      .isLength({ min: 3, max: 100 })
      .withMessage('Business name must be between 3 and 100 characters'),
    
    body('ownerName')
      .trim()
      .notEmpty()
      .withMessage('Owner name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Owner name must be between 2 and 100 characters'),
    
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Valid email is required')
      .normalizeEmail(),
    
    body('phone')
      .trim()
      .notEmpty()
      .withMessage('Phone number is required')
      .matches(/^\+237[0-9]{9}$/)
      .withMessage('Phone must be a valid Cameroonian number (+237XXXXXXXXX)'),
    
    body('password')
      .notEmpty()
      .withMessage('Password is required')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must contain uppercase, lowercase, number, and special character'),
    
    body('serviceType')
      .notEmpty()
      .withMessage('Service type is required')
      .isIn(['FOOD', 'MART'])
      .withMessage('Service type must be FOOD or MART'),
    
    body('location.address')
      .trim()
      .notEmpty()
      .withMessage('Business address is required'),
    
    body('location.coordinates.lat')
      .isFloat({ min: -90, max: 90 })
      .withMessage('Valid latitude is required'),
    
    body('location.coordinates.lng')
      .isFloat({ min: -180, max: 180 })
      .withMessage('Valid longitude is required'),
    
    body('bankDetails.accountName')
      .trim()
      .notEmpty()
      .withMessage('Bank account name is required'),
    
    body('bankDetails.accountNumber')
      .trim()
      .notEmpty()
      .withMessage('Bank account number is required')
      .isLength({ min: 10, max: 20 })
      .withMessage('Account number must be between 10 and 20 digits'),
    
    body('bankDetails.bankName')
      .trim()
      .notEmpty()
      .withMessage('Bank name is required'),
  ]),
  authController.register
);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login vendor
 * @access  Public
 */
router.post(
  '/login',
  validate([
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Valid email is required')
      .normalizeEmail(),
    
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
  ]),
  authController.login
);

/**
 * @route   POST /api/v1/auth/refresh-token
 * @desc    Refresh access token
 * @access  Public
 */
router.post(
  '/refresh-token',
  validate([
    body('refreshToken')
      .notEmpty()
      .withMessage('Refresh token is required'),
  ]),
  authController.refreshToken
);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout vendor
 * @access  Private
 */
router.post(
  '/logout',
  authenticateVendor,
  authController.logout
);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current vendor profile
 * @access  Private
 */
router.get(
  '/me',
  authenticateVendor,
  authController.getProfile
);

/**
 * @route   POST /api/v1/auth/change-password
 * @desc    Change vendor password
 * @access  Private
 */
router.post(
  '/change-password',
  authenticateVendor,
  validate([
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    
    body('newPassword')
      .notEmpty()
      .withMessage('New password is required')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must contain uppercase, lowercase, number, and special character'),
  ]),
  authController.changePassword
);

/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
router.post(
  '/forgot-password',
  validate([
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Valid email is required')
      .normalizeEmail(),
  ]),
  authController.forgotPassword
);

export default router;