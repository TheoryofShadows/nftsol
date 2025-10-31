#!/bin/bash
# 🚀 Safe Push to Private Repo
# Since your repo is private, you can commit everything!

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 PUSHING ETERNAL ECHOES TO PRIVATE REPO"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Verify we're in a git repo
if ! git rev-parse --git-dir > /dev/null 2>&1; then
  echo "❌ Not a git repository!"
  exit 1
fi

# Show current branch
current_branch=$(git branch --show-current)
echo "📍 Current branch: $current_branch"
echo ""

# Check for uncommitted changes
echo "📋 Checking for changes..."
if ! git diff-index --quiet HEAD -- 2>/dev/null; then
  echo "✅ Found changes to commit"
else
  echo "ℹ️  No changes to commit"
  echo ""
  echo "Push existing commits? (y/n)"
  read -r push_only
  
  if [ "$push_only" = "y" ]; then
    echo ""
    echo "🚀 Pushing to remote..."
    git push origin "$current_branch"
    echo ""
    echo "✅ PUSHED SUCCESSFULLY!"
    exit 0
  else
    echo "❌ Aborted"
    exit 0
  fi
fi

echo ""

# Show what will be committed
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 FILES TO BE COMMITTED:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
git status --short
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check for sensitive files (just in case)
echo "🔍 Checking for sensitive files..."
sensitive_found=false

if git status --short | grep -q ".env$"; then
  echo "⚠️  WARNING: .env file detected!"
  sensitive_found=true
fi

if git status --short | grep -q "wallet.json"; then
  echo "⚠️  WARNING: wallet.json detected!"
  sensitive_found=true
fi

if [ "$sensitive_found" = true ]; then
  echo ""
  echo "❌ Sensitive files detected! Remove them first:"
  echo "   git reset .env"
  echo "   git reset **/wallet.json"
  echo ""
  exit 1
fi

echo "✅ No sensitive files detected"
echo ""

# Confirm
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Ready to commit and push?"
echo ""
echo "Your repo is PRIVATE, so this is safe! ✅"
echo ""
echo "Continue? (y/n)"
read -r confirm

if [ "$confirm" != "y" ]; then
  echo "❌ Aborted"
  exit 0
fi

# Get commit message
echo ""
echo "💬 Commit message (or press Enter for default):"
read -r commit_msg

if [ -z "$commit_msg" ]; then
  commit_msg="feat: implement eternal echoes with grok integration"
fi

# Stage all changes
echo ""
echo "📦 Staging changes..."
git add .

# Commit
echo ""
echo "💾 Committing..."
git commit -m "$commit_msg"

echo ""
echo "✅ Committed successfully!"
echo ""

# Push
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Pushing to remote..."
git push origin "$current_branch"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ SUCCESSFULLY PUSHED TO PRIVATE REPO!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🎉 Your Eternal Echoes implementation is now safely in git!"
echo ""
echo "📊 Summary:"
echo "  • Branch: $current_branch"
echo "  • Commit: $(git log -1 --pretty=format:'%h - %s')"
echo "  • Remote: $(git remote get-url origin)"
echo ""
echo "🔒 Your IP is protected (private repo)!"
echo "✨ Full version control!"
echo "🤖 I can still help you locally!"
echo ""
