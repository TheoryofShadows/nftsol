# Quick Fix: Server Port Mismatch

## Problem
- Backend was running on port **3000** (from `.env`)
- Frontend expects port **3001**
- Result: "Connection Issue" errors

## Solution Applied
✅ Updated `apps/backend/.env` to set `PORT=3001`
✅ Updated default port in `apps/backend/src/config/index.ts` to 3001

## Next Steps

### 1. Restart Backend
The backend needs to be restarted for the port change to take effect.

**Option A: Stop and restart manually**
```powershell
# Stop any running Node processes
Get-Process -Name node | Stop-Process -Force

# Start backend
cd apps\backend
npm run dev
```

**Option B: The backend should auto-restart if using ts-node-dev**

### 2. Verify Backend is Running
```powershell
# Check if port 3001 is listening
Test-NetConnection -ComputerName localhost -Port 3001

# Or test the API
curl http://localhost:3001/api/health
```

### 3. Refresh Frontend
- Hard refresh browser: `Ctrl+Shift+R`
- Check browser console (F12) - should see successful API calls
- "Connection Issue" notification should disappear

## Expected Result
✅ Backend: `http://localhost:3001`
✅ Frontend: `http://localhost:5173`
✅ Connection: Working

## If Still Not Working

1. **Check backend logs** - Look for "Server ready at http://0.0.0.0:3001"
2. **Verify .env file** - Ensure `PORT=3001` (not 3000)
3. **Check frontend .env** - Ensure `VITE_API_BASE=http://localhost:3001`
4. **Clear browser cache** - Hard refresh or clear cache

## Current Status
- ✅ Port configuration fixed
- ⏳ Backend restart needed
- ⏳ Frontend connection test needed

