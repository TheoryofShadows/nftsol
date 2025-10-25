import { getAppConfig, getHeliusConfig } from "./config/environment";
import { validateEnvironmentAndExit } from "./utils/envValidation";
import app from "./app";

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

app.listen(appConfig.port, host, () => {
  console.log(`✅ NFTSol API listening on http://${host}:${appConfig.port}`);
  console.log(`🔒 Security: Environment validation passed`);
});
