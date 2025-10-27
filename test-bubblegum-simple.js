/**
 * 🚀 Simple Bubblegum v2 Test
 * Tests the API endpoints directly
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const API_BASE = 'http://localhost:3000';

async function testBubblegumAPI() {
  console.log('🚀 Testing Bubblegum v2 API');
  console.log('============================');
  
  try {
    // Test 1: Get service info
    console.log('\n1️⃣ Testing service info...');
    const infoResponse = await fetch(`${API_BASE}/api/bubblegum/info`);
    const infoData = await infoResponse.json();
    
    if (infoData.success) {
      console.log('✅ Service info retrieved:', infoData.data);
    } else {
      console.log('❌ Failed to get service info:', infoData.error);
    }

    // Test 2: Create tree
    console.log('\n2️⃣ Testing tree creation...');
    const treeResponse = await fetch(`${API_BASE}/api/bubblegum/create-tree`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        maxDepth: 14,
        maxBufferSize: 64,
        canopyDepth: 0
      })
    });
    
    const treeData = await treeResponse.json();
    
    if (treeData.success) {
      console.log('✅ Tree created successfully!');
      console.log(`Tree Address: ${treeData.data.treeAddress}`);
      console.log(`Capacity: ${treeData.data.capacity.toLocaleString()} NFTs`);
      
      // Test 3: Mint single NFT
      console.log('\n3️⃣ Testing single NFT mint...');
      const mintResponse = await fetch(`${API_BASE}/api/bubblegum/mint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          treeAddress: treeData.data.treeAddress,
          metadata: {
            name: 'Test cNFT #1',
            symbol: 'TEST',
            description: 'A test compressed NFT',
            image: 'https://via.placeholder.com/300x300/00ff00/ffffff?text=Test+cNFT'
          }
        })
      });
      
      const mintData = await mintResponse.json();
      
      if (mintData.success) {
        console.log('✅ Single cNFT minted successfully!');
        console.log(`Asset ID: ${mintData.data.assetId}`);
        console.log(`Transaction: ${mintData.data.signature}`);
      } else {
        console.log('❌ Failed to mint single NFT:', mintData.error);
      }

      // Test 4: Test Merkle proof
      console.log('\n4️⃣ Testing Merkle proof...');
      const proofResponse = await fetch(`${API_BASE}/api/bubblegum/merkle-proof?treeAddress=${treeData.data.treeAddress}&leafIndex=0`);
      const proofData = await proofResponse.json();
      
      if (proofData.success) {
        console.log('✅ Merkle proof retrieved:', proofData.data.proof);
        
        // Test 5: Verify proof
        console.log('\n5️⃣ Testing proof verification...');
        const verifyResponse = await fetch(`${API_BASE}/api/bubblegum/verify-proof`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            treeAddress: treeData.data.treeAddress,
            leafIndex: 0,
            proof: proofData.data.proof
          })
        });
        
        const verifyData = await verifyResponse.json();
        
        if (verifyData.success) {
          console.log(`✅ Proof verification: ${verifyData.data.valid ? 'valid' : 'invalid'}`);
        } else {
          console.log('❌ Failed to verify proof:', verifyData.error);
        }
      } else {
        console.log('❌ Failed to get Merkle proof:', proofData.error);
      }
      
    } else {
      console.log('❌ Failed to create tree:', treeData.error);
      console.log('Details:', treeData.details);
    }

    console.log('\n🎉 API testing completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\nMake sure the backend server is running:');
    console.log('cd apps/backend && npm run dev');
  }
}

// Run the test
testBubblegumAPI();
