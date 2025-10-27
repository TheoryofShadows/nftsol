/**
 * 🚀 Bubblegum v2 Devnet Testing Script
 * Tests tree creation and compressed NFT minting on devnet
 */

const { Connection, Keypair, PublicKey } = require('@solana/web3.js');
const { BubblegumService } = require('./apps/backend/dist/services/bubblegumService');

// Devnet configuration
const DEVNET_RPC = 'https://api.devnet.solana.com';
const connection = new Connection(DEVNET_RPC);

// Test wallet (you'll need to fund this with devnet SOL)
const testWallet = Keypair.generate();

console.log('🚀 Starting Bubblegum v2 Devnet Test');
console.log('=====================================');
console.log(`Test Wallet: ${testWallet.publicKey.toString()}`);
console.log(`RPC Endpoint: ${DEVNET_RPC}`);
console.log('');

async function testBubblegumService() {
  try {
    // Initialize service
    console.log('1️⃣ Initializing Bubblegum Service...');
    const bubblegumService = new BubblegumService(connection, DEVNET_RPC);
    bubblegumService.setSigner(testWallet);
    console.log('✅ Service initialized');

    // Test service info
    console.log('\n2️⃣ Getting service info...');
    const serviceInfo = bubblegumService.getServiceInfo();
    console.log('Service Info:', JSON.stringify(serviceInfo, null, 2));

    // Test tree creation
    console.log('\n3️⃣ Creating Bubblegum tree...');
    const treeResult = await bubblegumService.createTree({
      maxDepth: 14, // 16,384 NFTs capacity
      maxBufferSize: 64,
      canopyDepth: 0
    });
    console.log('✅ Tree created successfully!');
    console.log(`Tree Address: ${treeResult.treeAddress.toString()}`);
    console.log(`Transaction: ${treeResult.signature}`);

    // Test single NFT mint
    console.log('\n4️⃣ Minting single compressed NFT...');
    const mintResult = await bubblegumService.createCompressedNFT({
      treeAddress: treeResult.treeAddress,
      metadata: {
        name: 'Test cNFT #1',
        symbol: 'TEST',
        description: 'A test compressed NFT on devnet',
        image: 'https://via.placeholder.com/300x300/00ff00/ffffff?text=Test+cNFT',
        attributes: [
          { trait_type: 'Test', value: 'Devnet' },
          { trait_type: 'Type', value: 'Compressed' }
        ]
      }
    });
    console.log('✅ Single cNFT minted successfully!');
    console.log(`Asset ID: ${mintResult.assetId.toString()}`);
    console.log(`Transaction: ${mintResult.signature}`);

    // Test bulk minting
    console.log('\n5️⃣ Testing bulk minting...');
    const bulkMetadatas = [
      {
        name: 'Test cNFT #2',
        symbol: 'TEST',
        description: 'Bulk test compressed NFT #2',
        image: 'https://via.placeholder.com/300x300/ff0000/ffffff?text=Bulk+2'
      },
      {
        name: 'Test cNFT #3',
        symbol: 'TEST',
        description: 'Bulk test compressed NFT #3',
        image: 'https://via.placeholder.com/300x300/0000ff/ffffff?text=Bulk+3'
      }
    ];

    const bulkResult = await bubblegumService.bulkMintCompressedNFTs({
      treeAddress: treeResult.treeAddress,
      metadatas: bulkMetadatas,
      batchSize: 2
    });
    console.log('✅ Bulk minting completed!');
    console.log(`Minted: ${bulkResult.minted}/${bulkMetadatas.length}`);
    console.log(`Total Cost: $${bulkResult.totalCost.toFixed(6)}`);
    console.log(`Signatures: ${bulkResult.signatures.length}`);

    // Test Merkle proof
    console.log('\n6️⃣ Testing Merkle proof...');
    const proof = await bubblegumService.getMerkleProof(treeResult.treeAddress, 0);
    console.log('✅ Merkle proof retrieved:', proof);

    const isValid = await bubblegumService.verifyMerkleProof(treeResult.treeAddress, 0, proof);
    console.log(`✅ Merkle proof verification: ${isValid ? 'valid' : 'invalid'}`);

    console.log('\n🎉 All tests completed successfully!');
    console.log('=====================================');
    console.log('Summary:');
    console.log(`- Tree created: ${treeResult.treeAddress.toString()}`);
    console.log(`- Single mint: ${mintResult.assetId.toString()}`);
    console.log(`- Bulk minted: ${bulkResult.minted} NFTs`);
    console.log(`- Total cost: $${bulkResult.totalCost.toFixed(6)}`);
    console.log(`- Merkle proof: ${isValid ? 'working' : 'not working'}`);

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Check if wallet has SOL
async function checkWalletBalance() {
  try {
    const balance = await connection.getBalance(testWallet.publicKey);
    const solBalance = balance / 1e9;
    
    console.log(`💰 Wallet balance: ${solBalance} SOL`);
    
    if (solBalance < 0.1) {
      console.log('⚠️  Warning: Low SOL balance. Please fund the wallet with devnet SOL:');
      console.log(`   Wallet: ${testWallet.publicKey.toString()}`);
      console.log('   You can get devnet SOL from: https://faucet.solana.com/');
      console.log('');
    }
    
    return solBalance >= 0.1;
  } catch (error) {
    console.error('❌ Error checking wallet balance:', error);
    return false;
  }
}

// Main execution
async function main() {
  console.log('Checking wallet balance...');
  const hasBalance = await checkWalletBalance();
  
  if (!hasBalance) {
    console.log('Please fund the wallet and run the test again.');
    return;
  }
  
  await testBubblegumService();
}

// Run the test
main().catch(console.error);
