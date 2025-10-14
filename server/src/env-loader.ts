import dotenv from "dotenv";
dotenv.config();

// --- Detect environment ---
const gitRef = process.env.GITHUB_REF_NAME || "";
const fromBranch = gitRef.toLowerCase().includes("dev") ? "devnet" : "mainnet-beta";

export const cluster =
  process.env.VITE_SOLANA_CLUSTER || fromBranch;

export const HELIUS_API_KEY =
  cluster === "devnet"
    ? process.env.HELIUS_API_KEY_DEV
    : process.env.HELIUS_API_KEY_MAINNET;

export const HELIUS_URL = `https://${cluster}.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;

// --- Force log immediately when this file loads ---
console.log("⚙️ NFTSol environment:", cluster);
console.log("🔑 Helius key prefix:", HELIUS_API_KEY ? HELIUS_API_KEY.slice(0, 8) + "..." : "❌ missing key");
console.log("🌐 Helius RPC URL:", HELIUS_URL);
