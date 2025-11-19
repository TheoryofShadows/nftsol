# 🚀 Quick Funding Guide for Platform Wallet

## Platform Wallet Address
```
3XEs3MJ8PFiqTTqrK6RAkK9vt95jQQ1hKNNKHiE6jJ3o
```

## ⚡ Fastest Method: Phantom/Solflare Wallet

### Step-by-Step:

1. **Open Phantom Wallet** (or Solflare)
   - Make sure you're on **Mainnet** (not Devnet)

2. **Click "Send"**
   - Look for the Send button in your wallet

3. **Paste the wallet address:**
   ```
   3XEs3MJ8PFiqTTqrK6RAkK9vt95jQQ1hKNNKHiE6jJ3o
   ```

4. **Enter amount:**
   - Minimum: **0.02 SOL** (for 1 mint)
   - Recommended: **0.1 SOL** (for ~5 mints)
   - Safe: **0.2 SOL** (for ~10 mints)

5. **Review and Send**
   - Double-check the address
   - Confirm the transaction
   - Wait ~30 seconds for confirmation

## 💰 Cost Estimate (at ~$150/SOL)
- 0.02 SOL = ~$3.00 USD
- 0.1 SOL = ~$15.00 USD  
- 0.2 SOL = ~$30.00 USD

## ✅ After Sending

Run this command to verify funding:
```bash
cd apps/backend
npx ts-node check-funding.ts
```

Or use the monitor script to auto-test when funded:
```bash
npx ts-node monitor-and-test.ts <your-wallet-address>
```

## 🔍 Verify Transaction

Check on Solana Explorer:
```
https://explorer.solana.com/address/3XEs3MJ8PFiqTTqrK6RAkK9vt95jQQ1hKNNKHiE6jJ3o
```

## ⚠️ Important Notes

- Make sure you're sending to **MAINNET** (not devnet)
- Double-check the wallet address before sending
- Keep at least 0.02 SOL for transaction fees
- Each NFT mint costs ~0.01-0.02 SOL in fees

