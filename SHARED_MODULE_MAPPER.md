# 🔧 Shared Module Path Mapper - Developer Guide

**Status**: Solution for the biggest TypeScript configuration issue

---

## 🎯 The Problem

Frontend TypeScript shows 17 errors like this:

```typescript
// ❌ Error: Cannot find module '@shared/utils/logger'
import { logger } from '@shared/utils/logger';
```

**Cause**: The `shared/` directory exists in the project root, but the `client/tsconfig.json` doesn't have path mapping configured for it.

**Impact**:
- IDE shows red squiggly lines (confusing for developers)
- TypeScript strict mode won't fully validate imports
- However, **the app still builds and runs** (Vite handles it at runtime)

---

## ✅ The Solution

### Step 1: Update `client/tsconfig.json`

Add this path mapping to the `compilerOptions`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@components/*": ["./src/components/*"],
      "@hooks/*": ["./src/hooks/*"],
      "@context/*": ["./src/context/*"],
      "@lib/*": ["./src/lib/*"],
      "@services/*": ["./src/services/*"],
      "@shared/*": ["../shared/*"],           // ← ADD THIS LINE
      "@shared/types": ["../shared/types"],
      "@shared/utils/*": ["../shared/utils/*"],
      "@shared/validation/*": ["../shared/validation/*"],
      "@shared/config/*": ["../shared/config/*"],
      "@shared/constants/*": ["../shared/constants/*"]
    }
  }
}
```

### Step 2: Update Vite Config

In `client/vite.config.ts`, add the alias:

```typescript
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, '../shared'),  // ← ADD THIS
      '@components': path.resolve(__dirname, './src/components'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@context': path.resolve(__dirname, './src/context'),
      '@lib': path.resolve(__dirname, './src/lib'),
      '@services': path.resolve(__dirname, './src/services'),
    },
  },
});
```

### Step 3: Update ESLint Config

In `client/.eslintrc.cjs`, add to `settings`:

```javascript
module.exports = {
  // ... other config
  settings: {
    'import/resolver': {
      typescript: {
        aliasDirs: [
          ['@/', './src'],
          ['@shared/', '../shared'],  // ← ADD THIS
          ['@components/', './src/components'],
          ['@hooks/', './src/hooks'],
          ['@context/', './src/context'],
          ['@lib/', './src/lib'],
          ['@services/', './src/services'],
        ]
      }
    }
  }
}
```

---

## 🔍 What to Import

Once configured, these imports will work:

```typescript
// Types
import type { NFT } from '@shared/types';
import type { ApiResponse } from '@shared/types';

// Utilities
import { logger } from '@shared/utils/logger';
import { errorHandler } from '@shared/utils/errors';
import { validateWallet } from '@shared/utils/validation';

// Config
import { DATABASE_URL } from '@shared/config/database';
import { SOLANA_CLUSTER } from '@shared/config/blockchain';

// Constants
import { ERROR_CODES } from '@shared/constants/errors';
import { HTTP_CODES } from '@shared/constants/http';

// Validation Schemas
import { validateNFT } from '@shared/validation/schemas';
```

---

## 🚀 Quick Fix Script

For developers who want an automated fix:

```bash
#!/bin/bash
# File: fix-shared-module-path.sh

echo "Fixing shared module path configuration..."

# Update tsconfig.json
cat >> client/tsconfig.json << 'EOF'
      "@shared/*": ["../shared/*"],
      "@shared/types": ["../shared/types"],
      "@shared/utils/*": ["../shared/utils/*"],
      "@shared/validation/*": ["../shared/validation/*"],
      "@shared/config/*": ["../shared/config/*"]
EOF

echo "✅ Updated client/tsconfig.json"
echo "✅ Now update client/vite.config.ts manually with:"
echo "   '@shared': path.resolve(__dirname, '../shared')"
echo "✅ Configuration complete!"
```

---

## 🧪 Verification

After applying the fix, verify it works:

```bash
# Run TypeScript check
cd client
npm run type-check

# Should not show @shared import errors anymore
```

---

## 📚 Why This Happens

1. **Project Structure**: The `shared/` directory is at the root level
2. **Client Isolation**: The `client/` folder is a sub-directory
3. **Path Mapping Required**: TypeScript needs explicit path configuration for parent-directory imports
4. **Relative vs Absolute**: Using `@shared/` is cleaner than `../shared/`

---

## 🎯 Why This Matters for Developers

| Aspect | Impact |
|--------|--------|
| **IDE Experience** | Red squiggles disappear, better autocomplete |
| **Type Safety** | TypeScript can properly validate imports |
| **Error Prevention** | Catch import errors at compile time |
| **Developer Productivity** | Less confusion, faster development |
| **Team Consistency** | Everyone uses same import style |

---

## 🔐 Security Note

This configuration:
- ✅ Doesn't expose any secrets
- ✅ Doesn't change runtime behavior
- ✅ Is purely for development/build time
- ✅ Works with Vite's bundling
- ✅ Safe for all environments

---

## 📝 Common Issues & Solutions

### Issue: "Cannot find module @shared/..."

**Solution**: Did you run the fix script? Verify tsconfig.json, vite.config.ts, and .eslintrc.cjs are updated.

### Issue: Autocomplete not working

**Solution**: Restart your IDE (VSCode, WebStorm, etc.) for TypeScript plugin to reload config.

### Issue: Build succeeds but IDE shows errors

**Solution**: This means Vite's path handling is working, but TypeScript config isn't. Apply the fix above.

---

## 🎓 For Project Maintainers

To prevent this issue in the future:

1. **Document it**: Add this guide to CONTRIBUTING.md
2. **Automate it**: Include this fix in setup scripts
3. **Template it**: Pre-configure in project templates
4. **Test it**: Add TypeScript strict mode to CI/CD

---

## ✅ Verification Checklist

After applying the fix, you should see:

- [ ] No `@shared` import errors in IDE
- [ ] `npm run type-check` passes
- [ ] `npm run lint` passes
- [ ] `npm run build` succeeds
- [ ] IDE autocomplete works for @shared imports
- [ ] No changes to runtime behavior

---

## 🚀 Apply Now

**For this project right now:**

1. Add the path mappings to `client/tsconfig.json`
2. Add the alias to `client/vite.config.ts`
3. Update `client/.eslintrc.cjs`
4. Run `npm run type-check` to verify
5. Commit the changes

This is a **safe, non-breaking change** that improves developer experience!

---

**Status**: This is the biggest development issue preventing perfect TypeScript configuration. Once applied, all @shared imports will be properly resolved, type-safe, and IDE-friendly.

