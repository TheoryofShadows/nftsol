"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const environment_1 = require("./config/environment");
const envValidation_1 = require("./utils/envValidation");
const app_1 = __importDefault(require("./app"));
// Validate environment before starting server
(0, envValidation_1.validateEnvironmentAndExit)();
const appConfig = (0, environment_1.getAppConfig)();
const heliusConfig = (0, environment_1.getHeliusConfig)();
console.log(`🚀 NFTSol Server Starting...`);
console.log(`   Environment: ${appConfig.env}`);
console.log(`   Port: ${appConfig.port}`);
console.log(`   Helius RPC: ${heliusConfig.rpcUrl}`);
console.log(`   Helius Key: ${heliusConfig.apiKey ? `${heliusConfig.apiKey.slice(0, 8)}...` : 'Not configured'}`);
const host = "0.0.0.0";
const PORT = Number(process.env.PORT || appConfig.port || 3000);
app_1.default.listen(PORT, host, () => {
    console.log(`✅ NFTSol API listening on http://${host}:${PORT}`);
    console.log(`🔒 Security: Environment validation passed`);
    console.log(`🔗 Health check: http://${host}:${PORT}/healthz`);
});
