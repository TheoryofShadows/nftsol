import { config } from "dotenv";
config(); // load .env if present locally

// Normalize cluster & key from whichever vars you have
const cluster =
  process.env.SOLANA_CLUSTER ??
  process.env.VITE_SOLANA_CLUSTER ??
  "mainnet-beta";

const key =
  process.env.HELIUS_API_KEY ??
  (cluster === "devnet"
    ? process.env.HELIUS_API_KEY_DEV
    : process.env.HELIUS_API_KEY_MAINNET) ??
  "";

// Write back normalized values so all modules read the same source
process.env.SOLANA_CLUSTER = cluster;
if (key) process.env.HELIUS_API_KEY = key;

// Do NOT compute URLs or log here; just normalize env.
