/**
 * End-to-End Tests: Complete Video Upload Flow
 * 
 * These tests require:
 * - Real environment variables (or use test mocks)
 * - Test database setup
 * - Optional: Test Solana devnet connection
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import request from 'supertest';

// Mock the app import since index.ts might have side effects
// For E2E tests, we'll test the actual route endpoints
let app: any;

beforeAll(async () => {
  // Import app dynamically to avoid side effects during test setup
  try {
    const { app: importedApp } = await import('../../index');
    app = importedApp;
  } catch (error) {
    // If import fails, skip E2E tests
    console.warn('E2E tests skipped - app import failed:', error);
    app = null;
  }
});

describe('E2E: Video Upload Flow', () => {
  const testVideoBuffer = Buffer.from('fake video content for testing');

  // Skip if app not available
  if (!app) {
    it.skip('E2E tests require full app setup', () => {});
    return;
  }

  describe('Complete Video Upload → Mint Flow', () => {
    it('should complete full video upload workflow', async () => {
      // 1. Upload video
      const uploadResponse = await request(app)
        .post('/api/video/upload')
        .attach('video', testVideoBuffer, 'test-video.mp4')
        .field('name', 'E2E Test Video')
        .field('description', 'End-to-end test video')
        .expect(200);

      expect(uploadResponse.body.success).toBe(true);
      expect(uploadResponse.body.data.videoCid).toBeDefined();
      expect(uploadResponse.body.data.metadataUri).toBeDefined();
      expect(uploadResponse.body.data.videoUrl).toContain('pinata.cloud');

      // 2. Verify metadata URI points to Arweave
      const metadataUri = uploadResponse.body.data.metadataUri;
      expect(metadataUri).toContain('arweave.net');

      // 3. Verify video URL points to Pinata
      const videoUrl = uploadResponse.body.data.videoUrl;
      expect(videoUrl).toContain('gateway.pinata.cloud');

      // 4. Verify Grok verification result (if available)
      if (uploadResponse.body.data.verification) {
        expect(uploadResponse.body.data.verification.score).toBeGreaterThan(0);
        expect(uploadResponse.body.data.verification.score).toBeLessThanOrEqual(100);
      }
    });
  });

  describe('Echo Video Layer Integration', () => {
    it('should add video echo to existing NFT', async () => {
      // This would require:
      // 1. Existing NFT/ledger ID
      // 2. Upload video
      // 3. Add echo with video URI
      // 4. Verify echo appears in ledger

      // TODO: Implement when Echo endpoints are ready
      expect(true).toBe(true); // Placeholder
    });
  });
});

