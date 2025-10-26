#!/usr/bin/env node

/**
 * Deployment Monitoring Script for NFTSol Platform
 * Monitors deployment status and provides real-time updates
 */

const https = require('https');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkEndpoint(url, name) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const req = https.get(url, { timeout: 10000 }, (res) => {
      const responseTime = Date.now() - startTime;
      resolve({
        name,
        status: res.statusCode,
        responseTime,
        success: res.statusCode >= 200 && res.statusCode < 400
      });
    });
    
    req.on('error', (error) => {
      const responseTime = Date.now() - startTime;
      resolve({
        name,
        status: 'ERROR',
        responseTime,
        success: false,
        error: error.message
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve({
        name,
        status: 'TIMEOUT',
        responseTime: 10000,
        success: false,
        error: 'Request timeout'
      });
    });
  });
}

async function monitorDeployments() {
  log('\n🚀 NFTSol Platform - Deployment Monitor', 'bold');
  log('=====================================', 'blue');
  
  const endpoints = [
    {
      url: 'https://nftsol-server-prod.onrender.com/healthz',
      name: 'Backend (Render)'
    },
    {
      url: 'https://nftsolmarket.netlify.app',
      name: 'Frontend (Netlify)'
    }
  ];
  
  let allDeployed = false;
  let attempts = 0;
  const maxAttempts = 20; // Monitor for up to 10 minutes
  
  while (!allDeployed && attempts < maxAttempts) {
    attempts++;
    log(`\n📊 Deployment Check #${attempts}`, 'blue');
    log('------------------------', 'blue');
    
    const results = await Promise.all(
      endpoints.map(endpoint => checkEndpoint(endpoint.url, endpoint.name))
    );
    
    allDeployed = true;
    
    for (const result of results) {
      if (result.success) {
        log(`✅ ${result.name}: ${result.status} (${result.responseTime}ms)`, 'green');
      } else {
        log(`⏳ ${result.name}: ${result.status} - ${result.error || 'Still deploying...'}`, 'yellow');
        allDeployed = false;
      }
    }
    
    if (!allDeployed) {
      log(`\n⏱️  Waiting 30 seconds before next check...`, 'yellow');
      await new Promise(resolve => setTimeout(resolve, 30000));
    }
  }
  
  if (allDeployed) {
    log('\n🎉 ALL DEPLOYMENTS SUCCESSFUL!', 'green');
    log('==============================', 'green');
    log('✅ Backend: https://nftsol-server-prod.onrender.com', 'green');
    log('✅ Frontend: https://nftsolmarket.netlify.app', 'green');
    log('\n🚀 Platform is ready for testing!', 'bold');
  } else {
    log('\n⚠️  Deployment monitoring timeout reached', 'yellow');
    log('Deployments may still be in progress. Check manually:', 'yellow');
    log('- Backend: https://nftsol-server-prod.onrender.com/healthz', 'yellow');
    log('- Frontend: https://nftsolmarket.netlify.app', 'yellow');
  }
  
  log('\n📋 Next Steps:', 'blue');
  log('1. Test wallet connections', 'blue');
  log('2. Verify NFT minting functionality', 'blue');
  log('3. Test time capsule sales', 'blue');
  log('4. Verify governance features', 'blue');
  log('5. Check CU monitoring', 'blue');
}

// Run the monitor
monitorDeployments().catch(console.error);
