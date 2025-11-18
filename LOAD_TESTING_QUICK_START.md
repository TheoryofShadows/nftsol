# Load Testing - Quick Start (5 Minutes)

## Install k6

```bash
# macOS
brew install k6

# Linux (Ubuntu)
sudo apt-get install k6

# Windows (Chocolatey)
choco install k6

# Docker
docker run grafana/k6 run /path/to/script.js
```

## Create First Test

```javascript
// scripts/basic-load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 10,           // 10 virtual users
  duration: '30s'    // 30 seconds
};

export default function () {
  const res = http.get('https://nftsol.onrender.com/health');

  check(res, {
    'status is 200': (r) => r.status === 200
  });

  sleep(1);
}
```

## Run Test

```bash
# Basic test
k6 run scripts/basic-load-test.js

# Save results
k6 run -o json=results.json scripts/basic-load-test.js

# With custom URL
k6 run --env BASE_URL=http://localhost:3001 scripts/basic-load-test.js
```

## What You'll See

```
HTTP Requests & Responses
  http_reqs..................: 300 [58.823597/s]
  http_req_duration..........: avg=170ms p(95)=289ms p(99)=405ms
  http_req_failed............: 0%
  vus........................: 10
  vus_max....................: 10
```

## Pre-Built Scripts

### Smoke Test (1 minute)
```bash
k6 run smoke-test.js
```
Simple check that service works

### Load Test (10 minutes)
```bash
k6 run load-test.js
```
Normal peak load scenario

### Stress Test (20 minutes)
```bash
k6 run stress-test.js
```
Find the breaking point

## Script Templates

### Basic GET
```javascript
import http from 'k6/http';
import { check } from 'k6';

export default function () {
  const res = http.get('https://api.example.com/data');
  check(res, {
    'status 200': (r) => r.status === 200
  });
}
```

### POST with Body
```javascript
const payload = JSON.stringify({
  name: 'Test',
  value: 123
});

const res = http.post('https://api.example.com/create', payload, {
  headers: { 'Content-Type': 'application/json' }
});
```

### Authentication
```javascript
const params = {
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  }
};

const res = http.get('https://api.example.com/protected', params);
```

## Performance Targets

```
Response Time
- Good:     < 200ms
- Acceptable: < 500ms
- Poor:     > 1000ms

Failure Rate
- Good:     0%
- Acceptable: < 1%
- Bad:      > 5%

Load Progression
- Smoke:    1 user, 1 minute
- Load:     10-50 users, 5-10 minutes
- Stress:   100-500 users, 20+ minutes
```

## Options Cheat Sheet

```javascript
export const options = {
  vus: 10,                              // Virtual users
  duration: '30s',                      // Duration

  // Or use stages for progression
  stages: [
    { duration: '2m', target: 10 },     // Ramp up to 10 users
    { duration: '5m', target: 10 },     // Stay at 10 users
    { duration: '2m', target: 0 }       // Ramp down to 0
  ],

  // Thresholds (test passes if met)
  thresholds: {
    'http_req_duration': ['p(95)<500'],         // 95% < 500ms
    'http_req_failed': ['rate<0.1'],            // < 10% failures
    'checks': ['rate>0.95']                     // > 95% checks pass
  }
};
```

## Common Checks

```javascript
check(res, {
  // Status
  'status is 200': (r) => r.status === 200,
  'status 2xx': (r) => r.status >= 200 && r.status < 300,

  // Response time
  'response < 500ms': (r) => r.timings.duration < 500,
  'response < 1s': (r) => r.timings.duration < 1000,

  // Body content
  'has data': (r) => JSON.parse(r.body).data !== undefined,
  'success true': (r) => JSON.parse(r.body).success === true,

  // Headers
  'has content-type': (r) => r.headers['Content-Type'] !== undefined
});
```

## Real Examples

### NFT Listing
```javascript
const res = http.get(
  'https://nftsol.onrender.com/api/nfts?limit=20'
);
check(res, {
  'list status 200': (r) => r.status === 200,
  'has NFTs': (r) => JSON.parse(r.body).data.length > 0
});
```

### Marketplace Purchase
```javascript
const payload = JSON.stringify({
  nftId: '123',
  amount: 100
});
const res = http.post(
  'https://nftsol.onrender.com/api/marketplace/purchase',
  payload,
  { headers: { 'Content-Type': 'application/json' } }
);
check(res, {
  'purchase succeeded': (r) => r.status === 201
});
```

## Workflow

```bash
# 1. Create script
vim scripts/my-test.js

# 2. Run locally (few users)
k6 run scripts/my-test.js

# 3. Run with more users
k6 run --vus=20 --duration=1m scripts/my-test.js

# 4. Save results
k6 run -o json=results.json scripts/my-test.js

# 5. View results
cat results.json | jq '.data.samples[] | select(.type=="http") | .value'
```

## Troubleshooting

```bash
# Connection refused?
# → Backend not running or wrong URL

# Too many failures?
# → Reduce VUs or check backend logs

# Out of memory?
# → Split test into smaller pieces

# Want to see detailed errors?
k6 run -v scripts/test.js
```

## Next Steps

1. Run smoke test against your API
2. Create load test for your critical paths
3. Document baseline metrics
4. Run weekly and track trends
5. Set up automated testing in CI/CD

---

**That's it! You can now load test your APIs.** 🚀
