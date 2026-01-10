import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../services/api';
import type { Activity } from '../types';

interface ActivityFeedProps {
  userId?: string; // If provided, shows that user's feed; otherwise shows global feed
  limit?: number;
}

export default function ActivityFeed({ userId, limit = 50 }: ActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadActivityFeed = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let response;
      if (userId) {
        response = await apiClient.getUserActivityFeed(userId, limit);
      } else {
        response = await apiClient.getGlobalActivityFeed(limit);
      }

      if (response.success && response.data) {
        setActivities(response.data);
      } else {
        setError(response.error || 'Failed to load activity feed');
      }
    } catch (err) {
      console.error('Error loading activity feed:', err);
      setError('Failed to load activity feed');
    } finally {
      setLoading(false);
    }
  }, [userId, limit]);

  useEffect(() => {
    loadActivityFeed();
  }, [loadActivityFeed]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
        <p>{error}</p>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <p className="text-gray-600">No activity yet. Start liking quotes and creating collections!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        {userId ? 'User Activity' : 'Recent Activity'}
      </h2>
      
      <div className="space-y-3">
        {activities.map((activity) => (
          <ActivityItem key={activity.id} activity={activity} />
        ))}
      </div>
    </div>
  );
}

interface ActivityItemProps {
  activity: Activity;
}

function ActivityItem({ activity }: ActivityItemProps) {
  const getActivityIcon = () => {
    switch (activity.activityType) {
      case 'like':
        return '❤️';
      case 'collectionCreate':
        return '📚';
      case 'collectionUpdate':
        return '✏️';
      case 'quoteAdd':
        return '💬';
      default:
        return '📌';
    }
  };

  const getActivityText = () => {
    switch (activity.activityType) {
      case 'like':
        return 'liked a quote';
      case 'collectionCreate':
        return 'created a collection';
      case 'collectionUpdate':
        return activity.quote ? 'added a quote to' : 'updated';
      case 'quoteAdd':
        return 'added a new quote';
      default:
        return 'performed an action';
    }
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const activityDate = new Date(date);
    const seconds = Math.floor((now.getTime() - activityDate.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return activityDate.toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="shrink-0 w-10 h-10 bg-linear-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl">
          {getActivityIcon()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-gray-800">{activity.userName}</span>
            <span className="text-gray-600">{getActivityText()}</span>
            {activity.collection && activity.activityType !== 'collectionCreate' && (
              <span className="font-semibold text-gray-800">{activity.collection.name}</span>
            )}
          </div>

          {/* Quote preview */}
          {activity.quote && (
            <div className="mt-2 p-3 bg-gray-50 rounded-lg border-l-4 border-blue-500">
              <p className="text-gray-800 italic">"{activity.quote.text}"</p>
              <p className="text-sm text-gray-600 mt-1">— {activity.quote.author}</p>
            </div>
          )}

          {/* Collection info (for collectionCreate) */}
          {activity.collection && activity.activityType === 'collectionCreate' && (
            <div className="mt-2 p-3 bg-purple-50 rounded-lg border-l-4 border-purple-500">
              <p className="font-semibold text-gray-800">{activity.collection.name}</p>
              {activity.collection.description && (
                <p className="text-sm text-gray-600 mt-1">{activity.collection.description}</p>
              )}
            </div>
          )}

          {/* Timestamp */}
          <div className="mt-2 text-xs text-gray-500">
            {getTimeAgo(activity.createdAt)}
          </div>
        </div>
      </div>
    </div>
  );
}
