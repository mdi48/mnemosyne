import { PrismaClient } from '../generated/prisma/client';

const prisma = new PrismaClient();

export type ActivityType = 'like' | 'collectionCreate' | 'collectionUpdate' | 'quoteAdd';

export interface CreateActivityParams {
  userId: string;
  activityType: ActivityType;
  quoteId?: string;
  collectionId?: string;
  metadata?: Record<string, any>;
}

export interface ActivityWithDetails {
  id: string;
  userId: string;
  userName: string;
  activityType: string;
  createdAt: Date;
  quote?: {
    id: string;
    text: string;
    author: string;
  };
  collection?: {
    id: string;
    name: string;
    description: string | null;
  };
  metadata?: any;
}

/**
 * Track a user activity
 */
export async function createActivity(params: CreateActivityParams) {
  const { userId, activityType, quoteId, collectionId, metadata } = params;

  return await prisma.activity.create({
    data: {
      userId,
      activityType,
      quoteId,
      collectionId,
      metadata: metadata ? JSON.stringify(metadata) : null
    }
  });
}

/**
 * Get user's recent activity feed with full details
 */
export async function getUserActivityFeed(userId: string, limit: number = 20): Promise<ActivityWithDetails[]> {
  const activities = await prisma.activity.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      user: {
        select: {
          username: true
        }
      }
    }
  });

  // Fetch related quote and collection data
  const enrichedActivities: ActivityWithDetails[] = [];

  for (const activity of activities) {
    const enriched: ActivityWithDetails = {
      id: activity.id,
      userId: activity.userId,
      userName: activity.user.username,
      activityType: activity.activityType,
      createdAt: activity.createdAt,
      metadata: activity.metadata ? JSON.parse(activity.metadata) : undefined
    };

    // Fetch quote if quoteId exists
    if (activity.quoteId) {
      const quote = await prisma.quote.findUnique({
        where: { id: activity.quoteId },
        select: {
          id: true,
          text: true,
          author: true
        }
      });
      if (quote) {
        enriched.quote = quote;
      }
    }

    // Fetch collection if collectionId exists
    if (activity.collectionId) {
      const collection = await prisma.collection.findUnique({
        where: { id: activity.collectionId },
        select: {
          id: true,
          name: true,
          description: true
        }
      });
      if (collection) {
        enriched.collection = collection;
      }
    }

    enrichedActivities.push(enriched);
  }

  return enrichedActivities;
}

/**
 * Get global activity feed (most recent activities from all users)
 * Useful for discovery and trending content
 */
export async function getGlobalActivityFeed(limit: number = 50): Promise<ActivityWithDetails[]> {
  const activities = await prisma.activity.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      user: {
        select: {
          username: true
        }
      }
    }
  });

  // Fetch related quote and collection data
  const enrichedActivities: ActivityWithDetails[] = [];

  for (const activity of activities) {
    const enriched: ActivityWithDetails = {
      id: activity.id,
      userId: activity.userId,
      userName: activity.user.username,
      activityType: activity.activityType,
      createdAt: activity.createdAt,
      metadata: activity.metadata ? JSON.parse(activity.metadata) : undefined
    };

    // Fetch quote if quoteId exists
    if (activity.quoteId) {
      const quote = await prisma.quote.findUnique({
        where: { id: activity.quoteId },
        select: {
          id: true,
          text: true,
          author: true
        }
      });
      if (quote) {
        enriched.quote = quote;
      }
    }

    // Fetch collection if collectionId exists
    if (activity.collectionId) {
      const collection = await prisma.collection.findUnique({
        where: { id: activity.collectionId },
        select: {
          id: true,
          name: true,
          description: true
        }
      });
      if (collection) {
        enriched.collection = collection;
      }
    }

    enrichedActivities.push(enriched);
  }

  return enrichedActivities;
}

/**
 * Delete old activities (for cleanup jobs)
 */
export async function deleteOldActivities(daysOld: number = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  return await prisma.activity.deleteMany({
    where: {
      createdAt: {
        lt: cutoffDate
      }
    }
  });
}
