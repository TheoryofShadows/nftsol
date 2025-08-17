
import assert from 'node:assert';

const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}`;

async function testServer() {
  console.log('🧪 Testing NFTSol Server...\n');

  const tests = [
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

      assert(response.ok, `HTTP error! status: ${response.status}`);

      const contentType = response.headers.get('content-type') || '';
      const data = contentType.includes('application/json')
        ? await response.json()
        : await response.text();

      assert.equal(response.status, 200, `Expected status 200, got ${response.status}`);

      const message = typeof data === 'string'
        ? data
        : data.message || data.status || 'OK';

      console.log(`✅ ${test.name}: ${response.status} - ${message}`);
    } catch (error) {
      console.log(`❌ ${test.name}: Failed - ${error.message}`);
      throw error;
    }
  }

  console.log('\n🎯 Server testing complete!');
}

testServer().catch(err => {
  console.error(err);
  process.exit(1);
});
