import "./env-loader";
import "dotenv/config";
import { SOLANA_CLUSTER, HELIUS_API_KEY, HELIUS_RPC_URL } from "./config";
console.log(`⚙️ NFTSol environment: ${SOLANA_CLUSTER}`);
console.log(`🔑 Helius key prefix: ${HELIUS_API_KEY ? HELIUS_API_KEY.slice(0,8) : "❌ missing key"}`);
console.log(`🌐 Helius RPC URL: ${HELIUS_RPC_URL}`);
import app from "./app";

const port = Number(process.env.PORT) || 3000;
const host = "0.0.0.0";

app.listen(port, host, () => {
  console.log(`api listening on http://${host}:${port}`);
});
