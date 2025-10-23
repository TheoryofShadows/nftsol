import { Router } from "express";
const router = Router();

// Health check endpoint for Render
router.get("/", (_req, res) => res.json({ ok: true, ts: Date.now() }));

// Additional health endpoint for Render health checks
router.get("/health", (_req, res) => res.json({ 
  status: "ok", 
  timestamp: Date.now(),
  service: "nftsol-server",
  version: "1.0.0"
}));

export default router;
