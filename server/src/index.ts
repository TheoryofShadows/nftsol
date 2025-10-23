import { getAppConfig, getHeliusConfig } from "./config/environment";
import app from "./app";

const appConfig = getAppConfig();
const heliusConfig = getHeliusConfig();

console.log(`?? NFTSol environment: ${appConfig.env}`);
console.log(
  `?? Helius key prefix: ${
    heliusConfig.apiKey ? heliusConfig.apiKey.slice(0, 8) : "? missing key"
  }`,
);
console.log(`?? Helius RPC URL: ${heliusConfig.rpcUrl}`);

const host = "0.0.0.0";

app.listen(appConfig.port, host, () => {
  console.log(`api listening on http://${host}:${appConfig.port}`);
});
