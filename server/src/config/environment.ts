import "dotenv/config";
import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(3000),
  LOG_LEVEL: z.string().default("info"),
  ALLOWED_ORIGINS: z.string().optional(),
  DEV_ALLOWED_ORIGINS: z.string().optional(),
  SOLANA_CLUSTER: z.string().default("mainnet-beta"),
  HELIUS_API_KEY: z.string().optional(),
  HELIUS_RPC_URL: z.string().optional(),
  HELIUS_REST_URL: z.string().optional(),
  HELIUS_TIMEOUT_MS: z.coerce.number().optional(),
  NEAR_NETWORK_ID: z.string().default('mainnet'),
  NEAR_NODE_URL: z.string().default('https://rpc.mainnet.near.org'),
});

export type AppEnvironment = z.infer<typeof EnvSchema>;

export interface AppConfig {
  env: AppEnvironment["NODE_ENV"];
  isProduction: boolean;
  port: number;
  logLevel: string;
  allowedOrigins: string[];
}

export interface HeliusConfig {
  apiKey: string;
  rpcUrl: string;
  restUrl: string;
  timeoutMs: number;
  cluster: string;
}

export interface NearConfig {
  networkId: string;
  nodeUrl: string;
}

const DEFAULT_DEV_ORIGINS = ["http://localhost:3000", "http://localhost:5173"];
const DEFAULT_PROD_ORIGINS = [
  "https://nftsol.app", 
  "https://www.nftsol.app",
  "https://nftsol.netlify.app",
  "https://nftsol-server-prod.onrender.com"
];
const DEFAULT_REST_URL = "https://api.helius.xyz/v0";
const DEFAULT_TIMEOUT_MS = 15000;

function splitOrigins(value?: string | null): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

let cachedAppConfig: AppConfig | null = null;
let cachedHeliusConfig: HeliusConfig | null = null;
let cachedNearConfig: NearConfig | null = null;

export function getAppConfig(): AppConfig {
  if (cachedAppConfig) {
    return cachedAppConfig;
  }

  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("[env] Invalid configuration:");
    for (const issue of parsed.error.issues) {
      console.error(`- ${issue.path.join(".") || "(root)"}: ${issue.message}`);
    }
    throw new Error("Invalid environment configuration");
  }

  const data = parsed.data;
  const isProduction = data.NODE_ENV === "production";

  const allowed = splitOrigins(data.ALLOWED_ORIGINS);
  const devAllowed = splitOrigins(data.DEV_ALLOWED_ORIGINS);
  const effectiveOrigins =
    allowed.length > 0
      ? allowed
      : isProduction
        ? DEFAULT_PROD_ORIGINS
        : devAllowed.length > 0
          ? devAllowed
          : DEFAULT_DEV_ORIGINS;

  cachedAppConfig = {
    env: data.NODE_ENV,
    isProduction,
    port: data.PORT,
    logLevel: data.LOG_LEVEL,
    allowedOrigins: effectiveOrigins,
  };

  return cachedAppConfig;
}

export function getHeliusConfig(): HeliusConfig {
  if (cachedHeliusConfig) {
    return cachedHeliusConfig;
  }

  const appConfig = getAppConfig();
  const parsed = EnvSchema.parse(process.env);
  const apiKey = parsed.HELIUS_API_KEY?.trim() || "";
  const restUrl = parsed.HELIUS_REST_URL?.trim() || DEFAULT_REST_URL;
  const cluster = parsed.SOLANA_CLUSTER;

  let rpcUrl = parsed.HELIUS_RPC_URL?.trim() || "";
  if (!rpcUrl) {
    if (apiKey) {
      const scope = cluster === "mainnet-beta" ? "mainnet" : cluster;
      rpcUrl = `https://${scope}.helius-rpc.com/?api-key=${apiKey}`;
    } else {
      rpcUrl =
        cluster === "mainnet-beta"
          ? "https://api.mainnet-beta.solana.com"
          : `https://api.${cluster}.solana.com`;
    }
  }

  const timeoutCandidate = parsed.HELIUS_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS;
  const timeoutMs = Number.isFinite(timeoutCandidate) && timeoutCandidate > 0 ? timeoutCandidate : DEFAULT_TIMEOUT_MS;

  cachedHeliusConfig = {
    apiKey,
    rpcUrl,
    restUrl: restUrl.endsWith("/") ? restUrl : `${restUrl}/`,
    timeoutMs,
    cluster,
  };

  if (!apiKey && appConfig.isProduction) {
    console.warn("[env] HELIUS_API_KEY is not set in production mode. RPC requests may fail or be rate limited.");
  }

  return cachedHeliusConfig;
}

export function getNearConfig(): NearConfig {
  if (cachedNearConfig) {
    return cachedNearConfig;
  }

  const parsed = EnvSchema.parse(process.env);
  const networkId = parsed.NEAR_NETWORK_ID?.trim() || 'mainnet';
  const nodeUrl = parsed.NEAR_NODE_URL?.trim() || 'https://rpc.mainnet.near.org';

  cachedNearConfig = {
    networkId,
    nodeUrl,
  };

  return cachedNearConfig;
}
