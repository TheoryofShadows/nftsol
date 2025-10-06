# GitHub Repository Setup for NFTSol

Quick guide to push your NFTSol marketplace to GitHub and connect to NFTSol.app domain.

## 🚀 One-Command GitHub Setup

Copy and paste these commands in your terminal:

```bash
# Initialize git repository
git init

# Add all project files
git add .

# Create initial commit
git commit -m "🎉 Initial release: NFTSol marketplace with advanced backend and admin dashboard"

# Set main branch
git branch -M main

# Add your GitHub repository (REPLACE 'YOUR_USERNAME' with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/nftsol.git

# Push to GitHub
git push -u origin main
```

## 📝 Before Running Commands

1. **Create GitHub Repository**
   - Go to [github.com/new](https://github.com/new)
   - Repository name: `nftsol`
   - Description: `NFTSol - Professional NFT Marketplace for Solana`
   - Choose Public or Private
   - **Don't** initialize with README (we already have one)

2. **Replace YOUR_USERNAME**
   - In the git remote command above
   - Use your actual GitHub username

## 🌐 Domain Connection (NFTSol.app)

After GitHub setup, configure your domain:

### DNS Settings
Add these records in your domain provider:

```
Type: CNAME
Name: www
Value: your-deployment.vercel.app

Type: CNAME
Name: @  
Value: your-deployment.vercel.app
```

### Deployment Platforms

**Option 1: Vercel (Recommended)**
- Connect GitHub repository
- Auto-deploy on every push
- Custom domain setup included

**Option 2: Netlify**
- Connect GitHub repository  
- Drag-and-drop alternative
- Good for static sites

**Option 3: Railway**
- Full-stack hosting
- Database included
- Great for backend services

## ✅ Verification

After setup, verify:
- [ ] Repository appears on GitHub
- [ ] All files are uploaded
- [ ] README.md displays correctly
- [ ] Deployment platform connected
- [ ] NFTSol.app domain working

## 🔧 Quick Fixes

**If git push fails:**
```bash
git pull origin main --rebase
git push origin main
```

**If repository already exists:**
```bash
git remote set-url origin https://github.com/YOUR_USERNAME/nftsol.git
```

Your NFTSol marketplace is ready for the world! 🎊