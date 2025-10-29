#!/bin/bash

# NFTSol Platform Key Setup Script
# This script helps you set up new platform keys securely

echo "🔐 NFTSol Platform Key Setup"
echo "============================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

echo "📦 Installing dependencies..."
cd apps/backend
npm install

echo ""
echo "🔑 Generating new platform keys..."
node ../../scripts/generate-platform-keys.js

echo ""
echo "🔒 Setting up .gitignore..."
cd ../..

# Ensure .gitignore includes sensitive files
if ! grep -q ".env" .gitignore; then
    echo ".env" >> .gitignore
    echo ".env.local" >> .gitignore
    echo ".env.production" >> .gitignore
    echo "platform-keys-backup.json" >> .gitignore
    echo "*.key" >> .gitignore
    echo "Added sensitive files to .gitignore"
fi

echo ""
echo "✅ Key generation complete!"
echo ""
echo "🚀 NEXT STEPS:"
echo "=============="
echo "1. Review the generated .env file"
echo "2. Fund the platform wallet with SOL:"
echo "   solana transfer <PUBLIC_KEY> 1.0 --from <your-wallet> --url devnet"
echo "3. Test the platform:"
echo "   cd apps/backend && npm run dev"
echo "4. Update your deployment configuration"
echo "5. Deploy to production"
echo ""
echo "⚠️  SECURITY:"
echo "============"
echo "• Never commit .env files to version control"
echo "• Store backup keys securely offline"
echo "• Use environment variables in production"
echo "• Monitor for unauthorized access"
