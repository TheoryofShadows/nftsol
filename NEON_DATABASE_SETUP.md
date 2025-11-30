# 🚀 Neon PostgreSQL Setup for NFTSol

## Step 1: Create Neon Account & Database

1. Go to: https://console.neon.tech
2. Sign up (free account)
3. Create a new project called "nftsol"
4. Choose PostgreSQL version 15 or 16

## Step 2: Get Your Connection String

After creating the project, you'll see a connection string like:

```
postgresql://nftsol_user:YOUR_PASSWORD@ep-xxxx-xxxxx.us-east-1.neon.tech/nftsol?sslmode=require
```

**Copy this entire string - you'll need it**

## Step 3: Update Render Environment Variables

1. Go to: https://dashboard.render.com
2. Click on your backend service (nftsol-api)
3. Go to "Environment" tab
4. Find or create `DATABASE_URL`
5. Paste your Neon connection string
6. Save and redeploy

## Step 4: Test the Connection

After Render redeploys (2-5 minutes), test:
```bash
curl https://nftsol.onrender.com/healthz
```

Should show database is healthy ✅

## Step 5: (Optional) Connect Locally

To connect your local machine to Neon for testing:

1. Update `apps/backend/.env`:
```
DATABASE_URL="postgresql://nftsol_user:YOUR_PASSWORD@ep-xxxx-xxxxx.us-east-1.neon.tech/nftsol?sslmode=require"
```

2. Run migrations if needed:
```bash
cd apps/backend
npm run migrate
```

## Neon Free Tier Limits

✅ Up to 3 projects
✅ Unlimited storage (within reason)
✅ Unlimited read/write operations
✅ 1 free compute instance (auto-pause after 5 min inactivity)
⚠️ Will pause after 5 minutes of inactivity (but wakes up fast on next request)

## Important Security Notes

⚠️ Never commit DATABASE_URL to GitHub (it's in .gitignore)
⚠️ Keep your password private
✅ Use environment variables on Render (not in code)
✅ Rotate password if you think it's compromised

## Troubleshooting

**"Too many connections"**
- Neon has connection pooling, should be fine
- If it happens, upgrade to paid plan

**"SSL certificate error"**
- Make sure `?sslmode=require` is in the connection string
- Or add NODE_EXTRA_CA_CERTS environment variable

**Database is paused**
- Free tier pauses after 5 min of inactivity
- Will automatically resume when you make a request
- Takes 2-3 seconds to wake up

---

Once you have your Neon URL, reply with it and I'll update your Render backend! 🚀
