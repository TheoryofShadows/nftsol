# Echo API Testing Guide

## Quick Start

Your Echo API is configured and ready to test! Here's everything you need to know.

## ✅ Valid Wallet Address

From your `.env` file:
```
PLATFORM_PUBLIC_KEY=6133iAoisDPsgbttQCXEZhz77rxNoG3sfdx8Pop1zC1v
```

This is a **valid 44-character Solana public key** that will work with the API.

## 🚀 Running the Tests

### Option 1: Comprehensive Test Suite
```powershell
.\test-echo-api.ps1
```
This runs 3 tests:
1. Mint an Echo NFT
2. Add a basic echo
3. Add an echo with custom JSON metadata

### Option 2: Quick Test
```powershell
.\test-echo-quick.ps1
```
This runs just the mint and add endpoints quickly.

### Option 3: Manual Testing

#### Test Mint Endpoint
```powershell
$WALLET = "6133iAoisDPsgbttQCXEZhz77rxNoG3sfdx8Pop1zC1v"

Invoke-WebRequest http://localhost:3000/api/echo/mint `
  -Method POST -ContentType application/json `
  -Body (@{ iaId = "apollo11"; walletAddress = $WALLET } | ConvertTo-Json)
```

#### Test Add Echo Endpoint
```powershell
$WALLET = "6133iAoisDPsgbttQCXEZhz77rxNoG3sfdx8Pop1zC1v"

Invoke-WebRequest http://localhost:3000/api/echo/add `
  -Method POST -ContentType application/json `
  -Body (@{ 
    ledgerId = "TEST_LEDGER"
    echoData = "First echo"
    echoType = "Text"
    contributorWallet = $WALLET 
  } | ConvertTo-Json)
```

## 📋 API Endpoints

### 1. Search Internet Archive
```
GET /api/echo/search?q=apollo&rows=10
```

### 2. Mint Echo NFT
```
POST /api/echo/mint
Body: {
  "iaId": "apollo11",
  "walletAddress": "6133iAoisDPsgbttQCXEZhz77rxNoG3sfdx8Pop1zC1v"
}
```

### 3. Add Echo
```
POST /api/echo/add
Body: {
  "ledgerId": "TEST_LEDGER",
  "echoData": "Your echo text here",
  "echoType": "Text",
  "contributorWallet": "6133iAoisDPsgbttQCXEZhz77rxNoG3sfdx8Pop1zC1v"
}
```

### 4. Get Ledger Echoes
```
GET /api/echo/:ledgerId
```

### 5. Verify Ledger
```
POST /api/echo/verify
Body: {
  "ledgerId": "TEST_LEDGER"
}
```

### 6. Get Trending
```
GET /api/echo/trending?limit=10
```

### 7. Get User Stats
```
GET /api/echo/stats/:wallet
```

## 🔍 Understanding the Validation

The API validates wallet addresses using Solana's `PublicKey` constructor:

```typescript
z.string().refine(val => {
  try {
    new PublicKey(val);
    return true;
  } catch {
    return false;
  }
}, 'Invalid wallet address')
```

**Valid Solana addresses must be:**
- 43-44 characters long
- Base58 encoded
- Valid according to Solana's key format

**Invalid examples that will fail:**
- `"111...EEE"` - Not a real key
- `"<YOUR_SOLANA_PUBKEY>"` - Placeholder text
- `"test123"` - Too short
- Empty strings or undefined

## 🎯 Getting Your Own Wallet Address

### Phantom Wallet
1. Open Phantom extension
2. Click on your wallet name at the top
3. Click "Copy Address"
4. Use this address in the tests

### Backpack Wallet
1. Open Backpack extension
2. Click on your profile
3. Click "Copy Address"
4. Use this address in the tests

### Solflare Wallet
1. Open Solflare
2. Click on your wallet address
3. It will be copied automatically

## 🔧 Troubleshooting

### Error: "Invalid wallet address"
- Make sure you're using a real Solana public key (43-44 chars)
- Don't use placeholder values like `111...EEE`
- Verify the address is base58 encoded

### Error: "Connection refused" or "404 on /healthz"
- This is normal if `/healthz` isn't implemented
- The Echo API runs on port 3000 by default
- Make sure your server is running: `node apps/backend/dist/index.js`

### Error: "Item not found on Internet Archive"
- The `iaId` must be a valid Internet Archive identifier
- Try: `apollo11`, `bigbuckbunny`, `night-of-the-living-dead`

### Rate Limiting
The API has rate limits:
- Search: 20 requests/minute
- Mint: 10 requests/minute
- Echo operations: 30 requests/minute

If you hit the limit, wait a minute and try again.

## 📦 What Each Test Does

### Mint Test
1. Validates your wallet address
2. Fetches metadata from Internet Archive
3. Runs Grok verification on the content
4. Returns data needed for NFT minting

### Add Echo Test
1. Validates your wallet address
2. Verifies the echo content with Grok
3. Stores the echo in the ledger
4. Awards CLOUT tokens for verified echoes

## 🎨 Example Responses

### Successful Mint
```json
{
  "success": true,
  "iaId": "apollo11",
  "title": "Apollo 11 Moon Landing",
  "videoUri": "https://archive.org/download/apollo11/apollo11.mp4",
  "truthScore": 92,
  "verified": true,
  "teaser": "Highly verified"
}
```

### Successful Echo Add
```json
{
  "success": true,
  "echoId": "TEST_LEDGER:1730317200000",
  "verified": true,
  "verificationScore": 85,
  "message": "✨ Echo added and verified! CLOUT boost applied."
}
```

## 🚀 Next Steps

1. Run `.\test-echo-api.ps1` to test all endpoints
2. Check the responses for any errors
3. If successful, integrate with your frontend
4. Connect a real Phantom/Backpack wallet for production testing

## 📚 Additional Resources

- [Solana Web3.js Docs](https://solana-labs.github.io/solana-web3.js/)
- [Internet Archive API](https://archive.org/help/aboutsearch.htm)
- [Echo API Source](./apps/backend/src/routes/echo.ts)
