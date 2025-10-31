# 🎯 Echo API Testing - Quick Reference

Your Echo API is working! The 400 errors were due to invalid wallet strings. This guide shows you how to test with **real Solana public keys**.

## ⚡ Quick Start (30 seconds)

```powershell
# 1. Validate your wallet address
.\validate-wallet.ps1

# 2. Run the tests
.\test-echo-api.ps1
```

Done! ✅

## 📝 What You Have

### Valid Wallet Address
```
6133iAoisDPsgbttQCXEZhz77rxNoG3sfdx8Pop1zC1v
```
This is your platform wallet from `.env` - it's a **valid 44-character Solana public key**.

### Test Scripts Created
1. **`validate-wallet.ps1`** - Validate any Solana address before testing
2. **`test-echo-api.ps1`** - Comprehensive test suite (3 tests)
3. **`test-echo-quick.ps1`** - Quick test (2 tests)

### Documentation
- **`ECHO_API_TESTING_GUIDE.md`** - Complete API documentation with examples

## 🎬 Step-by-Step Testing

### Step 1: Make sure your server is running
```powershell
# Start the backend server
node apps/backend/dist/index.js

# Or if you have a start script
npm run start
```

The server should be running on `http://localhost:3000`

### Step 2: Validate your wallet (optional but recommended)
```powershell
.\validate-wallet.ps1
```

This checks if your wallet address is valid before sending requests.

### Step 3: Run the comprehensive tests
```powershell
.\test-echo-api.ps1
```

This will test:
1. ✨ **Mint Echo NFT** - Creates NFT data from Internet Archive
2. ✨ **Add Basic Echo** - Adds a text echo to a ledger
3. ✨ **Add JSON Echo** - Adds structured data with metadata

### Step 4: Check the results

Look for responses like this:

**✅ Success:**
```json
{
  "success": true,
  "iaId": "apollo11",
  "title": "Apollo 11 Moon Landing",
  "truthScore": 92,
  "verified": true
}
```

**❌ If you see errors:**
```json
{
  "success": false,
  "error": "Invalid wallet address"
}
```
→ The wallet address isn't valid. Run `.\validate-wallet.ps1` to check it.

## 🔑 Using Your Own Wallet

### Option 1: Copy from Phantom/Backpack
1. Open your wallet extension
2. Click "Copy Address"
3. Edit the test scripts and replace `$WALLET` with your address

### Option 2: Generate a new keypair (for testing only)
```powershell
# Install Solana CLI if needed
solana-keygen new

# Get your public key
solana-keygen pubkey ~/.config/solana/id.json
```

## 📚 API Endpoints Reference

### All Available Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/echo/search` | GET | Search Internet Archive |
| `/api/echo/mint` | POST | Prepare NFT mint data |
| `/api/echo/add` | POST | Add echo to ledger |
| `/api/echo/:ledgerId` | GET | Get all echoes in ledger |
| `/api/echo/verify` | POST | Re-verify ledger |
| `/api/echo/trending` | GET | Get trending echoes |
| `/api/echo/stats/:wallet` | GET | Get user statistics |

### Example: Manual Test with cURL

```bash
# Mint
curl -X POST http://localhost:3000/api/echo/mint \
  -H "Content-Type: application/json" \
  -d '{
    "iaId": "apollo11",
    "walletAddress": "6133iAoisDPsgbttQCXEZhz77rxNoG3sfdx8Pop1zC1v"
  }'

# Add Echo
curl -X POST http://localhost:3000/api/echo/add \
  -H "Content-Type: application/json" \
  -d '{
    "ledgerId": "TEST_LEDGER",
    "echoData": "First echo",
    "echoType": "Text",
    "contributorWallet": "6133iAoisDPsgbttQCXEZhz77rxNoG3sfdx8Pop1zC1v"
  }'
```

## 🐛 Troubleshooting

### "Connection refused" or "ECONNREFUSED"
**Problem:** Server isn't running
**Solution:** 
```powershell
node apps/backend/dist/index.js
```

### "Invalid wallet address" (400 error)
**Problem:** The wallet string isn't a valid Solana public key
**Solution:**
```powershell
# Validate your address first
.\validate-wallet.ps1

# Common issues:
# ❌ "111...EEE" - Placeholder, not real
# ❌ "<YOUR_WALLET>" - Placeholder text
# ❌ "test123" - Too short
# ✅ "6133iAoisDPsgbttQCXEZhz77rxNoG3sfdx8Pop1zC1v" - Valid!
```

### "Item not found on Internet Archive" (404)
**Problem:** The `iaId` doesn't exist
**Solution:** Use valid Internet Archive IDs like:
- `apollo11`
- `bigbuckbunny`
- `night-of-the-living-dead`

### Rate Limit Errors (429)
**Problem:** Too many requests
**Solution:** Wait 60 seconds, then try again

Rate limits:
- Search: 20 requests/minute
- Mint: 10 requests/minute  
- Echo operations: 30 requests/minute

### "/healthz 404" is fine
The main Echo API runs on port 3000. The `/healthz` endpoint is separate and optional.

## 🎯 What Makes a Valid Solana Address?

### ✅ Valid Address Requirements:
- **Length:** 43-44 characters
- **Encoding:** Base58 (numbers 1-9, letters A-Z, a-z, excluding 0, O, I, l)
- **Format:** No spaces, hyphens, or special characters

### ✅ Valid Examples:
```
6133iAoisDPsgbttQCXEZhz77rxNoG3sfdx8Pop1zC1v  (44 chars) ✅
11111111111111111111111111111111             (32 chars base58) ✅
EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v   (44 chars) ✅
```

### ❌ Invalid Examples:
```
111...EEE                                     (Placeholder) ❌
<YOUR_SOLANA_PUBKEY>                          (Placeholder) ❌
test123                                       (Too short) ❌
0OIl0OIl0OIl0OIl0OIl0OIl0OIl0OIl0OIl0OIl      (Invalid chars) ❌
my-wallet-address                             (Not base58) ❌
```

## 🚀 Next Steps

1. ✅ Run `.\validate-wallet.ps1` to confirm your wallet is valid
2. ✅ Run `.\test-echo-api.ps1` to test all endpoints
3. ✅ Check the responses for success messages
4. ✅ Integrate with your frontend
5. ✅ Deploy and test with real wallets

## 📖 Additional Documentation

- **Full Guide:** `ECHO_API_TESTING_GUIDE.md`
- **API Source:** `apps/backend/src/routes/echo.ts`
- **Validation Schema:** See `mintSchema` and `addEchoSchema` in source

## 💡 Pro Tips

1. **Always validate first** - Run `validate-wallet.ps1` before testing
2. **Use real wallets in production** - The platform wallet is fine for testing, but use Phantom/Backpack for real usage
3. **Watch rate limits** - Don't spam the API, it has limits
4. **Check responses** - Look for `"success": true` in the JSON response
5. **Read error messages** - They'll tell you exactly what's wrong

## ✨ Success Indicators

You'll know it's working when you see:

```powershell
✓ Mint successful!
Status Code: 200

✓ Add echo successful!
Status Code: 200

✓ Add custom echo successful!
Status Code: 200
```

And responses like:
```json
{
  "success": true,
  "verified": true,
  "message": "✨ Echo added and verified! CLOUT boost applied."
}
```

## 🎊 You're Ready!

Your Echo API is configured correctly. The only issue was using placeholder wallet addresses instead of real Solana public keys. Now you have valid addresses and test scripts ready to go!

**Happy testing! 🚀**

---

Questions? Check `ECHO_API_TESTING_GUIDE.md` for detailed documentation.
