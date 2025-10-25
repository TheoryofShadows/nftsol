#!/bin/bash

# NFTSol Server Only Startup Script
echo "🔧 Setting up NFTSol server environment..."

# Set environment variables
export PINATA_API_KEY="***REMOVED***"
export PINATA_SECRET_KEY="***REMOVED***"
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
