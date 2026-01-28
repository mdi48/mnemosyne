import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../services/api';
import type { Quote } from '../types';
import { LikeButton } from './LikeButton';
import { ShareButton } from './ShareButton';
import { AddToCollectionButton } from './AddToCollectionButton';

interface ActivityFeedProps {
  onUserClick?: (userId: string) => void; // Callback when username is clicked
  onAuthRequired?: () => void;
}

export default function ActivityFeed({ onUserClick, onAuthRequired }: ActivityFeedProps) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadFeed = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('[ActivityFeed] Loading feed...');
      const response = await apiClient.getFeed({
        page,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });

      console.log('[ActivityFeed] Response:', response);

      if (response.success && response.data) {
        setQuotes(response.data);
        if (response.pagination) {
          setTotalPages(response.pagination.totalPages);
        }
      } else {
        console.error('[ActivityFeed] Error in response:', response.error);
        setError(response.error || 'Failed to load feed');
      }
    } catch (err) {
      console.error('[ActivityFeed] Error loading feed:', err);
      setError('Failed to load feed');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 rounded-lg p-4">
        <p>{error}</p>
      </div>
    );
  }

  if (quotes.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 text-center">
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Your feed is empty. Follow some users to see their quotes here!
        </p>
        <button
          onClick={() => onUserClick?.('discover')}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Discover Users
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
        Your Feed
      </h2>
      
      <div className="space-y-4">
        {quotes.map((quote) => (
          <QuoteCard
            key={quote.id}
            quote={quote}
            onUserClick={onUserClick}
            onAuthRequired={onAuthRequired}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-6">
          <button
            onClick={handlePreviousPage}
            disabled={page === 1}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            Previous
          </button>
          <span className="text-gray-700 dark:text-gray-300">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={handleNextPage}
            disabled={page === totalPages}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

interface QuoteCardProps {
  quote: Quote;
  onUserClick?: (userId: string) => void;
  onAuthRequired?: () => void;
}

function QuoteCard({ quote, onUserClick, onAuthRequired }: QuoteCardProps) {
  const getTimeAgo = (date: string) => {
    const now = new Date();
    const quoteDate = new Date(date);
    const seconds = Math.floor((now.getTime() - quoteDate.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return quoteDate.toLocaleDateString();
  };

  // For activity feed items, show who liked the quote
  const likedByUser = quote.likedBy;
  const activityTime = quote.likedAt || quote.createdAt;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow border dark:border-gray-700">
      {/* Activity header - who liked this */}
      {likedByUser && (
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
          <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-red-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
            {(likedByUser.displayName || likedByUser.username || 'U')[0].toUpperCase()}
          </div>
          <div className="flex-1">
            <span className="text-gray-600 dark:text-gray-300">
              <button
                onClick={() => likedByUser.id && onUserClick?.(likedByUser.id)}
                className="font-semibold text-gray-800 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {likedByUser.displayName || likedByUser.username}
              </button>
              {' liked this quote'}
            </span>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {getTimeAgo(activityTime)}
          </div>
        </div>
      )}

      {/* Quote content */}
      <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border-l-4 border-blue-500">
        <p className="text-lg text-gray-800 dark:text-gray-100 italic mb-2">
          "{quote.text}"
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          — {quote.author}
        </p>
      </div>

      {/* Category & Tags */}
      <div className="mb-4 flex flex-wrap gap-2">
        <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm">
          {quote.category}
        </span>
        {quote.tags?.map((tag) => (
          <span
            key={tag}
            className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm"
          >
            #{tag}
          </span>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <LikeButton
          quoteId={quote.id}
          initialLikeCount={quote.likeCount || 0}
          initialIsLiked={quote.isLikedByUser || false}
          onAuthRequired={onAuthRequired}
        />
        <ShareButton quote={quote} />
        <AddToCollectionButton quoteId={quote.id} onAuthRequired={onAuthRequired} />
      </div>
    </div>
  );
}
