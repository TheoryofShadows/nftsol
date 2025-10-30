#!/bin/bash
# 🔒 Secure Git Push - Eternal Echoes
# Safely push changes while protecting IP

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔒 SECURE GIT PUSH - ETERNAL ECHOES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Step 1: Check if repo is private
echo "⚠️  IMPORTANT: Is your GitHub repo PRIVATE?"
echo ""
echo "To check:"
echo "1. Go to: https://github.com/YOUR_USERNAME/nftsol/settings"
echo "2. Scroll to 'Danger Zone'"
echo "3. Verify it says 'Change visibility' → 'Make public'"
echo "   (If it says 'Make private', your repo is PUBLIC!)"
echo ""
echo "Is your repo PRIVATE? (y/n)"
read -r is_private

if [ "$is_private" != "y" ]; then
  echo ""
  echo "❌ Please make your repo private first!"
  echo ""
  echo "How to make private:"
  echo "1. Go to repo Settings"
  echo "2. Scroll to Danger Zone"
  echo "3. Click 'Change visibility'"
  echo "4. Select 'Make private'"
  echo "5. Confirm"
  echo ""
  exit 1
fi

echo ""
echo "✅ Repo is private - proceeding..."
echo ""

# Step 2: Update .gitignore to protect sensitive files
echo "📝 Updating .gitignore to protect sensitive files..."

cat >> .gitignore << 'GITIGNORE_EOF'

# ============================================
# Eternal Echoes - Protected Files
# ============================================

# Core verification logic (your secret sauce)
apps/backend/src/utils/grokpedia-free.ts

# Detailed documentation (reveals strategy)
ETERNAL_ECHOES_IMPLEMENTATION.md
ETERNAL_ECHOES_QUICK_START.md
ETERNAL_ECHOES_FREE_GROK_SETUP.md
XAI_INTEGRATION_GUIDE.md
XAI_BEFORE_AFTER.md
*ECHOES_FREE*.txt
*ECHOES_FREE*.md

# Setup scripts (reveals integration)
setup-eternal-echoes*.sh
secure-push.sh

# Sensitive configs
.env
.env.*
!.env.example

# API keys
XAI_API_KEY*
**/wallet.json

GITIGNORE_EOF

echo "✅ .gitignore updated!"
echo ""

# Step 3: Stage safe files
echo "📦 Staging safe files for commit..."
echo ""

# Frontend (safe - UI code)
git add apps/frontend/src/pages/EchoMint.tsx || true
git add apps/frontend/src/pages/EchoMint.css || true
git add apps/frontend/src/pages/EchoViewer.tsx || true
git add apps/frontend/src/pages/EchoViewer.css || true
git add apps/frontend/src/App.tsx || true

# Backend (safe - scaffolding only, not core logic)
git add apps/backend/src/routes/echo.ts || true
git add apps/backend/src/schema.ts || true
git add apps/backend/src/types/echo.ts || true
git add apps/backend/src/app.ts || true
git add apps/backend/.env.example || true

# Smart contracts (safe - public anyway when deployed)
git add apps/smart-contracts/tests/eternal-echoes.test.ts || true
git add apps/smart-contracts/*/programs/eternal_echoes/src/lib.rs || true
git add apps/smart-contracts/*/programs/eternal_echoes/Cargo.toml || true

# .gitignore
git add .gitignore || true

echo "✅ Files staged!"
echo ""

# Step 4: Show what will be committed
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 FILES TO BE COMMITTED:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
git diff --staged --name-only
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "⚠️  PROTECTED FILES (not committed):"
echo "  • grokpedia-free.ts (core verification logic)"
echo "  • ETERNAL_ECHOES*.md (detailed docs)"
echo "  • setup scripts"
echo "  • .env files"
echo ""

# Step 5: Confirm
echo "Review files above. Continue with commit? (y/n)"
read -r confirm

if [ "$confirm" != "y" ]; then
  echo "❌ Aborted"
  git reset
  exit 0
fi

# Step 6: Commit
echo ""
echo "💬 Commit message (or press Enter for default):"
read -r commit_msg

if [ -z "$commit_msg" ]; then
  commit_msg="feat: add archive explorer feature"
fi

git commit -m "$commit_msg"
echo "✅ Committed!"
echo ""

# Step 7: Push
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Push to remote? (y/n)"
read -r push_confirm

if [ "$push_confirm" = "y" ]; then
  echo ""
  echo "🚀 Pushing to origin..."
  git push origin $(git branch --show-current)
  echo ""
  echo "✅ PUSHED SUCCESSFULLY!"
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "🎉 Your changes are now in your PRIVATE repo!"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
else
  echo "❌ Push cancelled - changes only in local git"
fi

echo ""
echo "💾 Don't forget to backup protected files separately:"
echo "  • apps/backend/src/utils/grokpedia-free.ts"
echo "  • ETERNAL_ECHOES*.md"
echo ""
echo "Backup command:"
echo "  tar -czf eternal-echoes-backup-\$(date +%Y%m%d).tar.gz \\"
echo "    apps/backend/src/utils/grokpedia-free.ts \\"
echo "    ETERNAL_ECHOES*.md \\"
echo "    setup-eternal-echoes*.sh"
echo ""
