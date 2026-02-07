// libs/shared-utils/validators/schemas.ts

import Joi from 'joi';
import { ServiceType, VehicleType, PackageCategory } from '../constants';

/**
 * Common validation patterns
 */
export const commonPatterns = {
  phone: /^\+237[0-9]{9}$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
};

/**
 * Coordinates Schema
 */
export const coordinatesSchema = Joi.object({
  lat: Joi.number().min(-90).max(90).required().messages({
    'number.base': 'Latitude must be a number',
    'number.min': 'Latitude must be between -90 and 90',
    'number.max': 'Latitude must be between -90 and 90',
    'any.required': 'Latitude is required',
  }),
  lng: Joi.number().min(-180).max(180).required().messages({
    'number.base': 'Longitude must be a number',
    'number.min': 'Longitude must be between -180 and 180',
    'number.max': 'Longitude must be between -180 and 180',
    'any.required': 'Longitude is required',
  }),
});

/**
 * Address Schema
 */
export const addressSchema = Joi.object({
  fullAddress: Joi.string().trim().min(10).max(200).required(),
  coordinates: coordinatesSchema.required(),
  instructions: Joi.string().trim().max(500).optional(),
  label: Joi.string().trim().max(50).optional(),
});

/**
 * Bank Details Schema
 */
export const bankDetailsSchema = Joi.object({
  accountName: Joi.string().trim().min(3).max(100).required(),
  accountNumber: Joi.string().trim().min(10).max(20).required(),
  bankName: Joi.string().trim().min(3).max(100).required(),
});

/**
 * Business Hours Schema
 */
export const businessHoursSchema = Joi.object({
  monday: Joi.object({
    open: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required(),
    close: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required(),
  }).optional(),
  tuesday: Joi.object({
    open: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required(),
    close: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required(),
  }).optional(),
  wednesday: Joi.object({
    open: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required(),
    close: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required(),
  }).optional(),
  thursday: Joi.object({
    open: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required(),
    close: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required(),
  }).optional(),
  friday: Joi.object({
    open: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required(),
    close: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required(),
  }).optional(),
  saturday: Joi.object({
    open: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required(),
    close: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required(),
  }).optional(),
  sunday: Joi.object({
    open: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required(),
    close: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required(),
  }).optional(),
});

/**
 * Vendor Registration Schema
 */
export const vendorRegistrationSchema = Joi.object({
  businessName: Joi.string().trim().min(3).max(100).required(),
  ownerName: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().trim().email().required(),
  phone: Joi.string().pattern(commonPatterns.phone).required(),
  password: Joi.string().min(8).pattern(commonPatterns.password).required(),
  serviceType: Joi.string()
    .valid(...Object.values(ServiceType))
    .required(),
  location: Joi.object({
    address: Joi.string().trim().min(10).max(200).required(),
    coordinates: coordinatesSchema.required(),
  }).required(),
  bankDetails: bankDetailsSchema.required(),
  businessHours: businessHoursSchema.optional(),
});

/**
 * Rider Registration Schema
 */
export const riderRegistrationSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().trim().email().required(),
  phone: Joi.string().pattern(commonPatterns.phone).required(),
  password: Joi.string().min(8).pattern(commonPatterns.password).required(),
  vehicleType: Joi.string()
    .valid(...Object.values(VehicleType))
    .required(),
  vehicleDetails: Joi.object({
    make: Joi.string().trim().min(2).max(50).required(),
    model: Joi.string().trim().max(50).required(),
    plateNumber: Joi.string().trim().min(5).max(20).required(),
    color: Joi.string().trim().max(30).required(),
  }).required(),
  bankDetails: bankDetailsSchema.required(),
  documents: Joi.object({
    nationalId: Joi.string().required(),
    driverLicense: Joi.string().required(),
  }).required(),
});

/**
 * Menu Item Schema
 */
export const menuItemSchema = Joi.object({
  name: Joi.string().trim().min(3).max(100).required(),
  description: Joi.string().trim().max(500).required(),
  category: Joi.string().trim().max(50).required(),
  price: Joi.number().positive().required(),
  preparationTime: Joi.number().integer().min(1).max(120).required(),
  available: Joi.boolean().default(true),
  images: Joi.array().items(Joi.string().uri()).max(5).optional(),
  tags: Joi.array().items(Joi.string().trim().max(30)).max(10).optional(),
});

/**
 * Order Item Schema
 */
export const orderItemSchema = Joi.object({
  itemId: Joi.string().required(),
  name: Joi.string().required(),
  quantity: Joi.number().integer().positive().required(),
  price: Joi.number().positive().required(),
  notes: Joi.string().trim().max(200).optional(),
});

/**
 * Food Order Schema
 */
export const foodOrderSchema = Joi.object({
  orderType: Joi.string().valid('FOOD', 'MART').required(),
  vendorId: Joi.string().required(),
  items: Joi.array().items(orderItemSchema).min(1).max(50).required(),
  deliveryAddress: addressSchema.required(),
  paymentMethod: Joi.string().valid('WALLET', 'CAMPAY', 'CARD', 'CASH').required(),
  notes: Joi.string().trim().max(500).optional(),
});

/**
 * Package Order Schema
 */
export const packageOrderSchema = Joi.object({
  orderType: Joi.string().valid('PACKAGE').required(),
  packageDetails: Joi.object({
    category: Joi.string()
      .valid(...Object.values(PackageCategory))
      .required(),
    weight: Joi.number().positive().max(50).required(),
    description: Joi.string().trim().min(10).max(500).required(),
    isFragile: Joi.boolean().default(false),
  }).required(),
  pickupAddress: addressSchema.extend({
    contactName: Joi.string().trim().min(2).max(100).required(),
    contactPhone: Joi.string().pattern(commonPatterns.phone).required(),
  }).required(),
  deliveryAddress: addressSchema.extend({
    contactName: Joi.string().trim().min(2).max(100).required(),
    contactPhone: Joi.string().pattern(commonPatterns.phone).required(),
  }).required(),
  paymentMethod: Joi.string().valid('WALLET', 'CAMPAY', 'CARD', 'CASH').required(),
});

/**
 * Payout Request Schema
 */
export const payoutRequestSchema = Joi.object({
  amount: Joi.number().positive().min(50000).required(),
  bankDetails: bankDetailsSchema.required(),
});

/**
 * Location Update Schema
 */
export const locationUpdateSchema = Joi.object({
  lat: Joi.number().min(-90).max(90).required(),
  lng: Joi.number().min(-180).max(180).required(),
  orderId: Joi.string().optional(),
});