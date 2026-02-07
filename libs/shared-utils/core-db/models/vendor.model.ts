// ============================================================================
// libs/core-db/models/vendor.model.ts
// ============================================================================

import { ServiceType, VendorStatus } from '../../constants';

export interface VendorLocation {
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  city?: string;
  region?: string;
}

export interface VendorBankDetails {
  accountName: string;
  accountNumber: string;
  bankName: string;
  bankCode?: string;
}

export interface BusinessHours {
  monday?: { open: string; close: string; closed?: boolean };
  tuesday?: { open: string; close: string; closed?: boolean };
  wednesday?: { open: string; close: string; closed?: boolean };
  thursday?: { open: string; close: string; closed?: boolean };
  friday?: { open: string; close: string; closed?: boolean };
  saturday?: { open: string; close: string; closed?: boolean };
  sunday?: { open: string; close: string; closed?: boolean };
}

export interface VendorModel {
  PK: string; // VENDOR#vendorId
  SK: string; // PROFILE
  GSI1PK: string; // VENDOR#status
  GSI1SK: string; // VENDOR#createdAt
  vendorId: string;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  passwordHash: string;
  serviceType: ServiceType;
  location: VendorLocation;
  bankDetails: VendorBankDetails;
  status: VendorStatus;
  isOnline: boolean;
  businessHours?: BusinessHours;
  logo?: string;
  coverImage?: string;
  description?: string;
  rating: number;
  totalRatings: number;
  totalOrders: number;
  commissionRate: number; // Platform commission percentage
  deliveryRadius?: number; // In kilometers
  minOrderAmount?: number; // Minimum order value
  averagePreparationTime?: number; // In minutes
  tags?: string[]; // e.g., ["Fast Food", "African", "Grill"]
  verificationDocuments?: {
    businessLicense?: string;
    taxId?: string;
  };
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectedAt?: string;
  rejectedReason?: string;
  suspendedAt?: string;
  suspendedReason?: string;
}
