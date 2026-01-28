import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../services/api';
import type { Collection } from '../types';

interface CollectionsListViewProps {
  userId: string;
  userName: string;
  onClose: () => void;
  onCollectionClick: (collection: Collection) => void;
}

export function CollectionsListView({ userId, userName, onClose, onCollectionClick }: CollectionsListViewProps) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCollections = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getUserCollections(userId);
      
      if (response.success && response.data) {
        setCollections(response.data);
      } else {
        setError(response.error || 'Failed to load collections');
      }
    } catch (err) {
      console.error('Error fetching collections:', err);
      setError('Failed to load collections');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadCollections();
  }, [loadCollections]);

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            {userName}'s Collections
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(80vh-80px)]">
          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}

          {error && (
            <div className="p-6">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 rounded-lg p-4">
                {error}
              </div>
            </div>
          )}

          {!loading && !error && collections.length === 0 && (
            <div className="p-12 text-center">
              <p className="text-gray-600 dark:text-gray-400">No collections yet.</p>
            </div>
          )}

          {!loading && !error && collections.length > 0 && (
            <div className="p-6 space-y-3">
              {collections.map((collection) => (
                <button
                  key={collection.id}
                  onClick={() => {
                    onCollectionClick(collection);
                    onClose();
                  }}
                  className="w-full text-left p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors border dark:border-gray-600"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 dark:text-gray-100">
                        {collection.name}
                      </h3>
                      {collection.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {collection.description}
                        </p>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                        {collection.quoteCount || 0} {collection.quoteCount === 1 ? 'quote' : 'quotes'}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(collection.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
