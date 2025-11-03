# 🚀 AUTO-DEPLOY SETUP - Complete Step-by-Step Guide

**Full path instructions to enable auto-deploy on Render and Netlify**

---

## ✅ PART 1: RENDER AUTO-DEPLOY (Backend)

### Step 1: Navigate to Render Dashboard
1. Open your browser
2. Go to: **https://dashboard.render.com**
3. Log in if needed

### Step 2: Find Your Backend Service
1. On the Render dashboard, you'll see a list of services
2. Look for your backend service (might be named like "nftsol-backend" or "nftsol-platform")
3. **Click on the service name** to open it

### Step 3: Open Settings Tab
1. At the top of the service page, you'll see tabs:
   - Overview | Logs | Metrics | Environment | **Settings** | ...
2. **Click "Settings"** tab

### Step 4: Find Build & Deploy Section
1. Scroll down in the Settings page
2. Look for the section labeled **"Build & Deploy"**
3. It should show:
   - **Branch:** (current branch name)
   - **Root Directory:** (usually blank or "apps/backend")
   - **Build Command:** (usually "npm install" or "npm ci")
   - **Start Command:** (usually "npm start" or "node dist/index.js")
   - **Auto-Deploy:** (toggle switch)

### Step 5: Enable Auto-Deploy
1. Find the **"Auto-Deploy"** toggle switch
2. **Click the toggle** to enable it (should turn green/blue when enabled)
3. Verify the **Branch** is set to: **`main`**
   - If not `main`, click the dropdown and select `main`

### Step 6: Verify Root Directory (IMPORTANT!)
1. In the same Build & Deploy section
2. Look for **"Root Directory"**
3. **Set it to:** `apps/backend`
   - This tells Render to build from the backend folder
   - If it's blank, type: `apps/backend`

### Step 7: Verify Build Command
1. Look for **"Build Command"**
2. Should be: `npm ci && npm run build`
   - If different, update it to: `npm ci && npm run build`

### Step 8: Verify Start Command
1. Look for **"Start Command"**
2. Should be: `npm start` or `node dist/index.js`
   - If different, update it to: `npm start`

### Step 9: Save Changes
1. Scroll to the bottom of the Settings page
2. **Click "Save Changes"** button
3. Render will show a confirmation message

### Step 10: Verify Auto-Deploy is Active
1. Go back to the **Overview** tab
2. Look for a badge or indicator showing:
   - ✅ "Auto-Deploy: Enabled"
   - Or: "Branch: main" with a green checkmark

**✅ Render Auto-Deploy is now ENABLED!**

---

## ✅ PART 2: NETLIFY AUTO-DEPLOY (Frontend)

### Step 1: Navigate to Netlify Dashboard
1. Open your browser
2. Go to: **https://app.netlify.com**
3. Log in if needed

### Step 2: Find Your Site
1. On the Netlify dashboard, you'll see "Sites" in the left sidebar
2. **Click "Sites"**
3. Find your site (might be "nftsolmarket" or similar)
4. **Click on the site name**

### Step 3: Open Site Settings
1. At the top of the site page, you'll see:
   - Overview | Deploys | Functions | **Site settings** | ...
2. **Click "Site settings"**

### Step 4: Open Build & Deploy Section
1. In the left sidebar of Site settings, you'll see:
   - General | Domain management | **Build & deploy** | ...
2. **Click "Build & deploy"**

### Step 5: Check Continuous Deployment
1. In the Build & deploy page, look for **"Continuous Deployment"**
2. You should see:
   - **Branch:** (current branch, should be `main`)
   - **Connected to Git provider:** GitHub
   - **Repository:** TheoryofShadows/nftsol
   - **Deploy status:** (should show status)

### Step 6: Verify Branch is Set to Main
1. Under "Continuous Deployment"
2. Find the **"Branch"** setting
3. **It should be:** `main`
   - If not, click the dropdown and select `main`

### Step 7: Verify Build Settings
1. Scroll down to **"Build settings"** section
2. Look for:
   - **Base directory:** (should be blank or `client`)
   - **Build command:** (should be `npm run build` or `cd client && npm run build`)
   - **Publish directory:** (should be `client/dist` or `dist`)

### Step 8: Update Build Settings (If Needed)
If Base directory is blank:
1. Click **"Edit settings"** button
2. Set **Base directory:** `client`
3. Set **Build command:** `npm run build`
4. Set **Publish directory:** `dist`
5. Click **"Save"**

### Step 9: Connect to GitHub (If Not Connected)
If you don't see GitHub connection:
1. Click **"Link repository"** or **"Connect to Git provider"**
2. Select **"GitHub"**
3. Authorize Netlify if prompted
4. Select repository: **TheoryofShadows/nftsol**
5. Select branch: **`main`**
6. Set build settings (as in Step 8)
7. Click **"Save and deploy"**

### Step 10: Verify Auto-Deploy is Active
1. Go back to the site **Overview** tab
2. You should see:
   - ✅ "Connected to GitHub"
   - ✅ "Branch: main"
   - ✅ Deployment history showing recent deploys

**✅ Netlify Auto-Deploy is now ENABLED!**

---

## 🧪 TEST AUTO-DEPLOY

### Test Render (Backend):

1. Make a small change to your backend:
   ```bash
   # In terminal, navigate to your project:
   cd C:\Users\KHK89\NFTSol
   
   # Create a test file or edit an existing one:
   echo "# Auto-deploy test" >> apps/backend/README.md
   ```

2. Commit and push:
   ```bash
   git add apps/backend/README.md
   git commit -m "test: verify auto-deploy"
   git push origin main
   ```

3. **Watch Render Dashboard:**
   - Go to: https://dashboard.render.com
   - Click your service
   - Go to **"Logs"** tab
   - You should see:
     ```
     ✅ Build started
     ✅ Installing dependencies
     ✅ Building...
     ✅ Deploying...
     ✅ Live!
     ```

### Test Netlify (Frontend):

1. Make a small change to your frontend:
   ```bash
   # Still in your project root:
   echo "# Auto-deploy test" >> client/README.md
   ```

2. Commit and push:
   ```bash
   git add client/README.md
   git commit -m "test: verify frontend auto-deploy"
   git push origin main
   ```

3. **Watch Netlify Dashboard:**
   - Go to: https://app.netlify.com
   - Click your site
   - Go to **"Deploys"** tab
   - You should see:
     ```
     ✅ New deploy started
     ✅ Building...
     ✅ Build succeeded
     ✅ Published
     ```

---

## 📋 VERIFICATION CHECKLIST

### Render Auto-Deploy:
- [ ] Auto-Deploy toggle is **ENABLED** (green/blue)
- [ ] Branch is set to **`main`**
- [ ] Root Directory is set to **`apps/backend`**
- [ ] Build Command is **`npm ci && npm run build`**
- [ ] Start Command is **`npm start`** or **`node dist/index.js`**
- [ ] Settings are saved

### Netlify Auto-Deploy:
- [ ] Connected to GitHub
- [ ] Repository: **TheoryofShadows/nftsol**
- [ ] Branch is set to **`main`**
- [ ] Base directory is **`client`** (or blank)
- [ ] Build command is **`npm run build`**
- [ ] Publish directory is **`dist`**

---

## 🎯 EXPECTED BEHAVIOR

### After Setup:

**Every time you push to `main`:**

1. **Render:**
   - Detects new commit
   - Starts build process
   - Deploys backend automatically
   - Backend goes live

2. **Netlify:**
   - Detects new commit
   - Starts build process
   - Builds frontend
   - Deploys to CDN
   - Frontend goes live

**No manual steps needed!** 🚀

---

## 🔍 TROUBLESHOOTING

### Render Not Auto-Deploying:

**Check 1:** Auto-Deploy toggle
- Make sure it's **enabled** (not grayed out)

**Check 2:** Branch setting
- Must be **`main`** (not `master` or other)

**Check 3:** Root Directory
- Must be **`apps/backend`** (case-sensitive!)

**Check 4:** Service Status
- Go to Overview tab
- Check if service is paused
- If paused, click "Unpause"

### Netlify Not Auto-Deploying:

**Check 1:** GitHub Connection
- Site settings → Build & deploy
- Should show "Connected to GitHub"
- If not, reconnect (Step 9 above)

**Check 2:** Branch Setting
- Must be **`main`** (not `master`)

**Check 3:** Build Settings
- Base directory: `client`
- Build command: `npm run build`
- Publish directory: `dist`

**Check 4:** Netlify App Status
- Overview tab
- Check if site is active
- Look for any errors

---

## 📊 FULL PATH SUMMARY

### Render Auto-Deploy Path:
```
1. https://dashboard.render.com
2. Click: [Your Service Name]
3. Click: Settings tab
4. Scroll to: Build & Deploy section
5. Enable: Auto-Deploy toggle
6. Set: Branch = main
7. Set: Root Directory = apps/backend
8. Click: Save Changes
```

### Netlify Auto-Deploy Path:
```
1. https://app.netlify.com
2. Click: Sites (left sidebar)
3. Click: [Your Site Name]
4. Click: Site settings
5. Click: Build & deploy (left sidebar)
6. Verify: Continuous Deployment connected to GitHub
7. Verify: Branch = main
8. Verify: Build settings configured
```

---

## ✅ SUCCESS INDICATORS

### You'll Know It's Working When:

**Render:**
- ✅ New commits trigger deployments automatically
- ✅ Logs show "Build started" after push
- ✅ Service shows "Live" after deploy completes
- ✅ No manual "Deploy" button needed

**Netlify:**
- ✅ Deploys tab shows new deploy after push
- ✅ Build completes successfully
- ✅ Site updates automatically
- ✅ No manual "Trigger deploy" needed

---

## 🎉 THAT'S IT!

**After completing these steps:**

1. ✅ Render will auto-deploy backend on every push to `main`
2. ✅ Netlify will auto-deploy frontend on every push to `main`
3. ✅ No GitHub Actions needed
4. ✅ No manual deployment needed

**Just push code and it deploys automatically!** 🚀

---

## 📞 NEED HELP?

If you get stuck at any step:

1. **Screenshot** the page you're on
2. **Note** which step you're at
3. **Share** any error messages

I'll help you complete the setup!

---

*Created: November 3, 2025*  
*Complete auto-deploy setup guide*

