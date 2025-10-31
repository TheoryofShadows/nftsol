// Simple withdrawal test without database
const testData = {
  amount_sol: 0.01,
  to_address: '11111111111111111111111111111112',
  request_token: 'test-token-123',
};

console.log('Testing withdrawal endpoint...');
console.log('Data:', JSON.stringify(testData, null, 2));

// Test the endpoint
fetch('http://localhost:3000/api/wallets/withdraw', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(testData),
})
  .then((response) => response.json())
  .then((data) => {
    console.log('Response:', JSON.stringify(data, null, 2));
  })
  .catch((error) => {
    console.error('Error:', error);
  });
