/**
 * Tests: Truth Score produces varied, content-specific output
 *
 * Verifies that different items get different scores, summaries, and evidence —
 * the core fix for the "repetitive output" bug.
 */

import { describe, it, expect } from '@jest/globals';
import {
  GrokArchiveVerificationService,
  ArchiveMediaItem,
} from '../../services/archive-grok-echo-integration';

function makeItem(overrides: Partial<ArchiveMediaItem> = {}): ArchiveMediaItem {
  return {
    identifier: 'test-item',
    title: 'Untitled',
    description: '',
    creator: 'Unknown',
    mediaType: 'image',
    downloads: 0,
    url: 'https://archive.org/download/test-item',
    licenseType: 'public-domain',
    archiveUrl: 'https://archive.org/details/test-item',
    metadata: {},
    ...overrides,
  };
}

describe('Truth Score Variation', () => {
  const service = new GrokArchiveVerificationService('');

  it('produces different scores for items with different metadata richness', async () => {
    const sparseItem = makeItem({
      identifier: 'sparse-item',
      title: 'A Photo',
      description: '',
      creator: 'Unknown',
      downloads: 0,
      licenseType: 'cc-by-nc',
    });

    const richItem = makeItem({
      identifier: 'rich-item',
      title: 'NASA Apollo 11 Mission Footage',
      description: 'Original footage from the Apollo 11 mission showing the lunar landing. Sourced from NASA archives with full provenance chain documented.',
      creator: 'NASA',
      downloads: 150000,
      licenseType: 'public-domain',
      publicDate: '1969-07-20',
    });

    const sparseResult = await service.verifyArchiveContent(sparseItem);
    const richResult = await service.verifyArchiveContent(richItem);

    expect(richResult.truthScore).toBeGreaterThan(sparseResult.truthScore);
  });

  it('produces content-specific summaries, not generic templates', async () => {
    const item = makeItem({
      title: 'Vintage Jazz Recording 1952',
      creator: 'Duke Ellington',
      description: 'Live performance at the Cotton Club, digitized from original vinyl.',
      downloads: 5000,
      licenseType: 'public-domain',
    });

    const result = await service.verifyArchiveContent(item);

    expect(result.summary).toBeTruthy();
    expect(result.summary).toContain('Vintage Jazz Recording 1952');
    expect(result.summary).not.toBe('Heuristic estimate (AI verifier unavailable): ' + result.truthScore + '% based on Internet Archive metadata.');
  });

  it('includes content-specific evidence points', async () => {
    const item = makeItem({
      title: 'Historical Speech',
      creator: 'Winston Churchill',
      description: 'Address to Parliament during wartime.',
      downloads: 25000,
      licenseType: 'public-domain',
      publicDate: '1940-06-04',
    });

    const result = await service.verifyArchiveContent(item);

    expect(result.originAnalysis.supportingEvidence.length).toBeGreaterThan(0);
    const evidenceText = result.originAnalysis.supportingEvidence.join(' ');
    expect(evidenceText).toContain('Winston Churchill');
  });

  it('returns dimensions breakdown in heuristic fallback', async () => {
    const item = makeItem({
      title: 'Test Item',
      creator: 'Test Creator',
      downloads: 500,
      licenseType: 'cc-by',
    });

    const result = await service.verifyArchiveContent(item);

    expect(result.dimensions).toBeDefined();
    expect(result.dimensions!.authenticity).toBeGreaterThan(0);
    expect(result.dimensions!.originConfidence).toBeGreaterThan(0);
    expect(result.dimensions!.sourceReliability).toBeGreaterThan(0);
    expect(result.dimensions!.contentQuality).toBeGreaterThan(0);
  });

  it('flags items with missing creator attribution', async () => {
    const item = makeItem({
      title: 'Unknown Source Image',
      creator: 'Unknown',
      description: '',
      downloads: 2,
    });

    const result = await service.verifyArchiveContent(item);

    expect(result.concerns).toBeDefined();
    const concerns = result.concerns!;
    const hasCreatorConcern = concerns.some(c =>
      c.toLowerCase().includes('creator') || c.toLowerCase().includes('origin')
    );
    expect(hasCreatorConcern).toBe(true);
  });

  it('gives higher source reliability to public domain items', async () => {
    const pdItem = makeItem({ licenseType: 'public-domain', title: 'PD Item' });
    const ccItem = makeItem({ licenseType: 'cc-by-nc', title: 'CC Item' });

    const pdResult = await service.verifyArchiveContent(pdItem);
    const ccResult = await service.verifyArchiveContent(ccItem);

    expect(pdResult.dimensions!.sourceReliability).toBeGreaterThan(
      ccResult.dimensions!.sourceReliability
    );
  });
});
