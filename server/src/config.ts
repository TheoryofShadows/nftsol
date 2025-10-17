export const SOLANA_CLUSTER = process.env.SOLANA_CLUSTER ?? "mainnet-beta";
export const HELIUS_API_KEY = process.env.HELIUS_API_KEY ?? "";
export const HELIUS_RPC_URL =
  process.env.HELIUS_RPC_URL ??
  `https://${SOLANA_CLUSTER}.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
