module.exports = {
  apps: [
    {
      name: 'http-proxy-3003',
      script: './ipfs-img-proxy.cjs',
      interpreter: '/usr/bin/node',
      env: {
        HOST: '0.0.0.0',
        PORT: '3003',
        SECONDARY_PORT: '3004',
        ADMIN_PORT: '3004',
        METRICS_PORT: '3004',
        MANAGEMENT_PORT: '3004',
        PORT2: '3004',
        HEALTH_PORT: '3004',
        NODE_OPTIONS: '--require /home/khk89/NFTSol_step0/server/port-shim.cjs'
      },
      autorestart: true,
      watch: false
    },
    {
      name: 'static-assets-8088',
      script: '/usr/bin/python3',
      args: ['-m', 'http.server', '8088', '--directory', '/home/khk89/devnet-nft', '--bind', '0.0.0.0'],
      interpreter: 'none',
      exec_mode: 'fork',
      autorestart: true,
      watch: false
    }
  ]
}
