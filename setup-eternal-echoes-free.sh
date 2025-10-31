#!/bin/bash
# 🎬 ETERNAL ECHOES - FREE GROK SETUP SCRIPT
# Run this to set up Eternal Echoes with FREE xAI integration

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎬 ETERNAL ECHOES - FREE GROK SETUP"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Step 1: Install OpenAI SDK
echo "📦 Step 1: Installing OpenAI SDK..."
cd apps/backend
npm install openai --save
echo "✅ OpenAI SDK installed!"
echo ""

# Step 2: Copy optimized files
echo "📝 Step 2: Setting up optimized files..."
cp src/utils/grokpedia-free.ts src/utils/grokpedia.ts
cp src/routes/echo-optimized.ts src/routes/echo.ts
echo "✅ Files updated!"
echo ""

# Step 3: Setup .env
echo "🔑 Step 3: Setting up environment..."
if [ ! -f .env ]; then
  echo "Creating .env file..."
  echo "XAI_API_KEY=" > .env
  echo "✅ .env created!"
else
  echo "⚠️  .env already exists"
fi
echo ""

# Step 4: Show next steps
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ SETUP COMPLETE!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 NEXT STEPS:"
echo ""
echo "1. Get FREE xAI API key:"
echo "   → Visit: https://console.x.ai/api-keys"
echo "   → Sign up (FREE \$25 credits!)"
echo "   → Copy your key (starts with xai-)"
echo ""
echo "2. Add key to .env:"
echo "   → Edit apps/backend/.env"
echo "   → Add: XAI_API_KEY=xai-your-key-here"
echo ""
echo "3. Start backend:"
echo "   → cd apps/backend"
echo "   → npm run dev"
echo ""
echo "4. Test it:"
echo "   → curl -X POST http://localhost:3001/api/echo/verify \\"
echo "     -H \"Content-Type: application/json\" \\"
echo "     -d '{\"content\": \"NASA Apollo 11\"}'"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📚 Documentation: ETERNAL_ECHOES_FREE_GROK_SETUP.md"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🎉 Ready to use FREE Grok for Eternal Echoes! ✨"
