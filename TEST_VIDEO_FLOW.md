# Test Video Upload & Grok Verification Flow

## Step-by-Step Testing Guide

### 1. Environment Setup

**Add to `apps/backend/.env`:**
```env
PINATA_JWT=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI1NDJiMTkzNi0wYmFkLTRiNzQtOWFkOC0yNGQxZGVjZWMxMTEiLCJlbWFpbCI6InF1YWxpdHk0ODkwQG91dGxvb2suY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6ImI1NmViNTdiZDRlMGI1MDNhMDk0Iiwic2NvcGVkS2V5U2VjcmV0IjoiMmM4MzY1ZTI5M2VjZmYxNTBiOGE4Mjg4ZWZiMTc4ZTM5ZDE3MjlmOTVlYmM4ZjM0OWFlNGUwMTNjYzE2NmEyYiIsImV4cCI6MTc5Mjk2MTM5OX0.uX6wi9f4Y0WL7vOBb_jGANcROuQAstjS9CayOzLzyUM

XAI_API_KEY=xai-q0NulpGBmDBVpSYs4ybd1jFmnoHoDwSDSzXWdQ2Frx64HDGdiDX0d8iOkdXBP5UVxvHtx6Nuc098o06q
```

### 2. Start Servers

**Terminal 1 - Backend:**
```bash
cd apps/backend
npm run dev
```
✅ Should start on http://localhost:3001

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```
✅ Should start on http://localhost:5173

### 3. Test Video Upload Flow

1. **Open Browser**: http://localhost:5173
2. **Navigate**: Click "Eternal Echoes" tab
3. **Switch Mode**: Click "📹 Upload Video" button
4. **Upload**: Drag & drop a video file (MP4, WebM, MOV - max 100MB)
5. **Watch Progress**: 
   - Upload progress bar appears
   - Video preview loads
   - Grok verification happens automatically
   - Success notification shows verification status
6. **Mint**: Click "🚀 Mint Echo – CLOUT x2!" button
7. **Verify**: Check console logs for:
   - `[Video] Uploaded to Pinata: <CID>`
   - `[Video] Metadata uploaded to Irys: <URI>`
   - `[Video] Grok verification: VERIFIED/NEEDS_REVIEW (score: XX)`

### 4. Test Echo Feature

1. **After Minting**: Navigate to Echo Viewer
2. **Click**: "🎯 Echo This NFT" section
3. **Select**: "📹 Video Echo" from dropdown
4. **Add Video**: 
   - Enter Pinata IPFS URL
   - Add description
   - Click "📹 Add Video Echo"
5. **Verify**: Video layer appears with verification badge

### 5. Check API Endpoints

**Test Video Upload:**
```bash
curl -X POST http://localhost:3001/api/video/upload \
  -F "video=@test-video.mp4" \
  -F "name=Test Video" \
  -F "description=Test upload"
```

**Test Grok Verification:**
```bash
curl -X POST http://localhost:3001/api/grok/verify-video \
  -H "Content-Type: application/json" \
  -d '{"videoUri": "https://gateway.pinata.cloud/ipfs/Qm...", "nftId": "test-123"}'
```

### 6. Expected Results

✅ **Video Upload**:
- File uploaded to Pinata
- Returns: `videoCid`, `videoUrl`, `metadataUri`
- Grok verification result included

✅ **Grok Verification**:
- Returns: `verified: true/false`, `score: 0-100`, `summary`
- Falls back to Cloudflare AI if xAI fails

✅ **Echo Creation**:
- Video echo added to ledger
- Verification badge displayed
- CLOUT rewards for verified echoes

### 7. Troubleshooting

**Backend won't start:**
- Check `apps/backend/.env` has PINATA_JWT and XAI_API_KEY
- Verify `PLATFORM_SECRET_KEY_BASE58` is set

**Video upload fails:**
- Check Pinata JWT is valid
- Verify file size < 100MB
- Check browser console for errors

**Grok verification fails:**
- Check xAI API key is valid
- Verify API key has credits
- Check backend logs for error details
- Falls back to Cloudflare AI automatically

**Frontend errors:**
- Check `react-dropzone` is installed
- Verify API base URL in `.env`
- Check browser console for CORS errors

### 8. Production Deployment

**Render (Backend):**
- Add `PINATA_JWT` and `XAI_API_KEY` to environment variables
- Redeploy backend service

**Netlify (Frontend):**
- No changes needed - auto-deploys from Git
- Ensure `VITE_API_BASE` points to production backend

### Success Checklist

- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Video upload works (Pinata)
- [ ] Grok verification works (xAI API)
- [ ] Video NFT minting works
- [ ] Echo video layer works
- [ ] Verification badges display correctly
- [ ] Bundle size < 2MB (check `npm run build`)

**You're ready to ship! 🚀**

