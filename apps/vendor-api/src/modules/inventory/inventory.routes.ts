// apps/vendor-api/src/modules/inventory/inventory.routes.ts

import { Router } from 'express';
import { body, param } from 'express-validator';
import { validate } from '../../middleware/validation.middleware';
import { authenticateVendor, requireActiveVendor } from '../../middleware/auth.middleware';
import { InventoryController } from './inventory.controller';

const router = Router();
const inventoryController = new InventoryController();

// All inventory routes require authentication
router.use(authenticateVendor);
router.use(requireActiveVendor);

/**
 * POST /api/v1/inventory/items
 * Add new menu item
 */
router.post(
  '/items',
  validate([
    body('name')
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage('Name must be 3-100 characters'),
    
    body('description')
      .trim()
      .isLength({ min: 10, max: 500 })
      .withMessage('Description must be 10-500 characters'),
    
    body('category')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Category must be 2-50 characters'),
    
    body('price')
      .isFloat({ min: 100 })
      .withMessage('Price must be at least 100 XAF'),
    
    body('preparationTime')
      .isInt({ min: 1, max: 120 })
      .withMessage('Preparation time must be 1-120 minutes'),
    
    body('available')
      .optional()
      .isBoolean()
      .withMessage('Available must be a boolean'),
    
    body('images')
      .optional()
      .isArray({ max: 5 })
      .withMessage('Maximum 5 images allowed'),
    
    body('images.*')
      .optional()
      .isURL()
      .withMessage('Each image must be a valid URL'),
    
    body('tags')
      .optional()
      .isArray({ max: 10 })
      .withMessage('Maximum 10 tags allowed'),
  ]),
  inventoryController.addMenuItem
);

/**
 * GET /api/v1/inventory/items
 * Get all menu items for vendor
 */
router.get(
  '/items',
  inventoryController.getMenuItems
);

/**
 * GET /api/v1/inventory/items/:itemId
 * Get single menu item
 */
router.get(
  '/items/:itemId',
  validate([
    param('itemId')
      .notEmpty()
      .withMessage('Item ID is required'),
  ]),
  inventoryController.getMenuItem
);

/**
 * PUT /api/v1/inventory/items/:itemId
 * Update menu item
 */
router.put(
  '/items/:itemId',
  validate([
    param('itemId')
      .notEmpty()
      .withMessage('Item ID is required'),
    
    body('name')
      .optional()
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage('Name must be 3-100 characters'),
    
    body('description')
      .optional()
      .trim()
      .isLength({ min: 10, max: 500 })
      .withMessage('Description must be 10-500 characters'),
    
    body('price')
      .optional()
      .isFloat({ min: 100 })
      .withMessage('Price must be at least 100 XAF'),
    
    body('preparationTime')
      .optional()
      .isInt({ min: 1, max: 120 })
      .withMessage('Preparation time must be 1-120 minutes'),
  ]),
  inventoryController.updateMenuItem
);

/**
 * DELETE /api/v1/inventory/items/:itemId
 * Delete menu item
 */
router.delete(
  '/items/:itemId',
  validate([
    param('itemId')
      .notEmpty()
      .withMessage('Item ID is required'),
  ]),
  inventoryController.deleteMenuItem
);

/**
 * PATCH /api/v1/inventory/items/:itemId/availability
 * Toggle item availability
 */
router.patch(
  '/items/:itemId/availability',
  validate([
    param('itemId')
      .notEmpty()
      .withMessage('Item ID is required'),
    
    body('available')
      .isBoolean()
      .withMessage('Available must be a boolean'),
  ]),
  inventoryController.toggleAvailability
);

/**
 * GET /api/v1/inventory/categories
 * Get all categories for vendor
 */
router.get(
  '/categories',
  inventoryController.getCategories
);

/**
 * POST /api/v1/inventory/bulk-update
 * Bulk update item availability
 */
router.post(
  '/bulk-update',
  validate([
    body('itemIds')
      .isArray({ min: 1 })
      .withMessage('At least one item ID required'),
    
    body('available')
      .isBoolean()
      .withMessage('Available must be a boolean'),
  ]),
  inventoryController.bulkUpdateAvailability
);

export default router;

