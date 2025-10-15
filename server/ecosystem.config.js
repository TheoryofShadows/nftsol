module.exports = {
  apps: [
    {
      name: 'http-proxy-3003',
      script: './ipfs-img-proxy.cjs',
      interpreter: '/usr/bin/node',
      env: { HOST: '0.0.0.0', PORT: '3003', SECONDARY_PORT: '3004' },
      autorestart: true,
      watch: false
    },
    {
      name: 'static-assets-8088',
      script: 'python3',
      args: '-m http.server 8088 --directory /home/khk89/devnet-nft --bind 0.0.0.0',
      interpreter: '/usr/bin/bash', // let PM2 exec python directly is also fine
      autorestart: true,
      watch: false
    }
  ]
}
