# Supabase Setup for NFTSol (Free PostgreSQL Hosting)

Supabase is a PostgreSQL hosting service with a free tier. It's easier than local setup and works great for MVP.

## Quick Setup (5 minutes)

1. **Go to**: https://supabase.com/
2. **Sign up**: Use GitHub or Google
3. **Create Project**:
   - Click "New Project"
   - Name: `nftsol`
   - Password: Save this
   - Region: Pick closest to you
   - Click "Create new project"
4. **Get Connection String**:
   - Go to Settings → Database
   - Look for "Connection string"
   - Copy the PostgreSQL connection string
   - It looks like: `postgresql://postgres:password@host:5432/postgres`

5. **Update .env**:
```env
DATABASE_URL="postgresql://postgres:password@host:5432/postgres"
```

6. **Run migrations**:
```bash
cd /c/Users/KHK89/NFTSol/apps/backend
npm run db:migrate
```

Done! You have real PostgreSQL in the cloud.

## Why Supabase?
- ✅ Free tier (500MB storage)
- ✅ Real PostgreSQL
- ✅ Instant backups
- ✅ Built-in auth
- ✅ REST API included
- ✅ Perfect for MVP
