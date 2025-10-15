module.exports = {
  apps: [{
    name: "ipfs-proxy",
    script: "npx",
    args: "tsx src/ipfsProxyStandalone.ts",
    cwd: "./server",
    env: { NODE_ENV: "production" },
    max_memory_restart: "500M",
    watch: false,
    exp_backoff_restart_delay: 200,
  }]
};
