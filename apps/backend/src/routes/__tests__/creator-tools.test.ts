/**
 * Creator Tools Routes Tests
 * Tests admin authentication and creator verification
 */

import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';

// Mock auth middlewares
jest.mock('../../middlewares/auth', () => ({
  authenticate: (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, 'test-secret') as any;
      req.user = decoded;
      next();
    } catch {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }
  },
  isAdmin: (req: any, res: any, next: any) => {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }
    next();
  },
}));

// Mock creator-tools service
jest.mock('../../services/creator-tools.service', () => ({
  getCreatorToolsService: jest.fn(() => ({
    verifyCreator: jest.fn().mockReturnValue({
      creatorId: 'test-creator',
      verified: true,
      badgeLevel: 'silver',
      verifiedAt: new Date().toISOString(),
    }),
    getCreatorStats: jest.fn().mockReturnValue({
      totalNFTs: 5,
      totalSales: 3,
      totalVolume: 2.5,
      followers: 42,
    }),
    getCreatorBadge: jest.fn().mockReturnValue({ level: 'silver', label: 'Silver Creator' }),
    getTopCreators: jest.fn().mockReturnValue([
      { id: 'creator-1', name: 'Artist One', nfts: 10, volume: 5 },
      { id: 'creator-2', name: 'Artist Two', nfts: 8, volume: 3 },
    ]),
  })),
}));

import creatorToolsRoutes from '../creator-tools';

const JWT_SECRET = 'test-secret';

function makeToken(payload: Record<string, unknown>) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

const adminToken = makeToken({ id: 'admin-1', walletAddress: '11111111111111111111111111111111', isAdmin: true });
const userToken = makeToken({ id: 'user-1', walletAddress: '11111111111111111111111111111112', isAdmin: false });

const app = express();
app.use(express.json());
app.use('/api/v1/creator-tools', creatorToolsRoutes);

describe('Creator Tools Routes', () => {
  describe('GET /api/v1/creator-tools/stats/:creatorId', () => {
    it('returns creator stats for authenticated user', async () => {
      const res = await request(app)
        .get('/api/v1/creator-tools/stats/creator-1')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });

    it('returns 401 without token', async () => {
      await request(app)
        .get('/api/v1/creator-tools/stats/creator-1')
        .expect(401);
    });
  });

  describe('GET /api/v1/creator-tools/verify/:creatorId (admin only)', () => {
    it('allows admin to verify creator', async () => {
      const res = await request(app)
        .get('/api/v1/creator-tools/verify/creator-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('blocks non-admin from verifying creator', async () => {
      const res = await request(app)
        .get('/api/v1/creator-tools/verify/creator-1')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/admin/i);
    });

    it('returns 401 without any token', async () => {
      await request(app)
        .get('/api/v1/creator-tools/verify/creator-1')
        .expect(401);
    });
  });

  describe('GET /api/v1/creator-tools/top', () => {
    it('returns top creators list', async () => {
      const res = await request(app)
        .get('/api/v1/creator-tools/top')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});
