#!/bin/bash
# Script to create a new CLOUT token on Solana
# This will generate a new SPL token with proper configuration

set -e

echo "=== Creating New CLOUT Token ==="
echo ""

# Check if solana CLI is available
if ! command -v spl-token &> /dev/null; then
    echo "❌ Error: spl-token CLI not found"
    echo "Please install Solana CLI tools: https://docs.solana.com/cli/install-solana-cli-tools"
    exit 1
fi

# Configuration
TOKEN_NAME="CLOUT"
TOKEN_SYMBOL="CLOUT"
DECIMALS=9
INITIAL_SUPPLY=1000000000  # 1 Billion CLOUT

echo "Token Configuration:"
echo "  Name: $TOKEN_NAME"
echo "  Symbol: $TOKEN_SYMBOL"
echo "  Decimals: $DECIMALS"
echo "  Initial Supply: $INITIAL_SUPPLY"
echo ""

# Step 1: Create the token mint
echo "Step 1: Creating token mint..."
MINT_ADDRESS=$(spl-token create-token --decimals $DECIMALS --url https://api.mainnet-beta.solana.com 2>&1 | grep "Creating token" | awk '{print $3}')

if [ -z "$MINT_ADDRESS" ]; then
    echo "❌ Failed to create token mint"
    exit 1
fi

echo "✅ Token mint created: $MINT_ADDRESS"
echo ""

# Step 2: Create token account for minting
echo "Step 2: Creating token account..."
TOKEN_ACCOUNT=$(spl-token create-account $MINT_ADDRESS --url https://api.mainnet-beta.solana.com 2>&1 | grep "Creating account" | awk '{print $3}')

if [ -z "$TOKEN_ACCOUNT" ]; then
    echo "❌ Failed to create token account"
    exit 1
fi

echo "✅ Token account created: $TOKEN_ACCOUNT"
echo ""

# Step 3: Mint initial supply
echo "Step 3: Minting initial supply..."
spl-token mint $MINT_ADDRESS $INITIAL_SUPPLY --url https://api.mainnet-beta.solana.com

echo "✅ Minted $INITIAL_SUPPLY $TOKEN_SYMBOL tokens"
echo ""

# Step 4: Display token information
echo "=== New CLOUT Token Created Successfully ==="
echo ""
echo "Token Mint Address: $MINT_ADDRESS"
echo "Token Account: $TOKEN_ACCOUNT"
echo "Decimals: $DECIMALS"
echo "Supply: $INITIAL_SUPPLY"
echo ""
echo "⚠️  IMPORTANT: Save these addresses securely!"
echo ""
echo "Next Steps:"
echo "1. Update .env files with:"
echo "   CLOUT_MINT=$MINT_ADDRESS"
echo "   CLOUT_PROGRAM_ID=$MINT_ADDRESS"
echo "   REWARDS_VAULT=$TOKEN_ACCOUNT"
echo ""
echo "2. Run the update script:"
echo "   node scripts/update-token-addresses.js $MINT_ADDRESS $TOKEN_ACCOUNT"
echo ""
echo "3. Optional: Renounce mint authority (makes supply fixed):"
echo "   spl-token authorize $MINT_ADDRESS mint --disable --url https://api.mainnet-beta.solana.com"
echo ""
echo "4. Optional: Add token metadata (recommended):"
echo "   Use Metaplex Token Metadata program to add name, symbol, and logo"
echo ""

# Save to file for reference
cat > /workspace/NEW_TOKEN_INFO.md << EOF
# New CLOUT Token Information

**Created**: $(date)

## Token Details

- **Mint Address**: \`$MINT_ADDRESS\`
- **Token Account**: \`$TOKEN_ACCOUNT\`
- **Decimals**: $DECIMALS
- **Initial Supply**: $INITIAL_SUPPLY $TOKEN_SYMBOL

## Environment Variables

\`\`\`bash
CLOUT_MINT=$MINT_ADDRESS
CLOUT_PROGRAM_ID=$MINT_ADDRESS
REWARDS_VAULT=$TOKEN_ACCOUNT
\`\`\`

## View on Explorers

- Solscan: https://solscan.io/token/$MINT_ADDRESS
- Solana Explorer: https://explorer.solana.com/address/$MINT_ADDRESS

## Security Considerations

⚠️ **Mint Authority**: Currently active - can mint more tokens
⚠️ **Freeze Authority**: Currently active - can freeze accounts

To make the token trustless:
1. Renounce mint authority: \`spl-token authorize $MINT_ADDRESS mint --disable\`
2. Renounce freeze authority: \`spl-token authorize $MINT_ADDRESS freeze --disable\`

## Next Steps

1. ✅ Token created
2. ⬜ Update codebase with new addresses
3. ⬜ Add token metadata (name, symbol, logo)
4. ⬜ Distribute initial supply to wallets
5. ⬜ Renounce authorities (optional, for trustless operation)
6. ⬜ Announce new token to community

EOF

echo "✅ Token information saved to NEW_TOKEN_INFO.md"
echo ""
