/**
 * Regression test for the faked remix verification score.
 *
 * Previously, POST /api/echo/remix hardcoded `grokVerified: true` and
 * `verificationScore: 85` on every remix. `deriveRemixScore` now computes the
 * score from the parent ledger's real verification, so a remix never claims more
 * authenticity than its source and is never a flat 85.
 */
import { deriveRemixScore } from '../utils/remixScore';
import { EchoRow } from '../services/echoStore';

function makeEcho(overrides: Partial<EchoRow>): EchoRow {
  return {
    id: 'id',
    ledgerId: 'ledger',
    echoData: 'data',
    echoType: 'Text',
    dataHash: [],
    contributor: 'wallet',
    grokVerified: false,
    verificationScore: 0,
    timestamp: new Date(),
    ...overrides,
  } as EchoRow;
}

describe('deriveRemixScore', () => {
  it('inherits the base video echo score (not a hardcoded 85)', () => {
    const parent = [
      makeEcho({ echoType: 'Text', verificationScore: 40 }),
      makeEcho({ echoType: 'Video', videoUri: 'ipfs://x', verificationScore: 92 }),
    ];
    const result = deriveRemixScore(parent);
    expect(result.score).toBe(92);
    expect(result.verified).toBe(true);
    expect(result.score).not.toBe(85);
  });

  it('averages parent scores when there is no scored base video', () => {
    const parent = [
      makeEcho({ echoType: 'Text', verificationScore: 50 }),
      makeEcho({ echoType: 'Text', verificationScore: 70 }),
    ];
    const result = deriveRemixScore(parent);
    expect(result.score).toBe(60); // (50 + 70) / 2
    expect(result.verified).toBe(false); // 60 < 70 threshold
  });

  it('falls back to a conservative, unverified value when parent has no scores', () => {
    const parent = [makeEcho({ echoType: 'Text', verificationScore: 0 })];
    const result = deriveRemixScore(parent);
    expect(result.score).toBe(60);
    expect(result.verified).toBe(false);
    expect(result.score).not.toBe(85);
  });

  it('never inflates above the parent and clamps to 0-100', () => {
    const parent = [makeEcho({ echoType: 'Video', videoUri: 'x', verificationScore: 100 })];
    const result = deriveRemixScore(parent);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.score).toBe(100);
  });

  it('produces different scores for different parents', () => {
    const a = deriveRemixScore([makeEcho({ echoType: 'Video', videoUri: 'x', verificationScore: 75 })]);
    const b = deriveRemixScore([makeEcho({ echoType: 'Video', videoUri: 'x', verificationScore: 95 })]);
    expect(a.score).not.toBe(b.score);
  });
});
