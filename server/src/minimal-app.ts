import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import { getAppConfig } from "./config/environment";

const appConfig = getAppConfig();
const app = express();

// Trust proxy for rate limiting and security
app.set('trust proxy', 1);

// Basic middleware
app.use(helmet());
app.use(compression() as any);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Logging
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// Simple health check
app.get('/healthz', (_req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: Date.now(),
    service: "nftsol-server",
    version: "1.0.0",
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/health', (_req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: Date.now(),
    service: "nftsol-server",
    version: "1.0.0"
  });
});

// Basic API routes
app.get('/api/status', (_req, res) => {
  res.json({ 
    message: "NFTSol API is running",
    timestamp: Date.now(),
    environment: process.env.NODE_ENV
  });
});

// Error handling
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    timestamp: Date.now()
  });
});

// 404 handler
app.use('*', (_req, res) => {
  res.status(404).json({ 
    error: 'Not found',
    timestamp: Date.now()
  });
});

export default app;
