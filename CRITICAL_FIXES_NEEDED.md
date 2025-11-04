# 🔴 Critical Fixes Needed Before Launch

## Missing Backend Endpoints

### 1. Collections Endpoint ❌
**Frontend expects:** `GET /api/v1/collections`  
**Current status:** NOT IMPLEMENTED  
**Used by:** `Collections.tsx` component

**Fix needed:**
```typescript
// Add to apps/backend/src/index.ts or create apps/backend/src/routes/collections.ts

apiV1.get('/collections', async (req, res) => {
  try {
    // Query distinct collections from NFTs table
    const result = await pool.query(`
      SELECT 
        collection_name as id,
        collection_name as name,
        COUNT(*) as nft_count,
        MIN(image_url) as image,
        COALESCE(AVG(CAST(price AS DECIMAL)), 0) as floor_price
      FROM nfts
      WHERE collection_name IS NOT NULL
      GROUP BY collection_name
      ORDER BY nft_count DESC
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch collections'
    });
  }
});
```

### 2. Waitlist Subscribe Endpoint ❌
**Frontend expects:** `POST /api/waitlist/subscribe`  
**Current status:** NOT IMPLEMENTED  
**Used by:** `WaitlistSignup.tsx` component

**Fix needed:**
```typescript
// Add to apps/backend/src/index.ts or create apps/backend/src/routes/waitlist.ts

app.post('/api/waitlist/subscribe', sanitizeInput, async (req, res) => {
  try {
    const { email, walletAddress, referralCode, source } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }
    
    // Store in database
    await pool.query(`
      INSERT INTO waitlist (email, wallet_address, referral_code, source, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (email) DO NOTHING
    `, [email, walletAddress || null, referralCode || null, source || 'landing']);
    
    // Optional: Send to ConvertKit or Mailchimp
    // await sendToEmailService(email, walletAddress);
    
    res.json({
      success: true,
      message: 'Successfully joined waitlist'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to subscribe'
    });
  }
});
```

**Database migration needed:**
```sql
CREATE TABLE IF NOT EXISTS waitlist (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  wallet_address VARCHAR(44),
  referral_code VARCHAR(50),
  source VARCHAR(20) DEFAULT 'landing',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_waitlist_email ON waitlist(email);
CREATE INDEX idx_waitlist_referral ON waitlist(referral_code);
```

## Missing Assets

### 3. Placeholder NFT Image ❌
**File needed:** `client/public/placeholder-nft.png`  
**Used by:** `App.tsx` lines 329, 332

**Quick fix:**
Create a simple SVG placeholder:

```svg
<!-- Save as client/public/placeholder-nft.svg -->
<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
  <rect width="400" height="400" fill="url(#grad)"/>
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#8B5CF6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#06B6D4;stop-opacity:1" />
    </linearGradient>
  </defs>
  <text x="200" y="200" text-anchor="middle" font-family="Arial" font-size="48" fill="white" opacity="0.8">
    NFT
  </text>
  <text x="200" y="240" text-anchor="middle" font-family="Arial" font-size="16" fill="white" opacity="0.6">
    No Image Available
  </text>
</svg>
```

Then update `App.tsx` line 332:
```typescript
(e.target as HTMLImageElement).src = '/placeholder-nft.svg';
```

## Missing Environment Variable Documentation

### 4. .env.example Files ❌
**Status:** Created content below, needs manual creation due to gitignore

#### `apps/backend/.env.example`:
```env
# See PRODUCTION_AUDIT_REPORT.md for complete documentation
NODE_ENV=development
PORT=3001
SOLANA_RPC_URL=https://api.devnet.solana.com
CLOUT_MINT=26iJ37BE3icVtoo2QRkfjtYXFHMudG2sbTHAnhF2D6ab
DATABASE_URL=postgresql://user:password@localhost:5432/nftsol
JWT_SECRET=your-jwt-secret-minimum-32-characters
SESSION_SECRET=your-session-secret-minimum-32-characters
PLATFORM_SECRET_KEY_BASE58=YOUR_KEY_HERE
HELIUS_API_KEY=your-helius-key
PINATA_JWT=your-pinata-jwt
```

#### `client/.env.example`:
```env
VITE_API_BASE=http://localhost:3001
VITE_IMG_PROXY_BASE=http://localhost:3001
VITE_SOLANA_RPC_URL=https://api.devnet.solana.com
```

## Priority Action Items

| Priority | Task | Component | Est. Time |
|----------|------|-----------|-----------|
| 🔴 HIGH | Add `/api/v1/collections` endpoint | Backend | 15 min |
| 🔴 HIGH | Add `/api/waitlist/subscribe` endpoint | Backend | 15 min |
| 🔴 HIGH | Create waitlist database table | Database | 5 min |
| 🟡 MEDIUM | Add placeholder-nft.svg | Frontend | 5 min |
| 🟡 MEDIUM | Create .env.example files | DevOps | 2 min |

**Total estimated time:** ~42 minutes

## Testing Checklist After Fixes

- [ ] Collections page loads without errors
- [ ] Collections display correctly when NFTs exist
- [ ] Waitlist signup form submits successfully
- [ ] Email validation works
- [ ] Wallet auto-fill works when connected
- [ ] NFT images fallback to placeholder when broken
- [ ] All environment variables documented

## Notes

All other components and APIs are fully implemented and functional. These are the ONLY missing pieces preventing a perfect production deployment.

