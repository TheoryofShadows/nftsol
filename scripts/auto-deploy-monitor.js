#!/usr/bin/env node

/**
 * Auto-Deploy Monitor for CLOUT Token
 * 
 * Monitors treasury wallet balance and automatically deploys CLOUT token
 * when sufficient SOL is available for deployment fees.
 */

import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { deployCloutToken } from './deploy-clout-token.js';
import { checkTokenStatus } from './check-token-status.js';

// Configuration
const NETWORK = process.env.SOLANA_NETWORK || 'mainnet-beta';
const RPC_URL = process.env.VITE_SOLANA_RPC_URL || clusterApiUrl(NETWORK);
const TREASURY_ADDRESS = 'FsoPx1WmXA6FDxYTSULRDko3tKbNG7KxdRTq2icQJGjM';
const REQUIRED_SOL = 0.01; // Minimum SOL required for deployment
const CHECK_INTERVAL = 30000; // Check every 30 seconds

let isMonitoring = false;
let deploymentAttempted = false;

async function checkBalanceAndDeploy() {
  try {
    // First check if token is already deployed
    const tokenStatus = await checkTokenStatus();
    if (tokenStatus.deployed) {
      console.log('✅ CLOUT token already deployed');
      console.log(`📍 Mint Address: ${tokenStatus.mintAddress}`);
      console.log('🎉 Monitoring complete - token deployment successful!');
      return { deployed: true, existing: true };
    }

    // Check treasury balance
    const connection = new Connection(RPC_URL, 'confirmed');
    const treasuryPubkey = new PublicKey(TREASURY_ADDRESS);
    const balance = await connection.getBalance(treasuryPubkey);
    const solBalance = balance / 1e9;

    console.log(`💰 Treasury Balance: ${solBalance.toFixed(4)} SOL`);
    console.log(`📊 Required: ${REQUIRED_SOL} SOL`);
    
    if (solBalance >= REQUIRED_SOL) {
      if (!deploymentAttempted) {
        console.log('🚀 Sufficient balance detected! Starting CLOUT token deployment...');
        deploymentAttempted = true;
        
        try {
          const deploymentInfo = await deployCloutToken();
          
          if (deploymentInfo) {
            console.log('\n🎉 AUTO-DEPLOYMENT SUCCESSFUL!');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log(`📍 Mint Address: ${deploymentInfo.mintAddress}`);
            console.log(`🏦 Treasury Account: ${deploymentInfo.treasuryTokenAccount}`);
            console.log(`💰 Total Supply: ${deploymentInfo.totalSupply.toLocaleString()} CLOUT`);
            console.log(`🔗 Explorer: ${deploymentInfo.transactionUrl}`);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('\n✅ Your NFT marketplace now has a complete token economy!');
            console.log('✅ CLOUT rewards are now backed by real SPL tokens');
            console.log('✅ Ready for production deployment and user acquisition');
            
            return { deployed: true, deploymentInfo };
          }
        } catch (deployError) {
          console.error('❌ Auto-deployment failed:', deployError.message);
          deploymentAttempted = false; // Reset to allow retry
          return { deployed: false, error: deployError.message };
        }
      } else {
        console.log('⏳ Deployment already attempted, waiting for completion...');
      }
    } else {
      const needed = REQUIRED_SOL - solBalance;
      console.log(`⏳ Waiting for funding... Need ${needed.toFixed(4)} more SOL`);
      console.log(`📋 Send SOL to: ${TREASURY_ADDRESS}`);
    }

    return { deployed: false, balance: solBalance };

  } catch (error) {
    console.error('❌ Balance check failed:', error.message);
    return { deployed: false, error: error.message };
  }
}

async function startMonitoring() {
  if (isMonitoring) {
    console.log('⚠️  Monitor already running');
    return;
  }

  console.log('🔍 Starting CLOUT Token Auto-Deploy Monitor...');
  console.log(`Network: ${NETWORK}`);
  console.log(`Treasury: ${TREASURY_ADDRESS}`);
  console.log(`Required: ${REQUIRED_SOL} SOL`);
  console.log(`Check Interval: ${CHECK_INTERVAL / 1000} seconds`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  isMonitoring = true;

  // Initial check
  const initialResult = await checkBalanceAndDeploy();
  if (initialResult.deployed) {
    console.log('🎯 Monitoring complete - deployment successful!');
    return initialResult;
  }

  // Start monitoring loop
  const monitorInterval = setInterval(async () => {
    if (!isMonitoring) {
      clearInterval(monitorInterval);
      return;
    }

    const result = await checkBalanceAndDeploy();
    
    if (result.deployed) {
      console.log('🎯 Auto-deployment complete!');
      clearInterval(monitorInterval);
      isMonitoring = false;
      return;
    }
  }, CHECK_INTERVAL);

  // Handle process termination
  process.on('SIGINT', () => {
    console.log('\n📴 Stopping monitor...');
    clearInterval(monitorInterval);
    isMonitoring = false;
    process.exit(0);
  });

  console.log('\n💡 Monitor is running. Press Ctrl+C to stop.');
  console.log('💡 Send SOL to your treasury wallet to trigger automatic deployment.');
}

function stopMonitoring() {
  isMonitoring = false;
  console.log('📴 Monitor stopped');
}

// Run monitoring if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startMonitoring().catch(console.error);
}

export { startMonitoring, stopMonitoring, checkBalanceAndDeploy };