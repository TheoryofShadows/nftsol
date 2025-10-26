import React, { useMemo, useCallback } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
import { motion } from 'framer-motion';
import IpfsImage from './IpfsImage';

interface NFT {
  id: string;
  mintAddress: string;
  name: string;
  description: string;
  image: string;
  price?: string;
  owner: string;
  status: string;
  collection?: string;
  platform?: string;
  rarity?: number;
  attributes?: Array<{
    trait_type: string;
    value: string;
  }>;
}

interface VirtualizedNFTGridProps {
  nfts: NFT[];
  onBuyNFT: (nft: NFT) => void;
  connected: boolean;
  itemHeight?: number;
  itemWidth?: number;
  containerHeight?: number;
  containerWidth?: number;
}

interface GridItemProps {
  columnIndex: number;
  rowIndex: number;
  style: React.CSSProperties;
  data: {
    nfts: NFT[];
    onBuyNFT: (nft: NFT) => void;
    connected: boolean;
    columnsPerRow: number;
  };
}

const GridItem = React.memo(({ columnIndex, rowIndex, style, data }: GridItemProps) => {
  const { nfts, onBuyNFT, connected, columnsPerRow } = data;
  const nftIndex = rowIndex * columnsPerRow + columnIndex;
  const nft = nfts[nftIndex];

  if (!nft) {
    return <div style={style} />;
  }

  return (
    <motion.div
      style={style}
      className="nft-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: nftIndex * 0.05 }}
      whileHover={{ 
        scale: 1.02,
        y: -5,
        transition: { duration: 0.2 }
      }}
      layout
    >
      <div className="nft-image-container">
        <IpfsImage
          src={nft.image}
          alt={nft.name}
          className="nft-image"
          loading="lazy"
          quality={75}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {nft.status === 'listed' && (
          <motion.div 
            className="nft-badge"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            For Sale
          </motion.div>
        )}
        {nft.collection && (
          <motion.div 
            className="collection-badge"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            {nft.collection}
          </motion.div>
        )}
        {nft.platform && (
          <div className="platform-badge">
            {nft.platform}
          </div>
        )}
      </div>
      
      <div className="nft-info">
        <h3 className="nft-name">{nft.name}</h3>
        <p className="nft-description">{nft.description}</p>
        
        {nft.attributes && nft.attributes.length > 0 && (
          <div className="nft-attributes">
            {nft.attributes.slice(0, 3).map((attr, idx) => (
              <span key={idx} className="attribute-tag">
                {attr.trait_type}: {attr.value}
              </span>
            ))}
          </div>
        )}

        {nft.price && (
          <div className="nft-price-section">
            <div className="nft-price">{nft.price} SOL</div>
            <div className="clout-discount">Save 50% with CLOUT</div>
          </div>
        )}

        {nft.rarity && (
          <div className="rarity-score">
            Rarity: {nft.rarity}%
          </div>
        )}

        <div className="nft-actions">
          {nft.status === 'listed' ? (
            <motion.button
              onClick={() => onBuyNFT(nft)}
              className="btn-primary"
              disabled={!connected}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label={`Buy ${nft.name} for ${nft.price} SOL`}
            >
              {connected ? 'Buy Now' : 'Connect Wallet'}
            </motion.button>
          ) : (
            <div className="nft-status">Not for sale</div>
          )}
        </div>
      </div>
    </motion.div>
  );
});

GridItem.displayName = 'GridItem';

export default function VirtualizedNFTGrid({
  nfts,
  onBuyNFT,
  connected,
  itemHeight = 400,
  itemWidth = 300,
  containerHeight = 600,
  containerWidth = 1200
}: VirtualizedNFTGridProps) {
  const columnsPerRow = Math.floor(containerWidth / itemWidth);
  const rowCount = Math.ceil(nfts.length / columnsPerRow);

  const itemData = useMemo(() => ({
    nfts,
    onBuyNFT,
    connected,
    columnsPerRow
  }), [nfts, onBuyNFT, connected, columnsPerRow]);

  const getItemKey = useCallback(({ rowIndex, columnIndex }: { rowIndex: number; columnIndex: number }) => {
    const nftIndex = rowIndex * columnsPerRow + columnIndex;
    const nft = nfts[nftIndex];
    return nft ? nft.id : `empty-${rowIndex}-${columnIndex}`;
  }, [nfts, columnsPerRow]);

  if (nfts.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🖼️</div>
        <h3>No NFTs Found</h3>
        <p>Try adjusting your filters or check back later for new listings.</p>
      </div>
    );
  }

  return (
    <div className="virtualized-nft-grid">
      <Grid
        height={containerHeight}
        width={containerWidth}
        columnCount={columnsPerRow}
        rowCount={rowCount}
        columnWidth={itemWidth}
        rowHeight={itemHeight}
        itemData={itemData}
        itemKey={getItemKey}
        overscanRowCount={2}
        overscanColumnCount={1}
      >
        {GridItem}
      </Grid>
    </div>
  );
}
