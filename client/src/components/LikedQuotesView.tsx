import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../services/api';
import type { Quote } from '../types';
import { LikeButton } from './LikeButton';
import { ShareButton } from './ShareButton';
import { AddToCollectionButton } from './AddToCollectionButton';

interface LikedQuotesViewProps {
  userId: string;
  userName: string;
  onClose: () => void;
  onAuthRequired?: () => void;
}

export function LikedQuotesView({ userId, userName, onClose, onAuthRequired }: LikedQuotesViewProps) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadLikedQuotes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getUserLikes(userId, { page, limit: 20 });
      
      if (response.success && response.data) {
        setQuotes(response.data);
        if (response.pagination) {
          setTotalPages(response.pagination.totalPages);
        }
      } else {
        setError(response.error || 'Failed to load liked quotes');
      }
    } catch (err) {
      console.error('Error fetching liked quotes:', err);
      setError('Failed to load liked quotes');
    } finally {
      setLoading(false);
    }
  }, [userId, page]);

  useEffect(() => {
    loadLikedQuotes();
  }, [loadLikedQuotes]);

  const handleLikeChange = () => {
    loadLikedQuotes();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            Liked Quotes - {userName}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(85vh-140px)] p-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          ) : quotes.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              No liked quotes yet
            </div>
          ) : (
            <div className="space-y-4">
              {quotes.map((quote) => (
                <div
                  key={quote.id}
                  className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <blockquote className="text-lg text-gray-800 dark:text-gray-100 mb-2 italic">
                    "{quote.text}"
                  </blockquote>
                  <p className="text-gray-600 dark:text-gray-300 font-medium mb-3">
                    - {quote.author}
                  </p>

                  {quote.category && (
                    <div className="mb-2">
                      <span className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs">
                        {quote.category}
                      </span>
                    </div>
                  )}

                  {quote.tags && Array.isArray(quote.tags) && quote.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {quote.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded text-xs"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 flex-wrap">
                    <LikeButton
                      quoteId={quote.id}
                      initialLikeCount={quote.likeCount || 0}
                      initialIsLiked={quote.isLikedByUser || false}
                      onAuthRequired={onAuthRequired || (() => {})}
                      onLikeChange={handleLikeChange}
                    />
                    <ShareButton quote={quote} />
                    <AddToCollectionButton quoteId={quote.id} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-6">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
              >
                Previous
              </button>
              <span className="text-gray-700 dark:text-gray-300">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t dark:border-gray-700 p-4">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
