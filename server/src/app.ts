import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import health from "./routes/health.js";
import nfts from "./routes/nfts.js";
import market from "./routes/market";
import clout from "./routes/clout";
import universalNFTs from "./routes/universalNFTs";
import { getAppConfig } from "./config/environment";

const appConfig = getAppConfig();
const app = express();

app.use(
  cors({
    origin: appConfig.allowedOrigins,
    credentials: true,
  }),
);
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(morgan(appConfig.logLevel === "debug" ? "dev" : "tiny"));

app.use("/market", market);
app.use("/api", market);
app.use("/api/clout", clout);
app.use("/api/universal-nfts", universalNFTs);
app.use("/healthz", health);
app.use("/nfts", nfts);

app.get("/", (_req, res) => res.json({ ok: true }));

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Unhandled error", err);
  res.status(500).json({ error: "Internal Server Error" });
});

export default app;
