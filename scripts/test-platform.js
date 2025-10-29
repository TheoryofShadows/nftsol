#!/usr/bin/env node

/**
 * NFTSol Platform Test Script
 * 
 * This script tests the platform functionality:
 * 1. Tests backend API endpoints
 * 2. Tests frontend build
 * 3. Validates security features
 * 4. Generates test report
 */

const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

console.log('🧪 NFTSol Platform Testing');
console.log('==========================\n');

let backendProcess = null;
let testResults = {
    timestamp: new Date().toISOString(),
    tests: [],
    passed: 0,
    failed: 0,
    total: 0
};

function addTest(name, status, message, details = {}) {
    const test = { name, status, message, details, timestamp: new Date().toISOString() };
    testResults.tests.push(test);
    testResults.total++;
    if (status === 'PASS') {
        testResults.passed++;
        console.log(`✅ ${name}: ${message}`);
    } else {
        testResults.failed++;
        console.log(`❌ ${name}: ${message}`);
    }
}

function makeRequest(options, data = null) {
    return new Promise((resolve, reject) => {
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

async function testBackendAPI() {
    console.log('🔍 Testing Backend API...\n');
    
    const baseUrl = 'http://localhost:3000';
    
    // Test health endpoint
    try {
        const healthResponse = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/healthz',
            method: 'GET'
        });
        
        if (healthResponse.status === 200) {
            addTest('Health Check', 'PASS', 'Backend health endpoint responding', {
                status: healthResponse.status,
                data: healthResponse.body
            });
        } else {
            addTest('Health Check', 'FAIL', `Expected 200, got ${healthResponse.status}`);
        }
    } catch (error) {
        addTest('Health Check', 'FAIL', `Connection failed: ${error.message}`);
    }
    
    // Test API versioning
    try {
        const apiResponse = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/v1/programs',
            method: 'GET'
        });
        
        if (apiResponse.status === 200) {
            addTest('API Versioning', 'PASS', 'API v1 endpoints working', {
                status: apiResponse.status,
                data: apiResponse.body
            });
        } else {
            addTest('API Versioning', 'FAIL', `Expected 200, got ${apiResponse.status}`);
        }
    } catch (error) {
        addTest('API Versioning', 'FAIL', `Connection failed: ${error.message}`);
    }
    
    // Test CORS headers
    try {
        const corsResponse = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/v1/programs',
            method: 'OPTIONS',
            headers: {
                'Origin': 'http://localhost:5173',
                'Access-Control-Request-Method': 'GET'
            }
        });
        
        const corsHeaders = corsResponse.headers['access-control-allow-origin'];
        if (corsHeaders) {
            addTest('CORS Headers', 'PASS', 'CORS headers present', {
                'access-control-allow-origin': corsHeaders
            });
        } else {
            addTest('CORS Headers', 'FAIL', 'CORS headers missing');
        }
    } catch (error) {
        addTest('CORS Headers', 'FAIL', `CORS test failed: ${error.message}`);
    }
    
    // Test rate limiting
    try {
        const promises = [];
        for (let i = 0; i < 5; i++) {
            promises.push(makeRequest({
                hostname: 'localhost',
                port: 3000,
                path: '/api/v1/programs',
                method: 'GET'
            }));
        }
        
        const responses = await Promise.all(promises);
        const rateLimited = responses.some(r => r.status === 429);
        
        if (rateLimited) {
            addTest('Rate Limiting', 'PASS', 'Rate limiting working');
        } else {
            addTest('Rate Limiting', 'FAIL', 'Rate limiting not working');
        }
    } catch (error) {
        addTest('Rate Limiting', 'FAIL', `Rate limiting test failed: ${error.message}`);
    }
    
    // Test authentication (should fail without token)
    try {
        const authResponse = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/v1/wallets/withdraw',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        }, { amount_sol: 0.1, to_address: 'test' });
        
        if (authResponse.status === 401) {
            addTest('Authentication', 'PASS', 'Protected endpoints require authentication', {
                status: authResponse.status,
                error: authResponse.body.error
            });
        } else {
            addTest('Authentication', 'FAIL', `Expected 401, got ${authResponse.status}`);
        }
    } catch (error) {
        addTest('Authentication', 'FAIL', `Auth test failed: ${error.message}`);
    }
    
    // Test CSRF protection
    try {
        const csrfResponse = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/v1/simple-mint',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        }, { name: 'Test NFT', creatorWallet: 'test' });
        
        if (csrfResponse.status === 403) {
            addTest('CSRF Protection', 'PASS', 'CSRF protection working', {
                status: csrfResponse.status,
                error: csrfResponse.body.error
            });
        } else {
            addTest('CSRF Protection', 'FAIL', `Expected 403, got ${csrfResponse.status}`);
        }
    } catch (error) {
        addTest('CSRF Protection', 'FAIL', `CSRF test failed: ${error.message}`);
    }
}

async function testFrontend() {
    console.log('\n🎨 Testing Frontend...\n');
    
    // Check if dist folder exists
    const distPath = path.join(__dirname, '..', 'client', 'dist');
    if (fs.existsSync(distPath)) {
        const files = fs.readdirSync(distPath);
        if (files.length > 0) {
            addTest('Frontend Build', 'PASS', 'Frontend built successfully', {
                files: files.length,
                distPath
            });
        } else {
            addTest('Frontend Build', 'FAIL', 'Frontend dist folder is empty');
        }
    } else {
        addTest('Frontend Build', 'FAIL', 'Frontend dist folder not found');
    }
    
    // Check for index.html
    const indexPath = path.join(distPath, 'index.html');
    if (fs.existsSync(indexPath)) {
        addTest('Frontend Index', 'PASS', 'index.html exists');
    } else {
        addTest('Frontend Index', 'FAIL', 'index.html not found');
    }
}

function testSecurityFeatures() {
    console.log('\n🔒 Testing Security Features...\n');
    
    // Check .env is in .gitignore
    const gitignorePath = path.join(__dirname, '..', '.gitignore');
    if (fs.existsSync(gitignorePath)) {
        const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
        if (gitignoreContent.includes('.env')) {
            addTest('Gitignore Security', 'PASS', '.env files excluded from git');
        } else {
            addTest('Gitignore Security', 'FAIL', '.env files not in .gitignore');
        }
    } else {
        addTest('Gitignore Security', 'FAIL', '.gitignore file not found');
    }
    
    // Check for hardcoded secrets
    const backendPath = path.join(__dirname, '..', 'apps', 'backend', 'src');
    const files = fs.readdirSync(backendPath, { recursive: true });
    let hasHardcodedSecrets = false;
    
    files.forEach(file => {
        if (typeof file === 'string' && file.endsWith('.ts')) {
            const filePath = path.join(backendPath, file);
            const content = fs.readFileSync(filePath, 'utf8');
            if (content.includes('PLATFORM_SECRET_KEY_BASE58=') && !content.includes('process.env.')) {
                hasHardcodedSecrets = true;
            }
        }
    });
    
    if (!hasHardcodedSecrets) {
        addTest('No Hardcoded Secrets', 'PASS', 'No hardcoded secrets found in code');
    } else {
        addTest('No Hardcoded Secrets', 'FAIL', 'Hardcoded secrets found in code');
    }
    
    // Check security middleware
    const indexPath = path.join(__dirname, '..', 'apps', 'backend', 'src', 'index.ts');
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    
    const securityFeatures = [
        'helmet',
        'cors',
        'rateLimit',
        'sanitizeInput',
        'csrfProtection',
        'auditLogger',
        'securityLogger'
    ];
    
    securityFeatures.forEach(feature => {
        if (indexContent.includes(feature)) {
            addTest(`Security Feature: ${feature}`, 'PASS', `${feature} implemented`);
        } else {
            addTest(`Security Feature: ${feature}`, 'FAIL', `${feature} not found`);
        }
    });
}

async function startBackend() {
    return new Promise((resolve, reject) => {
        console.log('🚀 Starting backend server...');
        
        backendProcess = spawn('npm', ['run', 'dev'], {
            cwd: path.join(__dirname, '..', 'apps', 'backend'),
            stdio: 'pipe'
        });
        
        let started = false;
        
        backendProcess.stdout.on('data', (data) => {
            const output = data.toString();
            if (output.includes('listening on') || output.includes('Server started')) {
                if (!started) {
                    started = true;
                    console.log('✅ Backend server started');
                    resolve();
                }
            }
        });
        
        backendProcess.stderr.on('data', (data) => {
            console.error('Backend error:', data.toString());
        });
        
        backendProcess.on('error', (error) => {
            console.error('Failed to start backend:', error);
            reject(error);
        });
        
        // Timeout after 10 seconds
        setTimeout(() => {
            if (!started) {
                reject(new Error('Backend startup timeout'));
            }
        }, 10000);
    });
}

async function stopBackend() {
    if (backendProcess) {
        console.log('\n🛑 Stopping backend server...');
        backendProcess.kill();
        backendProcess = null;
    }
}

async function runTests() {
    try {
        // Start backend
        await startBackend();
        
        // Wait a bit for server to be ready
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Run tests
        await testBackendAPI();
        testFrontend();
        testSecurityFeatures();
        
    } catch (error) {
        console.error('Test setup failed:', error.message);
        addTest('Test Setup', 'FAIL', `Setup failed: ${error.message}`);
    } finally {
        await stopBackend();
    }
    
    // Generate report
    console.log('\n📊 TEST REPORT');
    console.log('==============');
    console.log(`Total Tests: ${testResults.total}`);
    console.log(`Passed: ${testResults.passed}`);
    console.log(`Failed: ${testResults.failed}`);
    console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
    
    // Save report
    const reportPath = path.join(__dirname, '..', 'test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
    console.log(`\n📁 Test report saved: ${reportPath}`);
    
    if (testResults.failed > 0) {
        console.log('\n❌ Some tests failed. Check the report for details.');
        process.exit(1);
    } else {
        console.log('\n✅ All tests passed! Platform is ready for deployment.');
    }
}

// Handle cleanup on exit
process.on('SIGINT', async () => {
    await stopBackend();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    await stopBackend();
    process.exit(0);
});

// Run tests
runTests().catch(console.error);
