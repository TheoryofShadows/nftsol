/**
 * 🧪 Test Grokipedia Integration
 * Tests the free public Grokipedia API integration
 */

const axios = require('axios');

// Test Grokipedia API endpoints
const testGrokipediaAPI = async () => {
  console.log('🔍 Testing Grokipedia Free Public API...\n');

  try {
    // Test 1: Search API
    console.log('1. Testing Grokipedia Search API...');
    const searchResponse = await axios.get('https://grokipedia.org/api/search', {
      params: {
        q: 'artificial intelligence',
        format: 'json',
        limit: 5
      },
      timeout: 10000
    });

    if (searchResponse.data && searchResponse.data.results) {
      console.log('✅ Search API working - found', searchResponse.data.results.length, 'results');
      console.log('   Sample result:', searchResponse.data.results[0]?.title || 'N/A');
    } else {
      console.log('⚠️ Search API returned unexpected format');
    }
  } catch (error) {
    console.log('❌ Search API failed:', error.message);
  }

  try {
    // Test 2: Summary API
    console.log('\n2. Testing Grokipedia Summary API...');
    const summaryResponse = await axios.get('https://grokipedia.org/api/summary', {
      params: {
        q: 'blockchain',
        format: 'json'
      },
      timeout: 10000
    });

    if (summaryResponse.data && summaryResponse.data.summary) {
      console.log('✅ Summary API working');
      console.log('   Summary preview:', summaryResponse.data.summary.substring(0, 100) + '...');
    } else {
      console.log('⚠️ Summary API returned unexpected format');
    }
  } catch (error) {
    console.log('❌ Summary API failed:', error.message);
  }

  try {
    // Test 3: Content verification simulation
    console.log('\n3. Testing content verification simulation...');
    const testContent = "This is a verified historical documentary about World War II with factual evidence and official documentation.";
    
    // Extract key terms (simplified version)
    const keyTerms = testContent.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !['this', 'that', 'with', 'about', 'documentation'].includes(word))
      .slice(0, 3);

    console.log('   Key terms extracted:', keyTerms);
    
    let verifiedTerms = 0;
    for (const term of keyTerms) {
      try {
        const response = await axios.get('https://grokipedia.org/api/search', {
          params: { q: term, format: 'json', limit: 1 },
          timeout: 5000
        });
        
        if (response.data && response.data.results && response.data.results.length > 0) {
          verifiedTerms++;
          console.log(`   ✅ "${term}" verified in Grokipedia`);
        }
      } catch (error) {
        console.log(`   ⚠️ "${term}" search failed:`, error.message);
      }
    }

    const score = (verifiedTerms / keyTerms.length) * 100;
    console.log(`   📊 Verification score: ${Math.round(score)}% (${verifiedTerms}/${keyTerms.length} terms verified)`);

  } catch (error) {
    console.log('❌ Content verification test failed:', error.message);
  }

  console.log('\n🎯 Grokipedia Integration Test Complete!');
  console.log('💡 No API key required - using free public data!');
};

// Run the test
testGrokipediaAPI().catch(console.error);