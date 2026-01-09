import { Router, Request, Response } from 'express';
import { PrismaClient } from '../generated/prisma/client';
import { authenticate, optionalAuth } from '../middleware/auth';
import { ApiResponse, PaginatedResponse } from '../types';

const router = Router();
const prisma = new PrismaClient();

// GET /api/users/profile - Get current user's profile
router.get('/profile', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        likesPrivate: true,
        createdAt: true
      }
    });

    if (!user) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'User not found'
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<typeof user> = {
      success: true,
      data: user
    };
    res.json(response);
  } catch (error) {
    console.error('Get profile error:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to fetch profile'
    };
    res.status(500).json(response);
  }
});

// PATCH /api/users/profile - Update current user's profile
router.patch('/profile', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { name, email, likesPrivate } = req.body;

    // If email is being changed, check if it's already taken by another user
    if (email !== undefined) {
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser && existingUser.id !== userId) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Email address is already in use'
        };
        return res.status(400).json(response);
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (likesPrivate !== undefined) updateData.likesPrivate = likesPrivate;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        likesPrivate: true,
        createdAt: true
      }
    });

    const response: ApiResponse<typeof updatedUser> = {
      success: true,
      data: updatedUser
    };
    res.json(response);
  } catch (error) {
    console.error('Update profile error:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to update profile'
    };
    res.status(500).json(response);
  }
});

// GET /api/users - Get all users (for discovery)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '20', search } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search as string } },
        { email: { contains: search as string } }
      ];
    }

    const total = await prisma.user.count({ where });
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        _count: {
          select: {
            likedQuotes: true,
            collections: true
          }
        }
      },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
      orderBy: { createdAt: 'desc' }
    });

    const response: PaginatedResponse<any> = {
      success: true,
      data: users.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        createdAt: u.createdAt,
        likeCount: u._count.likedQuotes,
        collectionCount: u._count.collections
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    };
    res.json(response);
  } catch (error) {
    console.error('Get users error:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to fetch users'
    };
    res.status(500).json(response);
  }
});

// GET /api/users/:id - Get public user profile by ID
router.get('/:id', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        likesPrivate: true,
        createdAt: true,
        _count: {
          select: {
            likedQuotes: true,
            collections: true
          }
        }
      }
    });

    if (!user) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'User not found'
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<any> = {
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        likeCount: user._count.likedQuotes,
        collectionCount: user._count.collections,
        likesPrivate: user.likesPrivate
      }
    };
    res.json(response);
  } catch (error) {
    console.error('Get user error:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to fetch user'
    };
    res.status(500).json(response);
  }
});

// GET /api/users/:id/likes - Get user's liked quotes (with respect to privacy options)
router.get('/:id/likes', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    const user = await prisma.user.findUnique({
      where: { id },
      select: { likesPrivate: true }
    });

    if (!user) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'User not found'
      };
      return res.status(404).json(response);
    }

    // Check privacy - only show if public, or requesting user is the owner
    const isOwner = req.user?.userId === id;
    if (user.likesPrivate && !isOwner) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'This user\'s likes are private'
      };
      return res.status(403).json(response);
    }

    const total = await prisma.quoteLike.count({
      where: { userId: id }
    });

    const likes = await prisma.quoteLike.findMany({
      where: { userId: id },
      include: {
        quote: true
      },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
      orderBy: { createdAt: 'desc' }
    });

    // Convert quotes to include tags as arrays
    const quotesWithLikes = await Promise.all(
      likes.map(async (like) => {
        const quote = like.quote;
        const likeCount = await prisma.quoteLike.count({
          where: { quoteId: quote.id }
        });

        return {
          ...quote,
          tags: quote.tags ? quote.tags.split(',') : [],
          likeCount,
          isLikedByUser: true,
          likedAt: like.createdAt
        };
      })
    );

    const response: PaginatedResponse<any> = {
      success: true,
      data: quotesWithLikes,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    };
    res.json(response);
  } catch (error) {
    console.error('Get user likes error:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to fetch liked quotes'
    };
    res.status(500).json(response);
  }
});

// GET /api/users/:id/collections - Get user's public collections
router.get('/:id/collections', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const collections = await prisma.collection.findMany({
      where: { userId: id },
      include: {
        _count: {
          select: { quotes: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    const response: ApiResponse<any[]> = {
      success: true,
      data: collections.map(c => ({
        id: c.id,
        name: c.name,
        description: c.description,
        userId: c.userId,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        quoteCount: c._count.quotes
      }))
    };
    res.json(response);
  } catch (error) {
    console.error('Get user collections error:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to fetch collections'
    };
    res.status(500).json(response);
  }
});

// GET /api/users/:id/activity - Get user's recent activity
router.get('/:id/activity', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { limit = '10' } = req.query;
    const limitNum = parseInt(limit as string, 10);

    const user = await prisma.user.findUnique({
      where: { id },
      select: { likesPrivate: true }
    });

    if (!user) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'User not found'
      };
      return res.status(404).json(response);
    }

    // Check privacy for likes
    const isOwner = req.user?.userId === id;
    const showLikes = !user.likesPrivate || isOwner;

    const activity: any[] = [];

    // Get recent likes
    if (showLikes) {
      const likes = await prisma.quoteLike.findMany({
        where: { userId: id },
        include: {
          quote: {
            select: {
              id: true,
              text: true,
              author: true
            }
          }
        },
        take: limitNum,
        orderBy: { createdAt: 'desc' }
      });

      activity.push(...likes.map(like => ({
        type: 'like',
        timestamp: like.createdAt,
        quote: like.quote
      })));
    }

    // Get recent collection updates
    const collections = await prisma.collection.findMany({
      where: { userId: id },
      select: {
        id: true,
        name: true,
        updatedAt: true
      },
      take: limitNum,
      orderBy: { updatedAt: 'desc' }
    });

    activity.push(...collections.map(col => ({
      type: 'collection_update',
      timestamp: col.updatedAt,
      collection: { id: col.id, name: col.name }
    })));

    // Sort by timestamp and limit
    activity.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    const limitedActivity = activity.slice(0, limitNum);

    const response: ApiResponse<any[]> = {
      success: true,
      data: limitedActivity
    };
    res.json(response);
  } catch (error) {
    console.error('Get user activity error:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to fetch activity'
    };
    res.status(500).json(response);
  }
});

export default router;
