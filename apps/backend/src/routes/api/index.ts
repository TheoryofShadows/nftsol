import { Router } from 'express';
import nftRoutes from './nft.routes';

const router = Router();

// API Routes
router.use('/nfts', nftRoutes);

// Health check endpoint
router.get('/health', (_, res) => {
  res.status(200).json({ status: 'ok' });
});

export default router;
