import { Router } from 'express';
import { EarningsController } from './earnings.controller';
import { authenticateRider } from '../../middleware/auth.middleware';

const router = Router();
const earningsController = new EarningsController();

/**
 * @route   GET /api/v1/earnings/summary
 * @desc    Get earnings summary
 * @access  Private (Rider)
 */
router.get('/summary', authenticateRider, earningsController.getSummary);

/**
 * @route   GET /api/v1/earnings/transactions
 * @desc    Get transaction history
 * @access  Private (Rider)
 */
router.get('/transactions', authenticateRider, earningsController.getTransactions);

/**
 * @route   GET /api/v1/earnings/daily
 * @desc    Get daily earnings (default: last 30 days)
 * @access  Private (Rider)
 */
router.get('/daily', authenticateRider, earningsController.getDailyEarnings);

/**
 * @route   GET /api/v1/earnings/weekly
 * @desc    Get weekly earnings (default: last 12 weeks)
 * @access  Private (Rider)
 */
router.get('/weekly', authenticateRider, earningsController.getWeeklyEarnings);

/**
 * @route   GET /api/v1/earnings/monthly
 * @desc    Get monthly earnings (default: last 12 months)
 * @access  Private (Rider)
 */
router.get('/monthly', authenticateRider, earningsController.getMonthlyEarnings);

export default router;
