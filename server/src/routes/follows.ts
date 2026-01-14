import { Router, Request, Response } from 'express';
import { PrismaClient } from '../generated/prisma/client';
import { authenticate } from '../middleware/auth';
import { ApiResponse, PaginatedResponse } from '../types';

const router = Router();
const prisma = new PrismaClient();

// POST /api/follows/:userId - Follow a user
router.post('/:userId', authenticate, async (req: Request, res: Response) => {
  try {
    const followerId = req.user!.userId;
    const followingId = req.params.userId;

    // Can't follow yourself
    if (followerId === followingId) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'You cannot follow yourself'
      };
      return res.status(400).json(response);
    }

    // Check if user to follow exists
    const userToFollow = await prisma.user.findUnique({
      where: { id: followingId }
    });

    if (!userToFollow) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'User not found'
      };
      return res.status(404).json(response);
    }

    // Check if already following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId
        }
      }
    });

    if (existingFollow) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Already following this user'
      };
      return res.status(400).json(response);
    }

    // Create follow relationship
    const follow = await prisma.follow.create({
      data: {
        followerId,
        followingId
      }
    });

    const response: ApiResponse<typeof follow> = {
      success: true,
      data: follow
    };
    res.status(201).json(response);
  } catch (error) {
    console.error('Follow user error:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to follow user'
    };
    res.status(500).json(response);
  }
});

// DELETE /api/follows/:userId - Unfollow a user
router.delete('/:userId', authenticate, async (req: Request, res: Response) => {
  try {
    const followerId = req.user!.userId;
    const followingId = req.params.userId;

    // Find the follow relationship
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId
        }
      }
    });

    if (!follow) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Not following this user'
      };
      return res.status(404).json(response);
    }

    // Delete follow relationship
    await prisma.follow.delete({
      where: {
        id: follow.id
      }
    });

    const response: ApiResponse<null> = {
      success: true,
      message: 'Successfully unfollowed user'
    };
    res.json(response);
  } catch (error) {
    console.error('Unfollow user error:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to unfollow user'
    };
    res.status(500).json(response);
  }
});

// GET /api/follows/:userId/followers - Get list of followers for a user
router.get('/:userId/followers', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    const total = await prisma.follow.count({
      where: { followingId: userId }
    });

    const followers = await prisma.follow.findMany({
      where: { followingId: userId },
      include: {
        follower: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            bio: true
          }
        }
      },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
      orderBy: { createdAt: 'desc' }
    });

    const response: PaginatedResponse<any> = {
      success: true,
      data: followers.map(f => f.follower),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    };
    res.json(response);
  } catch (error) {
    console.error('Get followers error:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to fetch followers'
    };
    res.status(500).json(response);
  }
});

// GET /api/follows/:userId/following - Get list of users this user follows
router.get('/:userId/following', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    const total = await prisma.follow.count({
      where: { followerId: userId }
    });

    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      include: {
        following: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            bio: true
          }
        }
      },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
      orderBy: { createdAt: 'desc' }
    });

    const response: PaginatedResponse<any> = {
      success: true,
      data: following.map(f => f.following),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    };
    res.json(response);
  } catch (error) {
    console.error('Get following error:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to fetch following'
    };
    res.status(500).json(response);
  }
});

// GET /api/follows/check/:userId - Check if current user follows a specific user
router.get('/check/:userId', authenticate, async (req: Request, res: Response) => {
  try {
    const followerId = req.user!.userId;
    const followingId = req.params.userId;

    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId
        }
      }
    });

    const response: ApiResponse<{ isFollowing: boolean }> = {
      success: true,
      data: {
        isFollowing: !!follow
      }
    };
    res.json(response);
  } catch (error) {
    console.error('Check follow status error:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to check follow status'
    };
    res.status(500).json(response);
  }
});

export default router;
