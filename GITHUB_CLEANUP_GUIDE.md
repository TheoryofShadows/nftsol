# 🧹 GitHub Repository Cleanup Guide

**Purpose:** Clean up the repository, remove old branches, delete trash files, and ensure all documentation is present.

---

## 🚀 Quick Start

### **Option 1: Run Automated Cleanup (Recommended)**

```powershell
# Run the comprehensive cleanup script
.\cleanup-github.ps1
```

This will:
- ✅ Clean merged branches
- ✅ Remove untracked files (with confirmation)
- ✅ Prune stale remote branches
- ✅ Verify documentation
- ✅ Push everything to main

---

### **Option 2: Manual Cleanup**

If you prefer manual control, follow these steps:

#### **Step 1: Fetch Latest and Check Status**

```powershell
cd C:\Users\KHK89\NFTSol

# Fetch latest from GitHub
git fetch --all --prune

# Check current status
git status

# List all branches
git branch -vv
git branch -r
```

#### **Step 2: Switch to Main and Pull Latest**

```powershell
# Switch to main
git checkout main

# Pull latest changes
git pull origin main
```

#### **Step 3: Delete Merged Local Branches**

```powershell
# List merged branches
git branch --merged main

# Delete merged branches (EXCEPT main and develop)
git branch --merged main | Where-Object { $_ -notmatch "main|develop|\*" } | ForEach-Object { 
    git branch -d $_.Trim() 
}
```

#### **Step 4: Delete Old Remote Branches**

```powershell
# ⚠️ WARNING: This affects all collaborators!

# List remote branches
git branch -r

# Delete specific remote branch (example)
git push origin --delete old-branch-name

# Or run the deletion script
.\delete-old-branches.ps1
```

#### **Step 5: Clean Untracked Files**

```powershell
# List untracked files
git ls-files --others --exclude-standard

# Preview what would be deleted
git clean -nd

# Delete untracked files and directories
git clean -fd

# Delete ignored files too (node_modules, dist, etc.)
git clean -fdX
```

#### **Step 6: Sync Develop with Main** (if you have a develop branch)

```powershell
# Check if develop exists
git branch --list develop

# If it exists, sync it
git checkout develop
git pull origin develop
git merge main -m "chore: Sync develop with main"
git push origin develop

# Switch back to main
git checkout main
```

#### **Step 7: Remove Trash Files**

```powershell
# Find and remove common trash files
Get-ChildItem -Path . -Include @("*.log", "*.tmp", ".DS_Store", "Thumbs.db") -Recurse | Remove-Item -Force

# Remove empty directories
Get-ChildItem -Path . -Recurse -Directory | Where-Object { (Get-ChildItem $_.FullName).Count -eq 0 } | Remove-Item -Force
```

#### **Step 8: Verify Documentation**

```powershell
# Check if all required docs exist
$docs = @(
    "README.md",
    "ALL_FEATURES_COMPLETE.md",
    "FEATURES_IMPLEMENTATION_STATUS.md",
    "SOLANA_NFT_HUB_REQUIREMENTS.md",
    "DEPLOYMENT.md",
    "DEVELOPER_DOCUMENTATION.md",
    "WHITEPAPER.md"
)

foreach ($doc in $docs) {
    if (Test-Path $doc) {
        Write-Host "✅ $doc" -ForegroundColor Green
    } else {
        Write-Host "❌ $doc (MISSING)" -ForegroundColor Red
    }
}
```

#### **Step 9: Push Everything to Main**

```powershell
# Stage all changes
git add -A

# Commit if there are changes
git commit -m "chore: Repository cleanup - removed old branches and trash files"

# Push to main
git push origin main
```

---

## 📋 Branch Management

### **Current Branches (Expected):**

- ✅ `main` - Primary production branch
- ✅ `develop` - Development branch (optional)

### **Branches to Delete:**

Look for branches like:
- ❌ `feature/*` - Old feature branches that are merged
- ❌ `fix/*` - Old bugfix branches that are merged
- ❌ `test/*` - Old testing branches
- ❌ Any branch with no recent commits

### **How to Check if a Branch is Safe to Delete:**

```powershell
# Check if branch is merged into main
git branch --merged main

# Check when branch was last modified
git for-each-ref --sort=-committerdate refs/heads/
```

---

## 🗑️ Files to Remove

### **Trash Files to Delete:**

```
❌ *.log          # Log files
❌ *.tmp          # Temporary files
❌ .DS_Store      # macOS metadata
❌ Thumbs.db      # Windows thumbnails
❌ *.swp          # Vim swap files
❌ *~             # Backup files
❌ node_modules/  # Dependencies (git-ignored but clean anyway)
❌ dist/          # Build output (git-ignored)
❌ .cache/        # Cache directories
```

### **Files to KEEP:**

```
✅ .github/       # GitHub Actions workflows
✅ .gitignore     # Git ignore rules
✅ .env.example   # Environment variable templates
✅ package.json   # Dependencies
✅ *.md           # Documentation
✅ src/           # Source code
✅ public/        # Public assets
```

---

## 📚 Required Documentation

### **Essential Docs (Must Have):**

| File | Status | Description |
|------|--------|-------------|
| `README.md` | ✅ Present | Project overview and quick start |
| `ALL_FEATURES_COMPLETE.md` | ✅ Present | Feature completion report |
| `FEATURES_IMPLEMENTATION_STATUS.md` | ✅ Present | Implementation status tracker |
| `SOLANA_NFT_HUB_REQUIREMENTS.md` | ✅ Present | Requirements and gap analysis |
| `DEPLOYMENT.md` | ✅ Present | Deployment guide |
| `DEVELOPER_DOCUMENTATION.md` | ✅ Present | Developer setup guide |
| `WHITEPAPER.md` | ✅ Present | Project whitepaper |

### **Optional but Recommended:**

| File | Status | Description |
|------|--------|-------------|
| `CONTRIBUTING.md` | ⏳ Optional | Contribution guidelines |
| `LICENSE` | ⏳ Optional | License file |
| `CHANGELOG.md` | ⏳ Optional | Version history |
| `SECURITY.md` | ⏳ Optional | Security policy |

---

## 🔧 GitHub Settings to Check

### **1. Default Branch:**

Ensure `main` is set as the default branch:
1. Go to: `https://github.com/TheoryofShadows/nftsol/settings`
2. Click "Branches" in the left sidebar
3. Verify "Default branch" is set to `main`

### **2. Branch Protection:**

Consider protecting `main` branch:
1. Go to: `https://github.com/TheoryofShadows/nftsol/settings/branches`
2. Click "Add branch protection rule"
3. Enter `main` as the branch name pattern
4. Enable:
   - ✅ Require pull request reviews before merging
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging

### **3. Delete Merged Branches:**

Enable automatic deletion of merged branches:
1. Go to: `https://github.com/TheoryofShadows/nftsol/settings`
2. Scroll to "Pull Requests"
3. Enable "Automatically delete head branches"

---

## 🎯 Final Verification Checklist

After cleanup, verify:

- [ ] ✅ Only `main` (and optionally `develop`) branches exist
- [ ] ✅ No untracked files (`git status` is clean)
- [ ] ✅ No trash files (*.log, *.tmp, etc.)
- [ ] ✅ All required documentation is present
- [ ] ✅ Latest code is pushed to `main`
- [ ] ✅ Repository is 100% legible and organized
- [ ] ✅ No old/stale remote branches

---

## 🚨 Safety Tips

### **Before Deleting Branches:**

1. ✅ **Make sure branch is merged:** `git branch --merged main`
2. ✅ **Check last commit date:** `git log -1 branch-name`
3. ✅ **Verify no unique commits:** `git log main..branch-name`

### **Before Deleting Files:**

1. ✅ **Preview first:** `git clean -nd` (dry run)
2. ✅ **Check if tracked:** `git ls-files`
3. ✅ **Backup important files:** Create a backup folder first

### **Before Force Pushing:**

1. ❌ **Never force push to main** (unless absolutely necessary)
2. ❌ **Don't delete commits others depend on**
3. ❌ **Don't rewrite public history**

---

## 📞 Need Help?

If you encounter issues:

1. **Check Git status:** `git status`
2. **View recent changes:** `git log --oneline -10`
3. **Undo last commit:** `git reset --soft HEAD~1`
4. **Restore deleted branch:** `git reflog` (shows deleted branches)

---

## ✅ You're Done!

Your repository is now:
- 🧹 **Clean** - No trash files or old branches
- 📚 **Documented** - All required docs present
- 🔄 **Synced** - Everything pushed to main
- 📖 **Legible** - 100% organized and clear

🎉 **Congratulations! Your GitHub repo is production-ready!**

