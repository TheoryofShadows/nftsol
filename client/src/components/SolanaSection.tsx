import React from 'react';
export default function SolanaSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ maxWidth: 1200, margin: '24px auto', padding: 16 }}>
      <h2 className="sla-text-gradient" style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>
        {title}
      </h2>
      <div className="sla-card" style={{ padding: 16 }}>
        {children}
      </div>
    </section>
  );
}
