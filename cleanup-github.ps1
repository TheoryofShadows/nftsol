# 🧹 GitHub Repository Cleanup Script
# Cleans up branches, removes trash files, and syncs everything to main

Write-Host "`n🚀 Starting GitHub Repository Cleanup...`n" -ForegroundColor Cyan

# 1. Check current status
Write-Host "📊 Current Repository Status:" -ForegroundColor Yellow
git status

# 2. Fetch latest from remote
Write-Host "`n🔄 Fetching latest from remote..." -ForegroundColor Yellow
git fetch --all --prune

# 3. List all branches
Write-Host "`n📋 All Local Branches:" -ForegroundColor Yellow
git branch -vv

Write-Host "`n📋 All Remote Branches:" -ForegroundColor Yellow
git branch -r

# 4. Switch to main branch
Write-Host "`n🔀 Switching to main branch..." -ForegroundColor Yellow
git checkout main

# 5. Pull latest main
Write-Host "`n⬇️ Pulling latest main..." -ForegroundColor Yellow
git pull origin main

# 6. Delete merged local branches (except main and develop)
Write-Host "`n🗑️ Cleaning up merged local branches..." -ForegroundColor Yellow
$localBranches = git branch --merged main | Where-Object { $_ -notmatch "main|develop|\*" }
foreach ($branch in $localBranches) {
    $branchName = $branch.Trim()
    if ($branchName) {
        Write-Host "   Deleting local branch: $branchName" -ForegroundColor Red
        git branch -d $branchName
    }
}

# 7. Check if develop branch exists
Write-Host "`n🔍 Checking develop branch..." -ForegroundColor Yellow
$developExists = git branch --list develop
if ($developExists) {
    Write-Host "✅ develop branch exists" -ForegroundColor Green
    
    # Merge main into develop to sync
    Write-Host "`n🔀 Syncing develop with main..." -ForegroundColor Yellow
    git checkout develop
    git pull origin develop
    git merge main -m "chore: Sync develop with main - cleanup"
    git push origin develop
    
    # Switch back to main
    git checkout main
} else {
    Write-Host "⚠️ develop branch does not exist (main is the primary branch)" -ForegroundColor Yellow
}

# 8. Clean up untracked files (be careful!)
Write-Host "`n🧹 Checking for untracked files..." -ForegroundColor Yellow
$untrackedFiles = git ls-files --others --exclude-standard
if ($untrackedFiles) {
    Write-Host "Found untracked files:" -ForegroundColor Yellow
    $untrackedFiles | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
    
    $response = Read-Host "`nDo you want to remove these untracked files? (y/N)"
    if ($response -eq 'y' -or $response -eq 'Y') {
        git clean -fd
        Write-Host "✅ Untracked files removed" -ForegroundColor Green
    }
} else {
    Write-Host "✅ No untracked files found" -ForegroundColor Green
}

# 9. Clean up ignored files (node_modules, dist, etc.)
Write-Host "`n🗑️ Cleaning up ignored files (node_modules, dist, etc.)..." -ForegroundColor Yellow
$response = Read-Host "Remove node_modules and dist folders? (y/N)"
if ($response -eq 'y' -or $response -eq 'Y') {
    git clean -fdX
    Write-Host "✅ Ignored files removed" -ForegroundColor Green
}

# 10. Delete old/stale remote branches
Write-Host "`n🌐 Checking for stale remote branches..." -ForegroundColor Yellow
git remote prune origin

# 11. List remaining branches
Write-Host "`n📋 Remaining Branches:" -ForegroundColor Yellow
Write-Host "Local branches:" -ForegroundColor Cyan
git branch

Write-Host "`nRemote branches:" -ForegroundColor Cyan
git branch -r

# 12. Ensure all documentation is present
Write-Host "`n📚 Checking documentation files..." -ForegroundColor Yellow
$requiredDocs = @(
    "README.md",
    "ALL_FEATURES_COMPLETE.md",
    "FEATURES_IMPLEMENTATION_STATUS.md",
    "SOLANA_NFT_HUB_REQUIREMENTS.md",
    "DEPLOYMENT.md",
    "DEVELOPER_DOCUMENTATION.md",
    "WHITEPAPER.md"
)

$missingDocs = @()
foreach ($doc in $requiredDocs) {
    if (Test-Path $doc) {
        Write-Host "   ✅ $doc" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $doc (MISSING)" -ForegroundColor Red
        $missingDocs += $doc
    }
}

if ($missingDocs.Count -gt 0) {
    Write-Host "`n⚠️ Missing documentation files:" -ForegroundColor Yellow
    $missingDocs | ForEach-Object { Write-Host "   - $_" -ForegroundColor Red }
} else {
    Write-Host "`n✅ All required documentation present!" -ForegroundColor Green
}

# 13. Check for common trash files
Write-Host "`n🗑️ Checking for trash/temp files..." -ForegroundColor Yellow
$trashPatterns = @(
    "*.log",
    "*.tmp",
    ".DS_Store",
    "Thumbs.db",
    "*.swp",
    "*~"
)

$foundTrash = $false
foreach ($pattern in $trashPatterns) {
    $files = Get-ChildItem -Path . -Filter $pattern -Recurse -ErrorAction SilentlyContinue
    if ($files) {
        $foundTrash = $true
        Write-Host "   Found $pattern files:" -ForegroundColor Yellow
        $files | ForEach-Object { Write-Host "      $_" -ForegroundColor Gray }
    }
}

if (-not $foundTrash) {
    Write-Host "✅ No trash files found" -ForegroundColor Green
}

# 14. Final status check
Write-Host "`n📊 Final Repository Status:" -ForegroundColor Yellow
git status

# 15. Push everything to main
Write-Host "`n⬆️ Pushing to main..." -ForegroundColor Yellow
git push origin main

Write-Host "`n✅ GitHub Cleanup Complete!" -ForegroundColor Green
Write-Host "`n📋 Summary:" -ForegroundColor Cyan
Write-Host "   - Merged branches deleted" -ForegroundColor White
Write-Host "   - Untracked files cleaned (if confirmed)" -ForegroundColor White
Write-Host "   - Remote branches pruned" -ForegroundColor White
Write-Host "   - Documentation verified" -ForegroundColor White
Write-Host "   - Everything pushed to main" -ForegroundColor White

Write-Host "`n🎉 Your repository is now clean and organized!`n" -ForegroundColor Green

