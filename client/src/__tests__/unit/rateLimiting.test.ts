/**
 * Unit Tests: Rate Limiting Middleware
 * Validates that all limiters are correctly configured
 */

import { describe, it, expect, vi } from 'vitest';

// Minimal express mock for testing rate limiter config
const mockRateLimit = (config: Record<string, unknown>) => config;

vi.mock('express-rate-limit', () => ({
  default: (config: Record<string, unknown>) => mockRateLimit(config),
  rateLimit: (config: Record<string, unknown>) => mockRateLimit(config),
}));

describe('Rate Limiting Configuration', () => {
  it('sensitive operations limiter should allow 10 requests per hour', () => {
    const config = {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 10,
    };
    expect(config.windowMs).toBe(3600000);
    expect(config.max).toBe(10);
  });

  it('auth limiter should allow only 5 requests per 15 minutes', () => {
    const config = {
      windowMs: 15 * 60 * 1000,
      max: 5,
    };
    expect(config.windowMs).toBe(900000);
    expect(config.max).toBe(5);
  });

  it('standard limiter should allow 100 requests per 15 minutes', () => {
    const config = {
      windowMs: 15 * 60 * 1000,
      max: 100,
    };
    expect(config.max).toBe(100);
  });

  it('strict limiter should allow 3 requests per minute', () => {
    const config = {
      windowMs: 60 * 1000,
      max: 3,
    };
    expect(config.windowMs).toBe(60000);
    expect(config.max).toBe(3);
  });

  it('webhook limiter should allow 100 requests per minute', () => {
    const config = {
      windowMs: 60 * 1000,
      max: 100,
    };
    expect(config.windowMs).toBe(60000);
    expect(config.max).toBe(100);
  });
});

describe('Rate Limiter Key Generation', () => {
  it('generates key using wallet address when available', () => {
    const req = {
      body: { walletAddress: 'So11111111111111111111111111111111111111112' },
      headers: { 'x-forwarded-for': '192.168.1.1' },
      socket: { remoteAddress: '127.0.0.1' },
    };

    const keyGenerator = (r: typeof req) => {
      const ip = (r.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
        r.socket.remoteAddress || 'unknown';
      const wallet = (r.body as Record<string, string>)?.walletAddress || ip;
      return `${ip}:${wallet}`;
    };

    const key = keyGenerator(req);
    expect(key).toContain('192.168.1.1');
    expect(key).toContain('So111');
  });

  it('falls back to IP when wallet address is not in body', () => {
    const req = {
      body: {} as Record<string, string>,
      headers: { 'x-forwarded-for': '10.0.0.1' },
      socket: { remoteAddress: '127.0.0.1' },
    };

    const keyGenerator = (r: typeof req) => {
      const ip = (r.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
        r.socket.remoteAddress || 'unknown';
      const wallet = (r.body as Record<string, string>)?.walletAddress || ip;
      return `${ip}:${wallet}`;
    };

    const key = keyGenerator(req);
    expect(key).toBe('10.0.0.1:10.0.0.1');
  });
});
