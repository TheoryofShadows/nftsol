# 🔄 Update Render to Use Neon Connection Pooler

**Updated:** November 27, 2025

You need to update the DATABASE_URL in Render to use the connection pooler endpoint instead of the direct endpoint.

---

## 📋 What Changed

### Old Endpoint (Direct Connection):
```
postgresql://neondb_owner:npg_lZeM1jnHP9Aq@ep-cold-hall-aenue3di.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

### New Endpoint (Connection Pooler - BETTER):
```
postgresql://neondb_owner:npg_lZeM1jnHP9Aq@ep-cold-hall-aenue3di-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

**Key difference:** `ep-cold-hall-aenue3di.c-2.us-east-2.aws.neon.tech` → `ep-cold-hall-aenue3di-pooler.c-2.us-east-2.aws.neon.tech`

---

## ✅ Why Use Connection Pooler?

✅ Better performance for serverless apps
✅ Handles connection limits better
✅ Faster response times
✅ Recommended for production

---

## 🔧 How to Update Render

### Step 1: Go to Render Dashboard
1. Visit: https://dashboard.render.com
2. Click: **nftsol-api** service

### Step 2: Update Environment Variable
1. Click: **Environment** tab (left sidebar)
2. Find: `DATABASE_URL` variable
3. Click: Edit button (pencil icon)
4. Replace the value with:
   ```
   postgresql://neondb_owner:npg_lZeM1jnHP9Aq@ep-cold-hall-aenue3di-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
   ```
5. Click: **Save**

### Step 3: Wait for Redeploy
- Render will automatically redeploy with the new DATABASE_URL
- Watch for the green "Deployed" checkmark
- Should take 2-5 minutes

### Step 4: Verify
```bash
# Test the health endpoint
curl https://nftsol.onrender.com/healthz
```

Should return:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "database": {
      "status": "healthy",
      "responseTime": "XXms"
    }
  }
}
```

---

## 📝 Local Files Updated

✅ `apps/backend/.env` - Updated to pooler endpoint
✅ `.env` - Updated to pooler endpoint

Both are updated locally and ready to go!

---

## 🎯 Next Steps

1. Update Render environment variable (instructions above)
2. Wait 2-5 minutes for redeploy
3. Verify health endpoint works
4. You're done! 🎉

