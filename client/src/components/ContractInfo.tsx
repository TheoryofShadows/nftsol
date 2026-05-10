/**
 * ContractInfo Component
 * Displays Solana contract addresses for CLOUT and other programs
 * Shows the correct mainnet contract addresses
 */

import React, { useState, useEffect } from 'react';

const API_BASE =
  (import.meta.env.VITE_API_BASE as string) ||
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001');

interface ProgramConfig {
  CLOUT_PROGRAM_ID?: string;
  CLOUT_MINT?: string;
  REWARDS_VAULT?: string;
  MARKET_PROGRAM_ID?: string;
  LOYALTY_PROGRAM_ID?: string;
}

interface ProgramsResponse {
  success: boolean;
  data?: {
    programs: ProgramConfig;
  };
}

export default function ContractInfo() {
  const [programs, setPrograms] = useState<ProgramConfig>({});
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);

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

  // Fallback to mainnet addresses if API fails
  const defaultPrograms: ProgramConfig = {
    CLOUT_PROGRAM_ID: '26iJ37BE3icVtoo2QRkfjtYXFHMudG2sbTHAnhF2D6ab',
    CLOUT_MINT: '26iJ37BE3icVtoo2QRkfjtYXFHMudG2sbTHAnhF2D6ab',
    REWARDS_VAULT: '7SBYHw5KQasPKajH6gCDnpWmb5QAh9EBvTi3cUnFAc1v',
    MARKET_PROGRAM_ID: 'HTs1hErzM8MywaUojfUY7QA1T6gLQD977R3HsCnKj7m7',
    LOYALTY_PROGRAM_ID: '2TujfT3Czd2ncawJ6ZLmfGeJ2t1Ugb9bqEvxSE2EKoo9',
  };

  const contractAddresses = { ...defaultPrograms, ...programs };

  if (loading && !expanded) {
    return null;
  }

  if (dismissed) {
    return null;
  }

  return (
    <div className="glass rounded-xl p-4 border border-white/10 backdrop-blur-md">
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-left focus:outline-none"
        >
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <span>📋</span>
            Contract Addresses
          </h3>
          <span className="text-gray-400 text-sm">{expanded ? '▼' : '▶'}</span>
        </button>
        <button
          onClick={() => setDismissed(true)}
          aria-label="Close"
          className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-400 hover:text-white text-lg leading-none transition-all ml-2"
        >
          ×
        </button>
      </div>

      {expanded && (
        <div className="space-y-3 animate-fade-in">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">CLOUT Token Mint</label>
            <div className="flex items-center gap-2">
              <code className="text-xs text-cyan-300 font-mono break-all flex-1">
                {contractAddresses.CLOUT_PROGRAM_ID || contractAddresses.CLOUT_MINT || 'Loading...'}
              </code>
              <button
                onClick={() => {
                  const address =
                    contractAddresses.CLOUT_PROGRAM_ID || contractAddresses.CLOUT_MINT;
                  if (address) {
                    navigator.clipboard.writeText(address);
                  }
                }}
                className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                title="Copy to clipboard"
              >
                📋
              </button>
              <a
                href={`https://explorer.solana.com/address/${contractAddresses.CLOUT_PROGRAM_ID || contractAddresses.CLOUT_MINT}?cluster=mainnet-beta`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                title="View on Solana Explorer"
              >
                🔗
              </a>
            </div>
          </div>

          {contractAddresses.REWARDS_VAULT && (
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Rewards Vault</label>
              <div className="flex items-center gap-2">
                <code className="text-xs text-cyan-300 font-mono break-all flex-1">
                  {contractAddresses.REWARDS_VAULT}
                </code>
                <button
                  onClick={() => navigator.clipboard.writeText(contractAddresses.REWARDS_VAULT!)}
                  className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                  title="Copy to clipboard"
                >
                  📋
                </button>
                <a
                  href={`https://explorer.solana.com/address/${contractAddresses.REWARDS_VAULT}?cluster=mainnet-beta`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  title="View on Solana Explorer"
                >
                  🔗
                </a>
              </div>
            </div>
          )}

          {contractAddresses.MARKET_PROGRAM_ID && (
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Marketplace Program</label>
              <code className="text-xs text-cyan-300 font-mono break-all">
                {contractAddresses.MARKET_PROGRAM_ID}
              </code>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
