import React, { useState } from "react";
import SolanaHeader from "./components/SolanaHeader";
import SolanaSection from "./components/SolanaSection";
import { UniversalWalletProvider, WalletSelector } from "./wallet/UniversalWalletAdapter";
import MintForm from "./components/MintForm";
import NFTMarketplace from "./components/NFTMarketplace";
import ProxyCheck from "./components/ProxyCheck";
import CloutBadge from "./components/CloutBadge";

export default function App() {
  const [activeTab, setActiveTab] = useState<'mint' | 'marketplace' | 'proxy'>('marketplace');

  return (
    <UniversalWalletProvider>
      <div style={{ padding: 24, fontFamily: "system-ui, Segoe UI, Arial" }}>
        <SolanaHeader />

        <SolanaSection title="Connect Wallet">
          <WalletSelector />
        </SolanaSection>

      {/* Navigation Tabs */}
      <div style={{ marginBottom: 24, display: 'flex', gap: 8 }}>
        <button
          onClick={() => setActiveTab('marketplace')}
          style={{
            padding: '12px 24px',
            backgroundColor: activeTab === 'marketplace' ? '#007bff' : '#f8f9fa',
            color: activeTab === 'marketplace' ? 'white' : 'black',
            border: '1px solid #dee2e6',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 16,
            fontWeight: 500
          }}
        >
          Marketplace
        </button>
        <button
          onClick={() => setActiveTab('mint')}
          style={{
            padding: '12px 24px',
            backgroundColor: activeTab === 'mint' ? '#007bff' : '#f8f9fa',
            color: activeTab === 'mint' ? 'white' : 'black',
            border: '1px solid #dee2e6',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 16,
            fontWeight: 500
          }}
        >
          Create NFT
        </button>
        <button
          onClick={() => setActiveTab('proxy')}
          style={{
            padding: '12px 24px',
            backgroundColor: activeTab === 'proxy' ? '#007bff' : '#f8f9fa',
            color: activeTab === 'proxy' ? 'white' : 'black',
            border: '1px solid #dee2e6',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 16,
            fontWeight: 500
          }}
        >
          Proxy Test
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'marketplace' && (
        <SolanaSection title="NFT Marketplace">
          <NFTMarketplace />
        </SolanaSection>
      )}

      {activeTab === 'mint' && (
        <SolanaSection title="Create NFT">
          <MintForm />
        </SolanaSection>
      )}

      {activeTab === 'proxy' && (
        <SolanaSection title="IPFS Proxy Test">
          <ProxyCheck />
        </SolanaSection>
      )}

        <div style={{ marginTop: 24 }}>
          <CloutBadge />
        </div>
      </div>
    </UniversalWalletProvider>
  );
}
