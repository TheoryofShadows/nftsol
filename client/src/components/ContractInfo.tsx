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
    CLOUT_PROGRAM_ID: '62hWQAgAV4jugHSuZsMqzxZNVXaVLrbRpz3Sw58Z64Mw',
    CLOUT_MINT: '62hWQAgAV4jugHSuZsMqzxZNVXaVLrbRpz3Sw58Z64Mw',
    REWARDS_VAULT: '2KkNwFZbznAtYX1xjVS6e5BBqQnfaBuTjn42G4zJXAps',
    MARKET_PROGRAM_ID: 'HTs1hErzM8MywaUojfUY7QA1T6gLQD977R3HsCnKj7m7',
    LOYALTY_PROGRAM_ID: '2TujfT3Czd2ncawJ6ZLmfGeJ2t1Ugb9bqEvxSE2EKoo9',
  };

  const contractAddresses = { ...defaultPrograms, ...programs };

  if (loading && !expanded) {
    return null; // Don't show until loaded or user expands
  }

  return (
    <div className="glass rounded-xl p-4 border border-white/10 backdrop-blur-md">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-left mb-2 focus:outline-none"
      >
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <span>📋</span>
          Contract Addresses
        </h3>
        <span className="text-gray-400 text-sm">{expanded ? '▼' : '▶'}</span>
      </button>

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
