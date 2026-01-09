import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../services/api';
import type { User, Quote, Collection } from '../types';
import { useAuth } from '../hooks/useAuth';
import { LikeButton } from './LikeButton';

interface UserProfileProps {
  userId: string;
  onClose: () => void;
}

export default function UserProfile({ userId, onClose }: UserProfileProps) {
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'likes' | 'collections'>('likes');
  const [likedQuotes, setLikedQuotes] = useState<Quote[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isOwnProfile = currentUser?.id === userId;

  const loadUserData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Load user profile
      const userResponse = await apiClient.getUserById(userId);
      if (userResponse.success && userResponse.data) {
        setUser(userResponse.data);
      }

      // Load liked quotes
      try {
        const likesResponse = await apiClient.getUserLikes(userId, { limit: 20 });
        if (likesResponse.success && likesResponse.data) {
          setLikedQuotes(likesResponse.data);
        }
      } catch (err: unknown) {
        // Likes might be private
        if (err && typeof err === 'object' && 'response' in err) {
          const errorResponse = err as { response?: { status?: number } };
          if (errorResponse?.response?.status === 403) {
            setLikedQuotes([]);
          }
        }
      }

      // Load collections
      const collectionsResponse = await apiClient.getUserCollections(userId);
      if (collectionsResponse.success && collectionsResponse.data) {
        setCollections(collectionsResponse.data);
      }
    } catch (err) {
      console.error('Failed to load user data:', err);
      setError('Failed to load user profile');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-neutral-900 rounded-lg p-8 w-full max-w-4xl">
          <div className="text-center text-white/60">Loading profile...</div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-neutral-900 rounded-lg p-8 w-full max-w-4xl">
          <div className="text-center text-red-400">{error || 'User not found'}</div>
          <button
            onClick={onClose}
            className="mt-4 w-full bg-neutral-800 hover:bg-neutral-700 text-white py-2 rounded transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-neutral-900 rounded-lg w-full max-w-4xl my-8">
        {/* Header */}
        <div className="border-b border-neutral-800 p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">{user.name}</h2>
              <p className="text-white/60">{user.email}</p>
              {user.createdAt && (
                <p className="text-white/40 text-sm mt-1">
                  Joined {new Date(user.createdAt).toLocaleDateString('en-US', { 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white transition-colors"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Stats */}
          <div className="flex gap-6">
            <div>
              <div className="text-2xl font-bold text-white">{user.likeCount || 0}</div>
              <div className="text-white/60 text-sm">Likes</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{user.collectionCount || 0}</div>
              <div className="text-white/60 text-sm">Collections</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-neutral-800">
          <div className="flex">
            <button
              onClick={() => setActiveTab('likes')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'likes'
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Liked Quotes
            </button>
            <button
              onClick={() => setActiveTab('collections')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'collections'
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Collections
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {activeTab === 'likes' && (
            <div className="space-y-4">
              {likedQuotes.length === 0 ? (
                <div className="text-center text-white/40 py-8">
                  {user.likesPrivate && !isOwnProfile 
                    ? 'This user\'s likes are private' 
                    : 'No liked quotes yet'}
                </div>
              ) : (
                likedQuotes.map((quote) => (
                  <div
                    key={quote.id}
                    className="bg-neutral-800/50 rounded-lg p-4 border border-neutral-700 hover:border-neutral-600 transition-colors"
                  >
                    <p className="text-white text-lg mb-2 italic">"{quote.text}"</p>
                    <div className="flex justify-between items-center">
                      <p className="text-white/60">— {quote.author}</p>
                      <div className="flex items-center gap-2">
                        <LikeButton 
                          quoteId={quote.id}
                          initialLikeCount={quote.likeCount || 0}
                          initialIsLiked={quote.isLikedByUser || false}
                        />
                      </div>
                    </div>
                    {quote.tags && quote.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {quote.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-neutral-700/50 text-white/60 text-xs rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'collections' && (
            <div className="space-y-3">
              {collections.length === 0 ? (
                <div className="text-center text-white/40 py-8">No collections yet</div>
              ) : (
                collections.map((collection) => (
                  <div
                    key={collection.id}
                    className="bg-neutral-800/50 rounded-lg p-4 border border-neutral-700 hover:border-neutral-600 transition-colors"
                  >
                    <h3 className="text-white font-semibold text-lg">{collection.name}</h3>
                    {collection.description && (
                      <p className="text-white/60 text-sm mt-1">{collection.description}</p>
                    )}
                    <div className="flex justify-between items-center mt-3">
                      <span className="text-white/40 text-sm">
                        {collection.quoteCount || 0} quotes
                      </span>
                      <span className="text-white/40 text-sm">
                        Updated {new Date(collection.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-neutral-800 p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
