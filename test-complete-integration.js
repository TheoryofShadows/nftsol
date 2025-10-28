#!/usr/bin/env node

/**
 * 🧪 NFTSol Complete Integration Test Suite
 * Tests all real Solana endpoints and functionality
 */

const https = require('https');
const http = require('http');

// Configuration
const BASE_URL = process.env.TEST_URL || 'https://nftsol-dev.onrender.com';
const TEST_WALLET = '11111111111111111111111111111112'; // System program address for testing

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
}

async function testProgramsEndpoint() {
  const response = await makeRequest(`${BASE_URL}/api/programs`);
  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }
  if (!response.data.success) {
    throw new Error('Programs endpoint failed');
  }
}

async function testWalletVerification() {
  const response = await makeRequest(`${BASE_URL}/api/nfts/verify/${TEST_WALLET}`);
  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }
  if (!response.data.success) {
    throw new Error('Wallet verification failed');
  }
}

async function testWalletBalance() {
  const response = await makeRequest(`${BASE_URL}/api/nfts/balance/${TEST_WALLET}`);
  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }
  if (!response.data.success) {
    throw new Error('Wallet balance check failed');
  }
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
}

async function testAdminEndpoints() {
  // Test admin withdrawal list (should require auth)
  const response = await makeRequest(`${BASE_URL}/api/admin/withdrawals`);
  if (response.status !== 403 && response.status !== 401) {
    throw new Error(`Expected auth error, got ${response.status}`);
  }
}

async function testEmergencyControls() {
  const response = await makeRequest(`${BASE_URL}/api/admin/emergency/status`);
  if (response.status !== 403 && response.status !== 401) {
    throw new Error(`Expected auth error, got ${response.status}`);
  }
}

// Main test runner
async function runAllTests() {
  console.log(`${colors.bold}${colors.blue}🚀 NFTSol Complete Integration Test Suite${colors.reset}`);
  console.log(`Testing against: ${BASE_URL}`);
  console.log('');

  await runTest('Health Endpoint', testHealthEndpoint);
  await runTest('Programs Endpoint', testProgramsEndpoint);
  await runTest('Wallet Verification', testWalletVerification);
  await runTest('Wallet Balance Check', testWalletBalance);
  await runTest('Withdrawal Creation', testWithdrawalCreation);
  await runTest('Admin Endpoints (Auth Required)', testAdminEndpoints);
  await runTest('Emergency Controls (Auth Required)', testEmergencyControls);

  console.log('');
  console.log(`${colors.bold}📊 Test Results:${colors.reset}`);
  console.log(`${colors.green}✅ Passed: ${testResults.passed}${colors.reset}`);
  console.log(`${colors.red}❌ Failed: ${testResults.failed}${colors.reset}`);
  console.log(`📈 Total: ${testResults.total}`);
  
  if (testResults.failed === 0) {
    console.log('');
    console.log(`${colors.green}${colors.bold}🎉 ALL TESTS PASSED! Your NFTSol backend is working perfectly!${colors.reset}`);
  } else {
    console.log('');
    console.log(`${colors.yellow}${colors.bold}⚠️  Some tests failed. Check the errors above.${colors.reset}`);
  }
}

// Run tests
runAllTests().catch(console.error);
