import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

export default function QuickActions() {
  const { connected } = useWallet();

  const actions = [
    {
      label: 'Mint NFT',
      icon: '✨',
      description: 'Create a new NFT',
      color: 'from-purple-500 to-pink-500',
      action: () => {
        window.dispatchEvent(new CustomEvent('change-tab', { detail: 'mint' }));
      },
      requiresConnection: false,
    },
    {
      label: 'Browse Market',
      icon: '🏪',
      description: 'Discover NFTs',
      color: 'from-cyan-500 to-blue-500',
      action: () => {
        window.dispatchEvent(new CustomEvent('change-tab', { detail: 'market' }));
      },
      requiresConnection: false,
    },
    {
      label: 'My NFTs',
      icon: '👤',
      description: 'View collection',
      color: 'from-green-500 to-emerald-500',
      action: () => {
        window.dispatchEvent(new CustomEvent('change-tab', { detail: 'my-nfts' }));
      },
      requiresConnection: true,
    },
    {
      label: 'Withdraw SOL',
      icon: '💰',
      description: 'Manage funds',
      color: 'from-yellow-500 to-orange-500',
      action: () => {
        window.dispatchEvent(new CustomEvent('change-tab', { detail: 'withdraw' }));
      },
      requiresConnection: true,
    },
  ];

  return (
    <div className="glass-card p-6">
      <h2 className="text-xl font-bold gradient-text-primary mb-6">Quick Actions</h2>
      
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => {
          const isDisabled = action.requiresConnection && !connected;
          
          return (
            <button
              key={action.label}
              onClick={action.action}
              disabled={isDisabled}
              className={`
                relative p-4 rounded-xl bg-gradient-to-br ${action.color}
                transition-all duration-300 transform hover:scale-105 active:scale-95
                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                group overflow-hidden
              `}
            >
              <div className="relative z-10">
                <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                  {action.icon}
                </div>
                <div className="text-sm font-semibold text-white">{action.label}</div>
                <div className="text-xs text-white/80 mt-1">{action.description}</div>
              </div>
              
              {!isDisabled && (
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </button>
          );
        })}
      </div>

      {!connected && (
        <div className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
          <p className="text-xs text-yellow-400 text-center">
            Connect wallet to access all features
          </p>
        </div>
      )}
    </div>
  );
}
