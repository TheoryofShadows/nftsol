#!/bin/bash
# Pre-commit script to verify no secrets are being committed
# Usage: ./scripts/verify-no-secrets.sh

set -e

echo "🔍 Checking for secrets in staged files..."

# Check for common secret patterns in staged files
SECRET_PATTERNS=(
    "PLATFORM_SECRET_KEY_BASE58=.*[A-Za-z0-9]{20,}"
    "PLATFORM_SECRET_KEY_JSON=\[.*\]"
    "JWT_SECRET=.*[A-Za-z0-9]{20,}"
    "SESSION_SECRET=.*[A-Za-z0-9]{20,}"
    "DATABASE_URL=.*password.*"
    "HELIUS_API_KEY=.*[A-Za-z0-9]{20,}"
    "XAI_API_KEY=.*xai-.*"
    "PINATA_JWT=.*[A-Za-z0-9]{50,}"
)

FOUND_SECRETS=0

# Get staged files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM)

for file in $STAGED_FILES; do
    # Skip .gitignore and this script
    if [[ "$file" == ".gitignore" ]] || [[ "$file" == *"verify-no-secrets"* ]]; then
        continue
    fi
    
    # Check each pattern
    for pattern in "${SECRET_PATTERNS[@]}"; do
        if git diff --cached "$file" | grep -qiE "$pattern"; then
            echo "❌ SECURITY WARNING: Potential secret found in $file"
            echo "   Pattern: $pattern"
            FOUND_SECRETS=1
        fi
    done
    
    # Check for keypair files
    if [[ "$file" == *"keypair.json" ]] || [[ "$file" == *"wallet.json" ]] || [[ "$file" == ".env" ]]; then
        echo "❌ SECURITY WARNING: Sensitive file being committed: $file"
        FOUND_SECRETS=1
    fi
done

if [ $FOUND_SECRETS -eq 1 ]; then
    echo ""
    echo "⚠️  SECURITY ALERT: Secrets detected in staged files!"
    echo "   Please review and remove secrets before committing."
    echo "   Use environment variables instead."
    exit 1
else
    echo "✅ No secrets detected in staged files."
fi

