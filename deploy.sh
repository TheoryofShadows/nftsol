#!/bin/bash

# NFTSol Deployment Script
# This script prepares your NFTSol marketplace for GitHub and deployment

echo "🚀 NFTSol Deployment Setup"
echo "================================"

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📦 Initializing git repository..."
    git init
fi

# Get GitHub username
echo "📝 Enter your GitHub username:"
read github_username

if [ -z "$github_username" ]; then
    echo "❌ GitHub username is required!"
    exit 1
fi

echo "🔧 Setting up repository..."

# Add all files
git add .

# Create commit
git commit -m "🎉 feat: Complete NFTSol marketplace with advanced backend, admin dashboard, and Solana integration

- Modern React frontend with wallet connectivity
- Express.js backend with PostgreSQL database  
- Admin dashboard for platform management
- Advanced backend services with controllers and webhooks
- Solana smart contracts integration
- Automation scripts for NFT simulations and reporting
- Multi-platform deployment configuration
- GitHub Actions CI/CD pipeline"

# Set main branch
git branch -M main

# Add remote origin
git remote remove origin 2>/dev/null || true
git remote add origin https://github.com/$github_username/nftsol.git

echo "📤 Pushing to GitHub..."

# Push to GitHub
if git push -u origin main; then
    echo "✅ Successfully pushed to GitHub!"
    echo ""
    echo "🌐 Next Steps:"
    echo "1. Visit: https://github.com/$github_username/nftsol"
    echo "2. Deploy to Vercel: https://vercel.com/new/git"
    echo "3. Configure your NFTSol.app domain"
    echo "4. Set up environment variables for production"
    echo ""
    echo "📚 Documentation:"
    echo "- Deployment Guide: DEPLOYMENT_ADVANCED.md"
    echo "- GitHub Setup: GITHUB_SETUP.md" 
    echo "- Domain Connection: DOMAIN_CONNECTION.md"
    echo ""
    echo "🎊 Your NFTSol marketplace is ready for deployment!"
else
    echo "❌ Push failed. Make sure:"
    echo "1. Repository exists: https://github.com/$github_username/nftsol"
    echo "2. You have write access to the repository"
    echo "3. Your GitHub credentials are configured"
    echo ""
    echo "💡 Try running: git push origin main"
fi