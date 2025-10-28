# Netlify Environment Variables

## Required Environment Variables for Netlify Deployment

### Frontend Environment Variables (Netlify)
```bash
# Solana Configuration
VITE_SOLANA_RPC_URL=https://api.devnet.solana.com
VITE_SOLANA_NETWORK=devnet

# Backend API Configuration
VITE_API_BASE_URL=https://nftsol-backend.onrender.com
VITE_API_TIMEOUT=30000

# Wallet Configuration
VITE_WALLET_ADAPTER_NETWORK=devnet
VITE_WALLET_ADAPTER_RPC_ENDPOINT=https://api.devnet.solana.com

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_PWA=true
VITE_ENABLE_ETERNAL_ECHOES=true

# External Services
VITE_IRYS_GATEWAY_URL=https://gateway.irys.xyz
VITE_INTERNET_ARCHIVE_API_URL=https://archive.org/advancedsearch.php

# UI Configuration
VITE_APP_NAME=NFTSol
VITE_APP_VERSION=2.0.0
VITE_APP_DESCRIPTION=Decentralized NFT Platform with Eternal Echoes

# Security
VITE_ENABLE_CSRF_PROTECTION=true
VITE_ENABLE_RATE_LIMITING=true
```

### Build Settings for Netlify
```bash
# Build Command
npm run build

# Publish Directory
dist

# Node Version
18.18.0

# Environment
NODE_ENV=production
```

### Netlify Redirects (netlify.toml)
```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://api.devnet.solana.com https://nftsol-backend.onrender.com https://gateway.irys.xyz https://archive.org;"
```

## How to Set Environment Variables in Netlify

1. Go to your Netlify dashboard
2. Select your site
3. Go to Site settings > Environment variables
4. Add each variable with its value
5. Redeploy your site

## Mobile Deployment Notes

- The PWA is configured for mobile deployment
- Service worker is included for offline functionality
- Mobile wallet detection is enabled
- Responsive design works on all screen sizes
- Touch gestures are supported