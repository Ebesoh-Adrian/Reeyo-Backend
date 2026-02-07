// apps/vendor-api/src/modules/inventory/inventory.service.ts

import { v4 as uuidv4 } from 'uuid';
import { VendorRepository } from '../../../../../libs/core-db/repositories/vendor.repository';
import { dynamoDB } from '../../../../../libs/core-db/client';
import { AppError } from '../../middleware/error.middleware';

interface MenuItemData {
  name: string;
  description: string;
  category: string;
  price: number;
  preparationTime: number;
  available?: boolean;
  images?: string[];
  tags?: string[];
}

export class InventoryService {
  private vendorRepo: VendorRepository;
  private readonly MAX_MENU_ITEMS = parseInt(process.env.MAX_MENU_ITEMS || '500', 10);

  constructor() {
    this.vendorRepo = new VendorRepository();
  }

  /**
   * Add menu item
   */
  async addMenuItem(vendorId: string, itemData: MenuItemData) {
    // Verify vendor exists and is active
    const vendor = await this.vendorRepo.findById(vendorId);
    if (!vendor) {
      throw new AppError('Vendor not found', 404, 'VENDOR_3000');
    }

    if (vendor.status !== 'ACTIVE' && vendor.status !== 'APPROVED') {
      throw new AppError(
        'Vendor account is not active',
        403,
        'VENDOR_3002'
      );
    }

    // Check menu item limit
    const existingItems = await this.getMenuItems(vendorId, {});
    if (existingItems.length >= this.MAX_MENU_ITEMS) {
      throw new AppError(
        `Maximum menu items limit (${this.MAX_MENU_ITEMS}) reached`,
        400,
        'INVENTORY_6003'
      );
    }

    // Create menu item
    const itemId = `item_${uuidv4()}`;
    const menuItem = {
      PK: `VENDOR#${vendorId}`,
      SK: `ITEM#${itemId}`,
      GSI1PK: `VENDOR#${vendorId}#ITEMS`,
      GSI1SK: `ITEM#${itemData.category}#${itemId}`,
      itemId,
      vendorId,
      name: itemData.name,
      description: itemData.description,
      category: itemData.category,
      price: itemData.price,
      preparationTime: itemData.preparationTime,
      available: itemData.available !== undefined ? itemData.available : true,
      images: itemData.images || [],
      tags: itemData.tags || [],
      popularity: 0,
      totalOrders: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await dynamoDB.put(menuItem);

    return menuItem;
  }

  /**
   * Get all menu items for vendor
   */
  async getMenuItems(
    vendorId: string,
    filters: {
      category?: string;
      available?: boolean;
      search?: string;
    }
  ) {
    const result = await dynamoDB.query(
      'GSI1PK = :gsi1pk',
      { ':gsi1pk': `VENDOR#${vendorId}#ITEMS` },
      { indexName: 'GSI1' }
    );

    let items = result.items;

    // Apply filters
    if (filters.category) {
      items = items.filter((item: any) => 
        item.category.toLowerCase() === filters.category?.toLowerCase()
      );
    }

    if (filters.available !== undefined) {
      items = items.filter((item: any) => item.available === filters.available);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      items = items.filter((item: any) => 
        item.name.toLowerCase().includes(searchLower) ||
        item.description.toLowerCase().includes(searchLower) ||
        item.tags?.some((tag: string) => tag.toLowerCase().includes(searchLower))
      );
    }

    return items;
  }

  /**
   * Get single menu item
   */
  async getMenuItem(vendorId: string, itemId: string) {
    const item = await dynamoDB.get({
      PK: `VENDOR#${vendorId}`,
      SK: `ITEM#${itemId}`,
    });

    if (!item) {
      throw new AppError('Menu item not found', 404, 'INVENTORY_6000');
    }

    return item;
  }

  /**
   * Update menu item
   */
  async updateMenuItem(vendorId: string, itemId: string, updates: Partial<MenuItemData>) {
    // Verify item exists
    const existingItem = await this.getMenuItem(vendorId, itemId);

    const updatedItem = await dynamoDB.update(
      {
        PK: `VENDOR#${vendorId}`,
        SK: `ITEM#${itemId}`,
      },
      {
        ...updates,
        updatedAt: new Date().toISOString(),
      }
    );

    return updatedItem;
  }

  /**
   * Delete menu item
   */
  async deleteMenuItem(vendorId: string, itemId: string) {
    // Verify item exists
    await this.getMenuItem(vendorId, itemId);

    await dynamoDB.delete({
      PK: `VENDOR#${vendorId}`,
      SK: `ITEM#${itemId}`,
    });
  }

  /**
   * Toggle item availability
   */
  async toggleAvailability(vendorId: string, itemId: string, available: boolean) {
    const item = await dynamoDB.update(
      {
        PK: `VENDOR#${vendorId}`,
        SK: `ITEM#${itemId}`,
      },
      {
        available,
        updatedAt: new Date().toISOString(),
      }
    );

    return item;
  }

  /**
   * Get all unique categories for vendor
   */
  async getCategories(vendorId: string) {
    const items = await this.getMenuItems(vendorId, {});
    
    const categoriesSet = new Set<string>();
    const categoriesWithCount: { [key: string]: number } = {};

    items.forEach((item: any) => {
      categoriesSet.add(item.category);
      categoriesWithCount[item.category] = (categoriesWithCount[item.category] || 0) + 1;
    });

    return Array.from(categoriesSet).map(category => ({
      name: category,
      itemCount: categoriesWithCount[category],
    }));
  }

  /**
   * Bulk update availability
   */
  async bulkUpdateAvailability(vendorId: string, itemIds: string[], available: boolean) {
    const updatePromises = itemIds.map(itemId =>
      this.toggleAvailability(vendorId, itemId, available)
    );

    await Promise.all(updatePromises);
  }
}