/**
 * 🧪 Detailed Test Script for Bubblegum V2 Fix
 * Tests the service with detailed error reporting
 */

const API_BASE = 'http://localhost:3000/api/bubblegum';

async function testServiceInfo() {
  console.log('🔍 Checking service status...');
  
  try {
    const response = await fetch(`${API_BASE}/info`);
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Service is ready!');
      console.log('Status:', result.data.status);
      console.log('Version:', result.data.version);
      return true;
    } else {
      console.log('❌ Service not ready:', result.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Service check failed:', error.message);
    return false;
  }
}

async function testQuickMint() {
  console.log('🧪 Testing Bubblegum V2 Fix...');
  console.log('Tree: C4qvg46azH7ogDQGcsZMqpAJ5L5DSkPALkV45f82MZKx');
  
  try {
    const response = await fetch(`${API_BASE}/quick-test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Yooo cNFT Test',
        symbol: 'NSOL',
        description: 'Testing the 0x1773 fix!',
        image: 'https://arweave.net/placeholder.png'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ HTTP Error:', response.status, response.statusText);
      console.log('Error details:', errorText);
      return;
    }

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ SUCCESS! cNFT minted successfully!');
      console.log('📝 Transaction:', result.data.signature);
      console.log('🔗 Explorer:', result.data.explorerUrl);
      console.log('📄 Metadata URI:', result.data.uri);
      console.log('🎯 Asset ID:', result.data.assetId);
    } else {
      console.log('❌ FAILED:', result.error);
      console.log('Details:', result.details);
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting Detailed Bubblegum V2 Fix Tests\n');
  
  const serviceReady = await testServiceInfo();
  if (serviceReady) {
    await testQuickMint();
  }
  
  console.log('\n🎉 Test complete!');
  console.log('If successful, the 0x1773 error is fixed!');
  console.log('You can now proceed with bulk minting.');
}

// Run the tests
runTests().catch(console.error);
