/**
 * DMCA Policy & Takedown Form
 */

import React, { useState } from 'react';
import './LegalPage.css';

export const DMCA: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In production, this would send to backend
    setSubmitted(true);
    alert('Thank you. Your DMCA notice has been submitted and will be reviewed within 48 hours.');
  };

  return (
    <div className="legal-page">
      <div className="legal-header">
        <h1>DMCA Policy</h1>
        <p className="legal-updated">Last Updated: {new Date().toLocaleDateString()}</p>
      </div>

      <div className="legal-content">
        <section>
          <h2>Copyright Compliance</h2>
          <p>
            Eternal Echoes respects intellectual property rights and complies with the Digital Millennium 
            Copyright Act (DMCA). We only allow public domain content (pre-1923 or explicitly public domain).
          </p>
          <p>
            <strong>Source:</strong> All videos are sourced from{' '}
            <a href="https://archive.org" target="_blank">Internet Archive</a>, which hosts public domain materials. 
            Users must verify copyright status before minting.
          </p>
        </section>

        <section>
          <h2>Reporting Copyright Infringement</h2>
          <p>
            If you believe content on Eternal Echoes infringes your copyright, submit a DMCA takedown notice below or email:
          </p>
          <p className="contact-box">
            <strong>DMCA Agent:</strong> [Your Name]<br />
            <strong>Email:</strong> <a href="mailto:dmca@nftsol.com">dmca@nftsol.com</a><br />
            <strong>Address:</strong> [Your Physical Address]<br />
          </p>
        </section>

        <section>
          <h2>Required Information (17 U.S.C. § 512(c)(3))</h2>
          <p>Your notice must include:</p>
          <ol>
            <li>Physical or electronic signature of copyright owner</li>
            <li>Description of copyrighted work claimed to be infringed</li>
            <li>URL or description of infringing material on our site</li>
            <li>Your contact information (address, phone, email)</li>
            <li>Statement of good faith belief that use is not authorized</li>
            <li>Statement that information is accurate and you are authorized to act</li>
          </ol>
        </section>

        <section>
          <h2>DMCA Takedown Form</h2>
          {!submitted ? (
            <form className="dmca-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Your Name *</label>
                <input type="text" id="name" required />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input type="email" id="email" required />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone</label>
                <input type="tel" id="phone" />
              </div>

              <div className="form-group">
                <label htmlFor="address">Address *</label>
                <textarea id="address" rows={3} required></textarea>
              </div>

              <div className="form-group">
                <label htmlFor="work">Description of Copyrighted Work *</label>
                <textarea id="work" rows={4} required placeholder="Describe the original work you own..."></textarea>
              </div>

              <div className="form-group">
                <label htmlFor="infringing">Infringing Material (URL or NFT ID) *</label>
                <input type="text" id="infringing" required placeholder="https://nftsol.com/echo/..." />
              </div>

              <div className="form-group">
                <label htmlFor="evidence">Proof of Copyright Ownership</label>
                <textarea id="evidence" rows={3} placeholder="Copyright registration number, links to original work, etc."></textarea>
              </div>

              <div className="form-group checkbox">
                <label>
                  <input type="checkbox" required />
                  I have a good faith belief that use of the material is not authorized by the copyright owner.
                </label>
              </div>

              <div className="form-group checkbox">
                <label>
                  <input type="checkbox" required />
                  The information in this notice is accurate, and under penalty of perjury, I am authorized to act 
                  on behalf of the copyright owner.
                </label>
              </div>

              <div className="form-group">
                <label htmlFor="signature">Electronic Signature (type your full name) *</label>
                <input type="text" id="signature" required placeholder="John Doe" />
              </div>

              <button type="submit" className="btn-submit">
                Submit DMCA Notice
              </button>
            </form>
          ) : (
            <div className="dmca-success">
              <h3>✅ Notice Submitted</h3>
              <p>Your DMCA takedown notice has been received. We will:</p>
              <ul>
                <li>Review within <strong>48 hours</strong></li>
                <li>Remove infringing content if valid</li>
                <li>Notify the uploader (counter-notice option)</li>
                <li>Email you confirmation</li>
              </ul>
            </div>
          )}
        </section>

        <section>
          <h2>Counter-Notices</h2>
          <p>
            If your content was removed due to a DMCA notice and you believe it was a mistake, you may submit a 
            counter-notice to <a href="mailto:dmca@nftsol.com">dmca@nftsol.com</a>.
          </p>
          <p>
            Include the same information as above, plus a statement consenting to jurisdiction of federal court.
          </p>
        </section>

        <section>
          <h2>Repeat Infringers</h2>
          <p>
            Users who repeatedly infringe copyright will have their accounts terminated.
          </p>
        </section>
      </div>

      <div className="legal-footer">
        <p>
          <strong>Note:</strong> DMCA notices are legal documents. False claims may result in liability 
          for damages (including costs and attorney fees).
        </p>
        <button className="btn-back" onClick={() => window.history.back()}>
          ← Back to App
        </button>
      </div>
    </div>
  );
};

export default DMCA;
