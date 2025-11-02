# Git Sync Commands - Full Path

Run these commands from your terminal (PowerShell or Command Prompt):

## 1. Navigate to Project Directory

```powershell
cd C:\Users\KHK89\NFTSol
```

## 2. Check Current Status

```powershell
cd C:\Users\KHK89\NFTSol
git status
```

## 3. Commit All Changes

```powershell
cd C:\Users\KHK89\NFTSol
git add -A
git commit -m "chore: clean up repository and update documentation

- Remove unused Docker files
- Update README with latest features (dashboard, onboarding)
- Enhance documentation (TECHNICAL-DOCS, SECURITY, CONTRIBUTING)
- Add CHANGELOG and .gitattributes
- Fix deployment workflow"
```

## 4. Push to Main Branch

```powershell
cd C:\Users\KHK89\NFTSol
git push origin main
```

## 5. Sync Develop Branch (Merge Main into Develop)

```powershell
cd C:\Users\KHK89\NFTSol
git checkout develop
git merge main
git push origin develop
```

## 6. Switch Back to Main

```powershell
cd C:\Users\KHK89\NFTSol
git checkout main
```

## Alternative: All-in-One Script

You can copy-paste this entire block:

```powershell
cd C:\Users\KHK89\NFTSol
git add -A
git commit -m "chore: clean up repository and update documentation"
git push origin main
git checkout develop
git merge main
git push origin develop
git checkout main
```

## Verify Branches Are in Sync

```powershell
cd C:\Users\KHK89\NFTSol
git checkout main
git log --oneline -5
git checkout develop
git log --oneline -5
```

Both branches should show the same latest commit.

## Current Working Directory

All commands assume you're running from:
```
C:\Users\KHK89\NFTSol
```
