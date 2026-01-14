import { useState, useEffect } from 'react';
import { apiClient } from '../services/api';
import type { User } from '../types';

interface FollowListProps {
  userId: string;
  type: 'followers' | 'following';
  onUserClick: (userId: string) => void;
  onClose: () => void;
}

export function FollowList({ userId, type, onUserClick, onClose }: FollowListProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = type === 'followers'
          ? await apiClient.getUserFollowers(userId)
          : await apiClient.getUserFollowing(userId);

        if (response.success && response.data) {
          setUsers(response.data);
        } else {
          setError(response.error || 'Failed to load users');
        }
      } catch (err) {
        console.error('Error fetching follow list:', err);
        setError('Failed to load users');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [userId, type]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            {type === 'followers' ? 'Followers' : 'Following'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(80vh-88px)]">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-600">{error}</div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              No {type === 'followers' ? 'followers' : 'following'} yet
            </div>
          ) : (
            <div className="divide-y dark:divide-gray-700">
              {users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => {
                    onUserClick(user.id);
                    onClose();
                  }}
                  className="w-full p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left flex items-center gap-4"
                >
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={`${user.displayName || user.username}'s avatar`}
                      className="w-12 h-12 rounded-full object-cover"
                      onError={(e) => {
                        const imgEl = e.target as HTMLImageElement;
                        imgEl.style.display = 'none';
                        const fallback = imgEl.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div
                    className="w-12 h-12 bg-linear-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-lg font-bold"
                    style={{ display: user.avatarUrl ? 'none' : 'flex' }}
                  >
                    {(user.displayName || user.username).charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800 dark:text-gray-100">
                      {user.displayName || user.username}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      @{user.username}
                    </div>
                    {user.bio && (
                      <div className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-1">
                        {user.bio}
                      </div>
                    )}
                  </div>
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
