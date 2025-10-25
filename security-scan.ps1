# Comprehensive Security Scan Script
Write-Host "🔍 Running comprehensive security scan..." -ForegroundColor Green

# Function to run npm audit
function Run-NpmAudit {
    param([string]$Path)
    
    Write-Host "🔍 Scanning $Path..." -ForegroundColor Cyan
    Push-Location $Path
    
    try {
        $auditResult = npm audit --json 2>$null
        if ($auditResult) {
            $audit = $auditResult | ConvertFrom-Json
            if ($audit.vulnerabilities) {
                Write-Host "❌ Vulnerabilities found in $Path" -ForegroundColor Red
                foreach ($vuln in $audit.vulnerabilities.PSObject.Properties) {
                    Write-Host "   - $($vuln.Name): $($vuln.Value.severity)" -ForegroundColor Yellow
                }
            } else {
                Write-Host "✅ No vulnerabilities in $Path" -ForegroundColor Green
            }
        }
    } catch {
        Write-Host "⚠️ Could not scan $Path" -ForegroundColor Yellow
    }
    
    Pop-Location
}

# Scan all package.json locations
Run-NpmAudit "."
Run-NpmAudit "server"
Run-NpmAudit "client"

# Check for outdated dependencies
Write-Host "🔍 Checking for outdated dependencies..." -ForegroundColor Cyan
npm outdated 2>$null

Write-Host "✅ Security scan complete" -ForegroundColor Green
