// ============================================================================
// libs/socket-server/types.ts
// ============================================================================

export interface SocketUser {
  userId: string;
  email: string;
  userType: 'USER' | 'VENDOR' | 'RIDER';
}

export interface LocationUpdate {
  lat: number;
  lng: number;
  accuracy?: number;
  heading?: number;
  speed?: number;
  orderId?: string;
}

export interface OrderEvent {
  orderId: string;
  status: string;
  timestamp: string;
  data?: any;
}

export interface DeliveryRequest {
  orderId: string;
  pickupLocation: {
    lat: number;
    lng: number;
    address: string;
  };
  dropoffLocation: {
    lat: number;
    lng: number;
    address: string;
  };
  deliveryFee: number;
  distance: number;
  orderType: string;
  estimatedTime?: number;
}

