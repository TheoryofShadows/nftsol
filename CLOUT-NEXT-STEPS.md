# 🎯 CLOUT Integration - Next Steps

## ✅ What's Done
- [x] CLOUT token mint address configured
- [x] Rewards vault address configured  
- [x] Platform keypair loaded
- [x] ATA auto-creation utility created
- [x] Server running with CLOUT config

## 📋 Next Steps to Actually Use CLOUT

### 1. **Create CLOUT Reward Service** (High Priority)
Create a service to send CLOUT tokens to users.

**File to create:** `apps/backend/src/services/clout-rewards.ts`

```typescript
import { Connection, Keypair, PublicKey, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';
import { 
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  getOrCreateAssociatedTokenAccount,
  transfer,
  getMint,
  TOKEN_PROGRAM_ID
} from '@solana/spl-token';
import { connection, getPlatformKeypair } from '../lib/solana.js';
import { programConfig } from '../config/index.js';
import { getOrCreateCloutVault } from '../utils/clout-vault.js';

export async function sendCloutReward(
  recipientAddress: string,
  amount: number // Amount in CLOUT tokens (will be converted using decimals)
): Promise<{ success: boolean; txSignature?: string; error?: string }> {
  try {
    const platformKeypair = getPlatformKeypair();
    if (!platformKeypair) {
      return { success: false, error: 'Platform keypair not configured' };
    }

    const mint = new PublicKey(programConfig.cloutProgramId);
    const recipient = new PublicKey(recipientAddress);
    
    // Get mint info for decimals
    const mintInfo = await getMint(connection, mint);
    const amountLamports = BigInt(amount) * BigInt(10 ** mintInfo.decimals);

    // Ensure rewards vault exists
    const rewardsVault = await getOrCreateCloutVault(connection, platformKeypair);

    // Get or create recipient's ATA
    const recipientATA = await getOrCreateAssociatedTokenAccount(
      connection,
      platformKeypair, // payer
      mint,
      recipient
    );

    // Transfer CLOUT from vault to recipient
    const txSignature = await transfer(
      connection,
      platformKeypair, // payer
      rewardsVault,
      recipientATA.address,
      platformKeypair, // owner of rewards vault
      amountLamports
    );

    return { success: true, txSignature };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
```

### 2. **Create CLOUT Rewards API Endpoint**
Add endpoint to send CLOUT rewards.

**File to modify:** `apps/backend/src/routes/clout.ts` (create new file)

```typescript
import express from 'express';
import { sendCloutReward } from '../services/clout-rewards.js';
import { validateWallet } from '../utils/validation.js';
import { authenticate } from '../middleware/auth.js'; // if you have auth

const router = express.Router();

// POST /api/clout/reward
// Body: { recipientAddress: string, amount: number }
router.post('/reward', authenticate, validateWallet, async (req, res) => {
  try {
    const { recipientAddress, amount } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid amount'
      });
    }

    const result = await sendCloutReward(recipientAddress, amount);
    
    if (result.success) {
      res.json({
        success: true,
        txSignature: result.txSignature,
        message: `Sent ${amount} CLOUT to ${recipientAddress}`
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to send CLOUT reward'
    });
  }
});

export default router;
```

### 3. **Mount CLOUT Routes**
Add to `apps/backend/src/index.ts`:

```typescript
import cloutRouter from './routes/clout.js';

// ... existing code ...

app.use('/api/clout', cloutRouter);
```

### 4. **Fund Rewards Vault**
Before you can send CLOUT, you need CLOUT tokens in the rewards vault.

**Options:**
- Transfer CLOUT from your wallet to the rewards vault address
- Use Raydium/Solana DEX to swap SOL for CLOUT
- Mint CLOUT (if you have mint authority)

### 5. **Integrate with Existing Features**
Connect CLOUT rewards to your existing features:

- **Echo Verification Rewards** (already referenced in echo.ts)
- **NFT Minting Rewards**
- **Marketplace Trading Rewards**
- **User Engagement Rewards**

### 6. **Frontend Integration**
Add CLOUT balance display and reward notifications to your frontend.

**Frontend tasks:**
- Display user's CLOUT balance
- Show pending rewards
- Display reward history
- Add CLOUT to wallet integration

## 🧪 Testing Checklist

- [ ] Test CLOUT reward sending endpoint
- [ ] Verify ATA creation works automatically
- [ ] Test with insufficient vault balance
- [ ] Test with invalid recipient addresses
- [ ] Verify transactions on Solana explorer
- [ ] Test frontend CLOUT display

## 📚 Resources

- **Solana SPL Token Docs:** https://spl.solana.com/token
- **Your CLOUT Token:** https://solscan.io/token/62hWQAgAV4jugHSuZsMqzxZNVXaVLrbRpz3Sw58Z64Mw
- **Rewards Vault:** 2KkNwFZbznAtYX1xjVS6e5BBqQnfaBuTjn42G4zJXAps

## ⚠️ Important Notes

1. **ATA Creation:** Will happen automatically on first reward send (no manual creation needed)
2. **Vault Funding:** You must have CLOUT tokens in the rewards vault before sending rewards
3. **Gas Fees:** Each transaction costs ~0.000005 SOL in fees
4. **Rate Limiting:** Consider adding rate limits to prevent abuse

## 🎉 Priority Order

1. **High:** Create `clout-rewards.ts` service (send tokens)
2. **High:** Create `/api/clout/reward` endpoint
3. **Medium:** Fund the rewards vault with CLOUT tokens
4. **Medium:** Integrate with Echo rewards (already referenced)
5. **Low:** Frontend CLOUT display
6. **Low:** Reward history tracking

---

**Ready to start?** I can help you create the CLOUT rewards service and endpoint right now!

