import React from 'react';
import { usePhantom } from '../wallet/usePhantom';

export default function PhantomConnect() {
  const { connect, disconnect, connected, pubkey, isExpectedWallet } = usePhantom();

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '1rem'
    }}>
      {connected ? (
        <>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(255, 255, 255, 0.1)',
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: isExpectedWallet ? '#4ade80' : '#f59e0b'
            }} />
            <span style={{ color: 'white', fontSize: '0.9rem' }}>
              {pubkey ? `${pubkey.slice(0, 4)}...${pubkey.slice(-4)}` : 'Connected'}
            </span>
          </div>
          <button
            onClick={disconnect}
            style={{
              padding: '0.5rem 1rem',
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            Disconnect
          </button>
        </>
      ) : (
        <button
          onClick={connect}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'linear-gradient(45deg, #667eea, #764ba2)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: 'bold',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <span>🦄</span>
          Connect Phantom
        </button>
      )}
    </div>
  );
}