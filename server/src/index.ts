import { getAppConfig, getHeliusConfig } from "./config/environment";
import { validateEnvironmentAndExit } from "./utils/envValidation";
import { server } from "./app";

// Validate environment before starting server
validateEnvironmentAndExit();

const appConfig = getAppConfig();
const heliusConfig = getHeliusConfig();

console.log(`🚀 NFTSol Server Starting...`);
console.log(`   Environment: ${appConfig.env}`);
console.log(`   Port: ${appConfig.port}`);
console.log(`   Helius RPC: ${heliusConfig.rpcUrl}`);
console.log(`   Helius Key: ${heliusConfig.apiKey ? `${heliusConfig.apiKey.slice(0, 8)}...` : 'Not configured'}`);

const host = "0.0.0.0";
const PORT = Number(process.env.PORT || appConfig.port || 3000);

server.listen(PORT, host, () => {
  console.log(`✅ NFTSol API listening on http://${host}:${PORT}`);
  console.log(`🔒 Security: Environment validation passed`);
  console.log(`🔗 Health check: http://${host}:${PORT}/healthz`);
  console.log(`🔌 WebSocket: ${process.env.WS_ENABLED === 'true' ? 'Enabled' : 'Disabled'}`);
});
