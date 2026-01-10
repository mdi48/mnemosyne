import { Router, Request, Response } from 'express';
import { authenticate, optionalAuth } from '../middleware/auth';
import { ApiResponse } from '../types';
import { getUserActivityFeed, getGlobalActivityFeed, ActivityWithDetails } from '../services/activityService';

const router = Router();

// GET /api/activity/feed - Get global activity feed (public)
router.get('/feed', optionalAuth, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const maxLimit = 100;
    const safeLimit = Math.min(limit, maxLimit);

    const activities = await getGlobalActivityFeed(safeLimit);

    const response: ApiResponse<ActivityWithDetails[]> = {
      success: true,
      data: activities
    };
    res.json(response);
  } catch (error) {
    console.error('Get global activity feed error:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to fetch activity feed'
    };
    res.status(500).json(response);
  }
});

// GET /api/activity/user/:userId - Get user's activity feed
router.get('/user/:userId', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;
    const maxLimit = 100;
    const safeLimit = Math.min(limit, maxLimit);

    const activities = await getUserActivityFeed(userId, safeLimit);

    const response: ApiResponse<ActivityWithDetails[]> = {
      success: true,
      data: activities
    };
    res.json(response);
  } catch (error) {
    console.error('Get user activity feed error:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to fetch user activity'
    };
    res.status(500).json(response);
  }
});

// GET /api/activity/me - Get current user's activity feed
router.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const limit = parseInt(req.query.limit as string) || 20;
    const maxLimit = 100;
    const safeLimit = Math.min(limit, maxLimit);

    const activities = await getUserActivityFeed(userId, safeLimit);

    const response: ApiResponse<ActivityWithDetails[]> = {
      success: true,
      data: activities
    };
    res.json(response);
  } catch (error) {
    console.error('Get my activity feed error:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to fetch your activity'
    };
    res.status(500).json(response);
  }
});

export default router;
