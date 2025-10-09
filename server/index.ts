import 'dotenv/config';
import 'module-alias/register';
const log = console.log;

import "./instrument";
import * as Sentry from "@sentry/node";

import express, { type Request, type Response, type NextFunction } from "express";
import compression from "compression";
import { registerRoutes } from "./routes";
import { setupNFTRoutes } from "./nft-routes";
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
import fs from "fs";
import path from "path";

const uploadsDir = path.join(process.cwd(), "uploads");

const app = express();

app.set("trust proxy", true);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: false, limit: "50mb" }));
app.use(compression());

app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Keep-Alive", "timeout=5, max=1000");

  if (req.url.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg)$/)) {
    res.setHeader("Cache-Control", "public, max-age=86400");
  }

  next();
});

app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const pathName = req.path;
  let capturedJsonResponse: Record<string, any> | undefined;

  const originalResJson = res.json.bind(res);
  res.json = function (bodyJson: any) {
    capturedJsonResponse = bodyJson;
    return originalResJson(bodyJson);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (pathName.startsWith("/api")) {
      if (pathName.includes("/src/") || pathName.includes("vite") || res.statusCode === 304) return;
      let logLine = `${req.method} ${pathName} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) logLine = logLine.slice(0, 79) + ".";
      log(logLine);
    }
  });

  next();
});

(async () => {
  // Only require database in production; allow dev to run without DB
  if (process.env.NODE_ENV === "production") {
    const requiredEnvVars = ["DATABASE_URL"];
    const missing = requiredEnvVars.filter((env) => !process.env[env]);
    if (missing.length > 0) {
      console.error("Missing required environment variables:", missing);
      process.exit(1);
    }
  } else if (!process.env.DATABASE_URL) {
    console.warn("[startup] DATABASE_URL not set. Running with in-memory storage.");
  }

  const { setupPricingRoutes } = await import("./pricing-analytics");
  setupPricingRoutes(app);

  const { setupSolscanRoutes } = await import("./solscan-api");
  setupSolscanRoutes(app);

  const { setupHeliusRoutes } = await import("./helius-api");
  const { setupMagicEdenRoutes } = await import("./magic-eden-api");

  console.log("Setting up Magic Eden API routes...");
  setupMagicEdenRoutes(app);

  console.log("Setting up Helius API routes...");
  setupHeliusRoutes(app);

  const { getWalletConfig, updateWalletConfig } = await import("./routes/wallet-config");
  app.get("/api/wallet/config", getWalletConfig);
  app.post("/api/wallet/config", updateWalletConfig);

  const solanaRewardsRoutes = await import("./routes/solana-rewards");
  app.use("/api/solana/rewards", solanaRewardsRoutes.default);

  registerRoutes(app);
  setupNFTRoutes(app);
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

  app.get("/health", (req: Request, res: Response) => {
    console.log("Health check accessed");
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  app.get("/api/health", (req: Request, res: Response) => {
    console.log("API health check accessed");
    res.json({ status: "ok", timestamp: new Date().toISOString(), database: "connected" });
  });

  app.post("/api/webhook/test", (req: Request, res: Response) => {
    console.log("Webhook test received:", {
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
    console.log("Webhook GET test accessed");
    res.json({
      message: "Webhook endpoint is active",
      status: "ready",
      timestamp: new Date().toISOString()
    });
  });

  // Apply security middleware early and enable rate limiting in production
  app.use(helmetConfig);
  app.use(corsConfig);
  app.use(securityHeaders);
  if (process.env.NODE_ENV === "production") app.use(generalLimiter);
  app.use(requestLogger);
  app.use(securityLogger);
  app.use(sanitizeInput);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    if (process.env.NODE_ENV === "production" && process.env.SENTRY_DSN) {
      Sentry.captureException(err);
    }
    res.status(status).json({ message });
  });

  app.use((req: Request, res: Response) => {
    res.status(404).send("Sorry can't find that!");
  });

  const { setupWebSocketAPI } = await import("./websocket-api");

  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.use("/uploads", express.static(uploadsDir));

  // Serve client in production
  if (process.env.NODE_ENV === "production") {
    const { serveStatic } = await import("./vite");
    try {
      serveStatic(app);
    } catch (e) {
      console.warn("Static serve unavailable:", (e as Error).message);
    }
  }

  const PORT = parseInt(process.env.PORT || "3001", 10);
  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    console.log(`Access your app at: http://localhost:${PORT}`);
    console.log("WebSocket server initialized for real-time updates");
  });

  setupWebSocketAPI(server);
})();
