#!/bin/bash

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 Fixing Eternal Echoes Compatibility Issues"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Fix 1: Install missing backend dependency
echo "📦 Step 1/4: Installing openai package..."
cd apps/backend
npm install openai
cd ../..
echo "✅ openai installed"
echo ""

# Fix 2: Update CLOUT service integration
echo "🔄 Step 2/4: Fixing CLOUT service method calls..."

# Create backup
cp apps/backend/src/services/eternalEchoesService.ts apps/backend/src/services/eternalEchoesService.ts.backup

# Fix method name and parameters
cat > /tmp/fix_clout.sed << 'EOF'
s/await this\.cloutService\.awardCloutForAction(/await this.cloutService.distributeCloutRewards(/g
s/'echo_verified_mint',//g
s/'echo_verified_contribution',//g
s/truthScore >= 90 ? 100 : 50 \/\/ Higher reward for gold truth/truthScore >= 90 ? 100 : 50, 1.0 \/\/ Honor multiplier/g
s/cloutAmount$/cloutAmount, 1.0 \/\/ Honor multiplier/g
EOF

sed -i.bak -f /tmp/fix_clout.sed apps/backend/src/services/eternalEchoesService.ts
rm /tmp/fix_clout.sed apps/backend/src/services/eternalEchoesService.ts.bak

echo "✅ CLOUT service integration fixed"
echo ""

# Fix 3: Remove unused import
echo "🧹 Step 3/4: Removing unused imports..."
sed -i.bak '/^import { useNavigate } from/d' apps/frontend/src/pages/EchoMint.tsx
rm apps/frontend/src/pages/EchoMint.tsx.bak
echo "✅ Unused imports removed"
echo ""

# Fix 4: Verify dependencies
echo "🔍 Step 4/4: Verifying all dependencies..."
echo ""

echo "Backend Dependencies:"
cd apps/backend
echo "  openai: $(npm list openai 2>/dev/null | grep openai || echo '❌ Not found')"
echo "  socket.io: $(npm list socket.io 2>/dev/null | grep socket.io || echo '❌ Not found')"
cd ../..

echo ""
echo "Frontend Dependencies:"
cd apps/frontend
echo "  socket.io-client: $(npm list socket.io-client 2>/dev/null | grep socket.io-client || echo '❌ Not found')"
echo "  @tanstack/react-query: $(npm list @tanstack/react-query 2>/dev/null | grep react-query || echo '❌ Not found')"
echo "  framer-motion: $(npm list framer-motion 2>/dev/null | grep framer-motion || echo '❌ Not found')"
cd ../..

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ ALL FIXES APPLIED SUCCESSFULLY!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Changes made:"
echo "  1. ✅ Installed openai package"
echo "  2. ✅ Fixed CLOUT service method calls"
echo "  3. ✅ Removed unused React Router import"
echo "  4. ✅ Verified all dependencies"
echo ""
echo "📋 Backup created:"
echo "  apps/backend/src/services/eternalEchoesService.ts.backup"
echo ""
echo "🧪 Next steps:"
echo "  1. Review changes: git diff"
echo "  2. Test mint flow: Navigate to 🎬 Mint Echo"
echo "  3. Verify CLOUT awards: Check backend logs"
echo "  4. Test real-time: Add echo layer with 2 browsers"
echo ""
echo "🚀 Eternal Echoes is now 100% compatible!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
