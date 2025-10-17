import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import health from "./routes/health.js";
import nfts from "./routes/nfts.js";
import market from './routes/market';
import corsAllowed from './cors-allowed';

const app = express();
app.use('/api', market);
app.use(corsAllowed);
app.use(express.json());

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "").split(",").filter(Boolean);
app.use(cors({ origin: allowedOrigins.length ? allowedOrigins : true }));
app.use(helmet());
app.use(express.json({ limit: "1mb" }));
app.use(morgan(process.env.LOG_LEVEL === "debug" ? "dev" : "tiny"));

app.use("/healthz", health);
app.use("/nfts", nfts);

// Base check
app.get("/", (_req, res) => res.json({ ok: true }));

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Unhandled", err);
  res.status(500).json({ error: "Internal Server Error" });
});

export default app;
