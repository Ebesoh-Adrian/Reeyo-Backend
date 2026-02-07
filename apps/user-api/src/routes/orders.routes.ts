import { Router } from 'express';
import { body, param } from 'express-validator';
import { OrdersController } from './orders.controller';
import { validate } from '../../middleware/validation.middleware';
import { authenticateUser, requireVerifiedUser, requireActiveUser } from '../../middleware/auth.middleware';

const router = Router();
const ordersController = new OrdersController();

router.post('/', authenticateUser, requireVerifiedUser, requireActiveUser, validate([
  body('vendorId').notEmpty(),
  body('items').isArray({ min: 1 }),
  body('deliveryAddressId').notEmpty(),
  body('paymentMethod').isIn(['WALLET', 'MOBILE_MONEY', 'CASH']),
]), ordersController.placeOrder);

router.get('/active', authenticateUser, ordersController.getActiveOrders);
router.get('/history', authenticateUser, ordersController.getOrderHistory);
router.get('/:orderId', authenticateUser, ordersController.getOrderDetails);

router.post('/:orderId/cancel', authenticateUser, validate([
  body('reason').trim().notEmpty().isLength({ min: 10, max: 500 }),
]), ordersController.cancelOrder);

router.post('/:orderId/rate', authenticateUser, validate([
  body('rating').isInt({ min: 1, max: 5 }),
  body('review').optional().trim().isLength({ max: 1000 }),
]), ordersController.rateOrder);

export default router;
