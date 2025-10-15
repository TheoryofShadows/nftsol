import React from 'react';
import { usePhantom } from '../wallet/usePhantom';

export default function PhantomConnect() {
  const { connect, disconnect, connected, pubkey, isExpectedWallet } = usePhantom();

  return (
    <div style={{ padding: 20, background: '#111827', color: 'white', borderRadius: 8 }}>
      <h3>🪙 Phantom Wallet</h3>
      {connected ? (
        <>
          <p>Connected: <b>{pubkey}</b></p>
          {isExpectedWallet ? (
            <p style={{ color: 'lime' }}>✅ Matches devnet wallet</p>
          ) : (
            <p style={{ color: 'orange' }}>⚠️ Different wallet than devnet key</p>
          )}
          <button onClick={disconnect} style={{ padding: '8px 12px', marginTop: 10 }}>Disconnect</button>
        </>
      ) : (
        <button onClick={connect} style={{ padding: '8px 12px', marginTop: 10 }}>Connect Phantom</button>
      )}
    </div>
  );
}
