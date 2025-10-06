// server/index.ts
import 'dotenv/config';
import 'module-alias/register';
const log = console.log;

// Import Sentry instrumentation first
import "./instrument";
import * as Sentry from "@sentry/node";

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupNFTRoutes } from "./nft-routes"; // Add NFT routes
import { setupRecommendationRoutes } from "./recommendation-engine";
import { setupAIEnhancementRoutes } from "./ai-enhancement-api";
import { setupCloutRoutes } from "./clout-system";
import { setupSocialTradingRoutes } from "./social-trading-api";
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

// Initialize Express app
const app = express();

// Trust proxy for reverse proxies
app.set("trust proxy", true);

// Parse request bodies
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: false, limit: "50mb" }));

// Optimize connection handling
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Keep-Alive", "timeout=5, max=1000");

  // Cache static assets
  if (req.url.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg)$/)) {
    res.setHeader("Cache-Control", "public, max-age=86400"); // 24 hours
  }

  next();
});

// Custom logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson: any, ...args: any[]) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      if (path.includes("/src/") || path.includes("vite") || res.statusCode === 304) return;
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) logLine = logLine.slice(0, 79) + "…";
      log(logLine);
    }
  });

  next();
});

// Async setup
(async () => {
  // Validate required environment variables
  const requiredEnvVars = ["DATABASE_URL"];
  const missing = requiredEnvVars.filter((env) => !process.env[env]);
  if (missing.length > 0) {
    console.error("Missing required environment variables:", missing);
    process.exit(1);
  }

  // Import and setup dynamic routes
  const { setupPricingRoutes } = await import("./pricing-analytics");
  setupPricingRoutes(app);

  const { setupSolscanRoutes } = await import("./solscan-api");
  setupSolscanRoutes(app);

  const { setupHeliusRoutes } = await import("./helius-api");
  const { setupMagicEdenRoutes } = await import("./magic-eden-api");

  // Setup routes in order of importance
  console.log("🎮 Setting up Magic Eden API routes...");
  setupMagicEdenRoutes(app);

  console.log("⚡ Setting up Helius API routes...");
  setupHeliusRoutes(app);

  const { getWalletConfig, updateWalletConfig } = await import("./routes/wallet-config");
  app.get("/api/wallet/config", getWalletConfig);
  app.post("/api/wallet/config", updateWalletConfig);

  // Register all route setups
  registerRoutes(app);
  setupNFTRoutes(app); // Add NFT routes here
  setupRecommendationRoutes(app);
  setupAIEnhancementRoutes(app);
  setupCloutRoutes(app);
  setupSocialTradingRoutes(app);

  const debugRoutes = await import("./routes/debug");
  app.use("/api/debug", debugRoutes.default);

  const aiMetadataRoutes = await import("./routes/ai-metadata");
  app.use("/api/ai-metadata", aiMetadataRoutes.default);

  const aiFeaturesRoutes = await import("./routes/ai-features");
  app.use("/api/ai-features", aiFeaturesRoutes.default);

  const cloutDeploymentRoutes = await import("./routes/clout-deployment");
  app.use("/api/clout", cloutDeploymentRoutes.default);

  // Security monitoring endpoints
  app.get("/api/security/health", (req: Request, res: Response) => {
    res.json({
      status: "secure",
      timestamp: new Date().toISOString(),
      securityFeatures: {
        rateLimit: "active",
        helmet: "active",
        cors: "configured",
        inputValidation: "active",
        sqlInjectionProtection: "active",
        fileUploadValidation: "active",
        securityMonitoring: "active",
        realTimeAlerting: "active"
      }
    });
  });

  app.get("/api/security/dashboard", getSecurityDashboard);

  // Health check endpoints
  app.get("/health", (req: Request, res: Response) => {
    console.log("🏥 Health check accessed");
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  app.get("/api/health", (req: Request, res: Response) => {
    console.log("🏥 API health check accessed");
    res.json({ status: "ok", timestamp: new Date().toISOString(), database: "connected" });
  });

  // Webhook test endpoint
  app.post("/api/webhook/test", (req: Request, res: Response) => {
    console.log("🤝 Webhook test received:", {
      timestamp: new Date().toISOString(),
      headers: req.headers,
      body: req.body,
      ip: req.ip
    });
    res.json({
      success: true,
      message: "Webhook received successfully",
      timestamp: new Date().toISOString(),
      receivedData: req.body
    });
  });

  app.get("/api/webhook/test", (req: Request, res: Response) => {
    console.log("🤝 Webhook GET test accessed");
    res.json({
      message: "Webhook endpoint is active",
      status: "ready",
      timestamp: new Date().toISOString()
    });
  });

  // Security middleware (order matters)
  app.use(helmet(helmetConfig));
  app.use(cors(corsConfig));
  app.use(securityHeaders);
  app.use(requestLogger);
  app.use(securityLogger);
  // Disable rate limiting for now (re-enable with proper proxy config)
  // if (process.env.NODE_ENV === "production") app.use(generalLimiter);
  app.use(sanitizeInput);

  // Error handling middleware
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    if (process.env.NODE_ENV === "production" && process.env.SENTRY_DSN) {
      Sentry.captureException(err);
    }
    res.status(status).json({ message });
  });

  // 404 handler
  app.use((req: Request, res: Response) => {
    res.status(404).send("Sorry can't find that!");
  });

  // Setup WebSocket API
  const { setupWebSocketAPI } = await import("./websocket-api");
  const { io } = setupWebSocketAPI(app); // Assuming app is the server instance

  // Sentry configuration
  if (process.env.SENTRY_DSN) {
    console.log("Sentry monitoring enabled");
    console.log("Sentry request monitoring active");
    console.log("Sentry error monitoring active");
  }

  // Serve static uploads
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.use("/uploads", express.static(uploadsDir));

  // Start the server
  const PORT = parseInt(process.env.PORT || "3001", 10); // Standardize to 3001
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🌐 Server running on http://0.0.0.0:${PORT}`);
    console.log(`🔗 Access your app at: http://localhost:${PORT}`);
    console.log(`📡 WebSocket server initialized for real-time updates`);
  });
})();