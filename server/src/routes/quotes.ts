import { Router, Request, Response } from 'express';
import { quoteService } from '../services/quoteService';
import { ApiResponse, PaginatedResponse, QuoteFilters, QuoteSortOptions } from '../types';
import { validateBody } from '../middleware/validate';
import { createQuoteSchema, updateQuoteSchema } from '../validation/quoteSchemas';
import { authenticate, optionalAuth } from '../middleware/auth';
import { PrismaClient } from '../generated/prisma/client';
import { createActivity } from '../services/activityService';

const router = Router();
const prisma = new PrismaClient();

// GET /api/quotes - Get all quotes with filtering, sorting, and pagination
router.get('/', optionalAuth, async (req: Request, res: Response) => {
  try {
    const {
      category,
      author,
      tags,
      search,
      isPublic,
      likedByMe,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = '1',
      limit = '10'
    } = req.query;

    const filters: QuoteFilters = {};
    if (category) filters.category = category as string;
    if (author) filters.author = author as string;
    if (tags) {
      filters.tags = Array.isArray(tags) 
        ? tags as string[] 
        : (tags as string).split(',');
    }
    if (search) filters.search = search as string;
    if (isPublic !== undefined) filters.isPublic = isPublic === 'true';

    const sort: QuoteSortOptions = {
      field: sortBy as QuoteSortOptions['field'],
      order: sortOrder as QuoteSortOptions['order']
    };

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    let result = await quoteService.getAllQuotes(filters, sort, pageNum, limitNum);

    // Filter by liked quotes if requested (requires authentication)
    if (likedByMe === 'true' && req.user?.userId) {
      const userId = req.user.userId;
      const likedQuoteIds = await prisma.quoteLike.findMany({
        where: { userId },
        select: { quoteId: true }
      });
      const likedIds = new Set(likedQuoteIds.map(like => like.quoteId));
      result.quotes = result.quotes.filter(quote => likedIds.has(quote.id));
      result.total = result.quotes.length;
      result.totalPages = Math.ceil(result.total / limitNum);
    }

    // Add like counts and user's like status
    const userId = req.user?.userId;
    const quotesWithLikes = await Promise.all(
      result.quotes.map(async (quote) => {
        // Get like count
        const likeCount = await prisma.quoteLike.count({
          where: { quoteId: quote.id }
        });

        // Check if current user liked this quote (if authenticated)
        let isLikedByUser = false;
        if (userId) {
          const userLike = await prisma.quoteLike.findUnique({
            where: {
              userId_quoteId: {
                userId,
                quoteId: quote.id
              }
            }
          });
          isLikedByUser = !!userLike;
        }

        return {
          ...quote,
          likeCount,
          isLikedByUser
        };
      })
    );

    const response: PaginatedResponse<any> = {
      success: true,
      data: quotesWithLikes,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: result.total,
        totalPages: result.totalPages
      }
    };

    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to fetch quotes'
    };
    res.status(500).json(response);
  }
});

// GET /api/quotes/random - Get a random quote
router.get('/random', optionalAuth, async (req: Request, res: Response) => {
  try {
    const quote = await quoteService.getRandomQuote();
    
    if (!quote) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'No quotes available'
      };
      return res.status(404).json(response);
    }

    // Add like count and user's like status
    const likeCount = await prisma.quoteLike.count({
      where: { quoteId: quote.id }
    });

    let isLikedByUser = false;
    const userId = req.user?.userId;
    if (userId) {
      const userLike = await prisma.quoteLike.findUnique({
        where: {
          userId_quoteId: {
            userId,
            quoteId: quote.id
          }
        }
      });
      isLikedByUser = !!userLike;
    }

    const response: ApiResponse<typeof quote & { likeCount: number; isLikedByUser: boolean }> = {
      success: true,
      data: {
        ...quote,
        likeCount,
        isLikedByUser
      }
    };

    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to fetch random quote'
    };
    res.status(500).json(response);
  }
});

// GET /api/quotes/feed - Get quotes from followed users
router.get('/feed', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    
    // Debug: Get current user info
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true }
    });
    console.log('[FEED] Current user:', currentUser?.username, '(ID:', userId, ')');
    
    const {
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = '1',
      limit = '10'
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Get list of users the current user is following (with public likes only)
    const following = await prisma.follow.findMany({
      where: { 
        followerId: userId,
        following: {
          likesPrivate: false
        }
      },
      select: { 
        followingId: true,
        following: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            likesPrivate: true
          }
        }
      }
    });

    const followingIds = following.map(f => f.followingId);
    
    // Debug: Show who the user is following with public likes
    const followingDetails = following.map(f => ({
      id: f.followingId,
      username: f.following.username,
      likesPrivate: f.following.likesPrivate
    }));
    console.log('[FEED] Following with public likes:', JSON.stringify(followingDetails));

    // If not following anyone with public likes, return empty feed
    if (followingIds.length === 0) {
      console.log('[FEED] Not following anyone with public likes');
      const response: PaginatedResponse<any[]> = {
        success: true,
        data: [],
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: 0,
          totalPages: 0
        }
      };
      return res.json(response);
    }

    // Get recent likes from followed users
    const recentLikes = await prisma.quoteLike.findMany({
      where: {
        userId: { in: followingIds }
      },
      orderBy: {
        createdAt: sortOrder as 'asc' | 'desc'
      },
      skip,
      take: limitNum,
      include: {
        quote: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true
          }
        }
      }
    });

    const total = await prisma.quoteLike.count({
      where: {
        userId: { in: followingIds }
      }
    });
    
    console.log('[FEED] Found likes:', recentLikes.length, 'Total:', total);
    
    // Debug: Show who actually liked the quotes
    const likeDetails = recentLikes.map(like => ({
      quoteText: like.quote.text.substring(0, 30) + '...',
      likedByUsername: like.user.username,
      likedByDisplayName: like.user.displayName,
      likedById: like.user.id
    }));
    console.log('[FEED] Likes details:', JSON.stringify(likeDetails, null, 2));

    // Transform to quote format with like info
    const quotesWithLikes = await Promise.all(
      recentLikes.map(async (like) => {
        const quote = like.quote;
        const likeCount = await prisma.quoteLike.count({
          where: { quoteId: quote.id }
        });

        const userLike = await prisma.quoteLike.findUnique({
          where: {
            userId_quoteId: {
              userId,
              quoteId: quote.id
            }
          }
        });

        return {
          id: quote.id,
          text: quote.text,
          author: quote.author,
          category: quote.category,
          tags: quote.tags ? quote.tags.split(',') : [],
          isPublic: quote.isPublic,
          createdAt: quote.createdAt.toISOString(),
          updatedAt: quote.updatedAt.toISOString(),
          userId: quote.userId,
          user: quote.user,
          likeCount,
          isLikedByUser: !!userLike,
          likedBy: like.user, // Who liked this quote (for activity context)
          likedAt: like.createdAt.toISOString() // When it was liked
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
    console.error('Error fetching feed:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to fetch feed'
    };
    res.status(500).json(response);
  }
});

// GET /api/quotes/:id - Get a specific quote by ID
router.get('/:id', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const quote = await quoteService.getQuoteById(id);

    if (!quote) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Quote not found'
      };
      return res.status(404).json(response);
    }

    // Add like count and user's like status
    const likeCount = await prisma.quoteLike.count({
      where: { quoteId: id }
    });

    let isLikedByUser = false;
    const userId = req.user?.userId;
    if (userId) {
      const userLike = await prisma.quoteLike.findUnique({
        where: {
          userId_quoteId: {
            userId,
            quoteId: id
          }
        }
      });
      isLikedByUser = !!userLike;
    }

    const response: ApiResponse<typeof quote & { likeCount: number; isLikedByUser: boolean }> = {
      success: true,
      data: {
        ...quote,
        likeCount,
        isLikedByUser
      }
    };

    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to fetch quote'
    };
    res.status(500).json(response);
  }
});

// POST /api/quotes - Create a new quote
router.post('/', authenticate, validateBody(createQuoteSchema), async (req: Request, res: Response) => {
  try {
    const { text, author, category, tags, source, isPublic } = req.body;
    const userId = req.user!.userId;

    const newQuote = await quoteService.createQuote({
      text,
      author,
      category,
      tags,
      source,
      isPublic,
      userId
    });

    const response: ApiResponse<typeof newQuote> = {
      success: true,
      data: newQuote,
      message: 'Quote created successfully'
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating quote:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create quote'
    };
    res.status(500).json(response);
  }
});

// PUT /api/quotes/:id - Update an existing quote
router.put('/:id', validateBody(updateQuoteSchema), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { text, author, category, tags, source, isPublic } = req.body;

    const updatedQuote = await quoteService.updateQuote(id, {
      text,
      author,
      category,
      tags,
      source,
      isPublic
    });

    if (!updatedQuote) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Quote not found'
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<typeof updatedQuote> = {
      success: true,
      data: updatedQuote,
      message: 'Quote updated successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error updating quote:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update quote'
    };
    res.status(500).json(response);
  }
});

// DELETE /api/quotes/:id - Delete a quote
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await quoteService.deleteQuote(id);

    if (!deleted) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Quote not found'
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<null> = {
      success: true,
      message: 'Quote deleted successfully'
    };

    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to delete quote'
    };
    res.status(500).json(response);
  }
});

// GET /api/quotes/author/:author - Get quotes by author
router.get('/author/:author', async (req: Request, res: Response) => {
  try {
    const { author } = req.params;
    const quotes = await quoteService.getQuotesByAuthor(author);

    const response: ApiResponse<typeof quotes> = {
      success: true,
      data: quotes
    };

    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to fetch quotes by author'
    };
    res.status(500).json(response);
  }
});

// GET /api/quotes/category/:category - Get quotes by category
router.get('/category/:category', async (req: Request, res: Response) => {
  try {
    const { category } = req.params;
    const quotes = await quoteService.getQuotesByCategory(category);

    const response: ApiResponse<typeof quotes> = {
      success: true,
      data: quotes
    };

    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to fetch quotes by category'
    };
    res.status(500).json(response);
  }
});

// POST /api/quotes/:id/like - Like a quote (requires authentication)
router.post('/:id/like', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    // Check if quote exists
    const quote = await prisma.quote.findUnique({ where: { id } });
    if (!quote) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Quote not found'
      };
      return res.status(404).json(response);
    }

    // Check if already liked
    const existingLike = await prisma.quoteLike.findUnique({
      where: {
        userId_quoteId: {
          userId,
          quoteId: id
        }
      }
    });

    if (existingLike) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Quote already liked'
      };
      return res.status(400).json(response);
    }

    // Create like
    const like = await prisma.quoteLike.create({
      data: {
        userId,
        quoteId: id
      }
    });

    // Track activity
    await createActivity({
      userId,
      activityType: 'like',
      quoteId: id
    });

    const response: ApiResponse<typeof like> = {
      success: true,
      data: like,
      message: 'Quote liked successfully'
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error liking quote:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to like quote'
    };
    res.status(500).json(response);
  }
});

// DELETE /api/quotes/:id/like - Unlike a quote (requires authentication)
router.delete('/:id/like', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    // Check if like exists
    const existingLike = await prisma.quoteLike.findUnique({
      where: {
        userId_quoteId: {
          userId,
          quoteId: id
        }
      }
    });

    if (!existingLike) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Quote not liked'
      };
      return res.status(404).json(response);
    }

    // Delete like
    await prisma.quoteLike.delete({
      where: {
        userId_quoteId: {
          userId,
          quoteId: id
        }
      }
    });

    const response: ApiResponse<null> = {
      success: true,
      message: 'Quote unliked successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error unliking quote:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to unlike quote'
    };
    res.status(500).json(response);
  }
});

export default router;
