# NFTSol SaaS - Customer Onboarding Guide

**Welcome to NFTSol SaaS!** 🚀

This guide will walk you through everything you need to get your NFT marketplace up and running in less than an hour.

---

## 📋 Table of Contents

1. [Account Creation](#account-creation)
2. [Getting Your API Key](#getting-your-api-key)
3. [Integration Steps](#integration-steps)
4. [Testing Your Setup](#testing-your-setup)
5. [Going to Production](#going-to-production)
6. [Common Integrations](#common-integrations)
7. [Troubleshooting](#troubleshooting)

---

## Account Creation

### Step 1: Create Your Marketplace Account

Make a POST request to create your SaaS tenant:

```bash
curl -X POST https://api.nftsol.xyz/saas/tenants \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My NFT Marketplace",
    "slug": "my-marketplace",
    "email": "admin@mymarketplace.com",
    "website": "https://marketplace.mycompany.com",
    "description": "The best NFT marketplace for my community",
    "logoUrl": "https://..."
  }'
```

### Step 2: Save Your API Key

**IMPORTANT:** The API key is only shown once! Save it immediately to a secure location.

Response:
```json
{
  "success": true,
  "data": {
    "tenantId": "550e8400-e29b-41d4-a716-446655440000",
    "slug": "my-marketplace",
    "apiKey": "sk_test_abc123def456..."
  }
}
```

---

## Getting Your API Key

### Where's My API Key?

Your initial API key is provided when you create your account. Once you have it:

1. **Save it securely** → Environment variables, secrets manager, etc.
2. **Never share it** → Treat it like a password
3. **Create new keys** → For different apps/environments

### Creating Additional Keys

```bash
curl -X POST https://api.nftsol.xyz/saas/api-keys \
  -H "Authorization: Bearer sk_test_abc123..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Frontend App",
    "permissions": ["read:nfts", "read:collections", "read:users"]
  }'
```

### Understanding Permissions

**Read Permissions:**
- `read:nfts` - View NFT data
- `read:collections` - View collections
- `read:users` - View user profiles
- `read:analytics` - View marketplace analytics

**Write Permissions:**
- `write:nfts` - Create/update NFTs
- `write:collections` - Create collections
- `write:offers` - Create/accept offers
- `write:listings` - Create marketplace listings
- `write:users` - Update user profiles

**Shortcuts:**
- `read:*` - All read permissions
- `write:*` - All write permissions

---

## Integration Steps

### Step 1: Add API Key to Your Environment

**.env file:**
```env
NFTSOL_API_KEY=sk_test_abc123def456...
NFTSOL_API_URL=https://api.nftsol.xyz
```

### Step 2: Initialize the SDK

**JavaScript/Node.js:**
```javascript
const axios = require('axios');

const nftsol = axios.create({
  baseURL: process.env.NFTSOL_API_URL,
  headers: {
    'Authorization': `Bearer ${process.env.NFTSOL_API_KEY}`
  }
});

module.exports = nftsol;
```

**Python:**
```python
import requests
import os

nftsol = requests.Session()
nftsol.headers.update({
    'Authorization': f"Bearer {os.getenv('NFTSOL_API_KEY')}"
})
```

### Step 3: Verify Connection

```bash
curl https://api.nftsol.xyz/saas/health \
  -H "Authorization: Bearer sk_test_abc123..."
```

Expected response:
```json
{
  "success": true,
  "data": {
    "tenantId": "550e8400-e29b-41d4-a716-446655440000",
    "tenantName": "My NFT Marketplace",
    "status": "connected"
  }
}
```

---

## Testing Your Setup

### Test 1: Get Tenant Details

```javascript
// Test if you can retrieve your marketplace info
const tenant = await nftsol.get('/saas/tenant');
console.log('Marketplace:', tenant.data.data.name);
console.log('Users:', tenant.data.data.usersCount);
console.log('NFTs:', tenant.data.data.nftsCount);
```

### Test 2: Create an API Key

```javascript
// Create a test API key
const newKey = await nftsol.post('/saas/api-keys', {
  name: 'Test Key',
  permissions: ['read:nfts']
});
console.log('New API Key:', newKey.data.data.key);
```

### Test 3: Check Usage

```javascript
// View your current usage metrics
const usage = await nftsol.get('/saas/usage');
console.log('API Calls:', usage.data.data.apiCallsCount);
console.log('Users Created:', usage.data.data.usersCount);
console.log('NFTs Created:', usage.data.data.nftCreatedCount);
```

### Test 4: View Analytics

```javascript
// Get last 7 days of analytics
const analytics = await nftsol.get('/saas/analytics?days=7');
console.log(JSON.stringify(analytics.data.data.records, null, 2));
```

---

## Going to Production

### Step 1: Security Checklist

- [ ] API keys stored in secure environment variables
- [ ] Never expose API keys in client-side code
- [ ] HTTPS/SSL enabled on all connections
- [ ] API requests have proper error handling
- [ ] Rate limiting implemented on your end

### Step 2: Request Production API Key

Contact support to upgrade from test (`sk_test_`) to production (`sk_live_`) API keys.

```bash
# IMPORTANT: Test everything first!
# Production keys cannot be reverted to test keys
```

### Step 3: Update Environment

```env
# Before
NFTSOL_API_KEY=sk_test_abc123def456...

# After
NFTSOL_API_KEY=sk_live_xyz789uvw123...
```

### Step 4: Enable Webhooks (Optional)

Configure webhooks to receive real-time notifications:

```javascript
// Example: Listen for NFT sales
app.post('/webhooks/nftsol', (req, res) => {
  const event = req.body;

  if (event.event === 'nft.sold') {
    console.log('NFT Sold:', event.data);
    // Update your database, send notifications, etc.
  }

  res.json({ success: true });
});
```

---

## Common Integrations

### Integration 1: Frontend Marketplace Display

**Get NFTs from your marketplace:**

```javascript
// Fetch all NFTs from your marketplace
async function getNFTs() {
  const response = await nftsol.get('/nfts?limit=20&offset=0');
  return response.data.data.nfts;
}

// Display NFTs
const nfts = await getNFTs();
nfts.forEach(nft => {
  console.log(`${nft.name} - ${nft.floorPrice} lamports`);
});
```

### Integration 2: User Registration

**Create user accounts in your marketplace:**

```javascript
async function registerUser(walletAddress, username) {
  const response = await nftsol.post('/users', {
    walletAddress,
    username,
    email: 'user@example.com'
  });
  return response.data.data;
}
```

### Integration 3: NFT Creation

**Let creators list NFTs:**

```javascript
async function createNFT(creatorId, metadata) {
  const response = await nftsol.post('/nfts', {
    creatorId,
    name: metadata.name,
    description: metadata.description,
    imageUrl: metadata.image,
    attributes: metadata.attributes
  });
  return response.data.data;
}
```

### Integration 4: Marketplace Analytics

**Display marketplace stats to admins:**

```javascript
async function getMarketplaceStats() {
  const usage = await nftsol.get('/saas/usage');
  const analytics = await nftsol.get('/saas/analytics?days=30');

  return {
    currentMetrics: usage.data.data,
    historicalData: analytics.data.data.records
  };
}

// Display in admin dashboard
const stats = await getMarketplaceStats();
console.log(`Users: ${stats.currentMetrics.usersCount}`);
console.log(`NFTs: ${stats.currentMetrics.nftCreatedCount}`);
```

---

## Troubleshooting

### "Invalid or missing API key"

**Problem:** You're getting a 401 Unauthorized error.

**Solutions:**
1. Check your API key is correct in headers
2. Verify API key hasn't been revoked
3. Make sure you're using `Authorization: Bearer` or `X-API-Key` header
4. Check for trailing spaces in the API key

```bash
# ✅ Correct
curl https://api.nftsol.xyz/saas/tenant \
  -H "Authorization: Bearer sk_test_abc123"

# ❌ Wrong
curl https://api.nftsol.xyz/saas/tenant \
  -H "Authorization: sk_test_abc123"
```

### "Rate limit exceeded"

**Problem:** You're hitting rate limits (1000 req/hr default).

**Solutions:**
1. Implement request caching
2. Batch operations when possible
3. Contact sales to increase rate limit
4. Add exponential backoff to retries

```javascript
async function withRetry(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.response?.status === 429) {
        // Wait before retrying: 1s, 2s, 4s...
        await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
      } else {
        throw error;
      }
    }
  }
}
```

### "Slug already exists"

**Problem:** The slug you chose is already taken.

**Solution:** Choose a unique slug:
```json
{
  "slug": "my-marketplace-v2"
}
```

### "CORS errors in browser"

**Problem:** Browser blocking requests from your frontend.

**Solution:** Requests must come from your backend:
```javascript
// ❌ Frontend (will get CORS error)
fetch('https://api.nftsol.xyz/saas/tenant', {
  headers: { 'Authorization': 'Bearer sk_test_...' }
});

// ✅ Backend proxy
app.get('/api/tenant', async (req, res) => {
  const response = await axios.get(
    'https://api.nftsol.xyz/saas/tenant',
    { headers: { 'Authorization': `Bearer ${API_KEY}` }}
  );
  res.json(response.data);
});
```

---

## Best Practices

### ✅ DO

- Store API keys in environment variables
- Use different keys for development/production
- Implement error handling for all requests
- Cache responses when possible
- Monitor your usage metrics
- Rotate API keys periodically

### ❌ DON'T

- Hardcode API keys in your code
- Commit API keys to version control
- Expose API keys to the browser
- Ignore rate limit headers
- Make requests without retry logic

---

## Next Steps

1. ✅ Create your account
2. ✅ Save your API key
3. ✅ Run the test requests
4. ✅ Integrate with your application
5. ✅ Go to production

---

## Getting Help

- **Documentation:** https://docs.nftsol.xyz
- **API Reference:** See SAAS_API_DOCUMENTATION.md
- **Status Page:** https://status.nftsol.xyz
- **Support Email:** support@nftsol.xyz
- **Discord:** https://discord.gg/nftsol

---

## Quick Reference Commands

```bash
# Create account
curl -X POST https://api.nftsol.xyz/saas/tenants \
  -H "Content-Type: application/json" \
  -d '{"name":"My","slug":"my","email":"admin@my.com"}'

# Get tenant info
curl https://api.nftsol.xyz/saas/tenant \
  -H "Authorization: Bearer $API_KEY"

# Create API key
curl -X POST https://api.nftsol.xyz/saas/api-keys \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name":"New Key"}'

# List API keys
curl https://api.nftsol.xyz/saas/api-keys \
  -H "Authorization: Bearer $API_KEY"

# Get usage
curl https://api.nftsol.xyz/saas/usage \
  -H "Authorization: Bearer $API_KEY"

# Get analytics
curl "https://api.nftsol.xyz/saas/analytics?days=30" \
  -H "Authorization: Bearer $API_KEY"
```

---

**Ready to build?** Start with the [API Documentation](./SAAS_API_DOCUMENTATION.md) 🚀
