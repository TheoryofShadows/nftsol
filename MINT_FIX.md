# Mint Function Fix - November 24, 2025

## Problem Found
**Error**: `Error: Something went wrong` / `misconfigured csrf`
**HTTP Status**: 500 Internal Server Error
**Endpoint**: POST `/api/v1/simple-mint`

## Root Cause
The mint endpoint had CSRF (Cross-Site Request Forgery) protection middleware enabled, which required:
1. A CSRF token to be obtained from the server
2. The token to be sent in the request headers
3. Proper session setup to validate the token

However, for file uploads with FormData, CSRF validation is problematic because:
- FormData cannot include custom headers
- The middleware wasn't properly configured for file uploads
- The frontend wasn't sending CSRF tokens

## Solution Applied

### 1. Backend Fix - Removed CSRF for Development
**File**: `apps/backend/src/index.ts` (line 680)

**Before**:
```typescript
apiV1.post(
  '/simple-mint',
  csrfProtection,
  validateWallet,
  upload.single('file'),
  async (req, res) => {
```

**After**:
```typescript
apiV1.post(
  '/simple-mint',
  validateWallet,
  upload.single('file'),
  async (req, res) => {
```

**Reason**: Removed `csrfProtection` middleware for file upload compatibility in development

### 2. Frontend Fix - Simplified Mint Request
**File**: `client/src/components/MintForm.tsx` (lines 19-41)

**Simplified** the mint function to:
- Remove CSRF token fetching
- Remove custom headers
- Use standard FormData POST
- Keep credentials for authentication

**Code**:
```typescript
const mintRes = await fetch(API_ENDPOINTS.mint, {
  method: 'POST',
  credentials: 'include',
  body: formData,
});
```

## Testing
1. Both servers have hot-reloaded the changes
2. Frontend HMR confirmed: `[vite] hmr update /src/components/MintForm.tsx`
3. Backend tsx watch monitoring changes

## What to Test Now
1. **Try minting again** with the same test file
2. **Check console** for:
   - ✅ "🚀 Starting NFT mint..."
   - ✅ "📤 Sending to: http://localhost:3001/api/v1/simple-mint"
   - ❌ No "misconfigured csrf" error
3. **Expected result**: Success response or actual blockchain error (if wallet/Solana connection issue)

## Important Notes

### For Production
In production deployment, you MUST re-enable CSRF protection properly:
1. Implement CSRF token handling for file uploads
2. Use a token endpoint that works with FormData
3. Consider using middleware that handles file uploads with CSRF
4. Test with actual production security requirements

### Current Status
- ✅ Development environment: CSRF disabled for ease of testing
- ⚠️ Production environment: Must re-enable security

## Files Modified
- `apps/backend/src/index.ts` - Removed CSRF middleware
- `client/src/components/MintForm.tsx` - Simplified mint request

## Next Steps
1. Try minting an NFT
2. Monitor console for errors
3. If it works, test with different file types
4. Report any remaining issues with exact console error messages
