module.exports = {
  apps: [
    {
      name: 'ipfs-proxy',
      cwd: __dirname,
      script: 'npx',
      args: 'tsx src/ipfsProxyStandalone.ts',
      env: {
        IPFS_PROXY_PORT: 3002
      },
      autorestart: true,
      watch: false
    }
  ]
}
