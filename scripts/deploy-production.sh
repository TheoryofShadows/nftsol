#!/bin/bash

# NFTSol Production Deployment Script
echo "🚀 Deploying NFTSol to Production Environment..."

# Set environment
export NODE_ENV=production

# Install dependencies
echo "📦 Installing dependencies..."
npm install
cd client && npm install
cd ../server && npm install
cd ..

# Copy environment files
echo "🔧 Setting up environment variables..."
cp client/env.production client/.env.local
cp server/env.production server/.env

# Build frontend
echo "🏗️ Building frontend..."
cd client
npm run build
cd ..

# Build backend
echo "🏗️ Building backend..."
cd server
npm run build
cd ..

echo "✅ Production build complete!"
echo "📁 Frontend build: client/dist/"
echo "📁 Backend build: server/dist/"
echo ""
echo "🌐 Deploy to:"
echo "  Frontend: Upload client/dist/ to Netlify"
echo "  Backend: Push to GitHub (Render auto-deploys)"