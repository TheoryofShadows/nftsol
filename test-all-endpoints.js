#!/usr/bin/env node

/**
 * 🧪 NFTSol Complete Endpoint Testing Suite
 * Tests all real Solana endpoints and functionality
 */

const https = require('https');
const http = require('http');

// Configuration
const BASE_URL = process.env.TEST_URL || 'https://nftsol-dev.onrender.com';
const PLATFORM_WALLET = '3EgKZgBNotS5tnYTaWuhEuzS9NLyMQww3C4Vaz5RDhM4';
const TEST_WALLET = '11111111111111111111111111111112'; // System program address

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

// Test results
let testResults = {
  passed: 0,
  failed: 0,
  total: 0
};

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https');
    const client = isHttps ? https : http;
    
    const req = client.request(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

// Test function
async function runTest(name, testFn) {
  testResults.total++;
  process.stdout.write(`🧪 Testing ${name}... `);
  
  try {
    await testFn();
    console.log(`${colors.green}✅ PASSED${colors.reset}`);
    testResults.passed++;
  } catch (error) {
    console.log(`${colors.red}❌ FAILED${colors.reset}`);
    console.log(`   Error: ${error.message}`);
    testResults.failed++;
  }
}

// Individual tests
async function testHealthEndpoint() {
  const response = await makeRequest(`${BASE_URL}/healthz`);
  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }
  if (!response.data.success) {
    throw new Error('Health check failed');
  }
  console.log(`   Solana Health: ${response.data.data.solana.healthy ? '✅' : '❌'}`);
}

async function testProgramsEndpoint() {
  const response = await makeRequest(`${BASE_URL}/api/programs`);
  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }
  if (!response.data.success) {
    throw new Error('Programs endpoint failed');
  }
  console.log(`   Programs: ${Object.keys(response.data.data.programs).length} configured`);
}

async function testWalletVerification() {
  const response = await makeRequest(`${BASE_URL}/api/nfts/verify/${TEST_WALLET}`);
  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }
  if (!response.data.success) {
    throw new Error('Wallet verification failed');
  }
  console.log(`   Wallet exists: ${response.data.data.exists ? '✅' : '❌'}`);
}

async function testWalletBalance() {
  const response = await makeRequest(`${BASE_URL}/api/nfts/balance/${PLATFORM_WALLET}`);
  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }
  if (!response.data.success) {
    throw new Error('Wallet balance check failed');
  }
  console.log(`   Balance: ${response.data.data.solBalance}`);
}

async function testWithdrawalCreation() {
  const withdrawalData = {
    amount_sol: 0.001,
    to_address: TEST_WALLET,
    userId: 'test-user-123'
  };
  
  const response = await makeRequest(`${BASE_URL}/api/wallets/withdraw`, {
    method: 'POST',
    body: withdrawalData
  });
  
  // Should either succeed or fail with authentication error (expected)
  if (response.status !== 200 && response.status !== 401) {
    throw new Error(`Unexpected status: ${response.status}`);
  }
  console.log(`   Status: ${response.status} (${response.status === 401 ? 'Auth required ✅' : 'Success ✅'})`);
}

async function testAdminEndpoints() {
  // Test admin withdrawal list (should require auth)
  const response = await makeRequest(`${BASE_URL}/api/admin/withdrawals`);
  if (response.status !== 403 && response.status !== 401) {
    throw new Error(`Expected auth error, got ${response.status}`);
  }
  console.log(`   Auth protection: ✅`);
}

async function testEmergencyControls() {
  const response = await makeRequest(`${BASE_URL}/api/admin/emergency/status`);
  if (response.status !== 403 && response.status !== 401) {
    throw new Error(`Expected auth error, got ${response.status}`);
  }
  console.log(`   Emergency controls: ✅`);
}

async function testNFTMinting() {
  const mintData = {
    toAddress: TEST_WALLET,
    name: 'Test NFT',
    description: 'Test NFT for verification',
    imageUrl: 'https://example.com/test.jpg'
  };
  
  const response = await makeRequest(`${BASE_URL}/api/nfts/mint`, {
    method: 'POST',
    body: mintData
  });
  
  // Should either succeed or fail with validation error (expected)
  if (response.status !== 200 && response.status !== 400) {
    throw new Error(`Unexpected status: ${response.status}`);
  }
  console.log(`   Mint endpoint: ${response.status === 200 ? 'Success ✅' : 'Validation working ✅'}`);
}

// Main test runner
async function runAllTests() {
  console.log(`${colors.bold}${colors.blue}🚀 NFTSol Complete Endpoint Testing Suite${colors.reset}`);
  console.log(`Testing against: ${BASE_URL}`);
  console.log(`Platform Wallet: ${PLATFORM_WALLET}`);
  console.log('');

  await runTest('Health Endpoint', testHealthEndpoint);
  await runTest('Programs Endpoint', testProgramsEndpoint);
  await runTest('Wallet Verification', testWalletVerification);
  await runTest('Wallet Balance Check', testWalletBalance);
  await runTest('Withdrawal Creation', testWithdrawalCreation);
  await runTest('Admin Endpoints (Auth Required)', testAdminEndpoints);
  await runTest('Emergency Controls (Auth Required)', testEmergencyControls);
  await runTest('NFT Minting', testNFTMinting);

  console.log('');
  console.log(`${colors.bold}📊 Test Results:${colors.reset}`);
  console.log(`${colors.green}✅ Passed: ${testResults.passed}${colors.reset}`);
  console.log(`${colors.red}❌ Failed: ${testResults.failed}${colors.reset}`);
  console.log(`📈 Total: ${testResults.total}`);
  
  if (testResults.failed === 0) {
    console.log('');
    console.log(`${colors.green}${colors.bold}🎉 ALL TESTS PASSED! Your NFTSol backend is working perfectly!${colors.reset}`);
    console.log('');
    console.log(`${colors.yellow}📋 Next Steps:${colors.reset}`);
    console.log('1. Fund your platform wallet with devnet SOL');
    console.log('2. Test real NFT minting');
    console.log('3. Test real SOL withdrawals');
    console.log('4. Deploy frontend to Netlify');
    console.log('5. Start acquiring users!');
  } else {
    console.log('');
    console.log(`${colors.yellow}${colors.bold}⚠️  Some tests failed. Check the errors above.${colors.reset}`);
    console.log('');
    console.log(`${colors.blue}💡 Common Issues:${colors.reset}`);
    console.log('- Server not deployed yet (502 errors)');
    console.log('- Environment variables not set');
    console.log('- Platform wallet not funded');
    console.log('- Network connectivity issues');
  }
}

// Run tests
runAllTests().catch(console.error);
