#!/bin/bash

# NFTSol Development Startup Script for Ubuntu/Linux
# This script sets up the development environment properly

echo "🧹 Cleaning up existing processes..."

# Kill any existing Node processes
pkill -f "node" 2>/dev/null || true
pkill -f "tsx" 2>/dev/null || true

echo "✅ Cleaned up existing processes"

# Set environment variables
echo "🔧 Setting up environment variables..."

export PINATA_API_KEY="b56eb57bd4e0b503a094"
export PINATA_SECRET_KEY="2c8365e293ecff150b8a8288efb178e39d1729f95ebc8f349ae4e013cc166a2b"
export HELIUS_API_KEY="33d5c12f-895d-4192-bc26-a86d5ffa5cbc"
export JWT_SECRET="a8f5f167f44f4964e6c998dee827110c"
export SESSION_SECRET="b9e6e278g55g5075f7d009eff938221d"
export NODE_ENV="development"
export DATABASE_URL="postgresql://localhost:5432/nftsol_dev"
export REDIS_URL="redis://localhost:6379"

echo "✅ Environment variables set"

# Start server in background
echo "🚀 Starting NFTSol server..."
cd server
npm run dev &
SERVER_PID=$!
cd ..

# Wait for server to start
echo "⏳ Waiting for server to start..."
sleep 5

# Start client in background
echo "🎨 Starting NFTSol client..."
cd client
npm run dev &
CLIENT_PID=$!
cd ..

echo ""
echo "🎉 NFTSol development environment started!"
echo "📡 Server: http://localhost:3000"
echo "🎨 Client: http://localhost:5173"
echo "🔍 Health: http://localhost:3000/health"
echo ""
echo "Server PID: $SERVER_PID"
echo "Client PID: $CLIENT_PID"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for user to stop
wait
