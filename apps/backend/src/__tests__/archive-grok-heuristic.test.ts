/**
 * Regression test for the "everything scores 85%" bug.
 *
 * Previously, when the xAI/Grok verifier was unavailable (no/invalid API key),
 * `verifyArchiveContent` returned a hardcoded `truthScore: 85` for every item.
 * The fallback now computes a deterministic heuristic that varies per item and
 * is explicitly labelled `method: 'heuristic'`. These tests force the fallback
 * path by making the API call reject, then assert scores differ and are never 85.
 */
import axios from 'axios';
import {
  GrokArchiveVerificationService,
  ArchiveMediaItem,
} from '../services/archive-grok-echo-integration';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

function makeItem(overrides: Partial<ArchiveMediaItem>): ArchiveMediaItem {
  return {
    identifier: 'item-id',
    title: 'Title',
    description: '',
    creator: '',
    mediaType: 'text',
    downloads: 0,
    url: 'https://archive.org/details/item-id',
    licenseType: 'cc-by-nc',
    archiveUrl: 'https://archive.org/details/item-id',
    metadata: {},
    ...overrides,
  };
}

describe('verifyArchiveContent heuristic fallback (AI verifier unavailable)', () => {
  beforeEach(() => {
    // Simulate the xAI call failing (e.g. missing/invalid API key) so the
    // heuristic fallback path runs.
    mockedAxios.post.mockRejectedValue(new Error('401 missing api key'));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('does not return the hardcoded 85 and scales with provenance signals', async () => {
    const svc = new GrokArchiveVerificationService('');

    const weak = await svc.verifyArchiveContent(
      makeItem({ licenseType: 'cc-by-nc', downloads: 0 }),
    );
    const strong = await svc.verifyArchiveContent(
      makeItem({
        licenseType: 'public-domain',
        downloads: 250000,
        creator: 'NASA',
        description: 'x'.repeat(500),
        publicDate: '1969-07-20',
      }),
    );

    expect(weak.method).toBe('heuristic');
    expect(strong.method).toBe('heuristic');
    expect(weak.truthScore).not.toBe(85);
    expect(strong.truthScore).not.toBe(85);
    // A rich, public-domain, heavily-downloaded item should outscore a bare one.
    expect(strong.truthScore).toBeGreaterThan(weak.truthScore);

    for (const r of [weak, strong]) {
      expect(r.truthScore).toBeGreaterThanOrEqual(0);
      expect(r.truthScore).toBeLessThanOrEqual(100);
    }
  });

  it('produces distinct scores across varied items', async () => {
    const svc = new GrokArchiveVerificationService('');
    const items = [
      makeItem({ licenseType: 'cc-by-nc', downloads: 0 }),
      makeItem({ licenseType: 'cc-by', downloads: 1500, creator: 'Someone' }),
      makeItem({
        licenseType: 'public-domain',
        downloads: 120000,
        creator: 'NASA',
        description: 'y'.repeat(450),
        publicDate: '1970',
      }),
    ];

    const scores: number[] = [];
    for (const it of items) {
      scores.push((await svc.verifyArchiveContent(it)).truthScore);
    }

    expect(new Set(scores).size).toBeGreaterThan(1);
    expect(scores.every((s) => s === 85)).toBe(false);
  });

  it('is deterministic for the same input', async () => {
    const svc = new GrokArchiveVerificationService('');
    const item = makeItem({ licenseType: 'cc-by', downloads: 5000, creator: 'Archive' });
    const a = await svc.verifyArchiveContent(item);
    const b = await svc.verifyArchiveContent(item);
    expect(a.truthScore).toBe(b.truthScore);
  });
});
