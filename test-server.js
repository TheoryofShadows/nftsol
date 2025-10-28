#!/usr/bin/env node

/**
 * 🧪 Simple Server Test Script
 * Tests the server without complex curl commands
 */

const http = require('http');

// Test function
function testEndpoint(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Main test function
async function runTests() {
  console.log('🚀 Testing NFTSol Server...\n');

  try {
    // Test 1: Health Check
    console.log('1️⃣ Testing Health Endpoint...');
    const health = await testEndpoint('/healthz');
    console.log(`   Status: ${health.status}`);
    console.log(`   Response: ${JSON.stringify(health.data, null, 2)}\n`);

    // Test 2: Programs Endpoint
    console.log('2️⃣ Testing Programs Endpoint...');
    const programs = await testEndpoint('/api/programs');
    console.log(`   Status: ${programs.status}`);
    console.log(`   Response: ${JSON.stringify(programs.data, null, 2)}\n`);

    // Test 3: Wallet Verification
    console.log('3️⃣ Testing Wallet Verification...');
    const verify = await testEndpoint('/api/nfts/verify/11111111111111111111111111111112');
    console.log(`   Status: ${verify.status}`);
    console.log(`   Response: ${JSON.stringify(verify.data, null, 2)}\n`);

    // Test 4: Platform Wallet Balance
    console.log('4️⃣ Testing Platform Wallet Balance...');
    const balance = await testEndpoint('/api/nfts/balance/3EgKZgBNotS5tnYTaWuhEuzS9NLyMQww3C4Vaz5RDhM4');
    console.log(`   Status: ${balance.status}`);
    console.log(`   Response: ${JSON.stringify(balance.data, null, 2)}\n`);

    // Test 5: NFT Minting
    console.log('5️⃣ Testing NFT Minting...');
    const mint = await testEndpoint('/api/nfts/mint', 'POST', {
      toAddress: '11111111111111111111111111111112',
      name: 'Test NFT',
      description: 'Test NFT for verification',
      imageUrl: 'https://example.com/test.jpg'
    });
    console.log(`   Status: ${mint.status}`);
    console.log(`   Response: ${JSON.stringify(mint.data, null, 2)}\n`);

    // Test 6: Withdrawal Creation
    console.log('6️⃣ Testing Withdrawal Creation...');
    const withdraw = await testEndpoint('/api/wallets/withdraw', 'POST', {
      userId: 'test-user-123',
      toAddress: '11111111111111111111111111111112',
      amountSol: 0.001
    });
    console.log(`   Status: ${withdraw.status}`);
    console.log(`   Response: ${JSON.stringify(withdraw.data, null, 2)}\n`);

    console.log('✅ All tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run tests
runTests();
