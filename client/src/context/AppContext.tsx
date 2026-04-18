import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { AppState, NFT, Collection, WalletInfo, ProgramConfig } from '../types';
import { apiService } from '../services/api';
import { useLocalStorage } from '../hooks/useLocalStorage';

type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_NFTS'; payload: NFT[] }
  | { type: 'ADD_NFT'; payload: NFT }
  | { type: 'SET_COLLECTIONS'; payload: Collection[] }
  | { type: 'SET_WALLET_INFO'; payload: WalletInfo | null }
  | { type: 'SET_PROGRAMS'; payload: ProgramConfig | null }
  | { type: 'RESET' };

const initialState: AppState = {
  nfts: [],
  collections: [],
  wallet: null,
  programs: null,
  loading: false,
  error: null,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SET_NFTS':
      return { ...state, nfts: action.payload, loading: false };
    case 'ADD_NFT':
      return { ...state, nfts: [...state.nfts, action.payload] };
    case 'SET_COLLECTIONS':
      return { ...state, collections: action.payload, loading: false };
    case 'SET_WALLET_INFO':
      return { ...state, wallet: action.payload };
    case 'SET_PROGRAMS':
      return { ...state, programs: action.payload };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

interface AppContextType extends AppState {
  dispatch: React.Dispatch<AppAction>;
  loadMarketplace: () => Promise<void>;
  loadCollections: () => Promise<void>;
  loadWalletInfo: (address: string) => Promise<void>;
  loadPrograms: () => Promise<void>;
  addNFT: (nft: NFT) => void;
  clearError: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const { publicKey, connected } = useWallet();
  const [theme] = useLocalStorage('theme', 'dark');

  // Load marketplace data with retry/backoff. The production backend is hosted
  // on Render's free tier, which cold-starts after idle periods — the first
  // request after a spin-down can take 30-60s or fail outright. Retry silently
  // so the user doesn't see a transient "Connection Issue" toast on load.
  const loadMarketplace = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    const delays = [0, 3000, 8000, 15000];
    let lastError = 'Failed to load marketplace';

    for (let attempt = 0; attempt < delays.length; attempt++) {
      if (delays[attempt] > 0) {
        await new Promise((resolve) => setTimeout(resolve, delays[attempt]));
      }
      try {
        const response = await apiService.getMarketplace();
        if (response.success && response.data) {
          dispatch({ type: 'SET_NFTS', payload: response.data.nfts });
          return;
        }
        lastError = response.error || lastError;
      } catch {
        lastError = 'Failed to load marketplace';
      }
    }

    dispatch({ type: 'SET_ERROR', payload: lastError });
  }, []);

  // Load collections
  const loadCollections = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await apiService.getCollections();
      if (response.success && response.data) {
        dispatch({ type: 'SET_COLLECTIONS', payload: response.data });
      } else {
        // Silently fail - marketplace error already shown
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } catch {
      // Silently fail - marketplace error already shown
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // Load wallet info
  const loadWalletInfo = useCallback(async (address: string) => {
    try {
      const response = await apiService.getWalletInfo(address);
      if (response.success && response.data) {
        dispatch({ type: 'SET_WALLET_INFO', payload: response.data });
      }
    } catch {
      // Silently fail - wallet info is optional
      }
  }, []);

  // Load program configuration
  const loadPrograms = useCallback(async () => {
    try {
      const response = await apiService.getPrograms();
      if (response.success && response.data) {
        dispatch({ type: 'SET_PROGRAMS', payload: response.data });
      }
    } catch {
      // Silently fail - programs are optional
      }
  }, []);

  // Add NFT to state
  const addNFT = (nft: NFT) => {
    dispatch({ type: 'ADD_NFT', payload: nft });
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: 'SET_ERROR', payload: null });
  };

  // Load initial data
  useEffect(() => {
    loadMarketplace();
    loadCollections();
    loadPrograms();
  }, [loadMarketplace, loadCollections, loadPrograms]);

  // Load wallet info when connected
  useEffect(() => {
    if (connected && publicKey) {
      loadWalletInfo(publicKey.toBase58());
    } else {
      dispatch({ type: 'SET_WALLET_INFO', payload: null });
    }
  }, [connected, publicKey, loadWalletInfo]);

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const value: AppContextType = {
    ...state,
    dispatch,
    loadMarketplace,
    loadCollections,
    loadWalletInfo,
    loadPrograms,
    addNFT,
    clearError,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
