#!/bin/bash
# 💾 Backup Sensitive Eternal Echoes Files
# These files are NOT in git (protected by .gitignore)

set -e

BACKUP_DIR="$HOME/eternal-echoes-backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="eternal-echoes-private-$TIMESTAMP.tar.gz"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💾 BACKING UP SENSITIVE ETERNAL ECHOES FILES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Create backup directory
mkdir -p "$BACKUP_DIR"

echo "📦 Creating backup archive..."
echo ""

# Files to backup (your secret sauce)
tar -czf "$BACKUP_DIR/$BACKUP_FILE" \
  apps/backend/src/utils/grokpedia-free.ts \
  apps/backend/src/routes/echo-optimized.ts \
  ETERNAL_ECHOES_IMPLEMENTATION.md \
  ETERNAL_ECHOES_QUICK_START.md \
  ETERNAL_ECHOES_FREE_GROK_SETUP.md \
  ETERNAL_ECHOES_FREE_SUMMARY.txt \
  XAI_INTEGRATION_GUIDE.md \
  XAI_INTEGRATION_SUMMARY.txt \
  XAI_BEFORE_AFTER.md \
  setup-eternal-echoes-free.sh \
  secure-push.sh \
  2>/dev/null || true

echo "✅ Backup created: $BACKUP_FILE"
echo ""
echo "📍 Location: $BACKUP_DIR/"
echo ""
echo "📊 Backup contents:"
tar -tzf "$BACKUP_DIR/$BACKUP_FILE" | head -20
echo ""

# Also backup .env (if exists)
if [ -f "apps/backend/.env" ]; then
  cp apps/backend/.env "$BACKUP_DIR/env-backup-$TIMESTAMP.txt"
  echo "✅ .env backed up separately (DO NOT share!)"
  echo ""
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 BACKUP COMPLETE!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 Next steps:"
echo ""
echo "1. Store backup securely:"
echo "   • Encrypted USB drive"
echo "   • Encrypted cloud (Dropbox, Google Drive)"
echo "   • Password-protected archive"
echo ""
echo "2. Optional: Encrypt backup:"
echo "   gpg -c $BACKUP_DIR/$BACKUP_FILE"
echo ""
echo "3. Test restore:"
echo "   tar -xzf $BACKUP_DIR/$BACKUP_FILE -C /tmp/test"
echo ""
echo "📅 Backup date: $TIMESTAMP"
echo "📁 Backup file: $BACKUP_FILE"
echo ""
