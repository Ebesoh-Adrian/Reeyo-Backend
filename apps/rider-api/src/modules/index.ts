import { Router } from 'express';
import authRoutes from './auth/auth.routes';
import availabilityRoutes from '../modules/availability/availability.routes';
import ordersRoutes from '../modules/orders/orders.routes';
import earningsRoutes from '../modules/earnings/earnings.routes';
import payoutsRoutes from '../modules/payouts/payouts.routes';

const router = Router();

/**
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Reeyo Rider API is running',
    timestamp: new Date().toISOString(),
  });
});

/**
 * Module routes
 */
router.use('/auth', authRoutes);
router.use('/availability', availabilityRoutes);
router.use('/orders', ordersRoutes);
router.use('/earnings', earningsRoutes);
router.use('/payouts', payoutsRoutes);

export default router;
