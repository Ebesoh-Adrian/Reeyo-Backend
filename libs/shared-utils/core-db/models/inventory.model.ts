// ============================================================================
// libs/core-db/models/inventory.model.ts
// ============================================================================

export interface MenuItemModel {
  PK: string; // VENDOR#vendorId
  SK: string; // ITEM#itemId
  GSI1PK: string; // VENDOR#vendorId#CATEGORY#category
  GSI1SK: string; // ITEM#name
  itemId: string;
  vendorId: string;
  name: string;
  description: string;
  category: string;
  price: number;
  originalPrice?: number; // For displaying discounts
  preparationTime: number; // In minutes
  available: boolean;
  inStock: boolean;
  images: string[];
  tags?: string[];
  dietary?: {
    vegetarian?: boolean;
    vegan?: boolean;
    glutenFree?: boolean;
    spicy?: boolean;
    halal?: boolean;
  };
  nutrition?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };
  variants?: Array<{
    id: string;
    name: string;
    price: number;
  }>;
  addOns?: Array<{
    id: string;
    name: string;
    price: number;
  }>;
  popularity?: number; // Order count
  rating?: number;
  totalRatings?: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

