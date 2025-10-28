# 🚀 NFTSol Cursor Go-Live Instructions

## **Complete Automated Setup for Real Solana Integration**

### **📋 Prerequisites**
- Node.js v20+ installed
- Backend running locally on port 3000
- Platform wallet funded with devnet SOL

---

## **🎯 Quick Start (3 Steps)**

### **Step 1: Start Backend**
```bash
cd C:\Users\KHK89\NFTSol\apps\backend

# Set environment variables
$env:PLATFORM_SECRET_KEY_BASE58="57gPGZp3tgwnNAPK2GJxYE4kJpeHh75Vg95M4xRDaNswNe37Gv8PwPBX666sfcDgc4sijPRqw4jTyobuNa2ch15L"
$env:SOLANA_RPC_URL="https://api.devnet.solana.com"
$env:NODE_ENV="development"
$env:WITHDRAWALS_ENABLED="true"

# Start server
node dist/index.js
```

### **Step 2: Fund Platform Wallet**
1. Go to: https://faucet.solana.com/
2. Enter wallet: `3EgKZgBNotS5tnYTaWuhEuzS9NLyMQww3C4Vaz5RDhM4`
3. Select 'Devnet' and request SOL
4. Verify on Explorer: https://explorer.solana.com/address/3EgKZgBNotS5tnYTaWuhEuzS9NLyMQww3C4Vaz5RDhM4?cluster=devnet

### **Step 3: Run Go-Live Script**
```bash
# In a new terminal
cd C:\Users\KHK89\NFTSol\apps\backend
node cursor-go-live.js
```

---

## **🧪 What the Script Tests**

### **✅ Complete Integration Testing:**
1. **Health Check** - Server status and Solana connectivity
2. **Programs Check** - All Solana programs loaded
3. **Platform Wallet** - Balance and existence verification
4. **Wallet Verification** - Test wallet validation
5. **NFT Minting** - Real NFT creation on Solana devnet
6. **SOL Withdrawal** - Complete withdrawal workflow
7. **Admin Approval** - Withdrawal approval process
8. **SOL Processing** - Real SOL transfer to user wallet
9. **Final Verification** - Balance confirmation after transfer

### **📊 Expected Output:**
```
🚀 NFTSol Cursor Go-Live Script Starting...
==========================================

🚀 1️⃣ Health Check...
✅ Health Status: HEALTHY
📊 Solana Health: CONNECTED
🔗 RPC URL: https://api.devnet.solana.com

🚀 2️⃣ Programs Endpoint...
✅ Programs Status: LOADED
📋 Program IDs:
   cloutProgramId: CE9VN3Bkh4Mn77GSTdfhf7KNpUKeqpmMX7s8463EFvJE
   marketProgramId: HTs1hErzM8MywaUojfUY7QA1T6gLQD977R3HsCnKj7m7
   loyaltyProgramId: 2TujfT3Czd2ncawJ6ZLmfGeJ2t1Ugb9bqEvxSE2EKoo9
   rewardsVault: EkwwFmeS32L7Lei1vMwF66LCN2RuM7kfNZZ6HCmyvwuN

🚀 3️⃣ Platform Wallet Balance...
✅ Platform Wallet: 3EgKZgBNotS5tnYTaWuhEuzS9NLyMQww3C4Vaz5RDhM4
💰 Balance: 1.5000 SOL
📊 Exists: YES

🚀 4️⃣ Verifying Test Wallet...
✅ Test Wallet: 11111111111111111111111111111112
📊 Exists: YES
✅ Valid: YES

🚀 5️⃣ Test Wallet Balance...
💰 Test Wallet Balance: 0.0000 SOL

🚀 6️⃣ Minting NFT...
✅ NFT Minting: SUCCESS
🎨 Mint Address: [MINT_ADDRESS]
📝 Transaction: [TRANSACTION_SIGNATURE]

🚀 7️⃣ Creating SOL Withdrawal...
✅ Withdrawal Creation: SUCCESS
📊 Status: pending
💰 Amount: 0.01 SOL
🎯 To Address: 11111111111111111111111111111112
🆔 Withdrawal ID: [WITHDRAWAL_ID]

🚀 8️⃣ Approving Withdrawal...
✅ Approval: SUCCESS
📊 Status: approved

🚀 9️⃣ Processing Withdrawal (sending SOL)...
✅ Processing: SUCCESS
📝 Transaction Signature: [TRANSACTION_SIGNATURE]
💰 Amount Sent: 0.01 SOL
🔗 Explorer: https://explorer.solana.com/tx/[SIGNATURE]?cluster=devnet

🚀 🔟 Final Verification...
💰 Final Test Wallet Balance: 0.0100 SOL

✅ Cursor Go-Live Script Completed Successfully!

🎉 NFTSol Platform is 100% Ready for Production!
📋 Next Steps:
1. Fund platform wallet with devnet SOL
2. Deploy to Render with environment variables
3. Test with real user wallets
4. Launch your NFT marketplace!
```

---

## **🔧 Troubleshooting**

### **Common Issues:**

**❌ "Cannot find module 'axios'"**
```bash
npm install axios
```

**❌ "ECONNREFUSED" errors**
- Ensure backend is running on port 3000
- Check if server started successfully

**❌ "Platform wallet has 0 SOL"**
- Fund wallet at https://faucet.solana.com/
- Wait for transaction confirmation

**❌ "NFT minting failed"**
- Check if platform wallet is funded
- Verify Solana devnet connectivity

**❌ "Withdrawal processing failed"**
- Ensure platform wallet has sufficient SOL
- Check withdrawal amount is valid

---

## **🚀 Production Deployment**

### **Render Environment Variables:**
```
SOLANA_RPC_URL=https://api.devnet.solana.com
PLATFORM_SECRET_KEY_BASE58=57gPGZp3tgwnNAPK2GJxYE4kJpeHh75Vg95M4xRDaNswNe37Gv8PwPBX666sfcDgc4sijPRqw4jTyobuNa2ch15L
USE_MOCK=false
WITHDRAWALS_ENABLED=true
DAILY_WITHDRAWAL_LIMIT_SOL=10
MAX_WITHDRAWAL_SOL=5
RATE_LIMIT_WINDOW_MINUTES=15
RATE_LIMIT_MAX_REQUESTS=5
NODE_ENV=production
PORT=3000
```

### **Deployment Steps:**
1. Push code to GitHub
2. Update Render service
3. Set environment variables
4. Deploy and wait for success
5. Fund platform wallet with devnet SOL
6. Run go-live script against live URL

---

## **🎯 Success Criteria**

**✅ All tests pass**
**✅ Platform wallet funded**
**✅ Real NFT minting works**
**✅ Real SOL withdrawals work**
**✅ All transactions visible on Solana Explorer**

**Your NFTSol platform is now 100% ready for production!** 🚀✨
