import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../services/api';

interface LikeButtonProps {
  quoteId: string;
  initialLikeCount: number;
  initialIsLiked: boolean;
  onAuthRequired?: () => void;
  onLikeChange?: () => void;
}

export const LikeButton = ({ 
  quoteId, 
  initialLikeCount, 
  initialIsLiked,
  onAuthRequired,
  onLikeChange
}: LikeButtonProps) => {
  const { user } = useAuth();
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [isLoading, setIsLoading] = useState(false);

  // Sync state with props when they change (e.g., when navigating between quotes)
  useEffect(() => {
    setLikeCount(initialLikeCount);
    setIsLiked(initialIsLiked);
  }, [quoteId, initialLikeCount, initialIsLiked]);

  const handleLikeToggle = async () => {
    // Check if user is authenticated
    if (!user) {
      onAuthRequired?.();
      return;
    }

    // Updated UI state
    const newIsLiked = !isLiked;
    const newLikeCount = newIsLiked ? likeCount + 1 : likeCount - 1;
    
    setIsLiked(newIsLiked);
    setLikeCount(newLikeCount);
    setIsLoading(true);

    try {
      if (newIsLiked) {
        await apiClient.likeQuote(quoteId);
      } else {
        await apiClient.unlikeQuote(quoteId);
      }
      
      // Call the callback if provided
      if (onLikeChange) {
        onLikeChange();
      }
    } catch (error) {
      // Revert new update on error
      setIsLiked(!newIsLiked);
      setLikeCount(likeCount);
      console.error('Failed to update like:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleLikeToggle}
      disabled={isLoading}
      className="p-2 hover:bg-white/10 rounded-full transition-all duration-200 transform hover:scale-110 disabled:opacity-50 flex items-center gap-2"
      title={isLiked ? 'Unlike quote' : 'Like quote'}
      aria-label={isLiked ? 'Unlike quote' : 'Like quote'}
    >
      <svg
        className={`w-6 h-6 transition-colors duration-200`}
        fill={isLiked ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
        style={{ color: isLiked ? '#f472b6' : '#fbcfe8' }}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
      {likeCount > 0 && (
        <span className="text-sm font-medium text-pink-200">
          {likeCount}
        </span>
      )}
    </button>
  );
};
