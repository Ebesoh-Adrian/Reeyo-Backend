import { Response } from 'express';
import { AvailabilityService } from './availability.service';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { asyncHandler } from '../../middleware/error.middleware';

export class AvailabilityController {
  private availabilityService: AvailabilityService;

  constructor() {
    this.availabilityService = new AvailabilityService();
  }

  /**
   * Toggle online/offline status
   * PATCH /api/v1/availability/status
   */
  toggleStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.rider) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const { isOnline } = req.body;
    const result = await this.availabilityService.toggleOnlineStatus(
      req.rider.riderId,
      isOnline
    );

    res.status(200).json({
      success: true,
      message: `You are now ${isOnline ? 'online' : 'offline'}`,
      data: result,
    });
  });

  /**
   * Update current location
   * POST /api/v1/availability/location
   */
  updateLocation = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.rider) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const { latitude, longitude } = req.body;
    await this.availabilityService.updateLocation(req.rider.riderId, {
      latitude,
      longitude,
    });

    res.status(200).json({
      success: true,
      message: 'Location updated',
    });
  });

  /**
   * Get availability status
   * GET /api/v1/availability/status
   */
  getStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.rider) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const status = await this.availabilityService.getAvailabilityStatus(req.rider.riderId);

    res.status(200).json({
      success: true,
      data: status,
    });
  });

  /**
   * Get daily activity summary
   * GET /api/v1/availability/activity
   */
  getDailyActivity = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.rider) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const activity = await this.availabilityService.getDailyActivity(req.rider.riderId);

    res.status(200).json({
      success: true,
      data: activity,
    });
  });
}
