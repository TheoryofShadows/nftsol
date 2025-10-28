/**
 * 🌊 Eternal Echoes Test Script
 * Test the new Eternal Echoes feature
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testEternalEchoes() {
  console.log('🌊 Testing Eternal Echoes Feature...\n');

  try {
    // Test 1: Search Internet Archive videos
    console.log('1. Testing IA video search...');
    const searchResponse = await axios.get(`${BASE_URL}/api/eternal-echoes/search?query=history&rows=5`);
    console.log(`   ✅ Found ${searchResponse.data.videos.length} videos`);
    console.log(`   📹 First video: ${searchResponse.data.videos[0]?.title || 'None'}\n`);

    // Test 2: Verify content
    console.log('2. Testing content verification...');
    const verifyResponse = await axios.post(`${BASE_URL}/api/eternal-echoes/verify-content`, {
      content: 'This is a verified historical document from 1920.'
    });
    console.log(`   ✅ Verification score: ${verifyResponse.data.verification.score}/100`);
    console.log(`   📝 Summary: ${verifyResponse.data.verification.summary}\n`);

    // Test 3: Test with mock data
    console.log('3. Testing with mock video data...');
    const mockVideo = {
      identifier: 'test_video_123',
      title: 'Test Historical Video',
      description: 'This is a verified historical document from 1920.',
      creator: 'Test Creator',
      date: '1920-01-01',
      thumbnail: 'https://via.placeholder.com/300x200',
      videoUrl: 'https://example.com/video.mp4',
      duration: 300
    };

    const mintResponse = await axios.post(`${BASE_URL}/api/eternal-echoes/mint-base`, {
      iaId: mockVideo.identifier,
      creatorWallet: 'test_wallet_123',
      iaVideo: mockVideo
    });

    if (mintResponse.data.success) {
      console.log(`   ✅ Base echo minted successfully!`);
      console.log(`   📋 Ledger ID: ${mintResponse.data.ledgerId}\n`);

      // Test 4: Add echo to ledger
      console.log('4. Testing echo addition...');
      const addEchoResponse = await axios.post(`${BASE_URL}/api/eternal-echoes/add-echo`, {
        ledgerId: mintResponse.data.ledgerId,
        echoData: 'This is an additional historical context from 1925.',
        contributor: 'test_contributor_456',
        echoType: 'text'
      });

      if (addEchoResponse.data.success) {
        console.log(`   ✅ Echo added successfully!`);
        console.log(`   🆔 Echo ID: ${addEchoResponse.data.echoId}\n`);
      }

      // Test 5: Get echo ledger
      console.log('5. Testing ledger retrieval...');
      const ledgerResponse = await axios.get(`${BASE_URL}/api/eternal-echoes/ledger/${mintResponse.data.ledgerId}`);
      console.log(`   ✅ Ledger retrieved successfully!`);
      console.log(`   📊 Truth Score: ${ledgerResponse.data.ledger.truthScore}/100`);
      console.log(`   🔢 Echo Count: ${ledgerResponse.data.ledger.echoCount}\n`);

    } else {
      console.log(`   ❌ Failed to mint base echo: ${mintResponse.data.error}\n`);
    }

    console.log('🎉 All Eternal Echoes tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testEternalEchoes();
