import { Router, Request, Response } from 'express';
import { PrismaClient } from '../generated/prisma/client';
import { authenticate } from '../middleware/auth';
import { ApiResponse } from '../types';

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

export default router;
