import React from 'react';
import '../styles/SolanaHeader.css';

export default function SolanaHeader() {
  return (
    <header className="solana-header bg-[#08111d]/70 backdrop-blur">
      <div className="solana-header-container">
        <div className="solana-header-brand">
          <div className="sla-gradient solana-header-logo" />
          <div>
            <div className="sla-text-gradient solana-header-title">
              NFTSol
            </div>
            <div className="solana-header-subtitle">Built for Solana</div>
          </div>
        </div>
        <nav className="solana-header-nav">
          <a
            href="https://solana.com/branding"
            target="_blank"
            rel="noreferrer"
            className="solana-header-link"
          >
            Brand Guide
          </a>
          <button className="sla-gradient solana-header-button">
            Launch App
          </button>
        </nav>
      </div>
    </header>
  );
}
