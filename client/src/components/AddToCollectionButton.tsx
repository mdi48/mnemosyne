import { useState, useEffect } from 'react';
import { apiClient } from '../services/api';
import type { Collection } from '../types';

interface AddToCollectionButtonProps {
  quoteId: string;
}

export function AddToCollectionButton({ quoteId }: AddToCollectionButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (showModal) {
      loadCollections();
    }
  }, [showModal]);

  const loadCollections = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getCollections();
      if (response.data) {
        setCollections(response.data);
      }
    } catch (err) {
      setError('Failed to load collections');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCollection = async (collectionId: string) => {
    try {
      setError('');
      setSuccess('');
      await apiClient.addQuoteToCollection(collectionId, quoteId);
      setSuccess('Added to collection!');
      
      // Update the quote count for the collection
      setCollections(collections.map(c => 
        c.id === collectionId 
          ? { ...c, quoteCount: (c.quoteCount || 0) + 1 }
          : c
      ));
      
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      const error = err as Error;
      if (error.message?.includes('already in collection')) {
        setError('Quote is already in this collection');
      } else {
        setError('Failed to add quote to collection');
      }
      console.error(err);
    }
  };

  if (!showModal) {
    return (
      <button
        onClick={() => setShowModal(true)}
        className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
        title="Add to collection" // Replace the text below with an SVG icon later perhaps.
      >
        Add to Collection
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
        title="Add to collection"
      >
        Add to Collection
      </button>

      {/* Modal */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[70vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">Add to Collection</h3>
            <button
              onClick={() => {
                setShowModal(false);
                setError('');
                setSuccess('');
              }}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-100 text-green-700 rounded text-sm">
              {success}
            </div>
          )}

          {loading ? (
            <p className="text-center py-4">Loading collections...</p>
          ) : collections.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-gray-600 mb-4">You don't have any collections yet.</p>
              <p className="text-sm text-gray-500">
                Create a collection from the Library view to organize your quotes.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {collections.map((collection) => (
                <button
                  key={collection.id}
                  onClick={() => handleAddToCollection(collection.id)}
                  className="w-full p-3 text-left border border-gray-200 rounded hover:bg-gray-50 transition-colors"
                >
                  <div className="font-medium">{collection.name}</div>
                  {collection.description && (
                    <div className="text-sm text-gray-600 mt-1">{collection.description}</div>
                  )}
                  <div className="text-xs text-gray-500 mt-1">
                    {collection.quoteCount || 0} quote{collection.quoteCount !== 1 ? 's' : ''}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
