#!/bin/bash

# Universal Environment Setup Script
# Works for both Windows (WSL/Git Bash) and Linux

echo "🔧 Setting up NFTSol environment variables..."

# Set environment variables
export PINATA_API_KEY="b56eb57bd4e0b503a094"
export PINATA_SECRET_KEY="2c8365e293ecff150b8a8288efb178e39d1729f95ebc8f349ae4e013cc166a2b"
export HELIUS_API_KEY="33d5c12f-895d-4192-bc26-a86d5ffa5cbc"
export JWT_SECRET="a8f5f167f44f4964e6c998dee827110c"
export SESSION_SECRET="b9e6e278g55g5075f7d009eff938221d"
export NODE_ENV="development"
export DATABASE_URL="postgresql://localhost:5432/nftsol_dev"
export REDIS_URL="redis://localhost:6379"

echo "✅ Environment variables set successfully!"
echo ""
echo "🔍 Environment Status:"
echo "   PINATA_API_KEY: ${PINATA_API_KEY:0:8}..."
echo "   PINATA_SECRET_KEY: ${PINATA_SECRET_KEY:0:8}..."
echo "   HELIUS_API_KEY: ${HELIUS_API_KEY:0:8}..."
echo "   JWT_SECRET: ${JWT_SECRET:0:8}..."
echo "   SESSION_SECRET: ${SESSION_SECRET:0:8}..."
echo "   NODE_ENV: $NODE_ENV"
echo ""
echo "🚀 Ready to start development!"
echo "   Server: cd server && npm run dev"
echo "   Client: cd client && npm run dev"
echo "   Both:   ./start-dev.sh"
