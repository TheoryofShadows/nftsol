import { describe, expect, it } from 'vitest';
import { searchNFTs, type PublicNFT } from '@/utils/public-solana-api';

const baseNfts: PublicNFT[] = [
  {
    mint: 'mint-1',
    name: 'Solana Dragon',
    image: 'https://example.com/dragon.png',
    description: 'Legendary dragon from Solana realms',
    collection: 'Dragon Guild',
    creator: 'CreatorA',
    price: 12.5,
  },
  {
    mint: 'mint-2',
    name: 'Phantom Cat',
    image: 'https://example.com/cat.png',
    collection: 'Shadow Cats',
    creator: 'CreatorB',
    price: 4.2,
  },
  {
    mint: 'mint-3',
    name: 'Pixel Penguin',
    image: 'https://example.com/penguin.png',
    description: 'A chill penguin enjoying the ice.',
    collection: 'Arctic Pixels',
    creator: 'CreatorC',
  },
];

describe('searchNFTs', () => {
  it('returns the original list when the query is empty or whitespace', () => {
    expect(searchNFTs(baseNfts, '')).toEqual(baseNfts);
    expect(searchNFTs(baseNfts, '   ')).toEqual(baseNfts);
  });

  it('filters NFTs by matching name, collection, or description case-insensitively', () => {
    const resultsByName = searchNFTs(baseNfts, 'dragon');
    expect(resultsByName).toHaveLength(1);
    expect(resultsByName[0].mint).toBe('mint-1');

    const resultsByCollection = searchNFTs(baseNfts, 'shadow');
    expect(resultsByCollection).toHaveLength(1);
    expect(resultsByCollection[0].mint).toBe('mint-2');

    const resultsByDescription = searchNFTs(baseNfts, 'penguin enjoying');
    expect(resultsByDescription).toHaveLength(1);
    expect(resultsByDescription[0].mint).toBe('mint-3');
  });

  it('gracefully handles NFTs without descriptions', () => {
    const results = searchNFTs(baseNfts, 'phantom');
    expect(results).toHaveLength(1);
    expect(results[0].mint).toBe('mint-2');
  });
});
