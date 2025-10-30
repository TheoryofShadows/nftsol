/**
 * 🎬 Eternal Echoes - Mint Component
 * Search Internet Archive → Preview → Mint cNFT with Truth Score
 */

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PublicKey } from '@solana/web3.js';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import './EchoMint.css';

interface IASearchResult {
  identifier: string;
  title: string;
  description?: string;
  year?: string;
  creator?: string;
  thumbnail?: string;
  verificationTeaser?: string;
  truthScore?: number;
}

interface MintData {
  iaId: string;
  title: string;
  description?: string;
  videoUri: string;
  thumbnailUri?: string;
  grokTruthHash: number[];
  truthScore: number;
  teaser: string;
  verified: boolean;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const EchoMint: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedIaId, setSelectedIaId] = useState<string | null>(null);
  const { publicKey, signTransaction } = useWallet();
  const navigate = useNavigate();

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Search Internet Archive
  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['iaSearch', debouncedQuery],
    queryFn: async () => {
      const response = await fetch(
        `${API_BASE}/api/echo/search?q=${encodeURIComponent(debouncedQuery)}&rows=20`
      );
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      return data.results as IASearchResult[];
    },
    enabled: debouncedQuery.length > 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch mint data for selected item
  const { data: mintData, isLoading: isFetchingMint } = useQuery({
    queryKey: ['echoMint', selectedIaId],
    queryFn: async () => {
      if (!selectedIaId || !publicKey) return null;
      
      const response = await fetch(`${API_BASE}/api/echo/mint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          iaId: selectedIaId,
          walletAddress: publicKey.toBase58(),
        }),
      });

      if (!response.ok) throw new Error('Failed to fetch mint data');
      const data = await response.json();
      return data as MintData;
    },
    enabled: !!selectedIaId && !!publicKey,
  });

  // Mint Echo NFT
  const mintMutation = useMutation({
    mutationFn: async (data: MintData) => {
      if (!publicKey || !signTransaction) {
        throw new Error('Wallet not connected');
      }

      // Derive Echo Ledger PDA
      const [ledgerPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('echo_ledger'), Buffer.from(data.iaId)],
        new PublicKey('EtEchoXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX') // TODO: Replace with actual program ID
      );

      // TODO: Call Anchor program.methods.initEchoLedger()
      // This requires Anchor client setup - shown as placeholder
      
      toast.success('🎬 Echo Minted! Redirecting...');
      
      return ledgerPda.toBase58();
    },
    onSuccess: (ledgerPda) => {
      navigate(`/echo/${ledgerPda}`);
    },
    onError: (error: any) => {
      toast.error(`Mint failed: ${error.message}`);
    },
  });

  const handleMint = () => {
    if (!mintData) return;
    mintMutation.mutate(mintData);
  };

  return (
    <div className="echo-mint-container">
      {/* Header */}
      <motion.div 
        className="echo-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="echo-title">
          🎬 Eternal Echoes
          <span className="echo-subtitle">Remix History, Mint the Future</span>
        </h1>
        <WalletMultiButton className="wallet-button" />
      </motion.div>

      {/* Search Section */}
      <motion.div 
        className="search-section"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="search-input-wrapper">
          <input
            type="text"
            className="search-input"
            placeholder="Search Internet Archive... (e.g., 'apollo moon landing')"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {isSearching && <div className="search-spinner">🔍</div>}
        </div>

        {/* Search Results */}
        <AnimatePresence>
          {searchResults && searchResults.length > 0 && (
            <motion.div
              className="search-results"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              {searchResults.map((result) => (
                <motion.div
                  key={result.identifier}
                  className={`result-card ${selectedIaId === result.identifier ? 'selected' : ''}`}
                  onClick={() => setSelectedIaId(result.identifier)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <img 
                    src={result.thumbnail} 
                    alt={result.title}
                    className="result-thumbnail"
                  />
                  <div className="result-info">
                    <h3 className="result-title">{result.title}</h3>
                    <p className="result-meta">
                      {result.year && <span>📅 {result.year}</span>}
                      {result.creator && <span>👤 {result.creator}</span>}
                    </p>
                    {result.verificationTeaser && (
                      <div className="verification-badge">
                        {result.verificationTeaser}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Preview & Mint Section */}
      <AnimatePresence>
        {mintData && (
          <motion.div
            className="mint-preview"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
          >
            <div className="preview-content">
              <h2 className="preview-title">Preview Your Echo</h2>
              
              {/* Video Preview */}
              <video 
                src={mintData.videoUri} 
                controls 
                className="preview-video"
                poster={mintData.thumbnailUri}
              />

              {/* Truth Score Badge */}
              <motion.div 
                className={`truth-badge ${mintData.truthScore >= 90 ? 'gold' : mintData.truthScore >= 80 ? 'silver' : 'bronze'}`}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <div className="truth-score">{mintData.truthScore}%</div>
                <div className="truth-label">Truth Score</div>
                <div className="truth-teaser">{mintData.teaser}</div>
              </motion.div>

              {/* Metadata */}
              <div className="mint-metadata">
                <h3>{mintData.title}</h3>
                {mintData.description && (
                  <p className="mint-description">{mintData.description}</p>
                )}
              </div>

              {/* Mint Button */}
              <motion.button
                className="mint-button"
                onClick={handleMint}
                disabled={!publicKey || mintMutation.isPending}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {mintMutation.isPending ? (
                  <span>🎬 Minting...</span>
                ) : !publicKey ? (
                  <span>Connect Wallet to Mint</span>
                ) : (
                  <span>🚀 Mint Echo – CLOUT x2!</span>
                )}
              </motion.button>

              {mintData.verified && (
                <div className="mint-perks">
                  ✨ Verified Echo = Double CLOUT Rewards!
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading State */}
      {isFetchingMint && (
        <div className="loading-overlay">
          <motion.div
            className="loading-spinner"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            🎬
          </motion.div>
          <p>Preparing your Echo...</p>
        </div>
      )}
    </div>
  );
};

export default EchoMint;
