import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../services/api';
import type { User } from '../types';

interface UserDiscoveryProps {
  onUserSelect: (userId: string) => void;
}

export default function UserDiscovery({ onUserSelect }: UserDiscoveryProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.getUsers({
        page,
        limit: 10,
        search: searchQuery || undefined
      });

      if (response.success && response.data) {
        setUsers(response.data);
        if (response.pagination) {
          setTotalPages(response.pagination.totalPages);
        }
      } else {
        setError(response.error || 'Failed to load users');
      }
    } catch (err) {
      console.error('Failed to load users:', err);
      setError('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  }, [page, searchQuery]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadUsers();
  };

  return (
    <div className="bg-neutral-900 rounded-lg border border-neutral-800">
      
      {/* Header with search */}
      <div className="p-6 border-b border-neutral-800">
        <h2 className="text-2xl font-bold text-white mb-4">Discover Users</h2>
        
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or email..."
            className="flex-1 bg-neutral-800 text-white px-4 py-2 rounded border border-neutral-700 focus:border-blue-500 focus:outline-none"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {/* User list */}
      <div className="divide-y divide-neutral-800">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-75"></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-150"></div>
            </div>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-400">{error}</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-white/40">
            No users found
          </div>
        ) : (
          users.map((user) => (
            <div
              key={user.id}
              className="p-4 hover:bg-neutral-800/30 transition-colors cursor-pointer"
              onClick={() => onUserSelect(user.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-white font-semibold text-lg">{user.name}</h3>
                  <p className="text-white/60 text-sm">{user.email}</p>
                  {user.createdAt && (
                    <p className="text-white/40 text-xs mt-1">
                      Joined {new Date(user.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                  )}
                </div>

                <div className="flex gap-6 text-center">
                  <div>
                    <div className="text-xl font-bold text-white">{user.likeCount || 0}</div>
                    <div className="text-white/60 text-xs">Likes</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-white">{user.collectionCount || 0}</div>
                    <div className="text-white/60 text-xs">Collections</div>
                  </div>
                </div>

                <svg 
                  className="w-5 h-5 text-white/40 ml-4" 
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
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-neutral-800 flex items-center justify-between">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 disabled:bg-neutral-800/50 disabled:cursor-not-allowed text-white rounded transition-colors"
          >
            Previous
          </button>
          
          <span className="text-white/60">
            Page {page} of {totalPages}
          </span>
          
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 disabled:bg-neutral-800/50 disabled:cursor-not-allowed text-white rounded transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
