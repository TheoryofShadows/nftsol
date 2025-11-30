import "./env-loader";
import "dotenv/config";
import { SOLANA_CLUSTER, HELIUS_API_KEY, HELIUS_RPC_URL } from "./config";
log.info(`⚙️ NFTSol environment: ${SOLANA_CLUSTER}`);
log.info(`🔑 Helius key prefix: ${HELIUS_API_KEY ? HELIUS_API_KEY.slice(0,8) : "❌ missing key"}`);
log.info(`🌐 Helius RPC URL: ${HELIUS_RPC_URL}`);
import app from "./app";
import { createModuleLogger } from '../../../../utils/logger';

const log = createModuleLogger('index');

const port = Number(process.env.PORT) || 3000;
const host = "0.0.0.0";

app.listen(port, host, () => {
  log.info(`api listening on http://${host}:${port}`);
});
