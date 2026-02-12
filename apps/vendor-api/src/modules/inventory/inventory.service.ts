// apps/vendor-api/src/modules/inventory/inventory.service.ts

import { v4 as uuidv4 } from 'uuid';
import { AppError } from '../../../../../libs/shared-utils/errors/app-error';
import { logger } from '../../../../../libs/shared-utils/logger';
import { MenuItemRepository, MenuItem } from '../../../../../libs/shared-utils/core-db/repositories/menu-item.repository';

interface AddMenuItemDTO {
  name: string;
  description: string;
  category: string;
  price: number;
  preparationTime: number;
  available?: boolean;
  images?: string[];
  tags?: string[];
}

interface MenuItemFilters {
  category?: string;
  available?: boolean;
  search?: string;
}

export class InventoryService {
  private menuItemRepo: MenuItemRepository;

  constructor() {
    this.menuItemRepo = new MenuItemRepository();
  }

  async addMenuItem(vendorId: string, data: AddMenuItemDTO): Promise<MenuItem> {
    const itemId = `item_${uuidv4()}`;

    const menuItem: MenuItem = {
      itemId,
      vendorId,
      name: data.name,
      description: data.description,
      category: data.category,
      price: data.price,
      preparationTime: data.preparationTime,
      available: data.available !== undefined ? data.available : true,
      images: data.images || [],
      tags: data.tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.menuItemRepo.create(menuItem);

    logger.info('Menu item added', { vendorId, itemId, name: data.name });

    return menuItem;
  }

  async getMenuItems(vendorId: string, filters: MenuItemFilters): Promise<MenuItem[]> {
    let items = await this.menuItemRepo.findByVendor(vendorId);

    // Apply filters
    if (filters.category) {
      items = items.filter((item) => item.category === filters.category);
    }

    if (filters.available !== undefined) {
      items = items.filter((item) => item.available === filters.available);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(searchLower) ||
          item.description.toLowerCase().includes(searchLower) ||
          item.tags.some((tag) => tag.toLowerCase().includes(searchLower))
      );
    }

    // Sort by name
    items.sort((a, b) => a.name.localeCompare(b.name));

    return items;
  }

  async getMenuItem(vendorId: string, itemId: string): Promise<MenuItem> {
    const item = await this.menuItemRepo.findById(itemId);

    if (!item) {
      throw new AppError('Menu item not found', 404, 'INVENTORY_3001');
    }

    if (item.vendorId !== vendorId) {
      throw new AppError('Access denied', 403, 'INVENTORY_3002');
    }

    return item;
  }

  async updateMenuItem(
    vendorId: string,
    itemId: string,
    updates: Partial<AddMenuItemDTO>
  ): Promise<MenuItem> {
    const item = await this.getMenuItem(vendorId, itemId);

    const updatedItem = await this.menuItemRepo.update(itemId, updates);

    logger.info('Menu item updated', { vendorId, itemId });

    return updatedItem;
  }

  async deleteMenuItem(vendorId: string, itemId: string): Promise<void> {
    const item = await this.getMenuItem(vendorId, itemId);

    await this.menuItemRepo.delete(itemId);

    logger.info('Menu item deleted', { vendorId, itemId });
  }

  async toggleAvailability(
    vendorId: string,
    itemId: string,
    available: boolean
  ): Promise<MenuItem> {
    const item = await this.getMenuItem(vendorId, itemId);

    const updatedItem = await this.menuItemRepo.update(itemId, { available });

    logger.info('Menu item availability toggled', { vendorId, itemId, available });

    return updatedItem;
  }

  async getCategories(vendorId: string): Promise<string[]> {
    const items = await this.menuItemRepo.findByVendor(vendorId);

    const categories = [...new Set(items.map((item) => item.category))];

    return categories.sort();
  }

  async bulkUpdateAvailability(
    vendorId: string,
    itemIds: string[],
    available: boolean
  ): Promise<void> {
    const updatePromises = itemIds.map(async (itemId) => {
      const item = await this.menuItemRepo.findById(itemId);
      if (item && item.vendorId === vendorId) {
        await this.menuItemRepo.update(itemId, { available });
      }
    });

    await Promise.all(updatePromises);

    logger.info('Bulk availability update', { vendorId, count: itemIds.length, available });
  }
}