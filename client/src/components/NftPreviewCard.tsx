import React, { useEffect, useRef, useState } from 'react';

interface NFT {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  creator: string;
  owner: string;
  mintAddress: string;
  price?: string;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  attributes?: Array<{ trait_type: string; value: string | number }>;
}

interface NftPreviewCardProps {
  nft: NFT;
  anchorRect: DOMRect;
  onClose: () => void;
  onViewDetails: () => void;
  onBuy?: (nft: NFT) => void;
  onList?: (nft: NFT) => void;
}

const PREVIEW_WIDTH = 300;
const PREVIEW_GAP = 10;

const rarityConfig: Record<string, { label: string; color: string; bg: string }> = {
  legendary: { label: 'Legendary', color: '#c9a84c', bg: 'rgba(201,168,76,0.12)' },
  epic:      { label: 'Epic',      color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  rare:      { label: 'Rare',      color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
  common:    { label: 'Common',    color: '#71717a', bg: 'rgba(113,113,122,0.12)' },
};

function computePosition(anchor: DOMRect): { top: number; left: number } {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const PREVIEW_HEIGHT = 440;

  // Prefer right side, fall back to left
  let left = anchor.right + PREVIEW_GAP;
  if (left + PREVIEW_WIDTH > vw - 8) {
    left = anchor.left - PREVIEW_WIDTH - PREVIEW_GAP;
  }
  if (left < 8) {
    left = 8;
  }

  // Vertically center on the card, clamp to viewport
  let top = anchor.top + anchor.height / 2 - PREVIEW_HEIGHT / 2;
  top = Math.max(8, Math.min(top, vh - PREVIEW_HEIGHT - 8));

  return { top, left };
}

export default function NftPreviewCard({
  nft,
  anchorRect,
  onClose,
  onViewDetails,
  onBuy,
  onList,
}: NftPreviewCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(() => computePosition(anchorRect));
  const [visible, setVisible] = useState(false);
  const rarity = nft.rarity ?? 'common';
  const rc = rarityConfig[rarity] ?? rarityConfig.common;

  // Fade in after mount
  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Recompute position if anchor changes
  useEffect(() => {
    setPos(computePosition(anchorRect));
  }, [anchorRect]);

  // Close when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        top: pos.top,
        left: pos.left,
        width: PREVIEW_WIDTH,
        zIndex: 9999,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(6px) scale(0.97)',
        transition: 'opacity 180ms ease, transform 180ms ease',
        pointerEvents: 'auto',
      }}
      onMouseLeave={onClose}
    >
      <div
        style={{
          background: '#111111',
          border: '1px solid #2a2a2a',
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 24px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)',
        }}
      >
        {/* Image */}
        <div style={{ position: 'relative', aspectRatio: '1', background: '#0c0c0c' }}>
          <img
            src={nft.imageUrl}
            alt={nft.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src =
                'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjMTExMTExIi8+PHBhdGggZD0iTTEwMCA2MEwxNDAgMTAwSDE2MEwxMDAgNDBMNDAgMTAwSDYwWiIgZmlsbD0iIzFhMWExYSIvPjxwYXRoIGQ9Ik02MCAxMDBIMTQwTDEwMCAxNTBaIiBmaWxsPSIjMWExYTFhIi8+PC9zdmc+';
            }}
          />
          {/* Rarity pill */}
          <div
            style={{
              position: 'absolute',
              top: 10,
              left: 10,
              padding: '3px 9px',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 600,
              color: rc.color,
              background: rc.bg,
              border: `1px solid ${rc.color}30`,
              letterSpacing: '0.02em',
            }}
          >
            {rc.label}
          </div>
          {/* Price pill */}
          {nft.price && (
            <div
              style={{
                position: 'absolute',
                top: 10,
                right: 10,
                padding: '3px 9px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 700,
                color: '#c9a84c',
                background: 'rgba(17,17,17,0.9)',
                border: '1px solid rgba(201,168,76,0.25)',
              }}
            >
              {nft.price} SOL
            </div>
          )}
        </div>

        {/* Body */}
        <div style={{ padding: '14px 16px 16px' }}>
          {/* Name */}
          <p
            style={{
              margin: 0,
              fontSize: 15,
              fontWeight: 700,
              color: '#ffffff',
              lineHeight: 1.3,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {nft.name}
          </p>

          {/* Description */}
          {nft.description && (
            <p
              style={{
                margin: '5px 0 0',
                fontSize: 12,
                color: '#71717a',
                lineHeight: 1.5,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {nft.description}
            </p>
          )}

          {/* Creator row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              marginTop: 10,
            }}
          >
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: 6,
                background: 'rgba(201,168,76,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                fontWeight: 700,
                color: '#c9a84c',
                flexShrink: 0,
              }}
            >
              {nft.creator.slice(0, 2).toUpperCase()}
            </div>
            <span
              style={{
                fontSize: 11,
                color: '#52525b',
                fontFamily: 'monospace',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {nft.creator.slice(0, 6)}…{nft.creator.slice(-4)}
            </span>
          </div>

          {/* Attributes summary */}
          {nft.attributes && nft.attributes.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 5,
                marginTop: 10,
              }}
            >
              {nft.attributes.slice(0, 4).map((attr, i) => (
                <div
                  key={i}
                  style={{
                    padding: '3px 8px',
                    borderRadius: 5,
                    background: '#1a1a1a',
                    border: '1px solid #242424',
                    fontSize: 10,
                    color: '#a1a1aa',
                  }}
                >
                  <span style={{ color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {attr.trait_type}:{' '}
                  </span>
                  {attr.value}
                </div>
              ))}
              {nft.attributes.length > 4 && (
                <div
                  style={{
                    padding: '3px 8px',
                    borderRadius: 5,
                    background: '#1a1a1a',
                    border: '1px solid #242424',
                    fontSize: 10,
                    color: '#52525b',
                  }}
                >
                  +{nft.attributes.length - 4} more
                </div>
              )}
            </div>
          )}

          {/* Divider */}
          <div style={{ borderTop: '1px solid #1e1e1e', marginTop: 14 }} />

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails();
              }}
              style={{
                flex: 1,
                padding: '8px 0',
                borderRadius: 7,
                background: '#1e1e1e',
                border: '1px solid #2a2a2a',
                color: '#e4e4e7',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 140ms ease',
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = '#2a2a2a')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = '#1e1e1e')}
            >
              View Details
            </button>

            {nft.price ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onBuy) onBuy(nft);
                  onClose();
                }}
                style={{
                  flex: 1,
                  padding: '8px 0',
                  borderRadius: 7,
                  background: '#c9a84c',
                  border: 'none',
                  color: '#000000',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'background 140ms ease',
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = '#b8973f')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = '#c9a84c')}
              >
                Buy {nft.price} SOL
              </button>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onList) onList(nft);
                  onClose();
                }}
                style={{
                  flex: 1,
                  padding: '8px 0',
                  borderRadius: 7,
                  background: '#c9a84c',
                  border: 'none',
                  color: '#000000',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'background 140ms ease',
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = '#b8973f')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = '#c9a84c')}
              >
                List for Sale
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
