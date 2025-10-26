import { Router } from "express";

const router = Router();

// Simple health check that doesn't depend on external services
router.get("/", (_req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: Date.now(),
    service: "nftsol-server",
    version: "1.0.0",
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Health endpoint for Render
router.get("/health", (_req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: Date.now(),
    service: "nftsol-server",
    version: "1.0.0"
  });
});

export default router;
