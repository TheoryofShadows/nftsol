# Video & Grok API Setup - Quick Start

## ✅ Implementation Complete

All video upload, Grok verification, and Eternal Echoes features have been implemented.

## 🔑 API Keys Setup

Add these to `apps/backend/.env`:

```env
# Pinata (Video Storage - Free 1GB)
PINATA_JWT=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI1NDJiMTkzNi0wYmFkLTRiNzQtOWFkOC0yNGQxZGVjZWMxMTEiLCJlbWFpbCI6InF1YWxpdHk0ODkwQG91dGxvb2suY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6ImI1NmViNTdiZDRlMGI1MDNhMDk0Iiwic2NvcGVkS2V5U2VjcmV0IjoiMmM4MzY1ZTI5M2VjZmYxNTBiOGE4Mjg4ZWZiMTc4ZTM5ZDE3MjlmOTVlYmM4ZjM0OWFlNGUwMTNjYzE2NmEyYiIsImV4cCI6MTc5Mjk2MTM5OX0.uX6wi9f4Y0WL7vOBb_jGANcROuQAstjS9CayOzLzyUM

# xAI Grok (AI Verification)
XAI_API_KEY=xai-q0NulpGBmDBVpSYs4ybd1jFmnoHoDwSDSzXWdQ2Frx64HDGdiDX0d8iOkdXBP5UVxvHtx6Nuc098o06q
```

## 🧪 Test Locally

### 1. Install Dependencies
```bash
cd client && npm install
cd ../apps/backend && npm install
```

### 2. Start Backend
```bash
cd apps/backend
npm run dev
# Server runs on http://localhost:3001
```

### 3. Start Frontend
```bash
cd client
npm run dev
# App runs on http://localhost:5173
```

### 4. Test Video Upload
1. Go to http://localhost:5173
2. Navigate to "Eternal Echoes" tab
3. Click "Upload Video" mode
4. Drag & drop a video file (max 100MB)
5. Watch Grok verification happen automatically
6. Mint the video NFT

## ✅ Verified Working

- ✅ Pinata connection tested and working
- ✅ Video upload endpoint: `/api/video/upload`
- ✅ Grok verification endpoint: `/api/grok/verify-video`
- ✅ Eternal Echoes supports Video echoType
- ✅ Frontend components lazy-loaded
- ✅ Bundle optimization configured

## 📋 Features Implemented

1. **Video Upload**: Upload videos → Pinata IPFS → Irys metadata
2. **Grok Verification**: Real xAI Grok API with Cloudflare fallback
3. **Eternal Echoes**: Video layer support with "Echo It" UX
4. **User Education**: Joyride tours for video upload and echo features
5. **Bundle Optimization**: Video components code-split (< 2MB target)

## 🚀 Ready to Deploy

All code is production-ready. Just add the API keys to your Render environment variables for production deployment.

