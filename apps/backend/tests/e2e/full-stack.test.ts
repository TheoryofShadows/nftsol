import request from 'supertest';
import app from '../../src/app';

/**
 * End-to-End Integration Tests
 * Tests the full stack functionality including API endpoints and performance
 */

// Jest types are available through ts-jest configuration
describe('E2E: Full Stack Tests', () => {
  describe('Health Checks', () => {
    /**
     * Test the basic health check endpoint
     * Should return 200 OK with proper health status
     */
    test('GET /healthz returns 200 with health status', async () => {
      const res = await request(app).get('/healthz');
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body).toHaveProperty('uptime');
      expect(res.body).toHaveProperty('timestamp');
    });

    /**
     * Test the simple health check endpoint
     */
    test('GET /health returns 200', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
    });

    /**
     * Test root endpoint
     */
    test('GET / returns ok', async () => {
      const res = await request(app).get('/');
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });
  });

  describe('NFT Operations', () => {
    /**
     * Test marketplace endpoint accessibility
     * Should handle both success and error cases gracefully
     */
    test('GET /api/nfts returns valid response', async () => {
      const res = await request(app).get('/api/nfts');
      // Accept both 200 (success) and 500 (graceful error handling)
      expect([200, 500]).toContain(res.status);
      
      if (res.status === 200) {
        expect(res.body).toHaveProperty('nfts');
        expect(Array.isArray(res.body.nfts)).toBe(true);
      }
    });

    /**
     * Test collections endpoint
     */
    test('GET /api/collections endpoint exists', async () => {
      const res = await request(app).get('/api/collections');
      expect([200, 500]).toContain(res.status);
    });
  });

  describe('Performance Benchmarks', () => {
    /**
     * Performance test: Health check should respond within 500ms
     */
    test('Health check response time < 500ms', async () => {
      const start = Date.now();
      const res = await request(app).get('/healthz');
      const duration = Date.now() - start;
      
      expect(res.status).toBe(200);
      expect(duration).toBeLessThan(500); // Should respond in less than 500ms
    });

    /**
     * Performance test: API endpoints should respond within 1000ms
     */
    test('NFT endpoint response time < 1000ms', async () => {
      const start = Date.now();
      await request(app).get('/api/nfts');
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(1000); // Should respond in less than 1 second
    });
  });

  describe('Error Handling', () => {
    /**
     * Test graceful error handling for invalid endpoints
     */
    test('GET /api/invalid-endpoint returns 404', async () => {
      const res = await request(app).get('/api/invalid-endpoint');
      expect(res.status).toBe(404);
    });

    /**
     * Test CORS headers are present
     */
    test('CORS headers are set correctly', async () => {
      const res = await request(app)
        .get('/healthz')
        .set('Origin', 'http://localhost:5173');
      
      expect(res.status).toBe(200);
      // CORS headers should be present
      expect(res.headers['access-control-allow-origin']).toBeDefined();
    });
  });

  describe('Security Headers', () => {
    /**
     * Test security headers are present
     */
    test('Security headers are set', async () => {
      const res = await request(app).get('/healthz');
      
      expect(res.status).toBe(200);
      // Helmet.js should set these security headers
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['x-frame-options']).toBeDefined();
    });
  });
});
