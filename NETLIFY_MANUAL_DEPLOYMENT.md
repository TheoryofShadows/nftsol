# Manual Netlify Deployment Guide

## Frontend Deployment

### Step 1: Access Netlify
1. Go to [netlify.com](https://netlify.com)
2. Sign in to your account or create one if you don't have one

### Step 2: Deploy from Folder
1. Click on "Add new site" → "Deploy manually"
2. Drag and drop the `netlify-deploy` folder (or the `client/dist` folder) into the deploy area
3. Wait for the deployment to complete

### Step 3: Configure Site Settings
1. Go to Site settings → Site details
2. Change the site name to something like `nftsol-frontend` or `nftsol-app`
3. Note down your site URL (e.g., `https://nftsol-frontend.netlify.app`)

### Step 4: Configure Environment Variables
1. Go to Site settings → Environment variables
2. Add the following variables:
   - `VITE_API_BASE` = `https://your-backend-url.com/api` (update with your actual backend URL)
   - `NODE_ENV` = `production`

### Step 5: Configure Redirects
1. Go to Site settings → Redirects and rewrites
2. Add a redirect rule:
   - From: `/*`
   - To: `/index.html`
   - Status: `200`

## Backend Deployment (Alternative Options)

Since Netlify Functions have limitations for complex Express apps, consider these alternatives:

### Option 1: Render.com (Recommended)
1. Go to [render.com](https://render.com)
2. Connect your GitHub repository
3. Deploy the `server` folder as a Web Service
4. Use the provided URL for your frontend's API base

### Option 2: Vercel
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Deploy the `server` folder
4. Use the provided URL for your frontend's API base

### Option 3: Railway
1. Go to [railway.app](https://railway.app)
2. Connect your GitHub repository
3. Deploy the `server` folder
4. Use the provided URL for your frontend's API base

## Current Deployment Status

✅ Frontend built successfully
✅ Deployment files prepared in `netlify-deploy` folder
✅ Netlify configuration created
⏳ Ready for manual deployment

## Next Steps

1. Deploy the frontend to Netlify using the steps above
2. Deploy the backend to one of the suggested platforms
3. Update the frontend's `VITE_API_BASE` environment variable with your backend URL
4. Test the complete application

## Files Ready for Deployment

- **Frontend**: `netlify-deploy/` folder (contains built React app)
- **Backend**: `server/` folder (Express.js API)
- **Configuration**: `netlify.toml` (Netlify configuration)
