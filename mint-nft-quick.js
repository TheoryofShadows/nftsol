#!/usr/bin/env node

/**
 * 🚀 Quick NFT Minting Script for NFTSol Devnet
 *
 * Usage: node mint-nft-quick.js
 *
 * This script helps you mint an NFT on Solana Devnet without hassle.
 */

const https = require('https');
const http = require('http');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function makeRequest(options, data) {
  return new Promise((resolve, reject) => {
    const protocol = options.protocol === 'https:' ? https : http;
    const req = protocol.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, body });
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function main() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║  🎨 NFTSol Devnet NFT Minter - Quick Start              ║');
  console.log('║  Mint your first NFT in minutes!                        ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  try {
    // Get wallet address
    console.log('📝 NFT Details\n');
    const walletAddress = await question('💰 Your Devnet Wallet Address: ');
    if (!walletAddress.trim()) {
      console.log('❌ Wallet address is required');
      rl.close();
      return;
    }

    const name = await question('📛 NFT Name (e.g., "My Cool NFT"): ');
    if (!name.trim()) {
      console.log('❌ Name is required');
      rl.close();
      return;
    }

    const symbol = await question('🏷️  Symbol (e.g., "MYNFT") [optional]: ') || 'NFT';

    const description =
      (await question('📖 Description [optional]: ')) ||
      'NFT minted on NFTSol Devnet';

    const imageUrl = await question('🖼️  IPFS Image URL (https://ipfs.io/ipfs/...): ');
    if (!imageUrl.trim()) {
      console.log('❌ Image URL is required');
      rl.close();
      return;
    }

    // Validate image URL
    if (!imageUrl.includes('ipfs') && !imageUrl.startsWith('http')) {
      console.log('❌ Image URL must be IPFS or HTTP(S)');
      rl.close();
      return;
    }

    console.log('\n⏳ Processing your minting request...\n');

    // Make the API request
    const minting_options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/mint/ultra-cheap',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      protocol: 'http:',
    };

    const minting_data = {
      toAddress: walletAddress.trim(),
      name: name.trim(),
      symbol: symbol.trim(),
      description: description.trim(),
      imageUrl: imageUrl.trim(),
    };

    console.log('Sending request to NFTSol backend...\n');

    const response = await makeRequest(minting_options, minting_data);

    if (response.statusCode !== 200) {
      console.log(`❌ Server Error (${response.statusCode}):`);
      console.log(response.body);
      rl.close();
      return;
    }

    const result = JSON.parse(response.body);

    if (result.success && result.data) {
      console.log('\n╔════════════════════════════════════════════════════════╗');
      console.log('║                   ✅ SUCCESS! NFT MINTED!                  ║');
      console.log('╚════════════════════════════════════════════════════════╝\n');

      console.log(`📛 Name: ${result.data.name}`);
      console.log(`🪙 Mint Address: ${result.data.mintAddress}`);
      console.log(`💳 Cost: $${(result.data.costUSD || 0).toFixed(6)} USD`);
      console.log(`⛓️  Network: Solana Devnet\n`);

      const explorerUrl = `https://explorer.solana.com/address/${result.data.mintAddress}?cluster=devnet`;
      console.log(`🔗 View on Explorer:\n   ${explorerUrl}\n`);

      const magicEdenUrl = `https://devnet.magiceden.io`;
      console.log(`🎨 View on Magic Eden (Devnet):\n   ${magicEdenUrl}\n`);

      console.log('📖 Transaction Hash:', result.data.signature);
      console.log('\n✨ Your NFT is now on the blockchain!\n');

      // Show next steps
      console.log('📋 Next Steps:');
      console.log('   1. Wait 30 seconds for full blockchain confirmation');
      console.log('   2. Refresh the explorer link to see your NFT');
      console.log('   3. Share your NFT with friends!');
      console.log('   4. Mint more NFTs or list on marketplace\n');
    } else {
      console.log('❌ Minting failed:\n');
      console.log(result.error || result.message || 'Unknown error');

      if (result.code) {
        console.log(`Error Code: ${result.code}`);
      }

      console.log('\n🔧 Troubleshooting:');
      if (result.error && result.error.includes('signer')) {
        console.log('   • Ensure the backend is properly configured with a wallet');
        console.log('   • Set PLATFORM_SECRET_KEY_BASE58 in .env');
      } else if (result.error && result.error.includes('balance')) {
        console.log('   • Get free devnet SOL: solana airdrop 2 <address> --url devnet');
      } else if (result.error && result.error.includes('url')) {
        console.log('   • Ensure image URL is valid and accessible');
        console.log('   • Use IPFS gateway: https://ipfs.io/ipfs/<HASH>');
      }
    }
  } catch (error) {
    console.log('\n❌ Error communicating with server:\n');
    console.log(`${error.message}\n`);

    if (error.code === 'ECONNREFUSED') {
      console.log('🔧 Fix: Make sure the backend is running!');
      console.log('   cd NFTSol && npm run dev\n');
    }

    console.log('For help, see: DEVNET_MINTING_GUIDE.md\n');
  }

  rl.close();
}

main().catch(console.error);
