// ============================================================================
// libs/core-db/models/order.model.ts
// ============================================================================

import { OrderStatus, ServiceType, PaymentMethod, PaymentStatus } from '../../constants';

export interface OrderItem {
  itemId: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
  image?: string;
}

export interface PackageDetails {
  category: string;
  weight: number;
  description: string;
  isFragile: boolean;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
}

export interface OrderLocation {
  lat: number;
  lng: number;
  address: string;
  instructions?: string;
  contactName?: string;
  contactPhone?: string;
}

export interface OrderPricing {
  subtotal?: number;
  deliveryFee: number;
  serviceFee?: number;
  discount?: number;
  tax?: number;
  total: number;
  commissionAmount?: number;
  vendorAmount?: number;
  riderAmount?: number;
}

export interface OrderTimeline {
  status: OrderStatus;
  timestamp: string;
  note?: string;
  location?: {
    lat: number;
    lng: number;
  };
}

export interface OrderRating {
  vendorRating?: {
    rating: number;
    review?: string;
    ratedAt: string;
  };
  riderRating?: {
    rating: number;
    review?: string;
    ratedAt: string;
  };
}

export interface OrderModel {
  PK: string; // ORDER#orderId
  SK: string; // METADATA
  GSI1PK: string; // USER#userId#ORDERS or SENDER#senderId#PACKAGES
  GSI1SK: string; // ORDER#createdAt
  GSI2PK: string; // VENDOR#vendorId#ORDERS or RIDER#riderId#DELIVERIES
  GSI2SK: string; // ORDER#status#createdAt
  orderId: string;
  orderNumber: string; // Human-readable order number
  orderType: ServiceType;
  userId: string;
  vendorId?: string;
  riderId?: string;
  senderId?: string; // For package orders
  recipientId?: string; // For package orders
  status: OrderStatus;
  items?: OrderItem[];
  packageDetails?: PackageDetails;
  pricing: OrderPricing;
  locations: {
    pickup: OrderLocation;
    dropoff: OrderLocation;
  };
  distance?: number; // In kilometers
  estimatedDistance?: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentReference?: string;
  timeline: OrderTimeline[];
  rating?: OrderRating;
  notes?: string;
  cancellationReason?: string;
  rejectionReason?: string;
  photos?: {
    pickup?: string[];
    delivery?: string[];
  };
  verificationCode?: string; // For delivery confirmation
  scheduledFor?: string; // For scheduled orders
  estimatedDeliveryTime?: string;
  preparationTime?: number; // In minutes
  createdAt: string;
  updatedAt: string;
  acceptedAt?: string;
  preparingAt?: string;
  readyAt?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  rejectedAt?: string;
}

