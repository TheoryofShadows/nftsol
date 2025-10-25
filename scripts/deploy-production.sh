#!/bin/bash

# NFTSol Production Deployment Script
# This script handles the complete deployment process

set -e  # Exit on any error

echo "🚀 Starting NFTSol Production Deployment..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in project root directory"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm ci
npm run bootstrap

# Run linting
echo "🔍 Running linting..."
npm run lint --prefix server || echo "⚠️  Linting completed with warnings"

# Build the application
echo "🏗️  Building application..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully!"
else
    echo "❌ Build failed!"
    exit 1
fi

# Create deployment package
echo "📦 Creating deployment package..."
mkdir -p nftsol-deployment
cp -r server/dist nftsol-deployment/
cp -r client/dist nftsol-deployment/client-dist
cp server/package.json nftsol-deployment/
cp server/package-lock.json nftsol-deployment/
cp server/ecosystem.config.cjs nftsol-deployment/
cp server/env.example nftsol-deployment/.env.example
cp docker-compose.yml nftsol-deployment/ 2>/dev/null || true
cp render.yaml nftsol-deployment/ 2>/dev/null || true

# Create deployment archive
echo "🗜️  Creating deployment archive..."
tar -czf nftsol-production-$(date +%Y%m%d-%H%M%S).tar.gz nftsol-deployment/
rm -rf nftsol-deployment/

echo "✅ Deployment package created successfully!"
echo "📁 Archive: nftsol-production-$(date +%Y%m%d-%H%M%S).tar.gz"

# Display deployment instructions
echo ""
echo "🎯 Deployment Instructions:"
echo "1. Upload the archive to your server"
echo "2. Extract: tar -xzf nftsol-production-*.tar.gz"
echo "3. Install dependencies: npm install"
echo "4. Set up environment variables: cp .env.example .env"
echo "5. Start the application: npm start"
echo ""
echo "🌐 Your NFTSol platform is ready for production!"
