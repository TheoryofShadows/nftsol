"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAppConfig = getAppConfig;
exports.getHeliusConfig = getHeliusConfig;
require("dotenv/config");
const zod_1 = require("zod");
const EnvSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(["development", "test", "production"]).default("development"),
    PORT: zod_1.z.coerce.number().default(3000),
    LOG_LEVEL: zod_1.z.string().default("info"),
    ALLOWED_ORIGINS: zod_1.z.string().optional(),
    DEV_ALLOWED_ORIGINS: zod_1.z.string().optional(),
    SOLANA_CLUSTER: zod_1.z.string().default("mainnet-beta"),
    HELIUS_API_KEY: zod_1.z.string().optional(),
    HELIUS_RPC_URL: zod_1.z.string().optional(),
    HELIUS_REST_URL: zod_1.z.string().optional(),
    HELIUS_TIMEOUT_MS: zod_1.z.coerce.number().optional(),
});
const DEFAULT_DEV_ORIGINS = ["http://localhost:3000", "http://localhost:5173"];
const DEFAULT_PROD_ORIGINS = [
    "https://nftsol.app",
    "https://www.nftsol.app",
    "https://nftsol.netlify.app",
    "https://nftsol-server-prod.onrender.com"
];
const DEFAULT_REST_URL = "https://api.helius.xyz/v0";
const DEFAULT_TIMEOUT_MS = 15000;
function splitOrigins(value) {
    if (!value)
        return [];
    return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
}
let cachedAppConfig = null;
let cachedHeliusConfig = null;
function getAppConfig() {
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
    const effectiveOrigins = allowed.length > 0
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
function getHeliusConfig() {
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
        }
        else {
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
