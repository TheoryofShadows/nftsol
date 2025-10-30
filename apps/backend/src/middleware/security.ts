import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import { Router } from 'express';

const router = Router();

const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((s) => s.trim());

router.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) cb(null, true);
      else cb(new Error('CORS blocked'));
    },
    credentials: true,
  })
);

router.use(helmet({ contentSecurityPolicy: false }));

// ----- Rate limits -----
const searchLimiter = rateLimit({ windowMs: 60_000, max: 20 });
const mintLimiter = rateLimit({ windowMs: 60_000, max: 10 });
const echoLimiter = rateLimit({ windowMs: 60_000, max: 30 });

router.use('/api/echo/search', searchLimiter);
router.use('/api/echo/mint', mintLimiter);
router.use('/api/echo/add', echoLimiter);

export default router;
