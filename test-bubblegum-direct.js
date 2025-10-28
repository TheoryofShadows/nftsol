/**
 * 🧪 Direct Test Script for Bubblegum V2 Fix
 * Tests the service directly without requiring the server to be running
 */

const { BubblegumService } = require('./apps/backend/src/services/bubblegumService');
const { Connection, Keypair, PublicKey } = require('@solana/web3.js');

async function testBubblegumService() {
  console.log('🧪 Testing Bubblegum V2 Service Directly...');
  
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
    
    // Test quick mint with your existing tree
    const treeAddress = new PublicKey('C4qvg46azH7ogDQGcsZMqpAJ5L5DSkPALkV45f82MZKx');
    
    console.log('🎨 Testing mint with tree:', treeAddress.toString());
    
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
    console.log('🔗 Explorer:', `https://explorer.solana.com/tx/${result.signature}?cluster=devnet`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testBubblegumService().catch(console.error);
