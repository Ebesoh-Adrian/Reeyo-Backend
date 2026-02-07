// ============================================================================
// libs/wallet-engine/commission.calculator.ts
// ============================================================================

import { ServiceType, PlatformConstants } from '../shared-utils';

export interface CommissionConfig {
  foodCommissionRate: number;
  martCommissionRate: number;
  packagePlatformFee: number;
  deliveryFee: number;
}

export interface OrderPricing {
  subtotal?: number;
  deliveryFee: number;
  total: number;
  distance?: number;
}

export interface CommissionSplit {
  total: number;
  adminCut: number;
  vendorShare: number;
  riderFee: number;
  breakdown: {
    subtotal?: number;
    commissionRate?: string;
    deliveryFee: number;
    distance?: number;
  };
}

export class CommissionCalculator {
  private config: CommissionConfig;

  constructor(config?: Partial<CommissionConfig>) {
    this.config = {
      foodCommissionRate: config?.foodCommissionRate || PlatformConstants.DEFAULT_FOOD_COMMISSION,
      martCommissionRate: config?.martCommissionRate || PlatformConstants.DEFAULT_MART_COMMISSION,
      packagePlatformFee: config?.packagePlatformFee || PlatformConstants.DEFAULT_PACKAGE_PLATFORM_FEE,
      deliveryFee: config?.deliveryFee || PlatformConstants.BASE_DELIVERY_FEE,
    };
  }

  /**
   * Calculate commission split for completed order
   */
  calculateSplit(orderType: ServiceType, pricing: OrderPricing): CommissionSplit {
    switch (orderType) {
      case ServiceType.FOOD:
        return this.calculateFoodMartSplit(pricing, this.config.foodCommissionRate);
      case ServiceType.MART:
        return this.calculateFoodMartSplit(pricing, this.config.martCommissionRate);
      case ServiceType.PACKAGE:
        return this.calculatePackageSplit(pricing);
      default:
        throw new Error(`Unsupported order type: ${orderType}`);
    }
  }

  /**
   * Calculate split for Food/Mart orders
   */
  private calculateFoodMartSplit(pricing: OrderPricing, commissionRate: number): CommissionSplit {
    const { subtotal = 0, deliveryFee, total } = pricing;

    // Admin commission on subtotal only
    const adminCut = Math.round((subtotal * commissionRate) / 100);
    const vendorShare = subtotal - adminCut;
    const riderFee = deliveryFee;

    // Validation
    const calculatedTotal = vendorShare + adminCut + riderFee;
    if (Math.abs(calculatedTotal - total) > 1) { // Allow 1 XAF rounding difference
      throw new Error(`Split calculation mismatch: ${calculatedTotal} vs ${total}`);
    }

    return {
      total,
      adminCut,
      vendorShare,
      riderFee,
      breakdown: {
        subtotal,
        commissionRate: `${commissionRate}%`,
        deliveryFee,
      },
    };
  }

  /**
   * Calculate split for Package orders
   */
  private calculatePackageSplit(pricing: OrderPricing): CommissionSplit {
    const { total, distance = 0 } = pricing;

    // Platform takes 20%, rider gets 80%
    const adminCut = Math.round(total * (this.config.packagePlatformFee / 100));
    const riderFee = total - adminCut;

    return {
      total,
      adminCut,
      vendorShare: 0, // No vendor for packages
      riderFee,
      breakdown: {
        deliveryFee: total,
        distance,
      },
    };
  }

  /**
   * Calculate package pricing based on distance and weight
   */
  calculatePackagePricing(distanceKm: number, weight: number, isFragile: boolean): OrderPricing {
    const baseFee = PlatformConstants.PACKAGE_BASE_FEE;
    const distanceFee = Math.round(distanceKm * PlatformConstants.PACKAGE_FEE_PER_KM);
    const fragileSurcharge = isFragile ? 1000 : 0;
    const weightSurcharge = weight > 10 ? Math.round((weight - 10) * 200) : 0;

    const total = baseFee + distanceFee + fragileSurcharge + weightSurcharge;

    return {
      deliveryFee: total,
      total,
      distance: distanceKm,
    };
  }

  /**
   * Validate withdrawal amount
   */
  validateWithdrawal(amount: number, entityType: 'VENDOR' | 'RIDER'): {
    isValid: boolean;
    minThreshold: number;
    message: string;
  } {
    const minThreshold = PlatformConstants.MIN_PAYOUT_AMOUNT;
    const isValid = amount >= minThreshold;

    return {
      isValid,
      minThreshold,
      message: isValid
        ? 'Withdrawal amount is valid'
        : `Minimum withdrawal is ${minThreshold} XAF`,
    };
  }
}