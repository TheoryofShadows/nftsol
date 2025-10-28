import React, { createContext, useContext, useReducer, useEffect } from 'react';
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
  const [theme, setTheme] = useLocalStorage('theme', 'dark');

  // Load marketplace data
  const loadMarketplace = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await apiService.getMarketplace();
      if (response.success && response.data) {
        dispatch({ type: 'SET_NFTS', payload: response.data.nfts });
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.error || 'Failed to load marketplace' });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load marketplace' });
    }
  };

  // Load collections
  const loadCollections = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await apiService.getCollections();
      if (response.success && response.data) {
        dispatch({ type: 'SET_COLLECTIONS', payload: response.data });
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.error || 'Failed to load collections' });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load collections' });
    }
  };

  // Load wallet info
  const loadWalletInfo = async (address: string) => {
    try {
      const response = await apiService.getWalletInfo(address);
      if (response.success && response.data) {
        dispatch({ type: 'SET_WALLET_INFO', payload: response.data });
      }
    } catch (error) {
      console.error('Failed to load wallet info:', error);
    }
  };

  // Load program configuration
  const loadPrograms = async () => {
    try {
      const response = await apiService.getPrograms();
      if (response.success && response.data) {
        dispatch({ type: 'SET_PROGRAMS', payload: response.data });
      }
    } catch (error) {
      console.error('Failed to load programs:', error);
    }
  };

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
  }, []);

  // Load wallet info when connected
  useEffect(() => {
    if (connected && publicKey) {
      loadWalletInfo(publicKey.toBase58());
    } else {
      dispatch({ type: 'SET_WALLET_INFO', payload: null });
    }
  }, [connected, publicKey]);

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

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
