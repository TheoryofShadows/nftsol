/**
 * 🧪 Bubblegum API Integration Tests
 * Tests for the Bubblegum v2 API endpoints
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import bubblegumRouter from '../../src/routes/bubblegum';

// Create test app
const app = express();
app.use(express.json());
app.use('/api/bubblegum', bubblegumRouter);

describe('Bubblegum API Integration Tests', () => {
  beforeEach(() => {
    // Reset environment variables
    process.env.BUBBLEGUM_PRIVATE_KEY = '2ojcjdCnDLJzm8qjbH3pMnELwHcWpzC9dobwNHgyMRvWUok6QX6ME1xpoBWYNsyosBoNLAVoTSH7aNh6pDmderzD';
  });

  afterEach(() => {
    // Clean up
    delete process.env.BUBBLEGUM_PRIVATE_KEY;
  });

  describe('GET /api/bubblegum/info', () => {
    it('should return service information', async () => {
      const response = await request(app)
        .get('/api/bubblegum/info')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('name', 'Bubblegum v2 Service');
      expect(response.body.data).toHaveProperty('version', '2.0.0');
      expect(response.body.data).toHaveProperty('description');
      expect(response.body.data).toHaveProperty('features');
      expect(response.body.data).toHaveProperty('costPerNFT', '$0.00001');
    });
  });

  describe('POST /api/bubblegum/create-tree', () => {
    it('should validate maxDepth parameter', async () => {
      const response = await request(app)
        .post('/api/bubblegum/create-tree')
        .send({
          maxDepth: -1,
          maxBufferSize: 64,
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('maxDepth must be a number between 0 and 30');
    });

    it('should validate maxDepth upper limit', async () => {
      const response = await request(app)
        .post('/api/bubblegum/create-tree')
        .send({
          maxDepth: 31,
          maxBufferSize: 64,
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('maxDepth must be a number between 0 and 30');
    });

    it('should accept valid tree parameters', async () => {
      const response = await request(app)
        .post('/api/bubblegum/create-tree')
        .send({
          maxDepth: 14,
          maxBufferSize: 64,
          canopyDepth: 0,
        });

      // Should not return validation error
      expect(response.status).not.toBe(400);
    });

    it('should use default values when not provided', async () => {
      const response = await request(app)
        .post('/api/bubblegum/create-tree')
        .send({});

      // Should not return validation error
      expect(response.status).not.toBe(400);
    });
  });

  describe('POST /api/bubblegum/mint', () => {
    const validMetadata = {
      name: 'Test NFT',
      symbol: 'TEST',
      description: 'A test compressed NFT',
      image: 'https://example.com/image.png',
    };

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/bubblegum/mint')
        .send({
          metadata: validMetadata,
          // Missing treeAddress
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('Missing required fields: treeAddress, metadata');
    });

    it('should validate metadata fields', async () => {
      const response = await request(app)
        .post('/api/bubblegum/mint')
        .send({
          treeAddress: '11111111111111111111111111111112',
          metadata: {
            name: '',
            symbol: '',
            description: '',
            image: '',
          },
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('Metadata must include: name, description, image');
    });

    it('should accept valid mint request', async () => {
      const response = await request(app)
        .post('/api/bubblegum/mint')
        .send({
          treeAddress: '11111111111111111111111111111112',
          metadata: validMetadata,
        });

      // Should not return validation error
      expect(response.status).not.toBe(400);
    });

    it('should accept optional fields', async () => {
      const response = await request(app)
        .post('/api/bubblegum/mint')
        .send({
          treeAddress: '11111111111111111111111111111112',
          metadata: validMetadata,
          owner: '11111111111111111111111111111113',
          collectionMint: '11111111111111111111111111111114',
        });

      // Should not return validation error
      expect(response.status).not.toBe(400);
    });
  });

  describe('POST /api/bubblegum/bulk-mint', () => {
    const validMetadatas = [
      {
        name: 'Bulk NFT 1',
        symbol: 'BULK',
        description: 'First bulk NFT',
        image: 'https://example.com/image1.png',
      },
      {
        name: 'Bulk NFT 2',
        symbol: 'BULK',
        description: 'Second bulk NFT',
        image: 'https://example.com/image2.png',
      },
    ];

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/bubblegum/bulk-mint')
        .send({
          metadatas: validMetadatas,
          // Missing treeAddress
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('Missing required fields: treeAddress, metadatas (array)');
    });

    it('should validate metadatas is array', async () => {
      const response = await request(app)
        .post('/api/bubblegum/bulk-mint')
        .send({
          treeAddress: '11111111111111111111111111111112',
          metadatas: 'not-an-array',
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('Missing required fields: treeAddress, metadatas (array)');
    });

    it('should validate bulk mint size limit', async () => {
      const largeMetadatas = Array(10001).fill(null).map((_, i) => ({
        name: `NFT ${i + 1}`,
        symbol: 'TEST',
        description: `Test NFT ${i + 1}`,
        image: `https://example.com/image${i + 1}.png`,
      }));

      const response = await request(app)
        .post('/api/bubblegum/bulk-mint')
        .send({
          treeAddress: '11111111111111111111111111111112',
          metadatas: largeMetadatas,
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('Bulk mint limit is 10,000 NFTs per request');
    });

    it('should accept valid bulk mint request', async () => {
      const response = await request(app)
        .post('/api/bubblegum/bulk-mint')
        .send({
          treeAddress: '11111111111111111111111111111112',
          metadatas: validMetadatas,
          batchSize: 50,
        });

      // Should not return validation error
      expect(response.status).not.toBe(400);
    });
  });

  describe('GET /api/bubblegum/merkle-proof', () => {
    it('should validate required query parameters', async () => {
      const response = await request(app)
        .get('/api/bubblegum/merkle-proof')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('Missing required fields: treeAddress, leafIndex');
    });

    it('should validate leafIndex is provided', async () => {
      const response = await request(app)
        .get('/api/bubblegum/merkle-proof?treeAddress=11111111111111111111111111111112')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('Missing required fields: treeAddress, leafIndex');
    });

    it('should accept valid query parameters', async () => {
      const response = await request(app)
        .get('/api/bubblegum/merkle-proof?treeAddress=11111111111111111111111111111112&leafIndex=0');

      // Should not return validation error
      expect(response.status).not.toBe(400);
    });
  });

  describe('POST /api/bubblegum/verify-proof', () => {
    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/bubblegum/verify-proof')
        .send({
          treeAddress: '11111111111111111111111111111112',
          leafIndex: 0,
          // Missing proof
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('Missing required fields: treeAddress, leafIndex, proof (array)');
    });

    it('should validate proof is array', async () => {
      const response = await request(app)
        .post('/api/bubblegum/verify-proof')
        .send({
          treeAddress: '11111111111111111111111111111112',
          leafIndex: 0,
          proof: 'not-an-array',
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('Missing required fields: treeAddress, leafIndex, proof (array)');
    });

    it('should accept valid proof verification request', async () => {
      const response = await request(app)
        .post('/api/bubblegum/verify-proof')
        .send({
          treeAddress: '11111111111111111111111111111112',
          leafIndex: 0,
          proof: ['proof-0-1234567890'],
        });

      // Should not return validation error
      expect(response.status).not.toBe(400);
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting to bulk mint endpoint', async () => {
      // This test would require multiple rapid requests to trigger rate limiting
      // For now, we'll just verify the endpoint exists and accepts requests
      const response = await request(app)
        .post('/api/bubblegum/bulk-mint')
        .send({
          treeAddress: '11111111111111111111111111111112',
          metadatas: [{
            name: 'Test NFT',
            symbol: 'TEST',
            description: 'A test NFT',
            image: 'https://example.com/image.png',
          }],
        });

      // Should not return rate limit error on first request
      expect(response.status).not.toBe(429);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/bubblegum/mint')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should handle missing Content-Type header', async () => {
      const response = await request(app)
        .post('/api/bubblegum/mint')
        .send('{"treeAddress":"11111111111111111111111111111112","metadata":{"name":"Test","symbol":"TEST","description":"Test","image":"https://example.com/image.png"}}')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('Response Format', () => {
    it('should return consistent response format for info endpoint', async () => {
      const response = await request(app)
        .get('/api/bubblegum/info')
        .expect(200);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('data');
      expect(typeof response.body.success).toBe('boolean');
      expect(typeof response.body.data).toBe('object');
    });

    it('should return error format for failed requests', async () => {
      const response = await request(app)
        .post('/api/bubblegum/mint')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(typeof response.body.error).toBe('string');
    });
  });
});
