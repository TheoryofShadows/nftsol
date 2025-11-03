# 🚀 Quick Start: New CLOUT Token

**Status**: Old token redacted ✅ | Ready for new token creation ⏳

## 📝 TL;DR

Old CLOUT token addresses have been removed. Follow these 3 steps to set up your new token:

```bash
# 1. Create new token (needs Solana CLI + funded wallet)
bash scripts/create-new-clout-token.sh

# 2. Update codebase with new addresses
node scripts/update-token-addresses.js <MINT> <VAULT> <OWNER>

# 3. Commit changes
git add .
git commit -m "chore: configure new CLOUT token"
```

## 🎯 What Happened?

✅ **50 files updated** - All old token addresses replaced with placeholders  
✅ **Scripts created** - Automated token creation and updates  
✅ **Documentation updated** - All guides reflect new setup  
✅ **Environment templates** - Ready for your addresses  

## 📚 Files You Should Read

1. **[NEW_TOKEN_SETUP_GUIDE.md](NEW_TOKEN_SETUP_GUIDE.md)** ⭐
   - Complete step-by-step guide
   - Prerequisites, troubleshooting, verification
   - **Start here if you're unsure**

2. **[TOKEN_REDACTION_SUMMARY.md](TOKEN_REDACTION_SUMMARY.md)**
   - What was changed
   - Verification checklist
   - Technical details

3. **[.env.template](.env.template)**
   - All environment variables
   - Copy to `.env` and fill in

## 🔑 What You Need

Before running scripts:

- [ ] **Solana CLI** installed ([Install Guide](https://docs.solana.com/cli/install-solana-cli-tools))
- [ ] **SPL Token CLI** installed (`cargo install spl-token-cli`)
- [ ] **Funded wallet** (0.1+ SOL for token creation)
- [ ] **RPC endpoint** configured (mainnet-beta)

```bash
# Quick check
solana --version      # Should show version
spl-token --version   # Should show version
solana balance        # Should show > 0.1 SOL
```

## ⚡ Quick Commands

### Create Token (Step 1)
```bash
bash scripts/create-new-clout-token.sh
```

Output will include:
- New mint address (save this!)
- New token account (save this!)
- Owner address (save this!)

### Update Codebase (Step 2)
```bash
# Replace with your actual addresses from Step 1
node scripts/update-token-addresses.js \
  ABC123DefG456HijK789LmnO012PqrS345TuvW678XyzA \
  DEF456GhiJ789KlmN012OpqR345StuV678WxyZ012AbcD \
  GHI789JklM012NopQ345RstU678VwxY012ZabC345DefG
```

### Verify (Step 3)
```bash
# Check changes
git diff

# Verify no placeholders remain
grep -r "<YOUR_CLOUT_MINT_ADDRESS>" . \
  --exclude-dir=node_modules \
  --exclude-dir=.git \
  --exclude="*.template" \
  --exclude="*GUIDE.md" \
  --exclude="*SUMMARY.md"

# Should return NO results (except in guide/template files)
```

### Update Environment Variables (Step 4)

**Render:**
```bash
# Go to dashboard.render.com → Your Service → Environment
# Update:
CLOUT_MINT=<your_new_mint>
CLOUT_PROGRAM_ID=<your_new_mint>
REWARDS_VAULT=<your_new_vault>
```

**Netlify:**
```bash
# Go to app.netlify.com → Your Site → Site Settings → Environment Variables
# Update:
REACT_APP_CLOUT_MINT=<your_new_mint>
REACT_APP_CLOUT_PROGRAM_ID=<your_new_mint>
```

### Commit (Step 5)
```bash
git add .
git commit -m "chore: configure new CLOUT token"
git push
```

## 🔍 Verification

After setup, verify:

```bash
# 1. Check token on Solscan
https://solscan.io/token/<YOUR_MINT_ADDRESS>

# 2. Test backend
curl http://localhost:3001/api/v1/health | jq '.programs'

# 3. Test frontend
npm start  # Should connect to new token
```

## ❓ Common Questions

**Q: Do I have to create a new token?**  
A: Yes, if you want to use CLOUT features. The old token is redacted for security.

**Q: Can I use an existing token?**  
A: Yes! Skip step 1 and just run step 2 with your existing token address.

**Q: What if I don't have Solana CLI?**  
A: Install it: https://docs.solana.com/cli/install-solana-cli-tools

**Q: What if my wallet has no SOL?**  
A: You need 0.1+ SOL. Buy from exchange and send to your wallet.

**Q: Can I test on devnet first?**  
A: Yes! Change RPC URL to devnet and use devnet SOL (free from faucet).

**Q: Should I renounce mint authority?**  
A: Optional. Makes supply fixed forever. Only do if you're sure!

## 🆘 Something Wrong?

1. **Check prerequisites** - Do you have Solana CLI, SPL Token, and funded wallet?
2. **Read error messages** - They usually tell you what's missing
3. **Check NEW_TOKEN_SETUP_GUIDE.md** - Has troubleshooting section
4. **Verify RPC endpoint** - Is it accessible? Try: `solana cluster-version`

## 📊 What Changed (Summary)

| Category | Files Changed |
|----------|--------------|
| Documentation | 16 files |
| Source Code | 4 files |
| Scripts | 30 files |
| **Total** | **50 files** |

**Lines changed**: 134 insertions, 134 deletions (clean replacements)

## 🎉 After Setup

Once your new token is live:

1. ✅ Token visible on Solscan/Explorer
2. ✅ Backend health check shows correct addresses
3. ✅ Frontend displays token properly
4. ✅ Rewards system works
5. ✅ All tests pass

Then you can:
- 🎨 Add token metadata (logo, description)
- 💰 Distribute initial supply
- 🔒 Renounce authorities (optional)
- 📢 Announce to community

## 📞 Need More Help?

- **Full Guide**: [NEW_TOKEN_SETUP_GUIDE.md](NEW_TOKEN_SETUP_GUIDE.md)
- **Technical Details**: [TOKEN_REDACTION_SUMMARY.md](TOKEN_REDACTION_SUMMARY.md)
- **Solana Docs**: https://docs.solana.com
- **SPL Token Docs**: https://spl.solana.com/token

---

**Ready?** Start with: `bash scripts/create-new-clout-token.sh` 🚀
