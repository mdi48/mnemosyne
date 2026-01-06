import { useState, useEffect } from 'react';
import { apiClient } from '../services/api';
import type { Collection } from '../types';
import { CollectionView } from './CollectionView';

interface CollectionsManagerProps {
  onClose: () => void;
}

export function CollectionsManager({ onClose }: CollectionsManagerProps) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingCollection, setViewingCollection] = useState<Collection | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });

  useEffect(() => {
    loadCollections();
  }, []);

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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      const response = await apiClient.createCollection(formData);
      if (response.data) {
        setCollections([...collections, response.data]);
        setFormData({ name: '', description: '' });
        setIsCreating(false);
      }
    } catch (err) {
      setError('Failed to create collection');
      console.error(err);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId || !formData.name.trim()) return;

    try {
      const response = await apiClient.updateCollection(editingId, formData);
      if (response.data) {
        setCollections(collections.map(c => c.id === editingId ? response.data! : c));
        setEditingId(null);
        setFormData({ name: '', description: '' });
      }
    } catch (err) {
      setError('Failed to update collection');
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this collection?')) return;

    try {
      await apiClient.deleteCollection(id);
      setCollections(collections.filter(c => c.id !== id));
    } catch (err) {
      setError('Failed to delete collection');
      console.error(err);
    }
  };

  const startEdit = (collection: Collection) => {
    setEditingId(collection.id);
    setFormData({ name: collection.name, description: collection.description || '' });
    setIsCreating(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsCreating(false);
    setFormData({ name: '', description: '' });
  };

  if (loading) {
    return (
      <>
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-linear-to-br from-indigo-900 via-purple-900 to-pink-900 rounded-2xl border border-white/20 p-8 max-w-2xl w-full mx-4 shadow-2xl">
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-400 mr-4"></div>
              <span className="text-white text-lg">Loading collections...</span>
            </div>
          </div>
        </div>
        
        {viewingCollection && (
          <CollectionView
            collection={viewingCollection}
            onClose={() => setViewingCollection(null)}
          />
        )}
      </>
    );
  }

  return (
    <>
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-linear-to-br from-indigo-900 via-purple-900 to-pink-900 rounded-2xl border border-white/20 p-8 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-white">My Collections</h2>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white text-3xl transition-colors"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-400/50 rounded-lg backdrop-blur">
            <span className="text-red-200">{error}</span>
          </div>
        )}

        {/* Create/Edit Form */}
        {(isCreating || editingId) && (
          <form onSubmit={editingId ? handleUpdate : handleCreate} className="mb-6 p-4 bg-white/10 backdrop-blur rounded-xl border border-white/20">
            <h3 className="font-semibold mb-3 text-white text-lg">
              {editingId ? 'Edit Collection' : 'Create New Collection'}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-white mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent"
                  placeholder="e.g., Favorite Quotes, Motivation"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent resize-none"
                  placeholder="Optional description"
                  rows={2}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-linear-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600 text-white rounded-lg font-medium transition-all shadow-lg"
                >
                  {editingId ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/20 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Create Button */}
        {!isCreating && !editingId && (
          <button
            onClick={() => setIsCreating(true)}
            className="mb-4 px-6 py-3 bg-linear-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
          >
            + New Collection
          </button>
        )}

        {/* Collections List */}
        {collections.length === 0 ? (
          <p className="text-white/70 text-center py-8">
            No collections yet. Create your first collection to organize your quotes!
          </p>
        ) : (
          <div className="space-y-3">
            {collections.map((collection) => (
              <div
                key={collection.id}
                className="p-4 bg-white/10 backdrop-blur border border-white/20 rounded-xl hover:bg-white/15 transition-all"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-white">{collection.name}</h3>
                    {collection.description && (
                      <p className="text-indigo-200 text-sm mt-1">{collection.description}</p>
                    )}
                    <p className="text-pink-200 text-sm mt-2">
                      {collection.quoteCount || 0} quote{collection.quoteCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => setViewingCollection(collection)}
                      className="px-3 py-1 text-sm bg-blue-500/30 text-blue-200 border border-blue-400/30 rounded-lg hover:bg-blue-500/40 transition-colors"
                    >
                      View
                    </button>
                    <button
                      onClick={() => startEdit(collection)}
                      className="px-3 py-1 text-sm bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 rounded-lg hover:bg-indigo-500/40 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(collection.id)}
                      className="px-3 py-1 text-sm bg-red-500/30 text-red-200 border border-red-400/30 rounded-lg hover:bg-red-500/40 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>

    {/* Collection View Modal */}
    {viewingCollection && (
      <CollectionView
        collection={viewingCollection}
        onClose={() => setViewingCollection(null)}
      />
    )}
    </>
  );
}
