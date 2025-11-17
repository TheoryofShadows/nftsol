# NFTSol SaaS - API Documentation

**Version**: 1.0
**Last Updated**: November 17, 2025

---

## Overview

NFTSol SaaS is a white-label NFT marketplace platform as a service. This documentation covers all available API endpoints for managing your SaaS customer account.

### Quick Start

1. **Create Account** → POST `/saas/tenants`
2. **Get API Key** → Save from response (only shown once!)
3. **Set Headers** → `Authorization: Bearer sk_test_xxx`
4. **Make Requests** → Any `/saas/*` endpoint

---

## Authentication

### API Key Format

```
sk_test_xxxxxxxx... (test environment)
sk_live_xxxxxxxx... (production environment)
```

### Adding API Key to Requests

**Option 1: Authorization Header**
```bash
curl https://api.nftsol.xyz/saas/tenant \
  -H "Authorization: Bearer sk_test_abc123def456"
```

**Option 2: X-API-Key Header**
```bash
curl https://api.nftsol.xyz/saas/tenant \
  -H "X-API-Key: sk_test_abc123def456"
```

### Rate Limiting

- **Default**: 1,000 requests per hour
- **Enterprise**: Custom limits
- **Response Headers**:
  - `X-RateLimit-Limit: 1000`
  - `X-RateLimit-Remaining: 999`

---

## Core Endpoints

### 🚀 Create Tenant (Onboard Customer)

**POST** `/saas/tenants`

Creates a new SaaS customer account with an initial API key.

#### Request Body
```json
{
  "name": "Gaming DAO Marketplace",
  "slug": "gaming-dao",
  "email": "admin@gaming-dao.com",
  "website": "https://marketplace.gaming-dao.com",
  "description": "NFT marketplace for gaming items",
  "logoUrl": "https://..."
}
```

#### Response (201 Created)
```json
{
  "success": true,
  "data": {
    "tenantId": "550e8400-e29b-41d4-a716-446655440000",
    "slug": "gaming-dao",
    "apiKey": "sk_test_abc123def456..."
  },
  "message": "Tenant created successfully. Save your API key - it will not be shown again!"
}
```

#### Validation
- **name**: Required, 1-255 chars
- **slug**: Required, 3-63 chars, alphanumeric + hyphens only, must be unique
- **email**: Required, valid email format, must be unique

---

### 📊 Get Tenant Details

**GET** `/saas/tenant`

Requires: API Key

Retrieves current tenant's configuration and statistics.

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Gaming DAO Marketplace",
    "slug": "gaming-dao",
    "email": "admin@gaming-dao.com",
    "status": "active",
    "planId": "pro",
    "createdAt": "2025-11-17T12:00:00Z",
    "apiKeysCount": 2,
    "usersCount": 1250,
    "nftsCount": 3847
  }
}
```

---

### ⚙️ Update Configuration

**PATCH** `/saas/tenant/config`

Requires: API Key

Update marketplace configuration (features, branding, limits).

#### Request Body
```json
{
  "config": {
    "features": {
      "realTimeActivity": true,
      "recommendations": true,
      "gamification": true,
      "marketplace": true,
      "fiatOnramp": false,
      "creator_tools": true,
      "community": true,
      "analytics": true
    },
    "customization": {
      "primaryColor": "#6366f1",
      "secondaryColor": "#8b5cf6",
      "theme": "dark"
    },
    "limits": {
      "maxUsers": 50000,
      "maxNFTs": 500000,
      "maxCollections": 5000
    }
  }
}
```

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Tenant configuration updated"
}
```

---

## API Key Management

### 🔐 List API Keys

**GET** `/saas/api-keys`

Requires: API Key

List all API keys for the tenant.

#### Response (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "id": "key_123456",
      "name": "Production Key",
      "keyPreview": "...def456",
      "permissions": ["read:*", "write:*"],
      "rateLimit": 5000,
      "lastUsedAt": "2025-11-17T14:30:00Z",
      "createdAt": "2025-11-15T10:00:00Z"
    },
    {
      "id": "key_789012",
      "name": "Development Key",
      "keyPreview": "...abc123",
      "permissions": ["read:*"],
      "rateLimit": 1000,
      "lastUsedAt": "2025-11-17T09:15:00Z",
      "createdAt": "2025-11-17T12:00:00Z"
    }
  ]
}
```

---

### ✨ Create New API Key

**POST** `/saas/api-keys`

Requires: API Key

Generate a new API key for your tenant.

#### Request Body
```json
{
  "name": "Mobile App Key",
  "permissions": ["read:nfts", "read:collections", "write:offers"]
}
```

#### Response (201 Created)
```json
{
  "success": true,
  "data": {
    "key": "sk_test_new_api_key_full_value_here",
    "preview": "...here"
  },
  "message": "API key created. Save this key now - you will not be able to see it again!"
}
```

#### Permissions
- `read:nfts` - Read NFT data
- `read:collections` - Read collection data
- `read:users` - Read user data
- `read:analytics` - Read analytics
- `write:nfts` - Create/update NFTs
- `write:offers` - Create/update offers
- `write:listings` - Create marketplace listings
- `read:*` - Read all resources
- `write:*` - Write all resources

---

### ❌ Revoke API Key

**DELETE** `/saas/api-keys/{keyId}`

Requires: API Key

Revoke and disable an API key.

#### Response (200 OK)
```json
{
  "success": true,
  "message": "API key revoked"
}
```

---

## Usage & Billing

### 📈 Get Usage Metrics

**GET** `/saas/usage`

Requires: API Key

Get current billing period usage.

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "billingPeriodStart": "2025-11-01T00:00:00Z",
    "billingPeriodEnd": "2025-12-01T00:00:00Z",
    "apiCallsCount": 127450,
    "nftCreatedCount": 342,
    "usersCount": 1250,
    "transactionVolume": 2847500,
    "overageCharge": 0
  }
}
```

---

### 📊 Get Analytics

**GET** `/saas/analytics?days=30`

Requires: API Key

Get detailed analytics for specified period.

#### Query Parameters
- `days` (optional): 7, 14, 30, 90, 365 (default: 30)

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "period": "Last 30 days",
    "records": [
      {
        "date": "2025-11-17",
        "request_count": 4250,
        "avg_response_time": 87,
        "error_count": 3
      },
      {
        "date": "2025-11-16",
        "request_count": 3890,
        "avg_response_time": 82,
        "error_count": 1
      }
    ]
  }
}
```

---

## Admin Endpoints

### 👤 Update Plan (Admin)

**PATCH** `/saas/admin/plan`

Requires: API Key

Upgrade or downgrade tenant plan.

#### Request Body
```json
{
  "planId": "enterprise"
}
```

#### Valid Plans
- `starter` - Up to 1,000 users, $99/month
- `pro` - Up to 10,000 users, $499/month
- `enterprise` - Unlimited, custom pricing

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Plan updated"
}
```

---

### ⛔ Suspend Tenant

**POST** `/saas/admin/suspend`

Requires: API Key

Suspend a tenant account (blocks all API calls).

#### Request Body
```json
{
  "reason": "Payment failed - invoice overdue by 30 days"
}
```

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Tenant suspended"
}
```

---

### 🗑️ Delete Tenant

**POST** `/saas/admin/delete`

Requires: API Key

Soft delete tenant account (data retained for 90 days).

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Tenant deleted"
}
```

---

### 💚 Health Check

**GET** `/saas/health`

Requires: API Key

Verify API key is valid and tenant is active.

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "tenantId": "550e8400-e29b-41d4-a716-446655440000",
    "tenantName": "Gaming DAO Marketplace",
    "status": "connected"
  }
}
```

---

## Error Handling

### Error Response Format

```json
{
  "error": "Error Type",
  "message": "Human-readable error message"
}
```

### Common Error Codes

| Code | Error | Description |
|------|-------|-------------|
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Missing or invalid API key |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Slug or email already exists |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

### Example Error Response
```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing API key"
}
```

---

## SDKs & Code Examples

### JavaScript/Node.js

```javascript
const axios = require('axios');

const client = axios.create({
  baseURL: 'https://api.nftsol.xyz',
  headers: {
    'Authorization': `Bearer ${API_KEY}`
  }
});

// Get tenant details
const response = await client.get('/saas/tenant');
console.log(response.data);

// Create new API key
const newKey = await client.post('/saas/api-keys', {
  name: 'Mobile App',
  permissions: ['read:nfts', 'write:offers']
});
console.log('New API Key:', newKey.data.data.key);

// Get analytics
const analytics = await client.get('/saas/analytics', {
  params: { days: 30 }
});
console.log(analytics.data);
```

### Python

```python
import requests

client = requests.Session()
client.headers.update({
    'Authorization': f'Bearer {API_KEY}'
})

# Get tenant details
response = client.get('https://api.nftsol.xyz/saas/tenant')
print(response.json())

# Create new API key
new_key = client.post(
    'https://api.nftsol.xyz/saas/api-keys',
    json={
        'name': 'Mobile App',
        'permissions': ['read:nfts', 'write:offers']
    }
)
print('New API Key:', new_key.json()['data']['key'])

# Get analytics
analytics = client.get(
    'https://api.nftsol.xyz/saas/analytics',
    params={'days': 30}
)
print(analytics.json())
```

### cURL

```bash
# Get tenant details
curl https://api.nftsol.xyz/saas/tenant \
  -H "Authorization: Bearer sk_test_abc123..."

# Create tenant
curl -X POST https://api.nftsol.xyz/saas/tenants \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Marketplace",
    "slug": "my-marketplace",
    "email": "admin@example.com"
  }'

# Create new API key
curl -X POST https://api.nftsol.xyz/saas/api-keys \
  -H "Authorization: Bearer sk_test_abc123..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mobile App",
    "permissions": ["read:nfts"]
  }'

# Get analytics
curl "https://api.nftsol.xyz/saas/analytics?days=30" \
  -H "Authorization: Bearer sk_test_abc123..."
```

---

## Webhooks

### Subscribing to Webhooks

Webhooks allow you to receive real-time notifications of events in your marketplace.

**Available Events:**
- `nft.created` - NFT created
- `nft.sold` - NFT sold
- `nft.listed` - NFT listed for sale
- `user.registered` - User registered
- `offer.made` - Offer made on NFT
- `offer.accepted` - Offer accepted
- `collection.created` - Collection created

**Webhook Payload:**
```json
{
  "event": "nft.sold",
  "timestamp": "2025-11-17T14:30:00Z",
  "tenantId": "550e8400-e29b-41d4-a716-446655440000",
  "data": {
    "nftId": "...",
    "mint": "...",
    "seller": "...",
    "buyer": "...",
    "price": 5000000,
    "transactionSignature": "..."
  }
}
```

---

## Best Practices

### API Key Security
- ✅ Store API keys securely (environment variables, secrets manager)
- ✅ Rotate keys periodically
- ✅ Use different keys for different environments
- ✅ Never commit API keys to version control
- ❌ Don't expose API keys in client-side code

### Rate Limiting
- ✅ Implement exponential backoff for retries
- ✅ Cache responses when possible
- ✅ Monitor `X-RateLimit-Remaining` header

### Error Handling
- ✅ Implement proper error handling for all requests
- ✅ Log errors for debugging
- ✅ Implement automatic retries for 5xx errors

---

## Support

For questions or issues:
1. Check this documentation
2. Review code examples above
3. Contact support@nftsol.xyz
4. Check status page: https://status.nftsol.xyz

---

## Changelog

**v1.0 (Nov 17, 2025)**
- Initial SaaS API release
- Tenant management endpoints
- API key management
- Usage tracking & analytics
- Admin dashboard endpoints
