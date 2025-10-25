# Access Log Monitoring Script
param(
    [int]$Minutes = 60
)

Write-Host "📊 Monitoring access logs for last $Minutes minutes..." -ForegroundColor Green

# Check for suspicious activity
$suspiciousPatterns = @(
    "admin",
    "login",
    "password",
    "sql",
    "script",
    "eval",
    "exec",
    "union",
    "select",
    "drop",
    "delete",
    "insert",
    "update"
)

$logFile = "access.log"
if (Test-Path $logFile) {
    $recentLogs = Get-Content $logFile | Where-Object { 
        $_.Split(' ')[3] -gt (Get-Date).AddMinutes(-$Minutes).ToString("dd/MMM/yyyy:HH:mm:ss")
    }
    
    foreach ($pattern in $suspiciousPatterns) {
        $matches = $recentLogs | Where-Object { $_ -match $pattern }
        if ($matches) {
            Write-Host "🚨 Suspicious activity detected: $pattern" -ForegroundColor Red
            $matches | ForEach-Object { Write-Host "   $_" -ForegroundColor Yellow }
        }
    }
} else {
    Write-Host "⚠️ No access log file found" -ForegroundColor Yellow
}

Write-Host "✅ Access monitoring complete" -ForegroundColor Green
