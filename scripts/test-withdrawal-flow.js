#!/usr/bin/env node

/**
 * NFTSol Withdrawal Flow Test
 * 
 * This script tests the complete withdrawal flow:
 * 1. Health check
 * 2. Get CSRF token
 * 3. Create test user and get JWT
 * 4. Create withdrawal request
 * 5. Admin processes withdrawal
 * 6. Verify transaction
 */

const http = require('http');
const crypto = require('crypto');

console.log('🧪 NFTSol Withdrawal Flow Test');
console.log('===============================\n');

const BASE_URL = 'http://localhost:3000';
let csrfToken = '';
let userJWT = '';
let adminJWT = '';
let withdrawalId = '';

function makeRequest(path, method = 'GET', data = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const jsonBody = body ? JSON.parse(body) : {};
                    resolve({ status: res.statusCode, headers: res.headers, body: jsonBody });
                } catch (e) {
                    resolve({ status: res.statusCode, headers: res.headers, body: body });
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

async function testHealthCheck() {
    console.log('1️⃣ Testing health check...');
    try {
        const response = await makeRequest('/healthz');
        if (response.status === 200) {
            console.log('✅ Health check passed');
            console.log(`   Status: ${response.body.data?.status}`);
            console.log(`   Solana: ${response.body.data?.solana?.healthy ? 'Healthy' : 'Unhealthy'}`);
            console.log(`   Database: ${response.body.data?.database?.healthy ? 'Healthy' : 'Unhealthy'}`);
            return true;
        } else {
            console.log(`❌ Health check failed: ${response.status}`);
            return false;
        }
    } catch (error) {
        console.log(`❌ Health check error: ${error.message}`);
        return false;
    }
}

async function getCSRFToken() {
    console.log('\n2️⃣ Getting CSRF token...');
    try {
        const response = await makeRequest('/api/csrf-token');
        if (response.status === 200) {
            csrfToken = response.body.token;
            console.log('✅ CSRF token obtained');
            return true;
        } else {
            console.log(`❌ CSRF token failed: ${response.status}`);
            return false;
        }
    } catch (error) {
        console.log(`❌ CSRF token error: ${error.message}`);
        return false;
    }
}

async function createTestUser() {
    console.log('\n3️⃣ Creating test user...');
    try {
        // For testing, we'll create a mock user JWT
        // In production, this would come from your auth system
        const testUser = {
            id: 'test-user-123',
            username: 'testuser',
            isAdmin: false
        };
        
        // Create a simple JWT for testing (in production, use proper JWT library)
        const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
        const payload = Buffer.from(JSON.stringify(testUser)).toString('base64url');
        const signature = crypto.createHmac('sha256', 'test-secret').update(`${header}.${payload}`).digest('base64url');
        userJWT = `${header}.${payload}.${signature}`;
        
        console.log('✅ Test user JWT created');
        return true;
    } catch (error) {
        console.log(`❌ User creation error: ${error.message}`);
        return false;
    }
}

async function createAdminUser() {
    console.log('\n4️⃣ Creating admin user...');
    try {
        const adminUser = {
            id: 'admin-123',
            username: 'admin',
            isAdmin: true
        };
        
        const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
        const payload = Buffer.from(JSON.stringify(adminUser)).toString('base64url');
        const signature = crypto.createHmac('sha256', 'test-secret').update(`${header}.${payload}`).digest('base64url');
        adminJWT = `${header}.${payload}.${signature}`;
        
        console.log('✅ Admin JWT created');
        return true;
    } catch (error) {
        console.log(`❌ Admin creation error: ${error.message}`);
        return false;
    }
}

async function createWithdrawal() {
    console.log('\n5️⃣ Creating withdrawal request...');
    try {
        const withdrawalData = {
            amount_sol: 0.01, // Small test amount
            to_address: '3XEs3MJ8PFiqTTqrK6RAkK9vt95jQQ1hKNNKHiE6jJ3o', // Test wallet
            idempotency_key: `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        };

        const response = await makeRequest('/api/v1/wallets/withdraw', 'POST', withdrawalData, {
            'Authorization': `Bearer ${userJWT}`,
            'X-CSRF-Token': csrfToken
        });

        if (response.status === 200 || response.status === 201) {
            withdrawalId = response.body.data?.withdrawalId || response.body.data?.id;
            console.log('✅ Withdrawal request created');
            console.log(`   Withdrawal ID: ${withdrawalId}`);
            console.log(`   Amount: ${withdrawalData.amount_sol} SOL`);
            console.log(`   To Address: ${withdrawalData.to_address}`);
            return true;
        } else {
            console.log(`❌ Withdrawal creation failed: ${response.status}`);
            console.log(`   Error: ${response.body.error || 'Unknown error'}`);
            return false;
        }
    } catch (error) {
        console.log(`❌ Withdrawal creation error: ${error.message}`);
        return false;
    }
}

async function processWithdrawal() {
    console.log('\n6️⃣ Processing withdrawal (admin)...');
    try {
        if (!withdrawalId) {
            console.log('❌ No withdrawal ID available');
            return false;
        }

        const response = await makeRequest(`/api/v1/admin/withdrawals/${withdrawalId}/process`, 'POST', {}, {
            'Authorization': `Bearer ${adminJWT}`
        });

        if (response.status === 200) {
            console.log('✅ Withdrawal processed successfully');
            console.log(`   Transaction: ${response.body.data?.transactionSignature || 'N/A'}`);
            console.log(`   Status: ${response.body.data?.status || 'N/A'}`);
            return true;
        } else {
            console.log(`❌ Withdrawal processing failed: ${response.status}`);
            console.log(`   Error: ${response.body.error || 'Unknown error'}`);
            return false;
        }
    } catch (error) {
        console.log(`❌ Withdrawal processing error: ${error.message}`);
        return false;
    }
}

async function checkWithdrawalStatus() {
    console.log('\n7️⃣ Checking withdrawal status...');
    try {
        if (!withdrawalId) {
            console.log('❌ No withdrawal ID available');
            return false;
        }

        const response = await makeRequest(`/api/v1/admin/withdrawals/${withdrawalId}`, 'GET', null, {
            'Authorization': `Bearer ${adminJWT}`
        });

        if (response.status === 200) {
            console.log('✅ Withdrawal status retrieved');
            console.log(`   Status: ${response.body.data?.status || 'N/A'}`);
            console.log(`   Amount: ${response.body.data?.amount_sol || 'N/A'} SOL`);
            console.log(`   Transaction: ${response.body.data?.processed_tx_sig || 'N/A'}`);
            return true;
        } else {
            console.log(`❌ Status check failed: ${response.status}`);
            return false;
        }
    } catch (error) {
        console.log(`❌ Status check error: ${error.message}`);
        return false;
    }
}

async function runTest() {
    console.log('🚀 Starting withdrawal flow test...\n');
    
    const steps = [
        { name: 'Health Check', fn: testHealthCheck },
        { name: 'CSRF Token', fn: getCSRFToken },
        { name: 'Create User', fn: createTestUser },
        { name: 'Create Admin', fn: createAdminUser },
        { name: 'Create Withdrawal', fn: createWithdrawal },
        { name: 'Process Withdrawal', fn: processWithdrawal },
        { name: 'Check Status', fn: checkWithdrawalStatus }
    ];

    let passed = 0;
    let failed = 0;

    for (const step of steps) {
        try {
            const result = await step.fn();
            if (result) {
                passed++;
            } else {
                failed++;
                console.log(`\n⚠️  Test failed at step: ${step.name}`);
                break;
            }
        } catch (error) {
            console.log(`\n❌ Test error at step ${step.name}: ${error.message}`);
            failed++;
            break;
        }
    }

    console.log('\n📊 TEST RESULTS');
    console.log('================');
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

    if (failed === 0) {
        console.log('\n🎉 All tests passed! Withdrawal flow is working correctly.');
    } else {
        console.log('\n⚠️  Some tests failed. Check the logs above for details.');
    }

    return failed === 0;
}

// Run the test
runTest().catch(console.error);
