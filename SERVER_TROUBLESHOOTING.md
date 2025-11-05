# Server Troubleshooting Guide

## Common Issues & Solutions

### Issue 1: Port Mismatch
**Problem:** Backend runs on port 3000, frontend expects 3001 (or vice versa)

**Solution:**
1. Check `apps/backend/.env` - ensure `PORT=3001`
2. Check `apps/backend/src/config/index.ts` - default port should be 3001
3. Restart backend after changes

### Issue 2: Backend Not Starting
**Problem:** Backend fails to start or crashes immediately

**Check:**
```bash
cd apps/backend
npm run dev
```

**Common Causes:**
- Missing environment variables
- Port already in use
- Database connection issues
- Missing dependencies

**Solutions:**
1. **Check .env file** - Ensure all required vars are set:
   ```env
   PORT=3001
   NODE_ENV=development
   SOLANA_RPC_URL=https://api.devnet.solana.com
   PLATFORM_SECRET_KEY_BASE58=...
   PINATA_JWT=...
   XAI_API_KEY=...
   ```

2. **Check if port is in use:**
   ```powershell
   Test-NetConnection -ComputerName localhost -Port 3001
   ```

3. **Kill existing processes:**
   ```powershell
   Get-Process -Name node | Stop-Process -Force
   ```

### Issue 3: Frontend Can't Connect
**Problem:** "Connection Issue" notification appears

**Check:**
1. Is backend running? Check http://localhost:3001/health
2. Are CORS settings correct?
3. Check browser console for errors

**Solution:**
```bash
# Terminal 1: Backend
cd apps/backend
npm run dev

# Terminal 2: Frontend
cd client
npm run dev
```

### Issue 4: Component Import Errors
**Problem:** "Failed to load component" errors

**Solution:**
1. Check import paths - use relative paths correctly
2. Ensure all dependencies are installed:
   ```bash
   cd client && npm install
   cd ../apps/backend && npm install
   ```
3. Hard refresh browser (Ctrl+Shift+R)

### Issue 5: Environment Variables Not Loading
**Problem:** API keys not working, undefined values

**Solution:**
1. Ensure `.env` file exists in `apps/backend/`
2. Check `.env` file syntax (no spaces around `=`)
3. Restart backend after changing `.env`
4. Check `apps/backend/src/lib/secrets-loader.ts` for loading logic

## Quick Health Check

```bash
# 1. Check backend is running
curl http://localhost:3001/health

# 2. Check frontend is running
curl http://localhost:5173

# 3. Check API endpoints
curl http://localhost:3001/api/health
```

## Required Environment Variables

### Backend (.env)
```env
PORT=3001
NODE_ENV=development
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_CLUSTER=devnet
PLATFORM_SECRET_KEY_BASE58=...
PINATA_JWT=...
XAI_API_KEY=...
CLOUT_MINT=...
REWARDS_OWNER=...
BUBBLEGUM_TREE_ADDRESS=...
```

### Frontend (.env)
```env
VITE_API_BASE=http://localhost:3001
```

## Starting Servers Correctly

### Option 1: Separate Terminals
```bash
# Terminal 1
cd apps/backend
npm run dev

# Terminal 2
cd client
npm run dev
```

### Option 2: Background Process (Windows)
```powershell
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd apps\backend; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd client; npm run dev"
```

## Debugging Tips

1. **Check Backend Logs:**
   - Look for "Server listening on port X"
   - Check for error messages
   - Verify database connections

2. **Check Frontend Console:**
   - Open DevTools (F12)
   - Check Network tab for failed requests
   - Check Console for errors

3. **Verify Ports:**
   ```powershell
   netstat -ano | findstr :3001
   netstat -ano | findstr :5173
   ```

4. **Test API Endpoints:**
   ```bash
   # Health check
   curl http://localhost:3001/api/health
   
   # Test video endpoint (requires auth)
   curl -X POST http://localhost:3001/api/video/upload
   ```

## Still Having Issues?

1. Clear all node processes:
   ```powershell
   Get-Process -Name node | Stop-Process -Force
   ```

2. Reinstall dependencies:
   ```bash
   cd apps/backend && npm install
   cd ../client && npm install
   ```

3. Check for TypeScript errors:
   ```bash
   cd apps/backend && npm run build
   cd ../client && npm run build
   ```

4. Verify all files are saved and committed

