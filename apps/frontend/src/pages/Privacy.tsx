/**
 * Privacy Policy Page - GDPR/CCPA Compliant
 */

import React from 'react';
import './LegalPage.css';

export const Privacy: React.FC = () => {
  return (
    <div className="legal-page">
      <div className="legal-header">
        <h1>Privacy Policy</h1>
        <p className="legal-updated">Last Updated: {new Date().toLocaleDateString()}</p>
        <p className="gdpr-notice">
          🇪🇺 We comply with GDPR (EU) and CCPA (California).
        </p>
      </div>

      <div className="legal-content">
        <section>
          <h2>1. Information We Collect</h2>
          
          <h3>Automatically Collected:</h3>
          <ul>
            <li><strong>Wallet Address:</strong> Your Solana wallet public key (required for NFT minting)</li>
            <li><strong>IP Address:</strong> For analytics and security (anonymized after 30 days)</li>
            <li><strong>Usage Data:</strong> Pages visited, clicks, time spent (via Google Analytics)</li>
            <li><strong>Device Info:</strong> Browser type, OS, screen size (for optimization)</li>
          </ul>

          <h3>User-Provided:</h3>
          <ul>
            <li><strong>Echo Content:</strong> Text, annotations you add to NFTs (stored on-chain, public)</li>
            <li><strong>Email (optional):</strong> If you contact support</li>
          </ul>
        </section>

        <section>
          <h2>2. How We Use Your Data</h2>
          <ul>
            <li><strong>Core Functionality:</strong> Minting NFTs, adding echoes, CLOUT rewards</li>
            <li><strong>AI Verification:</strong> Sending content to xAI Grok for truth scoring</li>
            <li><strong>Analytics:</strong> Understanding user behavior to improve the Service</li>
            <li><strong>Security:</strong> Preventing fraud, abuse, and attacks</li>
            <li><strong>Communication:</strong> Support responses, important updates (if you provided email)</li>
          </ul>
        </section>

        <section>
          <h2>3. Third-Party Services</h2>
          <p>Your data may be shared with:</p>
          <ul>
            <li><strong>xAI (Grok):</strong> Video descriptions and echo text for AI verification</li>
            <li><strong>Helius:</strong> Solana RPC queries (wallet addresses, transaction data)</li>
            <li><strong>Supabase:</strong> Database hosting (wallet addresses, echo content)</li>
            <li><strong>Google Analytics:</strong> Anonymized usage statistics</li>
            <li><strong>Sentry:</strong> Error reports (no personal data)</li>
          </ul>
          <p>
            These providers have their own privacy policies. We recommend reviewing them:
          </p>
          <ul>
            <li><a href="https://x.ai/privacy" target="_blank">xAI Privacy Policy</a></li>
            <li><a href="https://helius.dev/privacy" target="_blank">Helius Privacy Policy</a></li>
            <li><a href="https://supabase.com/privacy" target="_blank">Supabase Privacy Policy</a></li>
          </ul>
        </section>

        <section>
          <h2>4. Data Storage & Security</h2>
          <ul>
            <li><strong>On-Chain Data:</strong> NFTs and echoes are stored permanently on Solana blockchain (public, immutable)</li>
            <li><strong>Off-Chain Data:</strong> Databases hosted on EU/US servers (Supabase)</li>
            <li><strong>Encryption:</strong> HTTPS for all traffic, encrypted database connections</li>
            <li><strong>Retention:</strong> We retain data for 2 years after last activity, then delete</li>
          </ul>
          <p className="warning">
            ⚠️ <strong>Blockchain is permanent.</strong> Once an NFT or echo is minted, it cannot be deleted.
          </p>
        </section>

        <section>
          <h2>5. Your Rights (GDPR/CCPA)</h2>
          <p>You have the right to:</p>
          <ul>
            <li><strong>Access:</strong> Request a copy of your data (email support@nftsol.com)</li>
            <li><strong>Correction:</strong> Update inaccurate data</li>
            <li><strong>Deletion:</strong> Request deletion of off-chain data (on-chain data cannot be deleted)</li>
            <li><strong>Export:</strong> Download your data in machine-readable format (JSON)</li>
            <li><strong>Opt-Out:</strong> Disable analytics cookies (see cookie settings)</li>
            <li><strong>Objection:</strong> Object to processing for marketing (we don't do marketing)</li>
          </ul>
          <p>
            To exercise these rights, email <a href="mailto:privacy@nftsol.com">privacy@nftsol.com</a> with your wallet address.
          </p>
        </section>

        <section>
          <h2>6. Cookies & Tracking</h2>
          <p>We use cookies for:</p>
          <ul>
            <li><strong>Essential:</strong> User consent, wallet connection (required)</li>
            <li><strong>Analytics:</strong> Google Analytics (optional, you can opt-out)</li>
          </ul>
          <p>
            We do <strong>not</strong> use tracking for advertising. You can manage cookie preferences in your browser.
          </p>
        </section>

        <section>
          <h2>7. Children's Privacy</h2>
          <p>
            The Service is not intended for users under 18. We do not knowingly collect data from minors.
            If we discover underage data, we will delete it immediately.
          </p>
        </section>

        <section>
          <h2>8. Data Breaches</h2>
          <p>
            In the event of a data breach, we will notify affected users within 72 hours (as required by GDPR) 
            via email or on-site notice.
          </p>
        </section>

        <section>
          <h2>9. International Transfers</h2>
          <p>
            Your data may be transferred to servers outside your country. We use EU-approved safeguards 
            (Standard Contractual Clauses) for international transfers.
          </p>
        </section>

        <section>
          <h2>10. Changes to Privacy Policy</h2>
          <p>
            We may update this policy. We will notify you of significant changes via email (if provided) 
            or prominent notice on the site.
          </p>
        </section>

        <section>
          <h2>11. Contact & Complaints</h2>
          <p>
            <strong>Privacy Questions:</strong> <a href="mailto:privacy@nftsol.com">privacy@nftsol.com</a>
          </p>
          <p>
            <strong>Data Protection Officer:</strong> [DPO Name/Email if applicable]
          </p>
          <p>
            <strong>EU Users:</strong> You have the right to lodge a complaint with your local Data Protection Authority.
          </p>
        </section>
      </div>

      <div className="legal-footer">
        <p>
          By using Eternal Echoes, you consent to this Privacy Policy.
        </p>
        <button className="btn-back" onClick={() => window.history.back()}>
          ← Back to App
        </button>
      </div>
    </div>
  );
};

export default Privacy;
