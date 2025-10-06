
const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}`;

async function testServer() {
  console.log('🧪 Testing NFTSol Server...\n');

  const tests = [
    {
      name: 'Root Endpoint',
      url: `${BASE_URL}/`,
      method: 'GET'
    },
    {
      name: 'Health Check',
      url: `${BASE_URL}/health`,
      method: 'GET'
    },
    {
      name: 'API Health Check',
      url: `${BASE_URL}/api/health`,
      method: 'GET'
    },
    {
      name: 'Wallet Config',
      url: `${BASE_URL}/api/wallet/config`,
      method: 'GET'
    },
    {
      name: 'Webhook Test (GET)',
      url: `${BASE_URL}/api/webhook/test`,
      method: 'GET'
    },
    {
      name: 'Webhook Test (POST)',
      url: `${BASE_URL}/api/webhook/test`,
      method: 'POST',
      body: { test: 'webhook', timestamp: new Date().toISOString() }
    }
  ];

  for (const test of tests) {
    try {
      console.log(`Testing ${test.name}...`);
      
      const options = {
        method: test.method,
        headers: { 'Content-Type': 'application/json' }
      };

      if (test.body) {
        options.body = JSON.stringify(test.body);
      }

      const response = await fetch(test.url, options);
      const data = await response.json();
      
      console.log(`✅ ${test.name}: ${response.status} - ${data.message || data.status || 'OK'}`);
    } catch (error) {
      console.log(`❌ ${test.name}: Failed - ${error.message}`);
    }
  }

  console.log('\n🎯 Server testing complete!');
}

testServer().catch(console.error);
