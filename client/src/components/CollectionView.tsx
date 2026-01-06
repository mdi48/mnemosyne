import { useState, useEffect } from 'react';
import { apiClient } from '../services/api';
import type { Quote, Collection } from '../types';
import { LikeButton } from './LikeButton';

interface CollectionViewProps {
  collection: Collection;
  onClose: () => void;
  onAuthRequired?: () => void;
}

export function CollectionView({ collection, onClose, onAuthRequired }: CollectionViewProps) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadQuotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collection.id]);

  const loadQuotes = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getCollectionQuotes(collection.id);
      if (response.data) {
        setQuotes(response.data);
      }
    } catch (err) {
      setError('Failed to load collection quotes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveQuote = async (quoteId: string) => {
    if (!confirm('Remove this quote from the collection?')) return;

    try {
      await apiClient.removeQuoteFromCollection(collection.id, quoteId);
      setQuotes(quotes.filter(q => q.id !== quoteId));
      setSuccessMessage('Quote removed from collection');
      setTimeout(() => setSuccessMessage(''), 2000);
    } catch (err) {
      setError('Failed to remove quote');
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-60 p-4">
      <div className="bg-linear-to-br from-indigo-900 via-purple-900 to-pink-900 rounded-2xl border border-white/20 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-linear-to-r from-purple-900/95 to-indigo-900/95 backdrop-blur-lg border-b border-white/20 p-6 z-10">
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-white">{collection.name}</h2>
              {collection.description && (
                <p className="text-indigo-200 mt-1">{collection.description}</p>
              )}
              <p className="text-pink-200 text-sm mt-2">
                {quotes.length} quote{quotes.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white text-3xl ml-4 transition-colors"
            >
              ×
            </button>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-500/20 border border-red-400/50 rounded-lg backdrop-blur text-sm">
              <span className="text-red-200">{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="mt-4 p-3 bg-green-500/20 border border-green-400/50 rounded-lg backdrop-blur text-sm">
              <span className="text-green-200">{successMessage}</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-400 mr-4"></div>
              <span className="text-white text-lg">Loading quotes...</span>
            </div>
          ) : quotes.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-white/30 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <p className="text-white/70 mb-2 text-lg">This collection is empty</p>
              <p className="text-white/50 text-sm">
                Add quotes to this collection from your library
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quotes.map((quote) => (
                <div
                  key={quote.id}
                  className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-5 hover:bg-white/15 transition-all duration-300"
                >
                  <blockquote className="text-white text-base leading-relaxed mb-3 italic">
                    "{quote.text}"
                  </blockquote>
                  
                  <div className="text-pink-200 font-medium mb-2">
                    — {quote.author}
                  </div>
                  
                  {quote.source && (
                    <div className="text-white/60 text-sm italic mb-3">
                      {quote.source}
                    </div>
                  )}
                  
                  {quote.category && (
                    <div className="mb-2">
                      <span className="inline-block px-3 py-1 bg-indigo-500/30 text-indigo-200 rounded-full text-xs font-medium backdrop-blur border border-indigo-400/30">
                        {quote.category}
                      </span>
                    </div>
                  )}
                  
                  {quote.tags && Array.isArray(quote.tags) && quote.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {quote.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-purple-500/20 text-purple-200 rounded text-xs border border-purple-400/30"
                        >
                          #{tag}
                        </span>
                      ))}
                      {quote.tags.length > 3 && (
                        <span className="text-white/50 text-xs px-2 py-1">
                          +{quote.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between pt-3 border-t border-white/10">
                    <div className="flex gap-2">
                      <LikeButton
                        quoteId={quote.id}
                        initialLikeCount={quote.likeCount || 0}
                        initialIsLiked={quote.isLikedByUser || false}
                        onAuthRequired={onAuthRequired || (() => {})}
                      />
                      <button
                        onClick={() => {
                          const text = `"${quote.text}" - ${quote.author}`;
                          navigator.clipboard.writeText(text);
                          setSuccessMessage('Quote copied to clipboard!');
                          setTimeout(() => setSuccessMessage(''), 2000);
                        }}
                        className="p-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg transition-colors"
                        title="Copy quote"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                    <button
                      onClick={() => handleRemoveQuote(quote.id)}
                      className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors"
                      title="Remove from collection"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-linear-to-r from-purple-900/95 to-indigo-900/95 backdrop-blur-lg border-t border-white/20 p-4">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-linear-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
