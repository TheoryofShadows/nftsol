#!/bin/bash
# 🎭 Obfuscate Eternal Echoes for Public Repo
# Makes your code look generic/uninteresting to competitors

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎭 OBFUSCATING ETERNAL ECHOES FOR PUBLIC REPO"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "⚠️  This will rename files to look generic."
echo "⚠️  Make sure you have a backup!"
echo ""
echo "Continue? (y/n)"
read -r confirm

if [ "$confirm" != "y" ]; then
  echo "❌ Aborted"
  exit 0
fi

echo ""
echo "📦 Step 1: Backing up original files..."
./BACKUP_SENSITIVE_FILES.sh

echo ""
echo "🎭 Step 2: Renaming files to generic names..."

# Backend files
if [ -f "apps/backend/src/utils/grokpedia-free.ts" ]; then
  mv apps/backend/src/utils/grokpedia-free.ts apps/backend/src/utils/contentVerification.ts
  echo "  ✓ grokpedia-free.ts → contentVerification.ts"
fi

if [ -f "apps/backend/src/routes/echo-optimized.ts" ]; then
  mv apps/backend/src/routes/echo-optimized.ts apps/backend/src/routes/archive.ts
  echo "  ✓ echo-optimized.ts → archive.ts"
fi

if [ -f "apps/backend/src/routes/echo.ts" ]; then
  mv apps/backend/src/routes/echo.ts apps/backend/src/routes/archiveContent.ts
  echo "  ✓ echo.ts → archiveContent.ts"
fi

# Frontend files
if [ -f "apps/frontend/src/pages/EchoMint.tsx" ]; then
  mv apps/frontend/src/pages/EchoMint.tsx apps/frontend/src/pages/ArchiveExplorer.tsx
  echo "  ✓ EchoMint.tsx → ArchiveExplorer.tsx"
fi

if [ -f "apps/frontend/src/pages/EchoMint.css" ]; then
  mv apps/frontend/src/pages/EchoMint.css apps/frontend/src/pages/ArchiveExplorer.css
  echo "  ✓ EchoMint.css → ArchiveExplorer.css"
fi

if [ -f "apps/frontend/src/pages/EchoViewer.tsx" ]; then
  mv apps/frontend/src/pages/EchoViewer.tsx apps/frontend/src/pages/ArchiveViewer.tsx
  echo "  ✓ EchoViewer.tsx → ArchiveViewer.tsx"
fi

if [ -f "apps/frontend/src/pages/EchoViewer.css" ]; then
  mv apps/frontend/src/pages/EchoViewer.css apps/frontend/src/pages/ArchiveViewer.css
  echo "  ✓ EchoViewer.css → ArchiveViewer.css"
fi

echo ""
echo "🗑️  Step 3: Deleting revealing documentation..."

# Delete docs that reveal strategy
rm -f ETERNAL_ECHOES*.md
rm -f XAI_*.md
rm -f *ECHOES*.txt
rm -f setup-eternal-echoes*.sh
rm -f secure-push.sh
rm -f SECURE_GIT_STRATEGY.md
echo "  ✓ Deleted revealing docs"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ OBFUSCATION COMPLETE!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⚠️  MANUAL STEPS REQUIRED:"
echo ""
echo "1. Update imports in App.tsx:"
echo "   - Change: import EchoMint from './pages/EchoMint'"
echo "   - To: import ArchiveExplorer from './pages/ArchiveExplorer'"
echo ""
echo "2. Update imports in app.ts (backend):"
echo "   - Change: import { grokVerify } from './utils/grokpedia'"
echo "   - To: import { verifyContent } from './utils/contentVerification'"
echo ""
echo "3. Update route names in app.ts:"
echo "   - Change: app.use('/api/echo', echoRouter)"
echo "   - To: app.use('/api/archive', archiveRouter)"
echo ""
echo "4. Search and replace revealing comments:"
echo "   - Remove: 'Eternal Echoes', 'Grok', 'xAI', etc."
echo "   - Use: Generic terms like 'archive', 'content', 'verification'"
echo ""
echo "5. Update function names to be generic:"
echo "   - grokVerify() → verifyContent()"
echo "   - mintEcho() → createArchiveItem()"
echo "   - etc."
echo ""
echo "6. Test that everything still works:"
echo "   cd apps/backend && npm run dev"
echo "   cd apps/frontend && npm run dev"
echo ""
echo "7. Commit with generic message:"
echo "   git add ."
echo "   git commit -m 'refactor: improve archive content handling'"
echo "   git push origin main"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💾 Original files backed up to: ~/eternal-echoes-backups/"
echo ""
