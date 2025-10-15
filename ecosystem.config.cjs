module.exports = {
  apps: [{
    name: "ipfs-proxy",
    cwd: "/home/khk89/NFTSol_step0/server",
    script: "node",
    args: "dist/ipfsProxyStandalone.js",
    env: {
      NODE_ENV: "production",
      PORT: "8080"
    },
    max_memory_restart: "500M",
    watch: false,
    exp_backoff_restart_delay: 200
  }]
};
