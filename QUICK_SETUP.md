# ⚡ Quick Setup Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Install Dependencies

```bash
# Install Zod in client (if not already installed)
cd client
npm install zod

# Verify server has Zod
cd ../server
npm list zod  # Should show zod@^3.23.8
```

### Step 2: Verify Path Aliases

The Vite config has been updated with `@shared` alias. Verify it works:

```typescript
// Test in any client file
import { NFT } from '@shared/types';
```

If you get import errors, restart your TypeScript server:
- **VS Code**: `Ctrl+Shift+P` → "TypeScript: Restart TS Server"
- **Cursor**: `Ctrl+Shift+P` → "TypeScript: Restart TS Server"

### Step 3: Start Using Shared Code

**Example: Replace a hardcoded value**

```typescript
// Before
const interval = 60000;

// After
import { POLLING_INTERVALS } from '@shared/constants';
const interval = POLLING_INTERVALS.STATS;
```

**Example: Use shared types**

```typescript
// Before
import { NFT } from '../types';

// After
import { NFT } from '@shared/types';
```

**Example: Add validation**

```typescript
// Before
if (!name) throw new Error('Name required');

// After
import { mintRequestSchema } from '@shared/validation/schemas';
import { ValidationError } from '@shared/utils/errors';

try {
  const validated = mintRequestSchema.parse({ name, ... });
} catch (error) {
  throw new ValidationError('Invalid mint request', error);
}
```

### Step 4: Test It Works

Create a test file to verify everything works:

```typescript
// client/src/test-shared.ts
import { NFT } from '@shared/types';
import { POLLING_INTERVALS } from '@shared/constants';
import { logger } from '@shared/utils/logger';
import { ValidationError } from '@shared/utils/errors';

// Should compile without errors
const nft: NFT = {
  id: 'test',
  name: 'Test',
  description: 'Test',
  imageUrl: 'https://example.com/image.png',
  creator: 'test',
  owner: 'test',
  mintAddress: 'test',
};

console.log('✅ Shared types work!');
console.log('✅ Constants:', POLLING_INTERVALS.STATS);
logger.info('✅ Logger works!');
```

## ✅ Verification Checklist

- [ ] Zod installed in client
- [ ] `@shared` imports work in client
- [ ] TypeScript compiles without errors
- [ ] Can import from `@shared/types`
- [ ] Can import from `@shared/constants`
- [ ] Can import from `@shared/validation/schemas`
- [ ] Can import from `@shared/utils/logger`
- [ ] Can import from `@shared/utils/errors`

## 🐛 Troubleshooting

### Import Errors

**Problem**: `Cannot find module '@shared/types'`

**Solution**: 
1. Restart TypeScript server
2. Check `vite.config.ts` has `@shared` alias
3. Verify `shared/` folder exists at project root

### Type Errors

**Problem**: Types not recognized

**Solution**:
1. Check `shared/types/index.ts` exports are correct
2. Verify TypeScript can resolve the path
3. Restart IDE

### Zod Not Found

**Problem**: `Cannot find module 'zod'`

**Solution**:
```bash
cd client
npm install zod
```

## 📚 Next Steps

1. Read `ARCHITECTURE.md` for architecture overview
2. Read `REFACTORING_GUIDE.md` for migration steps
3. Start migrating one component at a time
4. Replace hardcoded values with constants
5. Add validation to API endpoints

## 💡 Pro Tips

1. **One at a time**: Don't refactor everything at once
2. **Test as you go**: Verify nothing breaks
3. **Use find & replace**: Many changes are mechanical
4. **Let TypeScript guide you**: The compiler will show what needs updating

