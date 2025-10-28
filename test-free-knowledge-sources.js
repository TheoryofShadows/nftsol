/**
 * 🧪 Test Free Knowledge Sources Integration
 * Tests Wikipedia, Wikidata, and OpenLibrary APIs (all free, no API keys needed)
 */

const axios = require('axios');

const testFreeKnowledgeSources = async () => {
  console.log('🔍 Testing Free Knowledge Sources (No API Keys Required)...\n');

  const testContent = "This is a verified historical documentary about World War II with factual evidence and official documentation.";
  
  // Extract key terms (simplified version)
  const keyTerms = testContent.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3)
    .filter(word => !['this', 'that', 'with', 'about', 'documentation'].includes(word))
    .slice(0, 3);

  console.log('📝 Test content:', testContent);
  console.log('🔑 Key terms extracted:', keyTerms);
  console.log('');

  let totalScore = 0;
  let verifiedTerms = 0;

  for (const term of keyTerms) {
    console.log(`🔍 Verifying "${term}"...`);
    let termVerified = false;

    // Test Wikipedia API
    try {
      console.log(`   📚 Checking Wikipedia...`);
      const wikiResponse = await axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(term)}`, {
        timeout: 5000
      });

      if (wikiResponse.data && wikiResponse.data.extract) {
        console.log(`   ✅ Found in Wikipedia: ${wikiResponse.data.extract.substring(0, 100)}...`);
        totalScore += 25;
        verifiedTerms++;
        termVerified = true;
      }
    } catch (error) {
      console.log(`   ⚠️ Wikipedia search failed: ${error.message}`);
    }

    // Test Wikidata API if Wikipedia failed
    if (!termVerified) {
      try {
        console.log(`   🗃️ Checking Wikidata...`);
        const wikidataResponse = await axios.get('https://www.wikidata.org/w/api.php', {
          params: {
            action: 'wbsearchentities',
            search: term,
            language: 'en',
            format: 'json'
          },
          timeout: 5000
        });

        if (wikidataResponse.data && wikidataResponse.data.search && wikidataResponse.data.search.length > 0) {
          const result = wikidataResponse.data.search[0];
          console.log(`   ✅ Found in Wikidata: ${result.description || result.label}`);
          totalScore += 20;
          verifiedTerms++;
          termVerified = true;
        }
      } catch (error) {
        console.log(`   ⚠️ Wikidata search failed: ${error.message}`);
      }
    }

    // Test OpenLibrary API if both failed
    if (!termVerified) {
      try {
        console.log(`   📖 Checking OpenLibrary...`);
        const openLibResponse = await axios.get('https://openlibrary.org/search.json', {
          params: {
            title: term,
            limit: 1
          },
          timeout: 5000
        });

        if (openLibResponse.data && openLibResponse.data.docs && openLibResponse.data.docs.length > 0) {
          const result = openLibResponse.data.docs[0];
          console.log(`   ✅ Found in OpenLibrary: ${result.title}`);
          totalScore += 15;
          verifiedTerms++;
          termVerified = true;
        }
      } catch (error) {
        console.log(`   ⚠️ OpenLibrary search failed: ${error.message}`);
      }
    }

    if (!termVerified) {
      console.log(`   ❌ "${term}" not found in any knowledge source`);
    }

    console.log('');
  }

  // Calculate final score
  const baseScore = (totalScore / keyTerms.length) * 1.5;
  const finalScore = Math.min(100, Math.max(0, baseScore));

  console.log('📊 VERIFICATION RESULTS:');
  console.log(`   Terms verified: ${verifiedTerms}/${keyTerms.length}`);
  console.log(`   Total score: ${totalScore}`);
  console.log(`   Final score: ${Math.round(finalScore)}%`);
  console.log(`   Verification status: ${finalScore >= 70 ? '✅ VERIFIED' : '❌ NOT VERIFIED'}`);

  console.log('\n🎉 Free Knowledge Sources Test Complete!');
  console.log('💡 No API keys required - using Wikipedia, Wikidata, and OpenLibrary!');
};

// Run the test
testFreeKnowledgeSources().catch(console.error);