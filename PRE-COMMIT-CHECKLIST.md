# Pre-Commit Security Checklist

**⚠️ CRITICAL: Review this checklist before EVERY commit!**

## 🔐 Secret Protection

### Before Committing:

```bash
# Run the secret verification script
# On Linux/Mac:
./scripts/verify-no-secrets.sh

# On Windows:
.\scripts\verify-no-secrets.ps1
```

### Manual Checks:

- [ ] **No `.env` files** - All environment files must be in `.gitignore`
- [ ] **No keypair files** - No `*keypair.json` or `wallet.json` files
- [ ] **No hardcoded secrets** - Check for:
  - `PLATFORM_SECRET_KEY_BASE58=...` (actual values)
  - `PLATFORM_SECRET_KEY_JSON=[...]` (actual values)
  - `JWT_SECRET=...` (actual values)
  - `SESSION_SECRET=...` (actual values)
  - `DATABASE_URL=postgresql://...` (with passwords)
  - `HELIUS_API_KEY=...` (actual keys)
  - `XAI_API_KEY=...` (actual keys)
  - Any other API keys or tokens

- [ ] **Only placeholders in code** - All secrets should use `process.env.VAR_NAME`
- [ ] **Documentation safe** - Documentation should use placeholders like `your-secret-key`

### Safe to Commit:

✅ Public blockchain addresses (program IDs, mint addresses)
✅ Environment variable names (e.g., `process.env.JWT_SECRET`)
✅ Placeholder values (e.g., `your-jwt-secret-key`)
✅ Default/example values (e.g., `https://api.devnet.solana.com`)

## 📋 Quick Verification Commands

```bash
# Check what files are staged
git status

# Check for secrets in staged changes
git diff --cached | grep -iE "(secret|key|password|token)" | grep -v "process.env" | grep -v "PLACEHOLDER"

# Verify sensitive files are ignored
git check-ignore temp-keypair.json platform-keys-backup.json wallet.json

# List all tracked files (should not include secrets)
git ls-files | grep -iE "(keypair|secret|wallet|\.env)"
```

## 🚨 If Secrets Are Found

1. **DO NOT COMMIT** - Unstage the changes:
   ```bash
   git reset HEAD <file-with-secret>
   ```

2. **Remove the secret** - Replace with:
   - Environment variable reference: `process.env.VAR_NAME`
   - Placeholder: `your-secret-key-here`
   - Example/template value

3. **If secret was already committed:**
   - Rotate the exposed secret immediately
   - Remove from git history (see `SECURITY-AUDIT.md`)
   - Update all environments with new secret

## 📚 Related Documentation

- `SECURITY-AUDIT.md` - Full security audit and procedures
- `.gitignore` - Files automatically excluded
- `BACKEND-ENV-VARS-QUICKREF.md` - Environment variables reference

---

**Remember: When in doubt, ask or skip the commit!**

