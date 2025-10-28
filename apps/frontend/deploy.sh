#!/bin/bash

# NFTSol Netlify Deployment Script
echo "🚀 Deploying NFTSol to Netlify..."

# Build the project
echo "📦 Building project..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    
    # Deploy to Netlify
    echo "🌐 Deploying to Netlify..."
    netlify deploy --prod --dir=dist
    
    if [ $? -eq 0 ]; then
        echo "🎉 Deployment successful!"
    else
        echo "❌ Deployment failed!"
        exit 1
    fi
else
    echo "❌ Build failed!"
    exit 1
fi

