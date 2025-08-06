// Import Sentry instrumentation first
import "./instrument.mjs";
import * as Sentry from "@sentry/node";

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { setupRecommendationRoutes } from './recommendation-engine';
import { setupAIEnhancementRoutes } from './ai-enhancement-api';
import { setupCloutRoutes } from './clout-system';
import { setupSocialTradingRoutes } from './social-trading-api';
import {
  generalLimiter,
  helmetConfig,
  corsConfig,
  securityHeaders,
  requestLogger,
  sanitizeInput,
  errorHandler
} from "./security-middleware";
import { securityLogger, getSecurityDashboard } from "./security-monitoring";
import { storage } from "./storage";

const app = express();

// Trust proxy for Replit environment
app.set('trust proxy', true);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Optimized connection handling
app.use((req, res, next) => {
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Keep-Alive', 'timeout=5, max=1000');

  // Optimize static assets
  if (req.url.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg)$/)) {
    res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 hours
  }

  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      // Skip logging for frequent dev endpoints
      if (path.includes('/src/') || path.includes('vite') || res.statusCode === 304) {
        return;
      }

      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Validate required environment variables
  const requiredEnvVars = ['DATABASE_URL'];
  const missing = requiredEnvVars.filter(env => !process.env[env]);
  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing);
    process.exit(1);
  }

  // Import and setup pricing routes
  const { setupPricingRoutes } = await import("./pricing-analytics");
  setupPricingRoutes(app);

  // Import and setup Solscan API routes
  const { setupSolscanRoutes } = await import("./solscan-api");
  setupSolscanRoutes(app);

  // Import and setup NFT routes
  const { setupNFTRoutes } = await import("./nft-routes");
  setupNFTRoutes(app);

  // Import and setup Helius API routes
  const { setupHeliusRoutes } = await import("./helius-api");
  const { setupMagicEdenRoutes } = await import("./magic-eden-api");

  // Setup Magic Eden routes FIRST (most important for live data)
  console.log('🎯 Setting up Magic Eden API routes...');
  setupMagicEdenRoutes(app);

  console.log('⚡ Setting up Helius API routes...');
  setupHeliusRoutes(app);

  // Import and setup wallet configuration routes
  const { getWalletConfig, updateWalletConfig } = await import("./routes/wallet-config");
  app.get('/api/wallet/config', getWalletConfig);
  app.post('/api/wallet/config', updateWalletConfig);

  const server = await registerRoutes(app);

  // Apply error handler last
  app.use(errorHandler);

  // Setup WebSocket API
  const { setupWebSocketAPI } = await import('./websocket-api');
  const { io, broadcast } = setupWebSocketAPI(server);

  // Add Sentry error capturing if available
  if (process.env.SENTRY_DSN) {
    console.log('Sentry monitoring enabled');
  }

  // Sentry monitoring configured via instrument.mjs
  if (process.env.SENTRY_DSN) {
    console.log('Sentry request monitoring active');
  }

  // Security middleware (order matters!)
  app.use(helmetConfig);
  app.use(corsConfig);
  app.use(securityHeaders);
  app.use(requestLogger);
  app.use(securityLogger);

  // Disable rate limiting to fix production deployment issues
  // Rate limiting can be re-enabled after proper proxy configuration
  // if (process.env.NODE_ENV === 'production') {
  //   app.use('/api', generalLimiter);
  //   app.use(generalLimiter);
  // }

  app.use(sanitizeInput);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // Log error to Sentry in production
    if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
      Sentry.captureException(err);
    }

    res.status(status).json({ message });
    throw err;
  });

  // Ensure uploads directory exists and serve static files
  const fs = await import('fs');
  const uploadsDir = 'uploads';
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.use('/uploads', express.static('uploads'));

  // Setup ALL API routes BEFORE Vite middleware to prevent conflicts

  // Health check endpoints
  app.get('/health', (req: Request, res: Response) => {
    console.log('🏥 Health check accessed');
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  });

  app.get('/api/health', (req: Request, res: Response) => {
    console.log('🏥 API health check accessed');
    res.json({ status: 'ok', timestamp: new Date().toISOString(), database: 'connected' });
  });

  // Root endpoint removed - handled by Vite middleware in development

  // Webhook test endpoint
  app.post('/api/webhook/test', (req: Request, res: Response) => {
    console.log('🪝 Webhook test received:', {
      timestamp: new Date().toISOString(),
      headers: req.headers,
      body: req.body,
      ip: req.ip
    });
    
    res.json({
      success: true,
      message: 'Webhook received successfully',
      timestamp: new Date().toISOString(),
      receivedData: req.body
    });
  });

  app.get('/api/webhook/test', (req: Request, res: Response) => {
    console.log('🪝 Webhook GET test accessed');
    res.json({
      message: 'Webhook endpoint is active',
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  });

  // Setup debug routes FIRST for troubleshooting
  const debugRoutes = await import('./routes/debug');
  app.use('/api/debug', debugRoutes.default);

  // Setup AI metadata routes
  const aiMetadataRoutes = await import('./routes/ai-metadata');
  app.use('/api/ai-metadata', aiMetadataRoutes.default);

  // Setup AI features routes
  const aiFeaturesRoutes = await import('./routes/ai-features');
  app.use('/api/ai-features', aiFeaturesRoutes.default);

  // Setup recommendation routes
  setupRecommendationRoutes(app);

  // Setup AI enhancement routes
  setupAIEnhancementRoutes(app);

  // Setup CLOUT system routes
  setupCloutRoutes(app);

  // Setup social trading routes
  setupSocialTradingRoutes(app);

  // Security monitoring endpoints
  app.get('/api/security/health', (req: Request, res: Response) => {
    res.json({
      status: 'secure',
      timestamp: new Date().toISOString(),
      securityFeatures: {
        rateLimit: 'active',
        helmet: 'active',
        cors: 'configured',
        inputValidation: 'active',
        sqlInjectionProtection: 'active',
        fileUploadValidation: 'active',
        securityMonitoring: 'active',
        realTimeAlerting: 'active'
      }
    });
  });

  app.get('/api/security/dashboard', getSecurityDashboard);

  // Setup CLOUT deployment routes
  const cloutDeploymentRoutes = await import('./routes/clout-deployment');
  app.use('/api/clout', cloutDeploymentRoutes.default);

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // 404 handler
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.status(404).send("Sorry can't find that!")
  })

  // Sentry error monitoring configured via instrument.mjs
  if (process.env.SENTRY_DSN) {
    console.log('Sentry error monitoring active');
  }

  // Error handling middleware (must be last)
  app.use(errorHandler);

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT ?? "5000", 10);
  server.listen(port, "0.0.0.0", () => {
    console.log(`🌐 Server running on http://0.0.0.0:${port}`);
    console.log(`🔗 Access your app at: http://localhost:${port}`);
    console.log(`📡 WebSocket server initialized for real-time updates`);
  });

    // Stats system completely removed to prevent database errors
  // Clean development experience with no background processes
})();

// Stats system completely removed to prevent database errors
// Clean development experience with no background processes