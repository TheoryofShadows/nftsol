import React from "react";
import SolanaHeader from "./components/SolanaHeader";
import SolanaSection from "./components/SolanaSection";
import PhantomConnect from "./components/PhantomConnect";
import MintForm from "./components/MintForm";
import ProxyCheck from "./components/ProxyCheck";
import CloutBadge from "./components/CloutBadge";

export default function App() {
  return (
    <div style={{ padding: 24, fontFamily: "system-ui, Segoe UI, Arial" }}>
      <SolanaHeader />

      <SolanaSection title="Wallet">
        <PhantomConnect />
      </SolanaSection>

      <SolanaSection title="Mint Demo NFT">
        <MintForm />
      </SolanaSection>

      <SolanaSection title="Proxy Health">
        <ProxyCheck />
      </SolanaSection>

      <div style={{ marginTop: 24 }}>
        <CloutBadge />
      </div>
    </div>
  );
}
