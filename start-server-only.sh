#!/bin/bash

# NFTSol Server Only Startup Script
echo "🔧 Setting up NFTSol server environment..."

# Set environment variables
export PINATA_API_KEY="b56eb57bd4e0b503a094"
export PINATA_SECRET_KEY="2c8365e293ecff150b8a8288efb178e39d1729f95ebc8f349ae4e013cc166a2b"
export HELIUS_API_KEY="33d5c12f-895d-4192-bc26-a86d5ffa5cbc"
export JWT_SECRET="a8f5f167f44f4964e6c998dee827110c"
export SESSION_SECRET="b9e6e278g55g5075f7d009eff938221d"
export NODE_ENV="development"
export DATABASE_URL="postgresql://localhost:5432/nftsol_dev"
export REDIS_URL="redis://localhost:6379"

echo "✅ Environment variables set"
echo "🚀 Starting NFTSol server..."

cd server
npm run dev
