# 🗑️ Delete Old/Redundant Branches Script
# CAUTION: This will delete branches! Review carefully before running.

Write-Host "`n⚠️  BRANCH DELETION SCRIPT ⚠️`n" -ForegroundColor Red
Write-Host "This script will help you delete old, merged, or redundant branches.`n" -ForegroundColor Yellow

# Fetch latest
Write-Host "🔄 Fetching latest from remote..." -ForegroundColor Cyan
git fetch --all --prune

# Switch to main
Write-Host "🔀 Switching to main..." -ForegroundColor Cyan
git checkout main
git pull origin main

# List all local branches
Write-Host "`n📋 All Local Branches:" -ForegroundColor Cyan
git branch -vv

# List all remote branches
Write-Host "`n📋 All Remote Branches:" -ForegroundColor Cyan
git branch -r

# Find merged branches
Write-Host "`n🔍 Finding branches merged into main..." -ForegroundColor Cyan
$mergedBranches = git branch --merged main | Where-Object { 
    $_ -notmatch "main|develop|\*" -and $_.Trim() -ne "" 
}

if ($mergedBranches) {
    Write-Host "`n📌 Merged branches that can be deleted:" -ForegroundColor Yellow
    $mergedBranches | ForEach-Object { Write-Host "   - $($_.Trim())" -ForegroundColor Gray }
    
    $response = Read-Host "`nDelete all these merged local branches? (y/N)"
    if ($response -eq 'y' -or $response -eq 'Y') {
        foreach ($branch in $mergedBranches) {
            $branchName = $branch.Trim()
            if ($branchName) {
                Write-Host "   Deleting: $branchName" -ForegroundColor Red
                git branch -D $branchName
            }
        }
        Write-Host "✅ Merged local branches deleted" -ForegroundColor Green
    }
} else {
    Write-Host "✅ No merged branches to delete" -ForegroundColor Green
}

# Find stale remote branches
Write-Host "`n🔍 Checking for stale remote branches..." -ForegroundColor Cyan
$remoteBranches = git branch -r | Where-Object { 
    $_ -notmatch "origin/main|origin/develop|origin/HEAD" -and $_.Trim() -ne "" 
}

if ($remoteBranches) {
    Write-Host "`n📌 Remote branches:" -ForegroundColor Yellow
    $remoteBranches | ForEach-Object { Write-Host "   - $($_.Trim())" -ForegroundColor Gray }
    
    Write-Host "`n⚠️  WARNING: Deleting remote branches affects all collaborators!" -ForegroundColor Red
    $response = Read-Host "Do you want to delete these remote branches? (y/N)"
    
    if ($response -eq 'y' -or $response -eq 'Y') {
        foreach ($branch in $remoteBranches) {
            $branchName = $branch.Trim() -replace "origin/", ""
            if ($branchName) {
                Write-Host "   Deleting remote: $branchName" -ForegroundColor Red
                git push origin --delete $branchName
            }
        }
        Write-Host "✅ Remote branches deleted" -ForegroundColor Green
    }
} else {
    Write-Host "✅ No remote branches to delete" -ForegroundColor Green
}

# Prune remote tracking branches
Write-Host "`n🧹 Pruning stale remote-tracking branches..." -ForegroundColor Cyan
git remote prune origin

# Final status
Write-Host "`n📊 Final Branch Status:" -ForegroundColor Cyan
Write-Host "Local branches:" -ForegroundColor Yellow
git branch

Write-Host "`nRemote branches:" -ForegroundColor Yellow
git branch -r

Write-Host "`n✅ Branch cleanup complete!`n" -ForegroundColor Green

