# Render Environment Variables

## Required Environment Variables for Render Backend Deployment

### Backend Environment Variables (Render)
```bash
# Server Configuration
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Solana Configuration
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_NETWORK=devnet
SOLANA_PRIVATE_KEY=your_solana_private_key_here

# Database Configuration
DATABASE_URL=your_database_url_here
DB_HOST=your_db_host
DB_PORT=5432
DB_NAME=nftsol_production
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# JWT Configuration
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=https://your-netlify-site.netlify.app
CORS_CREDENTIALS=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# External Services
IRYS_GATEWAY_URL=https://gateway.irys.xyz
IRYS_PRIVATE_KEY=your_irys_private_key_here
INTERNET_ARCHIVE_API_URL=https://archive.org/advancedsearch.php

# Bubblegum Configuration
BUBBLEGUM_PROGRAM_ID=BGUMzZr2wWfD1yrR4n2h2MBWUUuudZ5Jc6Z4b7Rruc9
BUBBLEGUM_TREE_ADDRESS=your_bubblegum_tree_address_here
BUBBLEGUM_TREE_AUTHORITY=your_bubblegum_tree_authority_here

# CLOUT Token Configuration
CLOUT_TOKEN_MINT=your_clout_token_mint_here
CLOUT_TOKEN_DECIMALS=9

# Eternal Echoes Configuration
ETERNAL_ECHOES_ENABLED=true
GROK_VERIFICATION_ENABLED=true
TRUTH_SCORE_THRESHOLD=0.7

# Security
ENABLE_CSRF_PROTECTION=true
ENABLE_RATE_LIMITING=true
TRUST_PROXY=true

# Logging
LOG_LEVEL=info
LOG_FORMAT=combined

# Health Check
HEALTH_CHECK_ENABLED=true
HEALTH_CHECK_PATH=/health
```

### Render Service Configuration

#### Backend Service (Web Service)
```yaml
# render.yaml
services:
  - type: web
    name: nftsol-backend
    env: node
    plan: starter
    buildCommand: npm install
    startCommand: npm start
    healthCheckPath: /health
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3000
```

#### Database Service (PostgreSQL)
```yaml
  - type: pserv
    name: nftsol-database
    env: postgresql
    plan: starter
    databaseName: nftsol_production
```

### Build Settings for Render
```bash
# Build Command
npm install && npm run build

# Start Command
npm start

# Node Version
18.18.0

# Health Check
GET /health
```

## How to Set Environment Variables in Render

1. Go to your Render dashboard
2. Select your service
3. Go to Environment tab
4. Add each variable with its value
5. Deploy your service

## Security Notes

- Never commit private keys to version control
- Use Render's environment variable system
- Rotate keys regularly
- Monitor access logs
- Use HTTPS only
- Enable CORS properly
- Set up proper rate limiting

## Database Migration

If you need to run database migrations:
```bash
# Add to package.json scripts
"migrate": "npx prisma migrate deploy"
"migrate:dev": "npx prisma migrate dev"

# Run before deployment
npm run migrate
```

## Monitoring and Logs

- Enable Render's built-in monitoring
- Set up log aggregation
- Monitor error rates
- Track performance metrics
- Set up alerts for critical issues