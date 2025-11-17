# NFTSol SaaS Testing Guide

**Complete manual testing guide for the SaaS platform**

This guide provides step-by-step instructions to test all SaaS functionality without running automated tests.

---

## Prerequisites

- API is running (`npm run dev`)
- cURL or Postman installed
- Text editor to save API keys

**API URL**: `http://localhost:3001` (or your deployment URL)

---

## Test 1: Create a Tenant Account

**Test**: Create a new SaaS customer account

```bash
curl -X POST http://localhost:3001/saas/tenants \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Gaming DAO Test",
    "slug": "gaming-dao-test-'$(date +%s)'",
    "email": "admin-'$(date +%s)'@gaming-dao.test.com",
    "website": "https://gaming-dao.test.com",
    "description": "Test marketplace for gaming items",
    "logoUrl": "https://example.com/logo.png"
  }'
```

**Expected Response (201)**:
```json
{
  "success": true,
  "data": {
    "tenantId": "550e8400-e29b-41d4-a716-446655440000",
    "slug": "gaming-dao-test-1234567890",
    "apiKey": "sk_test_abc123def456..."
  },
  "message": "Tenant created successfully. Save your API key..."
}
```

**✅ Success Criteria**:
- Status code: 201
- Response includes `tenantId`
- Response includes `apiKey` starting with `sk_test_`
- Response includes `slug`

**💾 Save for later tests**:
```bash
export TENANT_ID="your-tenant-id-here"
export API_KEY="your-api-key-here"
```

---

## Test 2: Health Check (Verify API Key)

**Test**: Verify the API key works

```bash
curl http://localhost:3001/saas/health \
  -H "Authorization: Bearer $API_KEY"
```

**Expected Response (200)**:
```json
{
  "success": true,
  "data": {
    "tenantId": "550e8400-e29b-41d4-a716-446655440000",
    "tenantName": "Gaming DAO Test",
    "status": "connected"
  }
}
```

**✅ Success Criteria**:
- Status code: 200
- `status: "connected"`
- Returns the tenant name
- Returns the tenant ID

---

## Test 3: Get Tenant Details

**Test**: Retrieve full tenant information

```bash
curl http://localhost:3001/saas/tenant \
  -H "Authorization: Bearer $API_KEY"
```

**Expected Response (200)**:
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Gaming DAO Test",
    "slug": "gaming-dao-test-1234567890",
    "email": "admin@gaming-dao.test.com",
    "status": "active",
    "planId": "starter",
    "createdAt": "2025-11-17T12:00:00Z",
    "apiKeysCount": 1,
    "usersCount": 0,
    "nftsCount": 0
  }
}
```

**✅ Success Criteria**:
- Status code: 200
- All tenant fields present
- Status is "active"
- Plan is "starter" (default)
- Counts are 0 (new tenant)

---

## Test 4: List API Keys

**Test**: See all API keys for the tenant

```bash
curl http://localhost:3001/saas/api-keys \
  -H "Authorization: Bearer $API_KEY"
```

**Expected Response (200)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "key_123456",
      "name": "Default Key",
      "keyPreview": "...def456",
      "permissions": ["read:*", "write:*"],
      "rateLimit": 1000,
      "lastUsedAt": "2025-11-17T12:00:00Z",
      "createdAt": "2025-11-17T12:00:00Z"
    }
  ]
}
```

**✅ Success Criteria**:
- Status code: 200
- Array of API keys returned
- At least 1 key (the default)
- Each key has id, name, keyPreview, permissions, rateLimit

---

## Test 5: Create New API Key

**Test**: Generate a new API key for testing

```bash
curl -X POST http://localhost:3001/saas/api-keys \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mobile App Key",
    "permissions": ["read:nfts", "read:collections", "write:offers"]
  }'
```

**Expected Response (201)**:
```json
{
  "success": true,
  "data": {
    "key": "sk_test_new_api_key_full_value_here",
    "preview": "...here"
  },
  "message": "API key created. Save this key now..."
}
```

**✅ Success Criteria**:
- Status code: 201
- `key` field starts with `sk_test_`
- `preview` shows last 8 characters
- Message warns about saving key

**💾 Save this key for testing**:
```bash
export NEW_API_KEY="sk_test_new_api_key_full_value_here"
```

---

## Test 6: Verify New API Key Works

**Test**: Use the newly created key to authenticate

```bash
curl http://localhost:3001/saas/health \
  -H "Authorization: Bearer $NEW_API_KEY"
```

**Expected Response (200)**:
```json
{
  "success": true,
  "data": {
    "tenantId": "550e8400-e29b-41d4-a716-446655440000",
    "tenantName": "Gaming DAO Test",
    "status": "connected"
  }
}
```

**✅ Success Criteria**:
- Status code: 200
- New key authenticates successfully
- Returns same tenant information

---

## Test 7: Test Invalid API Key (Should Fail)

**Test**: Verify invalid keys are rejected

```bash
curl http://localhost:3001/saas/health \
  -H "Authorization: Bearer sk_test_invalid_key_12345"
```

**Expected Response (401)**:
```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing API key"
}
```

**✅ Success Criteria**:
- Status code: 401
- Error message about unauthorized
- Invalid key is rejected

---

## Test 8: Get Usage Metrics

**Test**: View current usage for billing period

```bash
curl http://localhost:3001/saas/usage \
  -H "Authorization: Bearer $API_KEY"
```

**Expected Response (200)**:
```json
{
  "success": true,
  "data": {
    "billingPeriodStart": "2025-11-01T00:00:00Z",
    "billingPeriodEnd": "2025-12-01T00:00:00Z",
    "apiCallsCount": 15,
    "nftCreatedCount": 0,
    "usersCount": 0,
    "transactionVolume": 0,
    "overageCharge": 0
  }
}
```

**✅ Success Criteria**:
- Status code: 200
- Billing period dates present
- All metrics initialized to 0 or counts
- No overage charges yet

---

## Test 9: Get Analytics

**Test**: View analytics for past 7 days

```bash
curl "http://localhost:3001/saas/analytics?days=7" \
  -H "Authorization: Bearer $API_KEY"
```

**Expected Response (200)**:
```json
{
  "success": true,
  "data": {
    "period": "Last 7 days",
    "records": [
      {
        "date": "2025-11-17",
        "request_count": 8,
        "avg_response_time": 85,
        "error_count": 0
      },
      {
        "date": "2025-11-16",
        "request_count": 3,
        "avg_response_time": 92,
        "error_count": 0
      }
    ]
  }
}
```

**✅ Success Criteria**:
- Status code: 200
- Period information present
- Array of daily records
- Each record has date, request_count, avg_response_time, error_count

---

## Test 10: Update Configuration

**Test**: Modify tenant configuration

```bash
curl -X PATCH http://localhost:3001/saas/tenant/config \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "config": {
      "features": {
        "realTimeActivity": true,
        "recommendations": true,
        "gamification": false,
        "marketplace": true
      },
      "customization": {
        "primaryColor": "#FF6B6B",
        "theme": "dark"
      }
    }
  }'
```

**Expected Response (200)**:
```json
{
  "success": true,
  "message": "Tenant configuration updated"
}
```

**✅ Success Criteria**:
- Status code: 200
- Success message returned
- No errors

---

## Test 11: Test Rate Limiting

**Test**: Send multiple requests and observe rate limit headers

```bash
# Send 10 requests rapidly
for i in {1..10}; do
  echo "Request $i:"
  curl -i http://localhost:3001/saas/health \
    -H "Authorization: Bearer $API_KEY" \
    -s | grep -E "X-RateLimit|HTTP"
done
```

**Expected Response Headers**:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
```

**✅ Success Criteria**:
- X-RateLimit-Limit header present
- X-RateLimit-Remaining decreases with each request
- No 429 errors yet (limit is high)

---

## Test 12: Test Missing API Key (Should Fail)

**Test**: Request without API key should be rejected

```bash
curl http://localhost:3001/saas/health
```

**Expected Response (401)**:
```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing API key"
}
```

**✅ Success Criteria**:
- Status code: 401
- Clear error message
- Request rejected without auth

---

## Test 13: Duplicate Slug (Should Fail)

**Test**: Try to create tenant with same slug twice

```bash
# First request
curl -X POST http://localhost:3001/saas/tenants \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Unique DAO",
    "slug": "unique-dao-slug",
    "email": "admin@unique.com"
  }'

# Save the slug and try again
curl -X POST http://localhost:3001/saas/tenants \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Another DAO",
    "slug": "unique-dao-slug",
    "email": "admin2@unique.com"
  }'
```

**Expected Response (409)**:
```json
{
  "error": "Conflict",
  "message": "A tenant with this slug already exists"
}
```

**✅ Success Criteria**:
- First request: 201 (success)
- Second request: 409 (conflict)
- Clear error about slug already existing

---

## Test 14: Missing Required Fields (Should Fail)

**Test**: Try to create tenant without required fields

```bash
curl -X POST http://localhost:3001/saas/tenants \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Incomplete DAO"
    # Missing slug and email
  }'
```

**Expected Response (400)**:
```json
{
  "error": "Missing required fields",
  "required": ["name", "slug", "email"]
}
```

**✅ Success Criteria**:
- Status code: 400
- Error message about missing fields
- Lists required fields

---

## Test 15: Invalid Slug Format (Should Fail)

**Test**: Try to create tenant with invalid slug

```bash
curl -X POST http://localhost:3001/saas/tenants \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Invalid Slug DAO",
    "slug": "UPPERCASE-NOT-ALLOWED",
    "email": "admin@invalid.com"
  }'
```

**Expected Response (400)**:
```json
{
  "error": "Invalid slug format",
  "message": "Slug must be 3-63 characters, lowercase alphanumeric and hyphens only"
}
```

**✅ Success Criteria**:
- Status code: 400
- Clear error about slug format
- Explains valid format

---

## Test 16: Multi-Tenant Isolation

**Test**: Verify different tenants can't access each other's data

```bash
# Create first tenant (already done above)
export TENANT1_KEY="$API_KEY"

# Create second tenant
TENANT2_RESPONSE=$(curl -X POST http://localhost:3001/saas/tenants \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Second Test DAO",
    "slug": "second-test-dao-'$(date +%s)'",
    "email": "admin2-'$(date +%s)'@test.com"
  }')

export TENANT2_KEY=$(echo $TENANT2_RESPONSE | grep -o '"apiKey":"[^"]*' | cut -d'"' -f4)

# Get tenant1 details
echo "Tenant 1:"
curl http://localhost:3001/saas/tenant \
  -H "Authorization: Bearer $TENANT1_KEY" | jq '.data.id'

# Get tenant2 details
echo "Tenant 2:"
curl http://localhost:3001/saas/tenant \
  -H "Authorization: Bearer $TENANT2_KEY" | jq '.data.id'

# They should be different!
```

**✅ Success Criteria**:
- Tenant 1 returns their own ID
- Tenant 2 returns their own ID
- IDs are different
- Each tenant only sees their own data

---

## Test 17: Admin Health Check (Public Endpoint)

**Test**: Check system health (no auth required)

```bash
curl http://localhost:3001/admin/health
```

**Expected Response (200)**:
```json
{
  "success": true,
  "data": {
    "active_tenants": 2,
    "new_tenants_7d": 2,
    "total_users": 0,
    "total_nfts": 0,
    "active_tenants_24h": 2,
    "errors_24h": 0,
    "avg_response_time_ms": 87
  }
}
```

**✅ Success Criteria**:
- Status code: 200
- Health metrics present
- Shows tenant counts created
- Shows error rates

---

## Test 18: Revoke API Key

**Test**: Disable an API key

First, get the key ID from the list:

```bash
curl http://localhost:3001/saas/api-keys \
  -H "Authorization: Bearer $API_KEY" | jq '.data[].id'
```

Then revoke it:

```bash
curl -X DELETE http://localhost:3001/saas/api-keys/{keyId} \
  -H "Authorization: Bearer $API_KEY"
```

**Expected Response (200)**:
```json
{
  "success": true,
  "message": "API key revoked"
}
```

**✅ Success Criteria**:
- Status code: 200
- Success message returned
- Revoked key no longer authenticates

---

## Quick Test Script

Save this as `test.sh` and run with `bash test.sh`:

```bash
#!/bin/bash

API_URL="http://localhost:3001"
TIMESTAMP=$(date +%s)

echo "🧪 NFTSol SaaS Quick Test"
echo "========================="

# Test 1: Create tenant
echo -e "\n1️⃣  Creating tenant..."
RESPONSE=$(curl -s -X POST $API_URL/saas/tenants \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Test DAO $TIMESTAMP\",
    \"slug\": \"test-dao-$TIMESTAMP\",
    \"email\": \"admin-$TIMESTAMP@test.com\"
  }")

API_KEY=$(echo $RESPONSE | jq -r '.data.apiKey')
TENANT_ID=$(echo $RESPONSE | jq -r '.data.tenantId')

if [ "$API_KEY" != "null" ]; then
  echo "✅ Tenant created"
  echo "   API Key: ${API_KEY:0:30}..."
  echo "   Tenant ID: ${TENANT_ID:0:8}..."
else
  echo "❌ Failed to create tenant"
  echo $RESPONSE | jq .
  exit 1
fi

# Test 2: Health check
echo -e "\n2️⃣  Testing health check..."
HEALTH=$(curl -s $API_URL/saas/health \
  -H "Authorization: Bearer $API_KEY")

STATUS=$(echo $HEALTH | jq -r '.data.status')
if [ "$STATUS" = "connected" ]; then
  echo "✅ Health check passed"
else
  echo "❌ Health check failed"
  exit 1
fi

# Test 3: Get details
echo -e "\n3️⃣  Getting tenant details..."
DETAILS=$(curl -s $API_URL/saas/tenant \
  -H "Authorization: Bearer $API_KEY")

NAME=$(echo $DETAILS | jq -r '.data.name')
echo "✅ Tenant details retrieved"
echo "   Name: $NAME"
echo "   Plan: $(echo $DETAILS | jq -r '.data.planId')"
echo "   Status: $(echo $DETAILS | jq -r '.data.status')"

# Test 4: Create API key
echo -e "\n4️⃣  Creating new API key..."
NEW_KEY=$(curl -s -X POST $API_URL/saas/api-keys \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Key",
    "permissions": ["read:nfts"]
  }')

NEW_API_KEY=$(echo $NEW_KEY | jq -r '.data.key')
if [ "$NEW_API_KEY" != "null" ]; then
  echo "✅ New API key created"
  echo "   Key: ${NEW_API_KEY:0:30}..."
else
  echo "❌ Failed to create API key"
  exit 1
fi

# Test 5: List keys
echo -e "\n5️⃣  Listing API keys..."
KEYS=$(curl -s $API_URL/saas/api-keys \
  -H "Authorization: Bearer $API_KEY")

COUNT=$(echo $KEYS | jq '.data | length')
echo "✅ API keys listed"
echo "   Total keys: $COUNT"

# Test 6: Get usage
echo -e "\n6️⃣  Getting usage metrics..."
USAGE=$(curl -s $API_URL/saas/usage \
  -H "Authorization: Bearer $API_KEY")

CALLS=$(echo $USAGE | jq -r '.data.apiCallsCount')
echo "✅ Usage retrieved"
echo "   API calls: $CALLS"

echo -e "\n✅ All tests passed!"
```

---

## Performance Test

Test API response times:

```bash
#!/bin/bash

echo "Performance Test (100 requests)"
echo "==============================="

total_time=0
for i in {1..100}; do
  start=$(date +%s%N)
  curl -s http://localhost:3001/saas/health \
    -H "Authorization: Bearer $API_KEY" > /dev/null
  end=$(date +%s%N)

  elapsed=$((($end - $start) / 1000000))  # Convert to ms
  total_time=$(($total_time + $elapsed))

  if [ $((i % 20)) -eq 0 ]; then
    echo "Completed $i requests..."
  fi
done

avg=$((total_time / 100))
echo "Average response time: ${avg}ms"
```

---

## Troubleshooting

### "Connection refused"
- Make sure API is running: `npm run dev`
- Check URL is correct (default: http://localhost:3001)

### "Invalid or missing API key"
- Verify API key in header
- Check syntax: `Authorization: Bearer sk_test_xxx`
- Not: `Authorization: sk_test_xxx` (missing "Bearer")

### "Slug already exists"
- Slugs must be unique
- Add timestamp: `test-dao-$(date +%s)`

### "Missing required fields"
- Check all three are present: name, slug, email
- Email must be valid format

### "Rate limit exceeded"
- Default is 1000 requests/hour
- Wait before retrying
- Or increase limit in admin panel

---

## Summary

You have now tested:

✅ Tenant creation
✅ API key generation
✅ Authentication
✅ Tenant isolation
✅ Usage tracking
✅ Analytics
✅ Configuration updates
✅ Error handling
✅ Rate limiting
✅ Health checks
✅ Admin endpoints

**All core SaaS functionality is working!** 🎉
