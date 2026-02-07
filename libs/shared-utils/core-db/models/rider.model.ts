// ============================================================================
// libs/core-db/models/rider.model.ts
// ============================================================================

import { RiderStatus, RiderAvailability, VehicleType } from '../../constants';

export interface BankDetails {
  accountHolder: string;
  accountNumber: string;
  bankName: string;
  bankCode?: string;
}

export interface VehicleDetails {
  make: string;
  model: string;
  plateNumber: string;
  color: string;
  year?: number;
}

export interface RiderDocuments {
  nationalId: string;
  driverLicense: string;
  vehicleRegistration?: string;
  insurance?: string;
}

export interface RiderStats {
  totalDeliveries: number;
  completionRate: number; // Percentage
  rating: number;
  totalRatings: number;
  activeDeliveries: number;
  onTimeDeliveryRate?: number;
  averageDeliveryTime?: number; // In minutes
}

export interface RiderLocation {
  lat: number;
  lng: number;
  accuracy?: number;
  heading?: number;
  speed?: number;
  updatedAt: string;
}

export interface RiderModel {
  PK: string; // RIDER#riderId
  SK: string; // PROFILE
  GSI1PK: string; // RIDER#status#availability
  GSI1SK: string; // LOCATION#geohash
  riderId: string;
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  vehicleType: VehicleType;
  vehicleDetails: VehicleDetails;
  bankDetails: BankDetails;
  documents: RiderDocuments;
  status: RiderStatus;
  availability: RiderAvailability;
  currentLocation?: RiderLocation;
  homeLocation?: {
    lat: number;
    lng: number;
    address: string;
  };
  stats: RiderStats;
  profileImage?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  deviceToken?: string;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectedAt?: string;
  rejectedReason?: string;
  suspendedAt?: string;
  suspendedReason?: string;
  lastActiveAt?: string;
}
