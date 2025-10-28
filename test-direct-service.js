/**
 * 🧪 Direct Service Test Script
 * Tests the BubblegumService directly without going through the API
 */

// Import the service directly
const { BubblegumService } = require('./apps/backend/src/services/bubblegumService');
const { Connection, Keypair } = require('@solana/web3.js');

async function testDirectService() {
  console.log('🧪 Testing BubblegumService directly...');
  
  try {
    // Create connection
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    
    // Create service
    const service = new BubblegumService(connection, 'https://api.devnet.solana.com');
    
    // Create test keypair
    const testKeypair = Keypair.generate();
    console.log('🔑 Generated test keypair:', testKeypair.publicKey.toString());
    
    // Set signer
    service.setSigner(testKeypair);
    
    // Test quick mint
    console.log('🎨 Testing quickMintTest...');
    const result = await service.quickMintTest({
      name: 'Yooo cNFT Test',
      symbol: 'NSOL',
      description: 'Testing the 0x1773 fix!',
      image: 'https://arweave.net/placeholder.png'
    });
    
    console.log('✅ SUCCESS! cNFT minted successfully!');
    console.log('📝 Transaction:', result.signature);
    console.log('📄 Metadata URI:', result.uri);
    console.log('🎯 Asset ID:', result.assetId);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testDirectService().catch(console.error);
