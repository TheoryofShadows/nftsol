import React from 'react';
import '../styles/SolanaSection.css';

export default function SolanaSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="solana-section">
      <h2 className="sla-text-gradient solana-section-title">
        {title}
      </h2>
      <div className="sla-card solana-section-card">
        {children}
      </div>
    </section>
  );
}
