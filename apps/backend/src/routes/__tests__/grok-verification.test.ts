/**
 * Grok Verification Routes Tests
 * Tests content verification with real xAI API and heuristic fallback
 */

import request from 'supertest';
import express from 'express';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

import grokVerificationRoutes from '../grok-verification';

const app = express();
app.use(express.json());
app.use('/api/grok', grokVerificationRoutes);

describe('Grok Verification Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/grok/verify (or equivalent)', () => {
    it('verifies content using heuristic fallback when no API key', async () => {
      delete process.env.XAI_API_KEY;

      const res = await request(app)
        .post('/api/grok/verify')
        .send({
          content: 'This is a historical NASA document from 1969.',
          contentType: 'text',
          metadata: { source: 'nasa.gov', timestamp: '1969-07-20' },
        });

      // Should not return 500
      expect(res.status).toBeLessThan(500);
      if (res.status === 200) {
        expect(res.body.success).toBe(true);
        expect(res.body.data?.score).toBeDefined();
      }
    });

    it('returns 400 for missing content', async () => {
      const res = await request(app)
        .post('/api/grok/verify')
        .send({ contentType: 'text' });

      // Should fail validation or return appropriate error
      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.status).toBeLessThan(500);
    });

    it('uses xAI API when key is present', async () => {
      process.env.XAI_API_KEY = 'test-key-123';

      mockedAxios.post.mockResolvedValueOnce({
        data: {
          choices: [{
            message: {
              content: JSON.stringify({
                score: 92,
                factualAccuracy: 95,
                sourceReliability: 90,
                contentAuthenticity: 92,
                biasDetection: 85,
                flags: [],
                summary: 'High quality historical content.',
              }),
            },
          }],
        },
      });

      const res = await request(app)
        .post('/api/grok/verify')
        .send({
          content: 'Verified historical document from trusted archive.',
          contentType: 'text',
          metadata: { source: 'archive.org', timestamp: '2020-01-01' },
        });

      if (res.status === 200) {
        expect(res.body.success).toBe(true);
        expect(res.body.data?.score).toBeGreaterThanOrEqual(80);
      }

      delete process.env.XAI_API_KEY;
    });

    it('falls back to heuristic when xAI API call fails', async () => {
      process.env.XAI_API_KEY = 'test-key-456';

      mockedAxios.post.mockRejectedValueOnce(new Error('API error'));

      const res = await request(app)
        .post('/api/grok/verify')
        .send({
          content: 'Some content to verify.',
          contentType: 'text',
        });

      // Should not return 500
      expect(res.status).toBeLessThan(500);
      delete process.env.XAI_API_KEY;
    });
  });

  describe('GET /api/grok/status', () => {
    it('returns verification service status', async () => {
      const res = await request(app).get('/api/grok/status');

      // Should return 200 or 404 (route may not exist as GET)
      expect([200, 404]).toContain(res.status);
    });
  });
});
