import { Router } from 'express';
import { body } from 'express-validator';
import { AuthController } from './auth.controller';
import { validate } from '../../middleware/validation.middleware';
import { authenticateRider } from '../../middleware/auth.middleware';

const router = Router();
const authController = new AuthController();

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new rider
 * @access  Public
 */
router.post(
  '/register',
  validate([
    body('firstName')
      .trim()
      .notEmpty()
      .withMessage('First name is required')
      .isLength({ min: 2, max: 50 })
      .withMessage('First name must be between 2 and 50 characters'),
    body('lastName')
      .trim()
      .notEmpty()
      .withMessage('Last name is required')
      .isLength({ min: 2, max: 50 })
      .withMessage('Last name must be between 2 and 50 characters'),
    body('phone')
      .trim()
      .notEmpty()
      .withMessage('Phone number is required')
      .matches(/^\+237[0-9]{9}$/)
      .withMessage('Invalid Cameroonian phone number format (e.g., +237670000000)'),
    body('email')
      .optional()
      .trim()
      .isEmail()
      .withMessage('Invalid email address')
      .normalizeEmail(),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/)
      .withMessage(
        'Password must contain uppercase, lowercase, number, and special character'
      ),
    body('vehicleType')
      .notEmpty()
      .withMessage('Vehicle type is required')
      .isIn(['MOTORCYCLE', 'BICYCLE', 'CAR', 'VAN'])
      .withMessage('Invalid vehicle type'),
    body('vehicleDetails.plateNumber')
      .trim()
      .notEmpty()
      .withMessage('Vehicle plate number is required')
      .isLength({ min: 2, max: 20 })
      .withMessage('Plate number must be between 2 and 20 characters'),
    body('documents.idCardUrl')
      .trim()
      .notEmpty()
      .withMessage('ID card document is required')
      .isURL()
      .withMessage('Invalid ID card URL'),
    body('documents.drivingLicenseUrl')
      .trim()
      .notEmpty()
      .withMessage('Driving license document is required')
      .isURL()
      .withMessage('Invalid driving license URL'),
    body('documents.vehicleRegistrationUrl')
      .trim()
      .notEmpty()
      .withMessage('Vehicle registration document is required')
      .isURL()
      .withMessage('Invalid vehicle registration URL'),
    body('bankDetails.accountName')
      .trim()
      .notEmpty()
      .withMessage('Bank account name is required'),
    body('bankDetails.accountNumber')
      .trim()
      .notEmpty()
      .withMessage('Bank account number is required'),
    body('bankDetails.bankName')
      .trim()
      .notEmpty()
      .withMessage('Bank name is required'),
    body('emergencyContact.name')
      .trim()
      .notEmpty()
      .withMessage('Emergency contact name is required'),
    body('emergencyContact.phone')
      .trim()
      .notEmpty()
      .withMessage('Emergency contact phone is required')
      .matches(/^\+237[0-9]{9}$/)
      .withMessage('Invalid emergency contact phone format'),
    body('emergencyContact.relationship')
      .trim()
      .notEmpty()
      .withMessage('Emergency contact relationship is required'),
  ]),
  authController.register
);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login rider
 * @access  Public
 */
router.post(
  '/login',
  validate([
    body('phone')
      .trim()
      .notEmpty()
      .withMessage('Phone number is required')
      .matches(/^\+237[0-9]{9}$/)
      .withMessage('Invalid phone number format'),
    body('password').notEmpty().withMessage('Password is required'),
  ]),
  authController.login
);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current rider profile
 * @access  Private (Rider)
 */
router.get('/me', authenticateRider, authController.getProfile);

/**
 * @route   PUT /api/v1/auth/profile
 * @desc    Update rider profile
 * @access  Private (Rider)
 */
router.put(
  '/profile',
  authenticateRider,
  validate([
    body('firstName')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('First name must be between 2 and 50 characters'),
    body('lastName')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Last name must be between 2 and 50 characters'),
    body('email')
      .optional()
      .trim()
      .isEmail()
      .withMessage('Invalid email address')
      .normalizeEmail(),
    body('profilePicture')
      .optional()
      .trim()
      .isURL()
      .withMessage('Invalid profile picture URL'),
  ]),
  authController.updateProfile
);

/**
 * @route   POST /api/v1/auth/verify-phone
 * @desc    Verify phone with OTP
 * @access  Private (Rider)
 */
router.post(
  '/verify-phone',
  authenticateRider,
  validate([
    body('otp')
      .trim()
      .notEmpty()
      .withMessage('OTP is required')
      .isLength({ min: 6, max: 6 })
      .withMessage('OTP must be 6 digits')
      .isNumeric()
      .withMessage('OTP must be numeric'),
  ]),
  authController.verifyPhone
);

/**
 * @route   POST /api/v1/auth/resend-otp
 * @desc    Resend verification OTP
 * @access  Private (Rider)
 */
router.post('/resend-otp', authenticateRider, authController.resendOTP);

/**
 * @route   POST /api/v1/auth/change-password
 * @desc    Change password
 * @access  Private (Rider)
 */
router.post(
  '/change-password',
  authenticateRider,
  validate([
    body('oldPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .notEmpty()
      .withMessage('New password is required')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/)
      .withMessage(
        'Password must contain uppercase, lowercase, number, and special character'
      ),
  ]),
  authController.changePassword
);

export default router;
