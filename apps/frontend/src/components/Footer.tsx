/**
 * Footer Component - Credits, Links, Legal
 */

import React from 'react';
import './Footer.css';

export const Footer: React.FC = () => {
  return (
    <footer className="app-footer">
      <div className="footer-content">
        <div className="footer-section">
          <h4>Eternal Echoes</h4>
          <p className="footer-tagline">
            Making history verifiable through collaborative, AI-verified NFTs
          </p>
          <p className="beta-notice">
            🚧 <strong>Beta Software:</strong> Features may change. Use at your own risk.
          </p>
        </div>

        <div className="footer-section">
          <h4>Powered By</h4>
          <div className="footer-credits">
            <a href="https://archive.org" target="_blank" rel="noopener noreferrer">
              <img src="/logos/internet-archive.svg" alt="Internet Archive" className="credit-logo" />
              Internet Archive
            </a>
            <a href="https://x.ai" target="_blank" rel="noopener noreferrer">
              <img src="/logos/xai.svg" alt="xAI" className="credit-logo" />
              xAI Grok
            </a>
            <a href="https://helius.dev" target="_blank" rel="noopener noreferrer">
              <img src="/logos/helius.svg" alt="Helius" className="credit-logo" />
              Helius
            </a>
            <a href="https://metaplex.com" target="_blank" rel="noopener noreferrer">
              <img src="/logos/metaplex.svg" alt="Metaplex" className="credit-logo" />
              Metaplex
            </a>
            <a href="https://solana.com" target="_blank" rel="noopener noreferrer">
              <img src="/logos/solana.svg" alt="Solana" className="credit-logo" />
              Solana
            </a>
          </div>
        </div>

        <div className="footer-section">
          <h4>Legal</h4>
          <nav className="footer-links">
            <a href="/terms">Terms of Service</a>
            <a href="/privacy">Privacy Policy</a>
            <a href="/dmca">DMCA Policy</a>
            <a href="/disclaimer">Disclaimers</a>
          </nav>
        </div>

        <div className="footer-section">
          <h4>Resources</h4>
          <nav className="footer-links">
            <a href="/docs">Documentation</a>
            <a href="/api">API Reference</a>
            <a href="/support">Support</a>
            <a href="https://github.com/nftsol/eternal-echoes" target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
          </nav>
        </div>

        <div className="footer-section">
          <h4>Contact</h4>
          <nav className="footer-links">
            <a href="mailto:support@nftsol.com">support@nftsol.com</a>
            <a href="https://twitter.com/nftsol" target="_blank" rel="noopener noreferrer">
              Twitter
            </a>
            <a href="https://discord.gg/nftsol" target="_blank" rel="noopener noreferrer">
              Discord
            </a>
          </nav>
        </div>
      </div>

      <div className="footer-bottom">
        <p className="footer-copyright">
          © {new Date().getFullYear()} NFTSol. All rights reserved.
        </p>
        <p className="footer-disclaimer">
          ⚠️ <strong>Disclaimer:</strong> Truth scores are AI-generated estimates, not verified facts. 
          NFTs are risky investments. Always verify information independently.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
