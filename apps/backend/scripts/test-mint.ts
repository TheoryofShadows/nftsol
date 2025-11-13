import { UltraCheapMintService } from '../src/services/ultra-cheap-mint';

async function testMint() {
  const mintService = new UltraCheapMintService();
  
  // Test mint parameters
  const params = {
    toAddress: '2AQdpHJ2JpcEgPiATUXjQxA8QmafFegfQwSLWSprPicmD', // Replace with your wallet address
    name: 'Test NFT',
    description: 'Minted with UltraCheapMintService',
    imageUrl: 'https://arweave.net/example-test-image-123',
    symbol: 'TEST',
    attributes: [
      { trait_type: 'Type', value: 'Test' },
      { trait_type: 'Rarity', value: 'Common' }
    ]
  };

  try {
    console.log('Testing mint service...');
    
    // Test estimate
    const estimate = await mintService.estimateCost();
    console.log('Cost estimate:', {
      sol: estimate.solCost,
      usd: estimate.usdCost
    });
    
    // Mint the NFT
    console.log('Minting NFT...');
    const result = await mintService.mint(params);
    
    if (result.success) {
      console.log('✅ Mint successful!', {
        assetId: result.assetId,
        signature: result.signature,
        cost: result.cost,
        costUSD: result.costUSD
      });
    } else {
      console.error('❌ Mint failed:', result.error);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testMint();
