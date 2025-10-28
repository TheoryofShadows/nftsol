# 🧪 NFTSol Mainnet Verification Test Suite

## **📋 Pre-Mainnet Checklist**

### **Environment Verification**
- [ ] `SOLANA_RPC_URL` set to `https://api.mainnet-beta.solana.com`
- [ ] `PLATFORM_SECRET_KEY_BASE58` configured in Render Secrets
- [ ] `WITHDRAWALS_ENABLED=true`
- [ ] `WITHDRAWALS_PAUSED=false`
- [ ] Platform wallet funded with test SOL

### **System Health Check**
```bash
# Test health endpoint
curl -s https://nftsol-dev.onrender.com/healthz

# Expected response:
# {"success":true,"data":{"status":"healthy",...}}
```

## **🧪 Test 1: Basic System Health**

### **Test Commands**
```bash
# 1. Health check
curl -s https://nftsol-dev.onrender.com/healthz | jq

# 2. Programs endpoint
curl -s https://nftsol-dev.onrender.com/api/programs | jq

# 3. Emergency status
curl -s https://nftsol-dev.onrender.com/api/admin/emergency/status | jq
```

### **Expected Results**
- ✅ Health endpoint returns `{"success": true}`
- ✅ Programs endpoint returns program IDs
- ✅ Emergency status shows `withdrawalsPaused: false`

## **🧪 Test 2: Small Withdrawal Test (0.001 SOL)**

### **Test Data**
```json
{
  "amount_sol": 0.001,
  "to_address": "YOUR_TEST_WALLET_ADDRESS",
  "request_token": "mainnet-test-001"
}
```

### **Test Commands**
```bash
# 1. Create withdrawal
curl -X POST https://nftsol-dev.onrender.com/api/wallets/withdraw \
  -H "Content-Type: application/json" \
  -d '{
    "amount_sol": 0.001,
    "to_address": "YOUR_TEST_WALLET_ADDRESS",
    "request_token": "mainnet-test-001"
  }' | jq

# 2. List pending withdrawals
curl -s https://nftsol-dev.onrender.com/api/admin/withdrawals?status=pending | jq

# 3. Approve withdrawal (replace ID)
curl -X POST https://nftsol-dev.onrender.com/api/admin/withdrawals/WITHDRAWAL_ID/approve | jq

# 4. Process withdrawal (replace ID)
curl -X POST https://nftsol-dev.onrender.com/api/admin/withdrawals/WITHDRAWAL_ID/process | jq
```

### **Expected Results**
- ✅ Withdrawal created with `status: "pending"`
- ✅ Admin can list pending withdrawals
- ✅ Approval changes status to `approved`
- ✅ Processing returns `status: "completed"` and `txSig`

## **🧪 Test 3: Solana Explorer Verification**

### **Check Transaction on Explorer**
1. Copy the `txSig` from the process response
2. Visit: `https://explorer.solana.com/tx/TX_SIGNATURE`
3. Verify:
   - ✅ Transaction shows as "Success"
   - ✅ Amount matches (0.001 SOL)
   - ✅ From address is your platform wallet
   - ✅ To address is your test wallet

### **Database Verification**
```sql
-- Check withdrawal record
SELECT id, status, processed_tx_sig, amount_lamports, created_at
FROM withdrawals
WHERE request_token = 'mainnet-test-001';

-- Expected: status = 'completed', processed_tx_sig is not null
```

## **🧪 Test 4: Emergency Controls Test**

### **Test Emergency Pause**
```bash
# 1. Pause withdrawals
curl -X POST https://nftsol-dev.onrender.com/api/admin/emergency/pause-withdrawals \
  -H "Content-Type: application/json" \
  -d '{"paused": true, "reason": "Testing emergency controls"}'

# 2. Try to create withdrawal (should fail)
curl -X POST https://nftsol-dev.onrender.com/api/wallets/withdraw \
  -H "Content-Type: application/json" \
  -d '{
    "amount_sol": 0.001,
    "to_address": "YOUR_TEST_WALLET_ADDRESS",
    "request_token": "emergency-test"
  }'

# 3. Resume withdrawals
curl -X POST https://nftsol-dev.onrender.com/api/admin/emergency/pause-withdrawals \
  -H "Content-Type: application/json" \
  -d '{"paused": false, "reason": "Resuming normal operations"}'
```

### **Expected Results**
- ✅ Pause command succeeds
- ✅ New withdrawal attempts are rejected with error
- ✅ Resume command succeeds
- ✅ New withdrawals work again

## **🧪 Test 5: Rate Limiting Test**

### **Test Rate Limits**
```bash
# Send 6 rapid requests (limit is 5 per 15 minutes)
for i in {1..6}; do
  curl -X POST https://nftsol-dev.onrender.com/api/wallets/withdraw \
    -H "Content-Type: application/json" \
    -d "{\"amount_sol\":0.001,\"to_address\":\"YOUR_TEST_WALLET_ADDRESS\",\"request_token\":\"rate-test-$i\"}"
  echo "Request $i completed"
done
```

### **Expected Results**
- ✅ First 5 requests succeed
- ✅ 6th request returns rate limit error
- ✅ Error message indicates rate limit exceeded

## **📊 Test Results Summary**

| Test | Status | Notes |
|------|--------|-------|
| System Health | ☐ | All endpoints responding |
| Small Withdrawal | ☐ | 0.001 SOL test successful |
| Solana Explorer | ☐ | Transaction visible on explorer |
| Emergency Controls | ☐ | Pause/resume working |
| Rate Limiting | ☐ | Limits enforced correctly |

## **✅ Mainnet Verification Complete**

If all tests pass:
- ✅ **Mainnet Verified** - System ready for production
- ✅ **User Announcement** - Ready to announce withdrawals
- ✅ **Monitoring Setup** - Configure alerts and monitoring
- ✅ **Backup Verification** - Ensure data protection

## **🚨 If Tests Fail**

1. **Check Environment Variables** - Verify all settings in Render
2. **Check Platform Wallet** - Ensure it's funded and accessible
3. **Check Database** - Verify migration was applied
4. **Check Logs** - Review Render service logs for errors
5. **Contact Support** - If issues persist, review error logs

## **🎯 Post-Verification Actions**

1. **Announce Launch** - Notify users that withdrawals are live
2. **Monitor Closely** - Watch for any issues in first 24 hours
3. **Scale Gradually** - Start with small limits, increase over time
4. **Document Issues** - Keep track of any problems for improvement
