import React from "react";

interface NFT {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  creator: string;
  mintAddress?: string;
  signature?: string;
}

interface NftGridProps {
  nfts: NFT[];
}

export default function NftGrid({ nfts }: NftGridProps) {
  if (!nfts?.length) {
    return (
      <div style={{
        color: 'white',
        textAlign: 'center',
        padding: '3rem',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎨</div>
        <h3 style={{ margin: '0 0 0.5rem 0' }}>No NFTs yet</h3>
        <p style={{ margin: 0, opacity: 0.8 }}>
          Be the first to mint an NFT and start the marketplace!
        </p>
      </div>
    );
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      gap: '1.5rem',
      marginTop: '1rem'
    }}>
      {nfts.map((nft) => (
        <div
          key={nft.id}
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: '1rem',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            transition: 'all 0.3s ease',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div style={{
            position: 'relative',
            borderRadius: '12px',
            overflow: 'hidden',
            aspectRatio: '1/1',
            marginBottom: '1rem'
          }}>
            <img
              src={nft.imageUrl}
              alt={nft.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: '12px'
              }}
              onError={(e) => {
                e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgNTBMMTUwIDEwMEgxMDBWNTBaIiBmaWxsPSIjOUI5QjlCIi8+CjxwYXRoIGQ9Ik0xMDAgMTUwTDUwIDEwMEgxMDBWMTUwWiIgZmlsbD0iIzlCOUI5QiIvPgo8L3N2Zz4K';
              }}
            />
            <div style={{
              position: 'absolute',
              top: '0.5rem',
              right: '0.5rem',
              background: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              padding: '0.25rem 0.5rem',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: 'bold'
            }}>
              NFT
            </div>
          </div>
          
          <div>
            <h3 style={{
              color: 'white',
              margin: '0 0 0.5rem 0',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {nft.name}
            </h3>
            
            <p style={{
              color: 'rgba(255, 255, 255, 0.8)',
              margin: '0 0 0.75rem 0',
              fontSize: '0.9rem',
              lineHeight: '1.4',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}>
              {nft.description}
            </p>
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 'auto'
            }}>
              <div style={{
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '0.8rem'
              }}>
                Creator: {nft.creator.slice(0, 8)}...
              </div>
              
              <button style={{
                background: 'linear-gradient(45deg, #667eea, #764ba2)',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}>
                View Details
              </button>
            </div>
            
            {nft.mintAddress && (
              <div style={{
                marginTop: '0.5rem',
                padding: '0.5rem',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '8px',
                fontSize: '0.7rem',
                color: 'rgba(255, 255, 255, 0.6)',
                wordBreak: 'break-all'
              }}>
                <strong>Mint:</strong> {nft.mintAddress}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}