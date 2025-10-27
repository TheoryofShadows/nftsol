/**
 * 🧪 NFT Minting Test Script
 * Tests both API-based and Umi-based NFT minting
 */

const { Connection, PublicKey, Keypair } = require('@solana/web3.js');
const fetch = require('node-fetch');

// Test configuration
const RPC_URL = 'https://api.devnet.solana.com';
const API_BASE = 'http://localhost:3000';

async function testAPIMinting() {
  console.log('🧪 Testing API-based NFT minting...');
  
  try {
    const response = await fetch(`${API_BASE}/api/mint`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test NFT',
        description: 'A test NFT created via API',
        imageUrl: 'https://via.placeholder.com/300x300.png',
        collection: 'Test Collection'
      })
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ API minting successful!');
      console.log(`📝 Transaction: ${data.signature}`);
      console.log(`🎨 NFT: ${data.mint}`);
    } else {
      console.log('❌ API minting failed:', data.error);
    }
  } catch (error) {
    console.log('❌ API minting error:', error.message);
  }
}

async function testUmiMinting() {
  console.log('🧪 Testing Umi-based NFT minting...');
  
  try {
    // This would require a wallet connection in the browser
    // For now, we'll just test the server endpoint
    const response = await fetch(`${API_BASE}/api/healthz`);
    const data = await response.json();
    
    if (data.status === 'ok') {
      console.log('✅ Server is healthy and ready for Umi minting');
      console.log('📝 Note: Umi minting requires browser wallet connection');
    } else {
      console.log('❌ Server health check failed');
    }
  } catch (error) {
    console.log('❌ Umi minting test error:', error.message);
  }
}

async function testMetadataUpload() {
  console.log('🧪 Testing metadata upload...');
  
  try {
    const testMetadata = {
      name: 'Test NFT',
      symbol: 'TEST',
      description: 'A test NFT for metadata upload',
      image: 'https://via.placeholder.com/300x300.png',
      properties: {
        files: [{
          uri: 'https://via.placeholder.com/300x300.png',
          type: 'image/png',
          cdn: false
        }],
        category: 'image',
        creators: [{
          address: '11111111111111111111111111111111',
          share: 100,
          verified: true
        }]
      },
      attributes: [],
      seller_fee_basis_points: 500
    };

    const response = await fetch(`${API_BASE}/api/upload-metadata`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testMetadata)
    });

    const data = await response.json();
    
    if (data.uri) {
      console.log('✅ Metadata upload successful!');
      console.log(`📝 URI: ${data.uri}`);
    } else {
      console.log('❌ Metadata upload failed:', data.error);
    }
  } catch (error) {
    console.log('❌ Metadata upload error:', error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting NFT Minting Tests...\n');
  
  await testAPIMinting();
  console.log('');
  
  await testUmiMinting();
  console.log('');
  
  await testMetadataUpload();
  console.log('');
  
  console.log('✅ All tests completed!');
  console.log('\n📝 Next steps:');
  console.log('1. Open http://localhost:5173 in your browser');
  console.log('2. Connect your Solana wallet');
  console.log('3. Try minting an NFT using the UI');
  console.log('4. Check the browser console for detailed logs');
}

runTests().catch(console.error);
