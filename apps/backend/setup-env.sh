#!/bin/bash
# NFTSol Server Environment Setup Script for Bash/Ubuntu
# This script sets all required environment variables for the NFTSol server

echo "🚀 Setting up NFTSol Server Environment Variables..."

# =============================================================================
# APPLICATION CONFIGURATION
# =============================================================================
export NODE_ENV="development"
export PORT="3000"
export LOG_LEVEL="info"

# =============================================================================
# SECURITY CONFIGURATION
# =============================================================================
export SESSION_SECRET="${SESSION_SECRET:-dev-session-secret-minimum-32-characters-long-production-ready-key}"
export JWT_SECRET="${JWT_SECRET:-dev-jwt-secret-minimum-32-characters-long-production-ready-key}"

# =============================================================================
# DATABASE CONFIGURATION (Optional - leave empty for now)
# =============================================================================
export DATABASE_URL=""
export REDIS_URL=""

# =============================================================================
# PINATA IPFS CONFIGURATION (Optional)
# =============================================================================
export PINATA_API_KEY=""
export PINATA_SECRET_KEY=""
export PINATA_JWT=""

# =============================================================================
# HELIUS SOLANA CONFIGURATION (Optional)
# =============================================================================
export HELIUS_API_KEY=""
export HELIUS_RPC_URL="https://api.mainnet-beta.solana.com"
export HELIUS_REST_URL="https://api.helius.xyz/v0"

# =============================================================================
# SOLANA CONFIGURATION
# =============================================================================
export SOLANA_CLUSTER="mainnet-beta"
export SOLANA_RPC_URL="https://api.mainnet-beta.solana.com"

# =============================================================================
# CORS CONFIGURATION
# =============================================================================
export DEV_ALLOWED_ORIGINS="http://localhost:3000,http://localhost:5173,http://localhost:5174"
export ALLOWED_ORIGINS="https://nftsol.app,https://www.nftsol.app,https://nftsol-server-prod.onrender.com"

# =============================================================================
# RATE LIMITING
# =============================================================================
export RATE_LIMIT_WINDOW_MS="900000"
export RATE_LIMIT_MAX_REQUESTS="100"

# =============================================================================
# AWS S3 CONFIGURATION (Optional)
# =============================================================================
export AWS_ACCESS_KEY_ID=""
export AWS_SECRET_ACCESS_KEY=""
export S3_BACKUP_BUCKET=""
export S3_BACKUP_REGION="us-east-1"

# =============================================================================
# OPENAI CONFIGURATION (Optional)
# =============================================================================
export OPENAI_API_KEY=""

# =============================================================================
# ADMIN CONFIGURATION
# =============================================================================
export ADMIN_IPS="127.0.0.1,::1"

# =============================================================================
# CLOUT TOKEN CONFIGURATION (Optional)
# =============================================================================
export CLOUT_MINT=""
export CLOUT_TREASURY=""
export CLOUT_FEE_COLLECTOR=""
export CLOUT_DEVELOPER=""

# =============================================================================
# SECURITY HEADERS
# =============================================================================
export HELMET_CSP_ENABLED="true"
export TRUST_PROXY="1"

echo "✅ Environment variables set!"
echo "📋 Summary:"
echo "   NODE_ENV: $NODE_ENV"
echo "   PORT: $PORT"
echo "   SESSION_SECRET: [SET]"
echo "   JWT_SECRET: [SET]"
echo "   DATABASE_URL: [EMPTY - Using in-memory]"
echo "   REDIS_URL: [EMPTY - Using in-memory sessions]"
echo ""
echo "🚀 You can now run: npm start"
