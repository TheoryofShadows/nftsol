/**
 * Terms of Service Page
 */

import React from 'react';
import './LegalPage.css';

export const Terms: React.FC = () => {
  return (
    <div className="legal-page">
      <div className="legal-header">
        <h1>Terms of Service</h1>
        <p className="legal-updated">Last Updated: {new Date().toLocaleDateString()}</p>
        <p className="beta-notice">
          🚧 Eternal Echoes is in <strong>BETA</strong>. These terms may change.
        </p>
      </div>

      <div className="legal-content">
        <section>
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using Eternal Echoes ("the Service"), you agree to be bound by these 
            Terms of Service. If you do not agree, do not use the Service.
          </p>
        </section>

        <section>
          <h2>2. Beta Software Disclaimer</h2>
          <p>
            Eternal Echoes is <strong>beta software</strong>. The Service is provided "AS IS" without 
            warranties of any kind. Features may change, bugs may occur, and the Service may be 
            discontinued at any time without notice.
          </p>
          <p className="warning">
            ⚠️ <strong>Use at your own risk.</strong> We are not liable for any losses, damages, or 
            issues arising from your use of the Service.
          </p>
        </section>

        <section>
          <h2>3. Eligibility</h2>
          <p>You must be at least 18 years old and legally capable of entering into contracts to use the Service.</p>
        </section>

        <section>
          <h2>4. User Responsibilities</h2>
          <p>You agree to:</p>
          <ul>
            <li><strong>Only mint public domain content</strong> (pre-1923 or explicitly public domain)</li>
            <li><strong>Not upload copyrighted, illegal, or offensive material</strong></li>
            <li><strong>Respect Internet Archive's terms of service</strong> when sourcing content</li>
            <li><strong>Not abuse the Service</strong> (e.g., spam, exploits, attacks)</li>
            <li><strong>Be responsible for your wallet security</strong> (we cannot recover lost funds)</li>
          </ul>
        </section>

        <section>
          <h2>5. Intellectual Property</h2>
          <p>
            <strong>You own your echoes.</strong> Content you create (echo text, annotations) is your 
            intellectual property. By submitting content, you grant us a non-exclusive, worldwide license 
            to display and distribute it as part of the Service.
          </p>
          <p>
            <strong>Solana blockchain:</strong> NFTs are stored on-chain. Once minted, they cannot be deleted 
            by us (blockchain is permanent).
          </p>
        </section>

        <section>
          <h2>6. AI Verification & Truth Scores</h2>
          <p className="warning">
            ⚠️ <strong>Truth scores are AI-generated estimates, not verified facts.</strong> Scores are provided 
            by xAI Grok and may be inaccurate. We do not guarantee accuracy, completeness, or reliability of 
            AI-generated content.
          </p>
          <p>
            Always verify important information through independent, authoritative sources.
          </p>
        </section>

        <section>
          <h2>7. Financial Risks</h2>
          <p className="warning">
            ⚠️ <strong>NFTs are risky investments.</strong> Values can go to zero. Only invest what you can 
            afford to lose. We are not financial advisors and do not provide investment advice.
          </p>
          <p>
            <strong>Fees:</strong> The Service charges 1% transaction fees and 5% royalties on secondary sales. 
            Fees are subject to change.
          </p>
        </section>

        <section>
          <h2>8. DMCA & Copyright Compliance</h2>
          <p>
            We comply with the Digital Millennium Copyright Act (DMCA). If you believe content infringes your 
            copyright, submit a takedown notice to <a href="mailto:dmca@nftsol.com">dmca@nftsol.com</a>.
          </p>
          <p>
            See our <a href="/dmca">DMCA Policy</a> for details.
          </p>
        </section>

        <section>
          <h2>9. Privacy & Data</h2>
          <p>
            We collect wallet addresses, usage data, and echo content. See our{' '}
            <a href="/privacy">Privacy Policy</a> for details.
          </p>
        </section>

        <section>
          <h2>10. Termination</h2>
          <p>
            We may suspend or terminate your access to the Service at any time for violations of these terms 
            or illegal activity.
          </p>
        </section>

        <section>
          <h2>11. Limitation of Liability</h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE ARE NOT LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, 
            OR CONSEQUENTIAL DAMAGES ARISING FROM YOUR USE OF THE SERVICE. THIS INCLUDES LOSS OF FUNDS, DATA, 
            OR BUSINESS OPPORTUNITIES.
          </p>
          <p>
            OUR TOTAL LIABILITY SHALL NOT EXCEED $100 USD.
          </p>
        </section>

        <section>
          <h2>12. Dispute Resolution</h2>
          <p>
            Any disputes shall be resolved through binding arbitration in [Your Jurisdiction]. You waive the 
            right to participate in class actions.
          </p>
        </section>

        <section>
          <h2>13. Changes to Terms</h2>
          <p>
            We may update these terms at any time. Continued use of the Service constitutes acceptance of new terms.
          </p>
        </section>

        <section>
          <h2>14. Contact</h2>
          <p>
            Questions? Contact us at <a href="mailto:support@nftsol.com">support@nftsol.com</a>.
          </p>
        </section>
      </div>

      <div className="legal-footer">
        <p>
          By using Eternal Echoes, you acknowledge that you have read, understood, and agree to these Terms of Service.
        </p>
        <button className="btn-back" onClick={() => window.history.back()}>
          ← Back to App
        </button>
      </div>
    </div>
  );
};

export default Terms;
