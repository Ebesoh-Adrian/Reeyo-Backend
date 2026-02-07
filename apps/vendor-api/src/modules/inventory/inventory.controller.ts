// apps/vendor-api/src/modules/inventory/inventory.controller.ts

import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { AppError, asyncHandler } from '../../middleware/error.middleware';
import { InventoryService } from './inventory.service';

export class InventoryController {
  private inventoryService: InventoryService;

  constructor() {
    this.inventoryService = new InventoryService();
  }

  /**
   * Add new menu item
   * POST /api/v1/inventory/items
   */
  addMenuItem = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.vendor) {
      throw new AppError('Unauthorized', 401, 'AUTH_1000');
    }

    const menuItem = await this.inventoryService.addMenuItem(
      req.vendor.vendorId,
      req.body
    );

    res.status(201).json({
      success: true,
      message: 'Menu item added successfully',
      data: menuItem,
    });
  });

  /**
   * Get all menu items
   * GET /api/v1/inventory/items
   */
  getMenuItems = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.vendor) {
      throw new AppError('Unauthorized', 401, 'AUTH_1000');
    }

    const { category, available, search } = req.query;

    const items = await this.inventoryService.getMenuItems(req.vendor.vendorId, {
      category: category as string,
      available: available === 'true' ? true : available === 'false' ? false : undefined,
      search: search as string,
    });

    res.status(200).json({
      success: true,
      data: {
        items,
        total: items.length,
      },
    });
  });

  /**
   * Get single menu item
   * GET /api/v1/inventory/items/:itemId
   */
  getMenuItem = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.vendor) {
      throw new AppError('Unauthorized', 401, 'AUTH_1000');
    }

    const { itemId } = req.params;

    const item = await this.inventoryService.getMenuItem(
      req.vendor.vendorId,
      itemId
    );

    res.status(200).json({
      success: true,
      data: item,
    });
  });

  /**
   * Update menu item
   * PUT /api/v1/inventory/items/:itemId
   */
  updateMenuItem = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.vendor) {
      throw new AppError('Unauthorized', 401, 'AUTH_1000');
    }

    const { itemId } = req.params;

    const item = await this.inventoryService.updateMenuItem(
      req.vendor.vendorId,
      itemId,
      req.body
    );

    res.status(200).json({
      success: true,
      message: 'Menu item updated successfully',
      data: item,
    });
  });

  /**
   * Delete menu item
   * DELETE /api/v1/inventory/items/:itemId
   */
  deleteMenuItem = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.vendor) {
      throw new AppError('Unauthorized', 401, 'AUTH_1000');
    }

    const { itemId } = req.params;

    await this.inventoryService.deleteMenuItem(
      req.vendor.vendorId,
      itemId
    );

    res.status(200).json({
      success: true,
      message: 'Menu item deleted successfully',
    });
  });

  /**
   * Toggle item availability
   * PATCH /api/v1/inventory/items/:itemId/availability
   */
  toggleAvailability = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.vendor) {
      throw new AppError('Unauthorized', 401, 'AUTH_1000');
    }

    const { itemId } = req.params;
    const { available } = req.body;

    const item = await this.inventoryService.toggleAvailability(
      req.vendor.vendorId,
      itemId,
      available
    );

    res.status(200).json({
      success: true,
      message: `Item ${available ? 'enabled' : 'disabled'} successfully`,
      data: item,
    });
  });

  /**
   * Get all categories
   * GET /api/v1/inventory/categories
   */
  getCategories = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.vendor) {
      throw new AppError('Unauthorized', 401, 'AUTH_1000');
    }

    const categories = await this.inventoryService.getCategories(req.vendor.vendorId);

    res.status(200).json({
      success: true,
      data: {
        categories,
        total: categories.length,
      },
    });
  });

  /**
   * Bulk update availability
   * POST /api/v1/inventory/bulk-update
   */
  bulkUpdateAvailability = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.vendor) {
      throw new AppError('Unauthorized', 401, 'AUTH_1000');
    }

    const { itemIds, available } = req.body;

    await this.inventoryService.bulkUpdateAvailability(
      req.vendor.vendorId,
      itemIds,
      available
    );

    res.status(200).json({
      success: true,
      message: `${itemIds.length} items updated successfully`,
    });
  });
}