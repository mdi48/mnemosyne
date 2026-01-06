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
        className="px-3 py-1 text-sm bg-purple-500/30 text-purple-200 border border-purple-400/30 rounded-lg hover:bg-purple-500/40 transition-colors"
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
        className="px-3 py-1 text-sm bg-purple-500/30 text-purple-200 border border-purple-400/30 rounded-lg hover:bg-purple-500/40 transition-colors"
        title="Add to collection"
      >
        Add to Collection
      </button>

      {/* Modal */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-linear-to-br from-indigo-900 via-purple-900 to-pink-900 rounded-2xl border border-white/20 p-6 max-w-md w-full mx-4 max-h-[70vh] overflow-y-auto shadow-2xl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-white">Add to Collection</h3>
            <button
              onClick={() => {
                setShowModal(false);
                setError('');
                setSuccess('');
              }}
              className="text-white/70 hover:text-white text-2xl transition-colors"
            >
              ×
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-400/50 rounded-lg backdrop-blur text-sm">
              <span className="text-red-200">{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-500/20 border border-green-400/50 rounded-lg backdrop-blur text-sm">
              <span className="text-green-200">{success}</span>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-400 mr-3"></div>
              <span className="text-white">Loading collections...</span>
            </div>
          ) : collections.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-white/70 mb-2">You don't have any collections yet.</p>
              <p className="text-sm text-white/50">
                Create a collection from the Library view to organize your quotes.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {collections.map((collection) => (
                <button
                  key={collection.id}
                  onClick={() => handleAddToCollection(collection.id)}
                  className="w-full p-4 text-left bg-white/10 backdrop-blur border border-white/20 rounded-xl hover:bg-white/15 transition-all"
                >
                  <div className="font-medium text-white">{collection.name}</div>
                  {collection.description && (
                    <div className="text-sm text-indigo-200 mt-1">{collection.description}</div>
                  )}
                  <div className="text-xs text-pink-200 mt-1">
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
