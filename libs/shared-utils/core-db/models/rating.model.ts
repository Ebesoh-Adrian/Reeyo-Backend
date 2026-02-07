// ============================================================================
// libs/core-db/models/rating.model.ts
// ============================================================================

export interface RatingModel {
  PK: string; // RATING#orderId
  SK: string; // REVIEW#userId
  GSI1PK: string; // VENDOR#vendorId#RATINGS or RIDER#riderId#RATINGS
  GSI1SK: string; // RATING#createdAt
  ratingId: string;
  orderId: string;
  userId: string;
  targetType: 'VENDOR' | 'RIDER';
  targetId: string;
  rating: number; // 1-5
  review?: string;
  tags?: string[]; // e.g., ["Fast", "Friendly", "Clean"]
  response?: {
    message: string;
    respondedAt: string;
    respondedBy: string;
  };
  images?: string[];
  helpful?: number; // Count of users who found this helpful
  reported?: boolean;
  createdAt: string;
  updatedAt: string;
}