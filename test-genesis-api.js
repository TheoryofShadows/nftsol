/**
 * 🧪 Genesis Protocol API Test
 * Test the Genesis Protocol endpoints
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testGenesisAPI() {
  console.log('🌟 Testing Genesis Protocol API');
  console.log('============================\n');

  try {
    // Test 1: Get service info
    console.log('1️⃣ Testing service info...');
    const infoResponse = await fetch('http://localhost:3000/api/genesis/info');
    const infoData = await infoResponse.json();
    
    if (infoData.success) {
      console.log('✅ Service info retrieved:', infoData.data.name);
      console.log('   Version:', infoData.data.version);
      console.log('   Features:', infoData.data.features.length);
    } else {
      console.log('❌ Failed to get service info:', infoData.error);
    }

    // Test 2: Create a launch
    console.log('\n2️⃣ Testing launch creation...');
    const launchData = {
      name: 'Test Genesis Launch',
      description: 'A test fair launch for compressed NFTs',
      maxSupply: 1000,
      pricePerNFT: 0.01,
      launchDate: '2024-12-01T00:00:00Z',
      whitelistRequired: true,
      maxMintsPerWallet: 2,
      maxMintsPerTransaction: 1,
      antiBotProtection: true,
      tieredAccess: false
    };

    const createResponse = await fetch('http://localhost:3000/api/genesis/launch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(launchData)
    });

    const createData = await createResponse.json();
    
    if (createData.success) {
      console.log('✅ Launch created successfully!');
      console.log('   ID:', createData.data.id);
      console.log('   Name:', createData.data.name);
      console.log('   Status:', createData.data.status);
      console.log('   Max Supply:', createData.data.maxSupply);
      console.log('   Price:', createData.data.pricePerNFT, 'SOL');
      
      const launchId = createData.data.id;

      // Test 3: Get all launches
      console.log('\n3️⃣ Testing get all launches...');
      const launchesResponse = await fetch('http://localhost:3000/api/genesis/launches');
      const launchesData = await launchesResponse.json();
      
      if (launchesData.success) {
        console.log('✅ Launches retrieved:', launchesData.data.length);
        console.log('   Launches:', launchesData.data.map(l => l.name));
      } else {
        console.log('❌ Failed to get launches:', launchesData.error);
      }

      // Test 4: Add to whitelist
      console.log('\n4️⃣ Testing whitelist addition...');
      const whitelistData = {
        walletAddress: '11111111111111111111111111111112',
        tier: 'default',
        maxMints: 2
      };

      const whitelistResponse = await fetch(`http://localhost:3000/api/genesis/launch/${launchId}/whitelist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(whitelistData)
      });

      const whitelistResult = await whitelistResponse.json();
      
      if (whitelistResult.success) {
        console.log('✅ Wallet added to whitelist successfully!');
      } else {
        console.log('❌ Failed to add to whitelist:', whitelistResult.error);
      }

      // Test 5: Get launch details
      console.log('\n5️⃣ Testing get launch details...');
      const detailsResponse = await fetch(`http://localhost:3000/api/genesis/launch/${launchId}`);
      const detailsData = await detailsResponse.json();
      
      if (detailsData.success) {
        console.log('✅ Launch details retrieved!');
        console.log('   Name:', detailsData.data.config.name);
        console.log('   Status:', detailsData.data.status);
        console.log('   Whitelist Size:', detailsData.data.whitelist.length);
        console.log('   Stats:', detailsData.data.stats);
      } else {
        console.log('❌ Failed to get launch details:', detailsData.error);
      }

    } else {
      console.log('❌ Failed to create launch:', createData.error);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }

  console.log('\n🎉 Genesis Protocol API testing completed!');
}

// Run the test
testGenesisAPI();
