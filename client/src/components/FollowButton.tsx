import { useState, useEffect } from 'react';
import { apiClient } from '../services/api';
import { useAuth } from '../hooks/useAuth';

interface FollowButtonProps {
  userId: string;
  initialFollowing?: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
}

export function FollowButton({ userId, initialFollowing = false, onFollowChange }: FollowButtonProps) {
  const { user, isAuthenticated } = useAuth();
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);

  // Check follow status on mount
  useEffect(() => {
    const checkFollowStatus = async () => {
      try {
        const response = await apiClient.checkFollowStatus(userId);
        if (response.success && response.data) {
          setIsFollowing(response.data.isFollowing);
        }
      } catch (error) {
        console.error('Error checking follow status:', error);
      } finally {
        setIsCheckingStatus(false);
      }
    };

    checkFollowStatus();
  }, [userId]);

  // Don't show button if viewing own profile or not authenticated
  if (!isAuthenticated || user?.id === userId) {
    return null;
  }

  const handleToggleFollow = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      if (isFollowing) {
        // Unfollow
        const response = await apiClient.unfollowUser(userId);
        if (response.success) {
          setIsFollowing(false);
          onFollowChange?.(false);
        }
      } else {
        // Follow
        const response = await apiClient.followUser(userId);
        if (response.success) {
          setIsFollowing(true);
          onFollowChange?.(true);
        }
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingStatus) {
    return (
      <button
        disabled
        className="px-4 py-2 rounded bg-gray-200 text-gray-500 cursor-not-allowed"
      >
        Loading...
      </button>
    );
  }

  return (
    <button
      onClick={handleToggleFollow}
      disabled={isLoading}
      className={`px-4 py-2 rounded font-medium transition-colors ${
        isFollowing
          ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          : 'bg-blue-500 text-white hover:bg-blue-600'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {isLoading ? 'Loading...' : isFollowing ? 'Following' : 'Follow'}
    </button>
  );
}
