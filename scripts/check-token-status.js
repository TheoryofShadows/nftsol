#!/usr/bin/env node

/**
 * CLOUT Token Status Checker
 * 
 * Checks the status of the CLOUT token on Solana network
 */

import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const NETWORK = process.env.SOLANA_NETWORK || 'mainnet-beta';
const RPC_URL = process.env.VITE_SOLANA_RPC_URL || clusterApiUrl(NETWORK);
const TREASURY_ADDRESS = 'FsoPx1WmXA6FDxYTSULRDko3tKbNG7KxdRTq2icQJGjM';

async function checkTokenStatus() {
  let splToken;
  try {
    splToken = await import('@solana/spl-token');
  } catch (error) {
    console.error('⚠️  @solana/spl-token is required to check token status.');
    console.error('    Install it locally with: npm install @solana/spl-token');
    throw error;
  }
  const { getAccount, getMint } = splToken;
  console.log('🔍 Checking CLOUT Token Status...');
  console.log(`Network: ${NETWORK}`);
  console.log(`Treasury: ${TREASURY_ADDRESS}`);

  try {
    // Initialize connection
    const connection = new Connection(RPC_URL, 'confirmed');
    console.log('✅ Connected to Solana network');

    // Check if deployment info exists
    const deploymentPath = path.join(__dirname, '..', 'CLOUT_TOKEN_DEPLOYMENT.json');
    let deploymentInfo = null;
    
    if (fs.existsSync(deploymentPath)) {
      deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
      console.log('✅ Found deployment info');
      
      // Check mint status
      try {
        const mintPubkey = new PublicKey(deploymentInfo.mintAddress);
        const mintInfo = await getMint(connection, mintPubkey);
        
        console.log('\n🪙 CLOUT Token Status:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`📍 Mint Address: ${deploymentInfo.mintAddress}`);
        console.log(`🏦 Treasury Account: ${deploymentInfo.treasuryTokenAccount}`);
        console.log(`💰 Total Supply: ${(Number(mintInfo.supply) / Math.pow(10, mintInfo.decimals)).toLocaleString()} CLOUT`);
        console.log(`🔗 Explorer: ${deploymentInfo.transactionUrl}`);
        console.log(`📅 Deployed: ${new Date(deploymentInfo.deployedAt).toLocaleString()}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        // Check treasury token account balance
        try {
          const treasuryTokenAccount = new PublicKey(deploymentInfo.treasuryTokenAccount);
          const accountInfo = await getAccount(connection, treasuryTokenAccount);
          
          console.log(`\n💼 Treasury Token Balance: ${(Number(accountInfo.amount) / Math.pow(10, mintInfo.decimals)).toLocaleString()} CLOUT`);
        } catch (error) {
          console.log('⚠️  Treasury token account not found or not accessible');
        }
        
        return {
          deployed: true,
          mintAddress: deploymentInfo.mintAddress,
          treasuryAccount: deploymentInfo.treasuryTokenAccount,
          supply: Number(mintInfo.supply) / Math.pow(10, mintInfo.decimals),
          decimals: mintInfo.decimals
        };
        
      } catch (error) {
        console.log('❌ CLOUT token mint not found or not accessible');
        console.log('The token may not be deployed yet or the mint address is incorrect');
        return { deployed: false, error: error.message };
      }
      
    } else {
      console.log('❌ No deployment info found');
      console.log('CLOUT token has not been deployed yet');
      console.log('\n📋 To deploy CLOUT token:');
      console.log('1. Ensure you have SOL in your treasury wallet for deployment fees');
      console.log('2. Run: npm run deploy:clout');
      
      return { deployed: false, reason: 'not_deployed' };
    }

  } catch (error) {
    console.error('❌ Status check failed:', error.message);
    return { deployed: false, error: error.message };
  }
}

// Run check if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  checkTokenStatus().catch(console.error);
}

export { checkTokenStatus };
