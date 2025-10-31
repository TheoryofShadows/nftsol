# 🎯 Echo API Test Master Menu
# Interactive menu for all Echo API testing tools

function Show-Header {
    Clear-Host
    Write-Host ""
    Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "         🎬 Echo API Testing & Validation Suite" -ForegroundColor Cyan
    Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  Your Echo API is working! ✨" -ForegroundColor Green
    Write-Host "  Platform Wallet: 6133iAoisDPsgbttQCXEZhz77rxNoG3sfdx8Pop1zC1v" -ForegroundColor Gray
    Write-Host ""
}

function Show-Menu {
    Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "  What would you like to do?" -ForegroundColor White
    Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  [1] 🚀 Run Exact Commands (from your request)" -ForegroundColor Yellow
    Write-Host "      → Mint + Add Echo with valid wallet" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  [2] ✅ Validate Wallet Address" -ForegroundColor Yellow
    Write-Host "      → Check if a Solana address is valid" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  [3] 🧪 Comprehensive Test Suite" -ForegroundColor Yellow
    Write-Host "      → 3 tests: Mint, Add Echo, Add JSON Echo" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  [4] ⚡ Quick Test" -ForegroundColor Yellow
    Write-Host "      → Fast mint + add echo test" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  [5] 📚 View Documentation" -ForegroundColor Yellow
    Write-Host "      → Open guides and API docs" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  [6] 🔍 Check Server Status" -ForegroundColor Yellow
    Write-Host "      → Test if server is running" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  [7] 📖 Show Example Commands" -ForegroundColor Yellow
    Write-Host "      → Display ready-to-copy commands" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  [Q] ❌ Quit" -ForegroundColor Red
    Write-Host ""
    Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
}

function Test-ServerStatus {
    Write-Host "`n🔍 Checking server status..." -ForegroundColor Cyan
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000/api/echo/trending?limit=1" -UseBasicParsing -TimeoutSec 3
        Write-Host "✅ Server is RUNNING on port 3000" -ForegroundColor Green
        Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Gray
        return $true
    } catch {
        Write-Host "❌ Server is NOT running or not accessible" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
        Write-Host ""
        Write-Host "💡 To start the server:" -ForegroundColor Yellow
        Write-Host "   node apps/backend/dist/index.js" -ForegroundColor Cyan
        return $false
    }
}

function Show-ExampleCommands {
    Write-Host ""
    Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "  📖 Example Commands" -ForegroundColor White
    Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    
    $wallet = "6133iAoisDPsgbttQCXEZhz77rxNoG3sfdx8Pop1zC1v"
    
    Write-Host "🔑 Wallet Address:" -ForegroundColor Yellow
    Write-Host "   `$WALLET = `"$wallet`"" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "🎬 Mint Echo NFT:" -ForegroundColor Yellow
    Write-Host @"
   Invoke-WebRequest http://localhost:3000/api/echo/mint ``
     -Method POST -ContentType application/json ``
     -Body (@{ iaId = "apollo11"; walletAddress = `$WALLET } | ConvertTo-Json)
"@ -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "✍️ Add Echo:" -ForegroundColor Yellow
    Write-Host @"
   Invoke-WebRequest http://localhost:3000/api/echo/add ``
     -Method POST -ContentType application/json ``
     -Body (@{ 
       ledgerId = "TEST_LEDGER"
       echoData = "First echo"
       echoType = "Text"
       contributorWallet = `$WALLET 
     } | ConvertTo-Json)
"@ -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "🔍 Search Internet Archive:" -ForegroundColor Yellow
    Write-Host "   Invoke-WebRequest 'http://localhost:3000/api/echo/search?q=apollo&rows=5'" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "📊 Get Trending:" -ForegroundColor Yellow
    Write-Host "   Invoke-WebRequest 'http://localhost:3000/api/echo/trending?limit=10'" -ForegroundColor Cyan
    Write-Host ""
}

function Show-Documentation {
    Write-Host ""
    Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "  📚 Documentation Files" -ForegroundColor White
    Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "Available documentation:" -ForegroundColor Yellow
    Write-Host "  1. ECHO_SOLUTION_SUMMARY.md" -ForegroundColor Cyan
    Write-Host "     → Problem solved explanation" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  2. ECHO_TEST_README.md" -ForegroundColor Cyan
    Write-Host "     → Quick reference guide" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  3. ECHO_API_TESTING_GUIDE.md" -ForegroundColor Cyan
    Write-Host "     → Complete API documentation" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "Which file would you like to open? (1-3, or Enter to skip): " -NoNewline -ForegroundColor White
    $choice = Read-Host
    
    switch ($choice) {
        "1" { notepad "ECHO_SOLUTION_SUMMARY.md" }
        "2" { notepad "ECHO_TEST_README.md" }
        "3" { notepad "ECHO_API_TESTING_GUIDE.md" }
    }
}

# Main loop
do {
    Show-Header
    Show-Menu
    
    Write-Host "Enter your choice (1-7, Q to quit): " -NoNewline -ForegroundColor White
    $choice = Read-Host
    
    switch ($choice.ToUpper()) {
        "1" {
            Write-Host ""
            Write-Host "Running exact commands..." -ForegroundColor Cyan
            & ".\test-exact-commands.ps1"
            Write-Host "`nPress Enter to continue..." -ForegroundColor Gray
            Read-Host
        }
        "2" {
            Write-Host ""
            & ".\validate-wallet.ps1"
            Write-Host "`nPress Enter to continue..." -ForegroundColor Gray
            Read-Host
        }
        "3" {
            Write-Host ""
            Write-Host "Running comprehensive test suite..." -ForegroundColor Cyan
            & ".\test-echo-api.ps1"
            Write-Host "`nPress Enter to continue..." -ForegroundColor Gray
            Read-Host
        }
        "4" {
            Write-Host ""
            Write-Host "Running quick test..." -ForegroundColor Cyan
            & ".\test-echo-quick.ps1"
            Write-Host "`nPress Enter to continue..." -ForegroundColor Gray
            Read-Host
        }
        "5" {
            Show-Documentation
            Write-Host "`nPress Enter to continue..." -ForegroundColor Gray
            Read-Host
        }
        "6" {
            Test-ServerStatus
            Write-Host "`nPress Enter to continue..." -ForegroundColor Gray
            Read-Host
        }
        "7" {
            Show-ExampleCommands
            Write-Host "`nPress Enter to continue..." -ForegroundColor Gray
            Read-Host
        }
        "Q" {
            Write-Host ""
            Write-Host "Thanks for using Echo API Testing Suite! 👋" -ForegroundColor Green
            Write-Host ""
            break
        }
        default {
            Write-Host ""
            Write-Host "Invalid choice. Please enter 1-7 or Q." -ForegroundColor Red
            Start-Sleep -Seconds 2
        }
    }
} while ($choice.ToUpper() -ne "Q")
