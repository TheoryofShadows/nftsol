import React, { useEffect, useState } from 'react';
import { Collection } from '../types';

const API_BASE =
  (import.meta.env.VITE_API_BASE as string) ||
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001');

export default function Collections() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCollections = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE}/api/v1/collections`);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          setCollections(data.data);
        } else {
          setCollections([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load collections');
        setCollections([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCollections();
  }, []);

  if (loading) {
    return (
      <div className="glass-card p-12">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          <span className="ml-4 text-white text-lg">Loading collections...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-12 text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-red-400 mb-4">Error Loading Collections</h2>
        <p className="text-gray-300">{error}</p>
      </div>
    );
  }

  if (collections.length === 0) {
    return (
      <div className="glass-card p-12 text-center">
        <div className="text-6xl mb-4">📚</div>
        <h2 className="text-2xl font-bold gradient-text-primary mb-4">
          No Collections Yet
        </h2>
        <p className="text-gray-300 mb-6">
          Collections will appear here as NFTs are minted and organized.
        </p>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('change-tab', { detail: 'market' }))}
          className="btn-primary-modern"
        >
          🏪 Browse Marketplace
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold gradient-text font-display mb-2">
          NFT Collections
        </h1>
        <p className="text-gray-300">
          Browse {collections.length} {collections.length === 1 ? 'collection' : 'collections'} on NFTSol
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {collections.map((collection) => (
          <div
            key={collection.id}
            className="glass-card-hover group cursor-pointer transform transition-all duration-300 hover:scale-105"
            onClick={() => {
              // Navigate to collection details or filter marketplace
              window.dispatchEvent(new CustomEvent('change-tab', { detail: 'market' }));
            }}
          >
            <div className="relative overflow-hidden rounded-t-xl aspect-video">
              {collection.imageUrl ? (
                <img
                  src={collection.imageUrl}
                  alt={collection.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder-collection.png';
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-primary flex items-center justify-center text-6xl">
                  📚
                </div>
              )}
              <div className="absolute top-4 right-4 glass px-3 py-1 rounded-full">
                <span className="text-white font-bold text-sm">
                  {collection.itemCount} {collection.itemCount === 1 ? 'item' : 'items'}
                </span>
              </div>
            </div>

            <div className="p-6 space-y-3">
              <h3 className="font-bold text-white text-xl group-hover:gradient-text-primary transition-all">
                {collection.name}
              </h3>
              {collection.description && (
                <p className="text-gray-400 text-sm line-clamp-2">{collection.description}</p>
              )}
              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <span className="text-xs text-gray-500">Created</span>
                <span className="text-xs text-gray-400">
                  {new Date(collection.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

