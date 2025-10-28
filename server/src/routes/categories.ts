import { Router, Request, Response } from 'express';
import { categories } from '../data/sampleData';
import { ApiResponse } from '../types';

const router = Router();

// GET /api/categories - Get all categories
router.get('/', (req: Request, res: Response) => {
  try {
    const response: ApiResponse<typeof categories> = {
      success: true,
      data: categories
    };

    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to fetch categories'
    };
    res.status(500).json(response);
  }
});

// GET /api/categories/:id - Get a specific category by ID
router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const category = categories.find(cat => cat.id === id);

    if (!category) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Category not found'
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<typeof category> = {
      success: true,
      data: category
    };

    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to fetch category'
    };
    res.status(500).json(response);
  }
});

export default router;
