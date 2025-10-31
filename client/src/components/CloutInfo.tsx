/**
 * CloutInfo Component
 * Displays comprehensive information about the CLOUT token
 * Shows correct mainnet contract addresses and token details
 */

import React, { useState, useEffect } from 'react';

const API_BASE =
  (import.meta.env.VITE_API_BASE as string) ||
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001');

interface ProgramConfig {
  CLOUT_PROGRAM_ID?: string;
  CLOUT_MINT?: string;
  REWARDS_VAULT?: string;
}

interface ProgramsResponse {
  success: boolean;
  data?: {
    programs: ProgramConfig;
  };
}

export default function CloutInfo() {
  const [programs, setPrograms] = useState<ProgramConfig>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/v1/programs`);
        if (response.ok) {
          const result: ProgramsResponse = await response.json();
          if (result.success && result.data?.programs) {
            setPrograms(result.data.programs);
          }
        }
      } catch (error) {
        console.error('Failed to fetch program config:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPrograms();
  }, []);

  // Mainnet CLOUT Token Details
  const cloutMint =
    programs.CLOUT_PROGRAM_ID ||
    programs.CLOUT_MINT ||
    '62hWQAgAV4jugHSuZsMqzxZNVXaVLrbRpz3Sw58Z64Mw';
  const rewardsVault = programs.REWARDS_VAULT || '2KkNwFZbznAtYX1xjVS6e5BBqQnfaBuTjn42G4zJXAps';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* What is CLOUT? Section */}
      <div className="glass rounded-xl p-6 border border-white/10 backdrop-blur-md">
        <h2 className="text-3xl font-bold text-cyan-400 mb-4">What is CLOUT?</h2>
        <p className="text-white text-lg leading-relaxed">
          CLOUT is the native utility token of the NFTSol platform. It&apos;s designed to reward
          active users and provide real utility within our ecosystem. Unlike other tokens, CLOUT has
          immediate, tangible benefits.
        </p>
      </div>

      {/* Token Details Section */}
      <div className="glass rounded-xl p-6 border border-white/10 backdrop-blur-md">
        <h2 className="text-3xl font-bold text-cyan-400 mb-4">Token Details</h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-white/10">
            <span className="text-gray-300 font-semibold">Name:</span>
            <span className="text-green-400 font-mono font-bold">CLOUT Token</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-white/10">
            <span className="text-gray-300 font-semibold">Symbol:</span>
            <span className="text-green-400 font-mono font-bold">CLOUT</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-white/10">
            <span className="text-gray-300 font-semibold">Decimals:</span>
            <span className="text-green-400 font-mono font-bold">9</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-white/10">
            <span className="text-gray-300 font-semibold">Total Supply:</span>
            <span className="text-green-400 font-mono font-bold">1,000,000,000 CLOUT</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-gray-300 font-semibold">Mint Address:</span>
            <div className="flex items-center gap-2">
              <code className="text-green-400 font-mono text-sm break-all">
                {loading ? 'Loading...' : cloutMint}
              </code>
              <button
                onClick={() => navigator.clipboard.writeText(cloutMint)}
                className="text-purple-400 hover:text-purple-300 transition-colors text-sm"
                title="Copy to clipboard"
              >
                📋
              </button>
              <a
                href={`https://explorer.solana.com/address/${cloutMint}?cluster=mainnet-beta`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 transition-colors text-sm"
                title="View on Solana Explorer"
              >
                🔗
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* CLOUT Utilities Section */}
      <div className="glass rounded-xl p-6 border border-white/10 backdrop-blur-md">
        <h2 className="text-3xl font-bold text-cyan-400 mb-4">CLOUT Utilities</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white/5 rounded-lg p-4">
            <h3 className="text-xl font-bold text-yellow-400 mb-2">⭐ NFT Minting Rewards</h3>
            <p className="text-gray-300 text-sm">
              Earn CLOUT tokens when you mint NFTs on the platform. Bonus multipliers for special
              collections!
            </p>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <h3 className="text-xl font-bold text-yellow-400 mb-2">🎬 Eternal Echo Bonuses</h3>
            <p className="text-gray-300 text-sm">
              Get 2x CLOUT rewards when minting Eternal Echoes. Build collaborative NFTs and earn
              more!
            </p>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <h3 className="text-xl font-bold text-yellow-400 mb-2">🎯 Referral Rewards</h3>
            <p className="text-gray-300 text-sm">
              Earn 5% CLOUT from every NFT minted through your referral link. Build your network!
            </p>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <h3 className="text-xl font-bold text-yellow-400 mb-2">💎 Platform Benefits</h3>
            <p className="text-gray-300 text-sm">
              Unlock premium features, reduced fees, and exclusive access with CLOUT token holdings.
            </p>
          </div>
        </div>
      </div>

      {/* Rewards Vault Info */}
      <div className="glass rounded-xl p-6 border border-white/10 backdrop-blur-md">
        <h2 className="text-2xl font-bold text-cyan-400 mb-3">Rewards Vault</h2>
        <p className="text-gray-300 mb-3">
          The Rewards Vault holds CLOUT tokens allocated for platform rewards and incentives.
        </p>
        <div className="flex items-center gap-2">
          <code className="text-green-400 font-mono text-sm break-all flex-1">{rewardsVault}</code>
          <button
            onClick={() => navigator.clipboard.writeText(rewardsVault)}
            className="text-purple-400 hover:text-purple-300 transition-colors text-sm"
            title="Copy to clipboard"
          >
            📋
          </button>
          <a
            href={`https://explorer.solana.com/address/${rewardsVault}?cluster=mainnet-beta`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 transition-colors text-sm"
            title="View on Solana Explorer"
          >
            🔗
          </a>
        </div>
      </div>
    </div>
  );
}
