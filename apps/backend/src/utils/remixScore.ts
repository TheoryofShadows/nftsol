import type { EchoRow } from '../services/echoStore';

const FALLBACK_SCORE = 60; // conservative, below the 70 "verified" threshold
const VERIFIED_THRESHOLD = 70;

/**
 * Derive a remix's verification score from its parent ledger's real, already-computed
 * verification — a remix must never claim higher authenticity than its source, and the
 * score must never be a hardcoded value. Prefers the base video echo's score, else the
 * average of the parent echoes' scores. Falls back to a conservative, unverified value
 * when the parent carries no scores.
 *
 * Lives in its own side-effect-free module (only a type import) so it can be unit
 * tested without booting the echo router / database pool.
 */
export function deriveRemixScore(parentEchoes: EchoRow[]): { score: number; verified: boolean } {
  const baseVideoEcho = parentEchoes.find((e) => e.echoType === 'Video' || e.videoUri);
  const baseScore = baseVideoEcho?.verificationScore;

  let score: number;
  if (typeof baseScore === 'number' && baseScore > 0) {
    score = baseScore;
  } else {
    const scored = parentEchoes
      .map((e) => e.verificationScore)
      .filter((s): s is number => typeof s === 'number' && s > 0);
    score = scored.length
      ? Math.round(scored.reduce((sum, s) => sum + s, 0) / scored.length)
      : FALLBACK_SCORE;
  }

  score = Math.max(0, Math.min(100, score));
  return { score, verified: score >= VERIFIED_THRESHOLD };
}
