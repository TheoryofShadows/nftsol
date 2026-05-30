/**
 * Unit Tests: redactRpcUrl
 *
 * Guards against leaking the Helius (or similar) API key embedded in RPC URLs
 * when those URLs are logged. (CodeQL: clear-text logging of sensitive info.)
 */

import { describe, it, expect } from '@jest/globals';
import { redactRpcUrl } from '../../utils/logger';

describe('redactRpcUrl', () => {
  it('redacts a Helius api-key query parameter', () => {
    const out = redactRpcUrl('https://mainnet.helius-rpc.com/?api-key=supersecret123');
    expect(out).toBe('https://mainnet.helius-rpc.com/?api-key=[REDACTED]');
    expect(out).not.toContain('supersecret123');
  });

  it('redacts api-key even when followed by another query param', () => {
    const out = redactRpcUrl('https://rpc.example.com/?api-key=abc123&commitment=confirmed');
    expect(out).toContain('api-key=[REDACTED]');
    expect(out).toContain('commitment=confirmed');
    expect(out).not.toContain('abc123');
  });

  it('redacts access-token style secrets too', () => {
    expect(redactRpcUrl('https://rpc.example.com/?access-token=zzz')).toBe(
      'https://rpc.example.com/?access-token=[REDACTED]',
    );
  });

  it('leaves a secret-free public RPC URL unchanged', () => {
    const url = 'https://api.mainnet-beta.solana.com';
    expect(redactRpcUrl(url)).toBe(url);
  });

  it('handles empty input safely', () => {
    expect(redactRpcUrl('')).toBe('');
  });
});
