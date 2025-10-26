import request from 'supertest';
import app from '../../src/app';

/**
 * Performance Benchmark Tests
 * Ensures the API meets performance requirements for production use
 */
describe('Performance Benchmarks', () => {
  describe('Response Time Benchmarks', () => {
    /**
     * Health check should respond extremely quickly (< 100ms)
     * This is a lightweight endpoint with no external dependencies
     */
    test('Health check responds in < 100ms', async () => {
      const iterations = 10;
      const times: number[] = [];
      
      for (let i = 0; i < iterations; i++) {
        const start = Date.now();
        const res = await request(app).get('/healthz');
        const duration = Date.now() - start;
        times.push(duration);
        expect(res.status).toBe(200);
      }
      
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);
      
      expect(avgTime).toBeLessThan(100); // Average should be < 100ms
      expect(maxTime).toBeLessThan(200); // Max should be < 200ms
    });

    /**
     * NFT endpoint should respond in reasonable time (< 2000ms)
     * This endpoint may query external services
     */
    test('NFT endpoint responds in < 2000ms', async () => {
      const start = Date.now();
      const res = await request(app).get('/api/nfts');
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(2000); // Should respond in < 2 seconds
      // Accept both success and graceful error responses
      expect([200, 500]).toContain(res.status);
    });
  });

  describe('Concurrency Benchmarks', () => {
    /**
     * Test concurrent request handling
     * Server should handle multiple requests simultaneously
     */
    test('Handles 10 concurrent requests', async () => {
      const concurrentRequests = 10;
      const requests = Array(concurrentRequests).fill(null).map(() => 
        request(app).get('/healthz')
      );
      
      const start = Date.now();
      const responses = await Promise.all(requests);
      const duration = Date.now() - start;
      
      // All requests should succeed
      responses.forEach(res => {
        expect(res.status).toBe(200);
      });
      
      // Concurrent requests should complete in reasonable time
      // Less than sequential requests would take
      expect(duration).toBeLessThan(1000); // 10 requests should take < 1 second
    });
  });

  describe('Memory Usage', () => {
    /**
     * Test that repeated requests don't cause memory leaks
     * By making many requests and checking server stays responsive
     */
    test('Server stays responsive after multiple requests', async () => {
      const iterations = 100;
      
      for (let i = 0; i < iterations; i++) {
        const res = await request(app).get('/healthz');
        expect(res.status).toBe(200);
        
        // Log progress every 20 requests
        if (i % 20 === 0) {
          console.log(`Progress: ${i}/${iterations} requests completed`);
        }
      }
      
      // Final request should still be fast
      const start = Date.now();
      const res = await request(app).get('/healthz');
      const duration = Date.now() - start;
      
      expect(res.status).toBe(200);
      expect(duration).toBeLessThan(500); // Should still respond quickly
    });
  });

  describe('Load Test Simulation', () => {
    /**
     * Simulate a load test scenario
     * Multiple rapid requests over a short period
     */
    test('Handles rapid sequential requests', async () => {
      const requestCount = 50;
      const requestsPerSecond = 10;
      const results: number[] = [];
      
      const startTime = Date.now();
      
      for (let i = 0; i < requestCount; i++) {
        const requestStart = Date.now();
        const res = await request(app).get('/healthz');
        const requestDuration = Date.now() - requestStart;
        
        results.push(requestDuration);
        expect(res.status).toBe(200);
        
        // Space out requests to simulate realistic load
        if (i < requestCount - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 / requestsPerSecond));
        }
      }
      
      const totalDuration = Date.now() - startTime;
      const avgResponseTime = results.reduce((a, b) => a + b, 0) / results.length;
      const maxResponseTime = Math.max(...results);
      
      // Average response time should remain low
      expect(avgResponseTime).toBeLessThan(200);
      // No single request should take too long
      expect(maxResponseTime).toBeLessThan(500);
      // Total test time should be reasonable
      expect(totalDuration).toBeLessThan(10000); // 10 seconds for 50 requests
    });
  });
});
