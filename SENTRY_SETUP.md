# 🐛 Sentry Error Monitoring Setup

## Step 1: Create Sentry Account
1. Go to [sentry.io](https://sentry.io)
2. Click "Get started for free"
3. Sign up with email or GitHub

## Step 2: Create Project
1. After login, click "Create Project"
2. Select platform: **Node.js**
3. Set Alert frequency: **On every new issue**
4. Project name: **nftsol-marketplace**
5. Team: Use default or create new

## Step 3: Get Your DSN
1. After project creation, you'll see the DSN immediately
2. Copy the full DSN URL (looks like this):
   ```
   https://abc123def456@o123456.ingest.sentry.io/123456
   ```

## Step 4: Add to Replit Secrets
1. In Replit, go to Secrets tab (lock icon)
2. Add new secret:
   - **Key**: `SENTRY_DSN`
   - **Value**: Your DSN URL from step 3

## What You Get
- Real-time error alerts in your email
- Error tracking dashboard
- Performance monitoring
- User impact analysis
- Stack traces for debugging

## Free Tier Limits
- 5,000 errors per month
- 10,000 performance transactions
- 1 team member
- 30-day data retention

Perfect for getting started with your NFT marketplace!