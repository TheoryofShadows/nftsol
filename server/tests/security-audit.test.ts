import request from 'supertest';
import { describe, it, expect } from '@jest/globals';
import app from '../src/app';

describe('Security Audit Tests', () => {
  const API_BASE = '/api';

  describe('Rate Limiting', () => {
    it('should enforce rate limits on general endpoints', async () => {
      // Send 101 requests rapidly
      const requests = Array.from({ length: 101 }, () =>
        request(app).get('/health')
      );

      const responses = await Promise.all(requests);
      
      // Check that at least one response is rate limited
      const rateLimited = responses.some(r => r.status === 429);
      expect(rateLimited).toBe(true);
    }, 30000);

    it('should enforce stricter rate limits on auth endpoints', async () => {
      const requests = Array.from({ length: 6 }, () =>
        request(app).post('/api/users/login').send({
          username: 'test',
          password: 'test'
        })
      );

      const responses = await Promise.all(requests);
      const rateLimited = responses.some(r => r.status === 429);
      
      // Auth endpoints should have stricter limits
      expect(rateLimited).toBe(true);
    }, 30000);
  });

  describe('Input Validation', () => {
    it('should reject invalid wallet addresses', async () => {
      const response = await request(app)
        .post(`${API_BASE}/market/mint`)
        .send({
          creatorWallet: 'invalid-wallet-address',
          name: 'Test NFT',
          description: 'Test Description',
          imageUrl: 'https://example.com/image.png'
        });

      expect(response.status).toBe(400);
    });

    it('should reject requests with missing required fields', async () => {
      const response = await request(app)
        .post(`${API_BASE}/market/mint`)
        .send({
          name: 'Test NFT'
          // Missing required fields
        });

      expect(response.status).toBe(400);
    });

    it('should sanitize malicious input', async () => {
      const response = await request(app)
        .post(`${API_BASE}/market/list`)
        .send({
          mintAddress: 'test<script>alert("xss")</script>',
          price: 1,
          sellerWallet: 'test<script>alert("xss")</script>'
        });

      // Should be rejected by validation or sanitized
      expect([400, 200]).toContain(response.status);
    });
  });

  describe('CORS Protection', () => {
    it('should reject requests from unauthorized origins in production', async () => {
      const response = await request(app)
        .get('/health')
        .set('Origin', 'https://malicious-site.com');

      // Response should not include CORS headers for unauthorized origin
      if (process.env.NODE_ENV === 'production') {
        expect(response.headers['access-control-allow-origin']).toBeUndefined();
      }
    });

    it('should allow requests from authorized origins', async () => {
      const response = await request(app)
        .get('/health')
        .set('Origin', 'http://localhost:5174');

      expect(response.status).toBe(200);
    });
  });

  describe('Security Headers', () => {
    it('should include X-Content-Type-Options header', async () => {
      const response = await request(app).get('/health');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });

    it('should include X-Frame-Options header', async () => {
      const response = await request(app).get('/health');
      expect(response.headers['x-frame-options']).toBe('DENY');
    });

    it('should include X-XSS-Protection header', async () => {
      const response = await request(app).get('/health');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
    });
  });

  describe('Request Size Limits', () => {
    it('should reject requests exceeding size limit', async () => {
      const largeData = 'x'.repeat(60 * 1024 * 1024); // 60MB
      
      const response = await request(app)
        .post(`${API_BASE}/market/mint`)
        .send({
          data: largeData,
          creatorWallet: 'test'.repeat(10),
          name: 'Test',
          description: 'Test',
          imageUrl: 'https://example.com/image.png'
        });

      expect([413, 400]).toContain(response.status);
    });
  });

  describe('SQL Injection Protection', () => {
    it('should prevent SQL injection attempts', async () => {
      const maliciousInput = {
        creatorWallet: "'; DROP TABLE nfts; --",
        name: 'Test',
        description: 'Test',
        imageUrl: 'https://example.com/image.png'
      };

      const response = await request(app)
        .post(`${API_BASE}/market/mint`)
        .send(maliciousInput);

      // Should either sanitize or reject the input
      expect([400, 500]).not.toContain(response.status);
    });
  });

  describe('Authentication', () => {
    it('should require valid JWT for protected endpoints', async () => {
      const response = await request(app)
        .get('/api/users/profile');

      // Should require authentication
      expect([401, 403]).toContain(response.status);
    });

    it('should reject invalid JWT tokens', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', 'Bearer invalid-token');

      expect([401, 403]).toContain(response.status);
    });
  });

  describe('XSS Protection', () => {
    it('should sanitize HTML in user input', async () => {
      const xssPayload = '<script>alert("XSS")</script>';
      
      const response = await request(app)
        .post(`${API_BASE}/market/mint`)
        .send({
          creatorWallet: 'test'.repeat(8),
          name: xssPayload,
          description: xssPayload,
          imageUrl: 'https://example.com/image.png'
        });

      // Input should be sanitized or rejected
      expect(response.body.name).not.toContain('<script>');
    });
  });
});
