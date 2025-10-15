import express from 'express';
import { addClout, getClout } from '../cloutStore';

const router = express.Router();

// GET /api/clout/:wallet -> { wallet, clout }
router.get('/:wallet', (req, res) => {
  const wallet = (req.params.wallet || '').trim();
  if (!wallet) return res.status(400).json({ error: 'missing wallet' });
  return res.json({ wallet, clout: getClout(wallet) });
});

// POST /api/clout/reward { wallet, delta=1, reason? } -> { wallet, clout, delta }
router.post('/reward', (req, res) => {
  const wallet = (req.body?.wallet || '').trim();
  const delta = Number(req.body?.delta ?? 1);
  if (!wallet) return res.status(400).json({ error: 'missing wallet' });

  const clout = addClout(wallet, delta);
  return res.json({ wallet, clout, delta, ok: true, reason: req.body?.reason || '' });
});

export default router;
