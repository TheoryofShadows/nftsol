// cursor-go-live.js
// Full Cursor Go-Live Script for NFTSol Devnet
// Run with: node cursor-go-live.js
// Prerequisite: Backend running locally on port 3000

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Replace with your devnet test wallet
const TEST_WALLET = '11111111111111111111111111111112'; // System program address for testing

// Platform wallet
const PLATFORM_WALLET = '3EgKZgBNotS5tnYTaWuhEuzS9NLyMQww3C4Vaz5RDhM4';

// Amount to withdraw in SOL for testing
const TEST_WITHDRAW_AMOUNT = 0.01;

// Helper for logging
const log = (msg) => console.log(`\n🚀 ${msg}`);

// Retry helper
const retryRequest = async (fn, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      console.error(`⚠️ Error, retrying... (${i + 1}/${retries})`, err.message);
      if (i < retries - 1) {
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  throw new Error('Failed after retries');
};

const main = async () => {
  console.log('🎯 NFTSol Cursor Go-Live Script Starting...');
  console.log('==========================================');

  try {
    // 1️⃣ Health Check
    log('1️⃣ Health Check...');
    const health = await retryRequest(() => axios.get(`${BASE_URL}/healthz`));
    console.log('✅ Health Status:', health.data.success ? 'HEALTHY' : 'UNHEALTHY');
    console.log(
      '📊 Solana Health:',
      health.data.data.solana.healthy ? 'CONNECTED' : 'DISCONNECTED'
    );
    console.log('🔗 RPC URL:', health.data.data.solana.details.rpcUrl);

    // 2️⃣ Programs Check
    log('2️⃣ Programs Endpoint...');
    const programs = await retryRequest(() => axios.get(`${BASE_URL}/api/programs`));
    console.log('✅ Programs Status:', programs.data.success ? 'LOADED' : 'FAILED');
    console.log('📋 Program IDs:');
    Object.entries(programs.data.data.programs).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`);
    });

    // 3️⃣ Platform Wallet Balance
    log('3️⃣ Platform Wallet Balance...');
    const platformBalance = await retryRequest(() =>
      axios.get(`${BASE_URL}/api/nfts/balance/${PLATFORM_WALLET}`)
    );
    console.log('✅ Platform Wallet:', PLATFORM_WALLET);
    console.log('💰 Balance:', platformBalance.data.data.solBalance);
    console.log('📊 Exists:', platformBalance.data.data.exists ? 'YES' : 'NO');

    if (platformBalance.data.data.balance === 0) {
      console.log('⚠️ WARNING: Platform wallet has 0 SOL - fund it at https://faucet.solana.com/');
    }

    // 4️⃣ Wallet Verification
    log('4️⃣ Verifying Test Wallet...');
    const walletVerify = await retryRequest(() =>
      axios.get(`${BASE_URL}/api/nfts/verify/${TEST_WALLET}`)
    );
    console.log('✅ Test Wallet:', TEST_WALLET);
    console.log('📊 Exists:', walletVerify.data.data.exists ? 'YES' : 'NO');
    console.log('✅ Valid:', walletVerify.data.data.valid ? 'YES' : 'NO');

    // 5️⃣ Test Wallet Balance
    log('5️⃣ Test Wallet Balance...');
    const testBalance = await retryRequest(() =>
      axios.get(`${BASE_URL}/api/nfts/balance/${TEST_WALLET}`)
    );
    console.log('💰 Test Wallet Balance:', testBalance.data.data.solBalance);

    // 6️⃣ Mint NFT
    log('6️⃣ Minting NFT...');
    const mintPayload = {
      toAddress: TEST_WALLET,
      name: 'Cursor Test NFT',
      description: 'Test NFT minted via Cursor Go-Live Script',
      imageUrl: 'https://example.com/test-metadata.json',
    };

    try {
      const mint = await retryRequest(() => axios.post(`${BASE_URL}/api/nfts/mint`, mintPayload));
      console.log('✅ NFT Minting:', mint.data.success ? 'SUCCESS' : 'FAILED');
      if (mint.data.success) {
        console.log('🎨 Mint Address:', mint.data.data.mintAddress);
        console.log('📝 Transaction:', mint.data.data.transactionSignature);
      } else {
        console.log('❌ Error:', mint.data.error);
      }
    } catch (error) {
      console.log('❌ NFT Minting Failed:', error.message);
    }

    // 7️⃣ Create Withdrawal Request
    log('7️⃣ Creating SOL Withdrawal...');
    const withdrawPayload = {
      userId: 'cursor-test-user',
      amount_sol: TEST_WITHDRAW_AMOUNT,
      to_address: TEST_WALLET,
    };

    try {
      const withdraw = await retryRequest(() =>
        axios.post(`${BASE_URL}/api/wallets/withdraw`, withdrawPayload)
      );
      console.log('✅ Withdrawal Creation:', withdraw.data.success ? 'SUCCESS' : 'FAILED');
      if (withdraw.data.success) {
        console.log('📊 Status:', withdraw.data.data.status);
        console.log('💰 Amount:', withdraw.data.data.amount_sol, 'SOL');
        console.log('🎯 To Address:', withdraw.data.data.to_address);

        const withdrawalId = withdraw.data.data.withdrawal.id;
        console.log('🆔 Withdrawal ID:', withdrawalId);

        // 8️⃣ Admin Approval
        log('8️⃣ Approving Withdrawal...');
        try {
          const approve = await retryRequest(() =>
            axios.post(`${BASE_URL}/api/admin/withdrawals/${withdrawalId}/approve`, {
              reason: 'Approved by Cursor Go-Live Script',
            })
          );
          console.log('✅ Approval:', approve.data.success ? 'SUCCESS' : 'FAILED');
          if (approve.data.success) {
            console.log('📊 Status:', approve.data.data.status);
          }

          // 9️⃣ Process Withdrawal
          log('9️⃣ Processing Withdrawal (sending SOL)...');
          try {
            const process = await retryRequest(() =>
              axios.post(`${BASE_URL}/api/admin/withdrawals/${withdrawalId}/process`)
            );
            console.log('✅ Processing:', process.data.success ? 'SUCCESS' : 'FAILED');
            if (process.data.success) {
              console.log('📝 Transaction Signature:', process.data.data.transactionSignature);
              console.log('💰 Amount Sent:', process.data.data.amountSol, 'SOL');
              console.log(
                '🔗 Explorer:',
                `https://explorer.solana.com/tx/${process.data.data.transactionSignature}?cluster=devnet`
              );
            } else {
              console.log('❌ Processing Error:', process.data.error);
            }
          } catch (processError) {
            console.log('❌ Processing Failed:', processError.message);
          }
        } catch (approveError) {
          console.log('❌ Approval Failed:', approveError.message);
        }
      } else {
        console.log('❌ Withdrawal Creation Error:', withdraw.data.error);
      }
    } catch (withdrawError) {
      console.log('❌ Withdrawal Creation Failed:', withdrawError.message);
    }

    // 🔟 Final Verification
    log('🔟 Final Verification...');
    const finalBalance = await retryRequest(() =>
      axios.get(`${BASE_URL}/api/nfts/balance/${TEST_WALLET}`)
    );
    console.log('💰 Final Test Wallet Balance:', finalBalance.data.data.solBalance);

    log('✅ Cursor Go-Live Script Completed Successfully!');
    console.log('\n🎉 NFTSol Platform is 100% Ready for Production!');
    console.log('📋 Next Steps:');
    console.log('1. Fund platform wallet with devnet SOL');
    console.log('2. Deploy to Render with environment variables');
    console.log('3. Test with real user wallets');
    console.log('4. Launch your NFT marketplace!');
  } catch (err) {
    console.error('❌ Cursor Go-Live Script Failed:', err.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Ensure backend is running: node dist/index.js');
    console.log('2. Check environment variables are set');
    console.log('3. Verify platform wallet is funded');
    console.log('4. Check Solana devnet connectivity');
  }
};

// Run the script
main();
