# PowerShell script to clear linter caches and restart relevant services

Write-Host "Clearing Linter Caches..." -ForegroundColor Cyan

# Clear ESLint cache
Write-Host "`nClearing ESLint cache..." -ForegroundColor Yellow
$eslintCachePath = "client/.eslintcache"
if (Test-Path $eslintCachePath) {
    Remove-Item $eslintCachePath -Force
    Write-Host "[OK] ESLint cache cleared" -ForegroundColor Green
} else {
    Write-Host "[INFO] No ESLint cache found" -ForegroundColor Gray
}

# Clear TypeScript cache
Write-Host "`nClearing TypeScript cache..." -ForegroundColor Yellow
$tsCachePaths = @(
    "client/node_modules/.cache",
    "apps/backend/node_modules/.cache",
    "client/tsconfig.tsbuildinfo",
    "apps/backend/tsconfig.tsbuildinfo"
)

foreach ($path in $tsCachePaths) {
    if (Test-Path $path) {
        Remove-Item $path -Recurse -Force
        Write-Host "[OK] Cleared: $path" -ForegroundColor Green
    }
}

# Clear Vite cache
Write-Host "`nClearing Vite cache..." -ForegroundColor Yellow
$viteCachePath = "client/node_modules/.vite"
if (Test-Path $viteCachePath) {
    Remove-Item $viteCachePath -Recurse -Force
    Write-Host "[OK] Vite cache cleared" -ForegroundColor Green
}

Write-Host "`n[SUCCESS] Cache clearing complete!" -ForegroundColor Green
Write-Host "`n[NEXT STEPS]" -ForegroundColor Cyan
Write-Host "   1. Reload your IDE window (Ctrl+Shift+P -> Reload Window)" -ForegroundColor White
Write-Host "   2. Wait for the linter to re-scan all files" -ForegroundColor White
Write-Host "   3. Check the Problems panel again" -ForegroundColor White
Write-Host "`n   The ErrorBoundary warnings should disappear!" -ForegroundColor Green
Write-Host "   The deploy.yml warnings are expected (see LINTER_WARNINGS_EXPLAINED.md)" -ForegroundColor Yellow
