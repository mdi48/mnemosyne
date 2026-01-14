import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../services/api';
import type { UserStats, Collection } from '../types';
import ProfileSettings from './ProfileSettings';
import { CollectionView } from './CollectionView';
import { FollowButton } from './FollowButton';
import { FollowList } from './FollowList';

interface ProfilePageProps {
  userId?: string; // If provided, shows that user's profile; otherwise shows current user
  onUserClick?: (userId: string) => void; // Callback for navigating to another user's profile
}

export default function ProfilePage({ userId, onUserClick }: ProfilePageProps) {
  const { user: currentUser } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'collections' | 'settings'>('overview');
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [followListState, setFollowListState] = useState<{ type: 'followers' | 'following'; userId: string } | null>(null);


  const isOwnProfile = !userId || userId === currentUser?.id;
  const profileUserId = userId || currentUser?.id;

  useEffect(() => {
    if (!profileUserId) {
      setLoading(false);
      return;
    }

    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiClient.getUserStats(profileUserId);
        if (response.success && response.data) {
          setStats(response.data);
        } else {
          setError(response.error || 'Failed to load profile');
        }
      } catch (err) {
        console.error('Error fetching user stats:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [profileUserId]);

  if (!currentUser && !userId) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-800">Please log in to view your profile</h2>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-red-600">{error || 'User not found'}</h2>
      </div>
    );
  }

  if (selectedCollection) {
    return (
      <div>
        <CollectionView 
          collection={selectedCollection}
          onClose={() => setSelectedCollection(null)}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Profile Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 border dark:border-gray-700">
        <div className="flex items-center gap-4">
          {stats.user.avatarUrl ? (
            <img 
              src={stats.user.avatarUrl} 
              alt={`${stats.user.displayName || stats.userName}'s avatar`}
              className="w-20 h-20 rounded-full object-cover"
              onError={(e) => {
                const imgEl = e.target as HTMLImageElement;
                imgEl.style.display = 'none';
                const fallback = imgEl.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
          ) : null}
          <div 
            className="w-20 h-20 bg-linear-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold"
            style={{ display: stats.user.avatarUrl ? 'none' : 'flex' }}
          >
            {(stats.user.displayName || stats.userName).charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
                {stats.user.displayName || stats.userName}
              </h1>
              {!isOwnProfile && <FollowButton userId={stats.userId} />}
            </div>
            {stats.user.displayName && (
              <p className="text-gray-500 dark:text-gray-400 text-sm">@{stats.userName}</p>
            )}
            {stats.user.bio && (
              <p className="text-gray-600 dark:text-gray-300 mt-2">{stats.user.bio}</p>
            )}
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {isOwnProfile ? 'Your Profile' : 'User Profile'}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      {isOwnProfile && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md mb-6 border dark:border-gray-700">
          <div className="flex border-b dark:border-gray-700">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'overview'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('collections')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'collections'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              Collections
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'settings'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              Settings
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      {activeTab === 'overview' && (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard
              label="Followers"
              value={stats.stats.followersCount}
              icon="👥"
              onClick={() => setFollowListState({ type: 'followers', userId: stats.userId })}
              clickable
            />
            <StatCard
              label="Following"
              value={stats.stats.followingCount}
              icon="➕"
              onClick={() => setFollowListState({ type: 'following', userId: stats.userId })}
              clickable
            />
            <StatCard
              label="Likes Given"
              value={stats.stats.likesGiven}
              icon="❤️"
              subtitle={stats.stats.likesGiven === null ? 'Private' : undefined}
            />
            <StatCard
              label="Collections"
              value={stats.stats.collectionsCount}
              icon="📚"
            />
          </div>

          {/* Recent Collections */}
          {stats.collections && stats.collections.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">Collections</h2>
              <div className="space-y-3">
                {stats.collections.slice(0, 5).map((collectionSummary) => (
                  <button
                    key={collectionSummary.id}
                    onClick={() => {
                      const fullCollection: Collection = {
                        id: collectionSummary.id,
                        name: collectionSummary.name,
                        description: collectionSummary.description ?? undefined,
                        userId: stats.userId,
                        createdAt: collectionSummary.createdAt,
                        updatedAt: collectionSummary.updatedAt,
                        quoteCount: collectionSummary.quotesCount
                      };
                      setSelectedCollection(fullCollection);
                    }}
                    className="w-full text-left p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 dark:text-gray-100">{collectionSummary.name}</h3>
                        {collectionSummary.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{collectionSummary.description}</p>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-sm font-medium text-blue-600">
                          {collectionSummary.quotesCount} {collectionSummary.quotesCount === 1 ? 'quote' : 'quotes'}
                        </div>
                        <div className="text-xs text-gray-500">
                          Updated {new Date(collectionSummary.updatedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              {stats.collections.length > 5 && (
                <button
                  onClick={() => setActiveTab('collections')}
                  className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
                >
                  View all {stats.collections.length} collections →
                </button>
              )}
            </div>
          )}

          {stats.collections && stats.collections.length === 0 && (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-600">No collections yet. Start collecting your favorite quotes!</p>
            </div>
          )}
        </>
      )}

      {activeTab === 'collections' && isOwnProfile && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">All Collections</h2>
          {stats.collections && stats.collections.length > 0 ? (
            <div className="space-y-3">
              {stats.collections.map((collection) => (
                <button
                  key={collection.id}
                  onClick={() => {
                    const fullCollection: Collection = {
                      id: collection.id,
                      name: collection.name,
                      description: collection.description ?? undefined,
                      userId: stats.userId,
                      createdAt: collection.createdAt,
                      updatedAt: collection.updatedAt,
                      quoteCount: collection.quotesCount
                    };
                    setSelectedCollection(fullCollection);
                  }}
                  className="w-full text-left p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 dark:text-gray-100">{collection.name}</h3>
                      {collection.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{collection.description}</p>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                        {collection.quotesCount} {collection.quotesCount === 1 ? 'quote' : 'quotes'}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Updated {new Date(collection.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-400 text-center py-8">No collections yet.</p>
          )}
        </div>
      )}

      {activeTab === 'settings' && isOwnProfile && (
        <ProfileSettings isOpen={activeTab === 'settings'} onClose={() => setActiveTab('overview')} />
      )}

      {/* Follow List Modal */}
      {followListState && onUserClick && (
        <FollowList
          userId={followListState.userId}
          type={followListState.type}
          onUserClick={onUserClick}
          onClose={() => setFollowListState(null)}
        />
      )}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number | null;
  icon: string;
  subtitle?: string;
  onClick?: () => void;
  clickable?: boolean;
}

function StatCard({ label, value, icon, subtitle, onClick, clickable }: StatCardProps) {
  const Component = clickable ? 'button' : 'div';
  
  return (
    <Component
      onClick={onClick}
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 text-center border dark:border-gray-700 ${
        clickable ? 'cursor-pointer hover:shadow-lg hover:scale-105 transition-all' : ''
      }`}
    >
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-3xl font-bold text-gray-800 dark:text-gray-100">{value ?? '-'}</div>
      <div className="text-sm text-gray-600 dark:text-gray-400">{label}</div>
      {subtitle && <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">{subtitle}</div>}
    </Component>
  );
}
