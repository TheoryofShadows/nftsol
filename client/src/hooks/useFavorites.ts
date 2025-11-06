import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';

export function useFavorites() {
  const [favorites, setFavorites] = useLocalStorage<string[]>('nft-favorites', []);

  const addFavorite = useCallback((mintAddress: string) => {
    setFavorites((prev) => {
      if (prev.includes(mintAddress)) return prev;
      return [...prev, mintAddress];
    });
  }, [setFavorites]);

  const removeFavorite = useCallback((mintAddress: string) => {
    setFavorites((prev) => prev.filter((addr) => addr !== mintAddress));
  }, [setFavorites]);

  const toggleFavorite = useCallback((mintAddress: string) => {
    setFavorites((prev) => {
      if (prev.includes(mintAddress)) {
        return prev.filter((addr) => addr !== mintAddress);
      }
      return [...prev, mintAddress];
    });
  }, [setFavorites]);

  const isFavorite = useCallback((mintAddress: string) => {
    return favorites.includes(mintAddress);
  }, [favorites]);

  return {
    favorites,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
  };
}

