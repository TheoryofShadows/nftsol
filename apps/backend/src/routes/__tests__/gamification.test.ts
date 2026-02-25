/**
 * Gamification Routes Tests
 * Tests leaderboard, achievements, and friend leaderboard
 */

import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';

jest.mock('../../middlewares/auth', () => ({
  authenticate: (req: any, res: any, next: any) => {
    const header = req.headers['authorization'];
    if (!header) return res.status(401).json({ success: false, error: 'Unauthorized' });
    try {
      const token = header.split(' ')[1];
      req.user = jwt.verify(token, 'test-secret');
      next();
    } catch {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }
  },
  isAdmin: (_req: any, _res: any, next: any) => next(),
}));

const mockEntries = [
  { userId: 'user-1', walletAddress: '111', score: 9500, rank: 1, level: 10, achievements: [] },
  { userId: 'user-2', walletAddress: '222', score: 8200, rank: 2, level: 9, achievements: [] },
  { userId: 'user-3', walletAddress: '333', score: 7100, rank: 3, level: 8, achievements: [] },
];

jest.mock('../../services/gamification.service', () => ({
  getGamificationService: jest.fn(() => ({
    getLeaderboard: jest.fn().mockReturnValue(mockEntries),
    getUserProfile: jest.fn().mockReturnValue(mockEntries[0]),
    getAchievements: jest.fn().mockReturnValue([
      { id: 'first_mint', name: 'First Mint', earned: true },
      { id: 'whale', name: 'Whale', earned: false },
    ]),
    addPoints: jest.fn().mockReturnValue({ success: true, newTotal: 100 }),
    checkAndUnlockAchievements: jest.fn().mockResolvedValue([]),
    getSeasonInfo: jest.fn().mockReturnValue({ season: 1, endsAt: new Date(Date.now() + 86400000).toISOString() }),
  })),
}));

import gamificationRoutes from '../gamification';

const app = express();
app.use(express.json());
app.use('/api/v1/gamification', gamificationRoutes);

const user1Token = jwt.sign({ id: 'user-1', walletAddress: '111' }, 'test-secret', { expiresIn: '1h' });
const user2Token = jwt.sign({ id: 'user-2', walletAddress: '222' }, 'test-secret', { expiresIn: '1h' });

describe('Gamification Routes', () => {
  describe('GET /api/v1/gamification/leaderboard', () => {
    it('returns global leaderboard for authenticated user', async () => {
      const res = await request(app)
        .get('/api/v1/gamification/leaderboard')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(res.body.data).toBeDefined();
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('returns 401 without auth', async () => {
      await request(app)
        .get('/api/v1/gamification/leaderboard')
        .expect(401);
    });

    it('supports limit query parameter', async () => {
      const res = await request(app)
        .get('/api/v1/gamification/leaderboard?limit=2')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(res.body.data).toBeDefined();
    });
  });

  describe('GET /api/v1/gamification/leaderboard/friends', () => {
    it('returns friends leaderboard for authenticated user', async () => {
      const res = await request(app)
        .get('/api/v1/gamification/leaderboard/friends')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(res.body.data).toBeDefined();
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('excludes the requesting user from their own friends leaderboard', async () => {
      const res = await request(app)
        .get('/api/v1/gamification/leaderboard/friends')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      const entries = res.body.data as Array<{ userId: string }>;
      expect(entries.some((e) => e.userId === 'user-1')).toBe(false);
    });

    it('returns note about personalisation', async () => {
      const res = await request(app)
        .get('/api/v1/gamification/leaderboard/friends')
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200);

      expect(res.body.note).toBeDefined();
    });

    it('returns 401 without auth', async () => {
      await request(app)
        .get('/api/v1/gamification/leaderboard/friends')
        .expect(401);
    });
  });

  describe('GET /api/v1/gamification/profile/:userId', () => {
    it('returns user gamification profile', async () => {
      const res = await request(app)
        .get('/api/v1/gamification/profile/user-1')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(res.body.data).toBeDefined();
    });
  });

  describe('GET /api/v1/gamification/achievements/:userId', () => {
    it('returns achievements for a user', async () => {
      const res = await request(app)
        .get('/api/v1/gamification/achievements/user-1')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(res.body.data).toBeDefined();
    });
  });
});
