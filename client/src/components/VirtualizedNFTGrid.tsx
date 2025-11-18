/**
 * Virtualized NFT Grid Component
 * Renders large lists efficiently using windowing technique
 */

import React, { memo, useCallback } from 'react';
import { VariableSizeList as List } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import { NFT } from '@/types';

interface VirtualizedNFTGridProps {
  nfts: NFT[];
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  itemsPerRow?: number;
}

const NFTCardPlaceholder = memo(() => (
  <div className="aspect-square bg-gradient-to-br from-slate-700 to-slate-900 rounded-lg animate-pulse" />
));

const NFTCard = memo(({ nft }: { nft: NFT }) => (
  <div className="cursor-pointer group">
    <div className="aspect-square rounded-lg overflow-hidden bg-slate-800 relative">
      <img
        src={nft.image_url}
        alt={nft.name}
        loading="lazy"
        decoding="async"
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
    </div>
    <div className="mt-2">
      <h3 className="font-semibold text-white truncate">{nft.name}</h3>
      <p className="text-sm text-gray-400">{nft.price || 'N/A'} SOL</p>
    </div>
  </div>
));

export const VirtualizedNFTGrid = memo(({
  nfts,
  isLoading,
  hasMore,
  onLoadMore,
  itemsPerRow = 4
}: VirtualizedNFTGridProps) => {
  const itemSize = 280; // Item height including text
  const itemWidth = 220;
  const gap = 16;
  const containerWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const actualItemsPerRow = Math.max(1, Math.floor((containerWidth - 32) / (itemWidth + gap)));
  const numRows = Math.ceil(nfts.length / actualItemsPerRow);
  const isItemLoaded = (index: number) => !hasMore || index < nfts.length;

  const loadMoreItems = useCallback(() => {
    if (!isLoading && hasMore) {
      onLoadMore();
    }
  }, [isLoading, hasMore, onLoadMore]);

  const Row = memo(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const items = nfts.slice(
      index * actualItemsPerRow,
      (index + 1) * actualItemsPerRow
    );

    return (
      <div
        style={style}
        className="flex gap-4 px-4"
      >
        {items.map((nft, i) => (
          <div key={`${index}-${i}`} className="flex-1">
            <NFTCard nft={nft} />
          </div>
        ))}
      </div>
    );
  });

  return (
    <InfiniteLoader
      isItemLoaded={isItemLoaded}
      itemCount={hasMore ? nfts.length + 1 : nfts.length}
      loadMoreItems={loadMoreItems}
    >
      {({ onItemsRendered, ref }) => (
        <List
          ref={ref}
          height={800}
          itemCount={numRows}
          itemSize={itemSize}
          width={containerWidth}
          onItemsRendered={onItemsRendered}
        >
          {Row}
        </List>
      )}
    </InfiniteLoader>
  );
});

VirtualizedNFTGrid.displayName = 'VirtualizedNFTGrid';
