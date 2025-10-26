# 💰 Wallet Funding API Documentation

## Overview

The Wallet Funding API allows you to fund Solana wallets with SOL using either:
- **Airdrops** (devnet/testnet)
- **Treasury transfers** (mainnet)

## Base URL

```
Production: https://nftsol-server-prod.onrender.com
Local: http://localhost:3000
```

## Endpoints

### 1. Fund a Wallet

Fund a wallet with SOL.

**Endpoint:** `POST /api/wallet/fund`

**Request Body:**
```json
{
  "walletAddress": "4mUWjVdfVWP9TT5wT9x2P2Uhd8NQgzWXXMGKM8xxmM9E",
  "amount": 0.1,
  "fundingSource": "airdrop"
}
```

**Parameters:**
- `walletAddress` (string, required): The Solana wallet address to fund
- `amount` (number, required): Amount of SOL to send (max 10 SOL per request)
- `fundingSource` (string, optional): Either `"airdrop"` or `"treasury"`. Defaults to `"airdrop"` on devnet and `"treasury"` on mainnet

**Response:**
```json
{
  "success": true,
  "signature": "5j7sxN...",
  "balance": 0.1,
  "message": "Successfully funded wallet with 0.1 SOL"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Amount must be greater than 0"
}
```

**Example using cURL:**
```bash
curl -X POST https://nftsol-server-prod.onrender.com/api/wallet/fund \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "4mUWjVdfVWP9TT5wT9x2P2Uhd8NQgzWXXMGKM8xxmM9E",
    "amount": 0.1,
    "fundingSource": "airdrop"
  }'
```

---

### 2. Get Wallet Balance

Get the SOL balance of a specific wallet.

**Endpoint:** `GET /api/wallet/balance/:walletAddress`

**Parameters:**
- `walletAddress` (path parameter): The Solana wallet address

**Response:**
```json
{
  "success": true,
  "balance": 0.5,
  "walletAddress": "4mUWjVdfVWP9TT5wT9x2P2Uhd8NQgzWXXMGKM8xxmM9E"
}
```

**Example using cURL:**
```bash
curl https://nftsol-server-prod.onrender.com/api/wallet/balance/4mUWjVdfVWP9TT5wT9x2P2Uhd8NQgzWXXMGKM8xxmM9E
```

---

### 3. Get Funding Wallet Status

Check if the funding wallet is configured and its balance.

**Endpoint:** `GET /api/wallet/funding-status`

**Response:**
```json
{
  "success": true,
  "available": true,
  "balance": 100.5
}
```

**Example using cURL:**
```bash
curl https://nftsol-server-prod.onrender.com/api/wallet/funding-status
```

---

## How It Works

### Devnet/Testnet
- Uses native Solana airdrop functionality
- Free and unlimited (within fair use)
- Only works on devnet/testnet networks
- No configuration needed

### Mainnet
- Requires a funding wallet with SOL balance
- Transfers SOL from treasury wallet
- Requires `FUNDING_WALLET_SECRET` environment variable
- Secure keypair management

---

## Configuration

### Environment Variables

Add to your `.env` file:

```bash
# Funding wallet secret key (base58 encoded)
# Only needed for mainnet treasury transfers
FUNDING_WALLET_SECRET=your-base58-encoded-secret-key-here

# Solana cluster
SOLANA_CLUSTER=mainnet-beta
```

### Generating a Funding Wallet

If you need to create a funding wallet for mainnet:

```javascript
const { Keypair } = require('@solana/web3.js');
const bs58 = require('bs58');

// Generate new keypair
const keypair = Keypair.generate();

// Get secret key in base58 format
const secretKey = bs58.encode(keypair.secretKey);
console.log('Secret Key:', secretKey);
console.log('Public Key:', keypair.publicKey.toString());

// Add secret key to your .env file as FUNDING_WALLET_SECRET
```

---

## Use Cases

### 1. New User Onboarding
Fund new user wallets so they can start using the platform:

```javascript
const response = await fetch('/api/wallet/fund', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    walletAddress: userWalletAddress,
    amount: 0.1,
    fundingSource: 'airdrop'
  })
});
```

### 2. Testing on Devnet
Fund test wallets for development:

```bash
curl -X POST http://localhost:3000/api/wallet/fund \
  -H "Content-Type: application/json" \
  -d '{"walletAddress": "YOUR_TEST_WALLET", "amount": 1}'
```

### 3. Mainnet Treasury Management
Transfer from treasury for production users:

```javascript
const response = await fetch('/api/wallet/fund', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    walletAddress: userWalletAddress,
    amount: 0.5,
    fundingSource: 'treasury'
  })
});
```

---

## Security Considerations

1. **Rate Limiting**: All endpoints are rate limited to prevent abuse
2. **Amount Limits**: Maximum 10 SOL per transaction
3. **Treasury Wallet**: Keep the funding wallet secure and funded appropriately
4. **Monitoring**: Monitor funding wallet balance regularly
5. **Access Control**: Consider adding authentication/authorization for production

---

## Troubleshooting

### "Account does not exist" Error
This is normal for new wallets. They will exist after the first transaction/funding.

### Airdrop Fails on Mainnet
Airdrops only work on devnet/testnet. Use `fundingSource: "treasury"` for mainnet.

### Funding Wallet Not Configured
Set `FUNDING_WALLET_SECRET` environment variable with your wallet's base58-encoded secret key.

### Transaction Timeout
Network congestion may cause delays. The API waits for confirmation before responding.

---

## Example: Complete Flow

```javascript
// 1. Check funding wallet status
const statusResponse = await fetch('/api/wallet/funding-status');
const status = await statusResponse.json();
console.log('Funding wallet available:', status.available);
console.log('Balance:', status.balance, 'SOL');

// 2. Fund a wallet
const fundResponse = await fetch('/api/wallet/fund', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    walletAddress: '4mUWjVdfVWP9TT5wT9x2P2Uhd8NQgzWXXMGKM8xxmM9E',
    amount: 0.1,
    fundingSource: 'airdrop'
  })
});
const fundResult = await fundResponse.json();
console.log('Funding result:', fundResult);

// 3. Verify balance
const balanceResponse = await fetch('/api/wallet/balance/4mUWjVdfVWP9TT5wT9x2P2Uhd8NQgzWXXMGKM8xxmM9E');
const balance = await balanceResponse.json();
console.log('New balance:', balance.balance, 'SOL');
```

---

## Support

For issues or questions, contact the development team or check the main project documentation.
