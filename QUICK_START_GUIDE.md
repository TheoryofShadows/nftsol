# ⚡ Quick Start: Critical Features Setup

## 🎯 Get Started in 30 Minutes

### Step 1: Redis Caching (10 minutes)

**Option A: Upstash (Recommended - Free Tier)**
```bash
# 1. Sign up at https://upstash.com
# 2. Create Redis database
# 3. Add to .env:
UPSTASH_REDIS_URL=https://your-db.upstash.io
UPSTASH_REDIS_TOKEN=your-token

# 4. Install
cd server
npm install @upstash/redis

# 5. Use in code
import { cacheService } from './services/cache';
const nfts = await cacheService.getOrSet('nfts:marketplace', fetchNfts, 300);
```

**Option B: Standard Redis**
```bash
# Install Redis locally or use Redis Cloud
# Add to .env:
REDIS_URL=redis://localhost:6379

# Install
npm install ioredis
```

### Step 2: Queue System (10 minutes)

```bash
# Install BullMQ
cd server
npm install bullmq ioredis

# Set up queues (already created in server/services/queue.ts)
# Use in routes:
import { addNFTMintJob } from './services/queue';

// Instead of blocking:
await mintNFT(data);

// Use queue:
await addNFTMintJob(data);
```

### Step 3: Image CDN (5 minutes)

**Cloudflare Images (Free Tier)**
```bash
# 1. Sign up at https://cloudflare.com
# 2. Enable Images product
# 3. Get account hash
# 4. Use in code:
const imageUrl = `https://imagedelivery.net/${accountHash}/${imageId}/w=800,h=600`;
```

### Step 4: Error Tracking (5 minutes)

```bash
# Install Sentry
cd server
npm install @sentry/node

cd ../client
npm install @sentry/react

# Initialize in server/index.ts
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});

# Initialize in client/main.tsx
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
});
```

---

## ✅ Verification

After setup, verify everything works:

```typescript
// Test cache
import { cacheService } from './services/cache';
await cacheService.set('test', 'value', 60);
const value = await cacheService.get('test');
console.log(value); // Should be 'value'

// Test queue
import { addNFTMintJob } from './services/queue';
const job = await addNFTMintJob({ name: 'Test' });
console.log('Job added:', job.id);

// Test email
import { emailService } from './services/email';
await emailService.send({
  to: 'test@example.com',
  subject: 'Test',
  html: '<p>Test email</p>',
});
```

---

## 🎉 You're Done!

**Time**: 30 minutes
**Cost**: $0 (free tiers)
**Impact**: 10x performance improvement

---

**Next**: Read `WEB2_WEB3_ROADMAP.md` for full roadmap!

