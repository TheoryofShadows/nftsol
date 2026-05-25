# NFTSol API Examples

Complete code examples for integrating with the NFTSol API. All examples use the production endpoint `https://nftsol.onrender.com`.

## Table of Contents

- [Health & Status](#health--status)
- [Wallet Operations](#wallet-operations)
- [NFT Operations](#nft-operations)
- [Marketplace Operations](#marketplace-operations)
- [CLOUT Token](#clout-token)
- [Echo (Collaborative NFTs)](#echo-collaborative-nfts)
- [Archive Integration](#archive-integration)
- [Grok AI Verification](#grok-ai-verification)
- [Authentication](#authentication)

---

## Health & Status

### Check API Health

#### cURL
```bash
curl -X GET https://nftsol.onrender.com/healthz
```

#### JavaScript (Node.js)
```javascript
const response = await fetch('https://nftsol.onrender.com/healthz');
const data = await response.json();
console.log('API Status:', data);
```

#### JavaScript (Browser/Fetch)
```javascript
fetch('https://nftsol.onrender.com/healthz')
  .then(res => res.json())
  .then(data => console.log('Health:', data))
  .catch(err => console.error('Error:', err));
```

#### Python
```python
import requests

response = requests.get('https://nftsol.onrender.com/healthz')
data = response.json()
print(f"API Status: {data}")
```

### Get Public Statistics

Get platform statistics for display on your landing page.

#### cURL
```bash
curl -X GET https://nftsol.onrender.com/api/public/stats
```

#### JavaScript
```javascript
const stats = await fetch('https://nftsol.onrender.com/api/public/stats')
  .then(res => res.json());

console.log(`Total NFTs: ${stats.platform.totalNFTs}`);
console.log(`Listed: ${stats.platform.listedNFTs}`);
console.log(`Volume: ${stats.platform.totalVolume} SOL`);
```

#### Python
```python
import requests

stats = requests.get('https://nftsol.onrender.com/api/public/stats').json()
print(f"Total NFTs: {stats['platform']['totalNFTs']}")
print(f"Listed: {stats['platform']['listedNFTs']}")
print(f"Total Volume: {stats['platform']['totalVolume']} SOL")
```

---

## Wallet Operations

### Get Wallet Information

Get wallet balance and existence status on-chain. The versioned endpoint is `GET /api/v1/wallet/:address`.

#### cURL
```bash
curl -X GET "https://nftsol.onrender.com/api/v1/wallet/11111111111111111111111111111111"
```

#### JavaScript
```javascript
async function getWalletInfo(walletAddress) {
  const response = await fetch(
    `https://nftsol.onrender.com/api/v1/wallet/${walletAddress}`
  );
  const data = await response.json();

  if (data.success) {
    console.log(`Balance: ${data.data.solBalance}`);
    console.log(`Exists on-chain: ${data.data.exists}`);
  }
  return data;
}

const info = await getWalletInfo('11111111111111111111111111111111');
```

#### Python
```python
import requests

def get_wallet_info(wallet_address):
    url = f'https://nftsol.onrender.com/api/v1/wallet/{wallet_address}'
    response = requests.get(url)
    data = response.json()

    if data['success']:
        print(f"Balance: {data['data']['solBalance']}")
        print(f"Exists: {data['data']['exists']}")
    return data

info = get_wallet_info('11111111111111111111111111111111')
```

---

## NFT Operations

### List All NFTs

Get NFTs from the marketplace with optional filtering. Supports `owner`, `collection`, `status`, and `limit` query parameters.

#### cURL
```bash
# Get all NFTs
curl -X GET "https://nftsol.onrender.com/api/nfts"

# Get NFTs by owner
curl -X GET "https://nftsol.onrender.com/api/nfts?owner=11111111111111111111111111111111"

# Get listed NFTs
curl -X GET "https://nftsol.onrender.com/api/nfts?status=listed"
```

> To fetch NFTs owned by a specific wallet on the versioned API, use `GET /api/v1/nfts/:owner` instead.

#### JavaScript
```javascript
async function listNFTs(filters = {}) {
  const params = new URLSearchParams(filters);
  const response = await fetch(
    `https://nftsol.onrender.com/api/nfts?${params}`
  );
  return await response.json();
}

// Get all NFTs
const allNFTs = await listNFTs();

// Get by owner
const ownerNFTs = await listNFTs({
  owner: '11111111111111111111111111111111'
});

// Get listed only
const listed = await listNFTs({ status: 'listed' });
```

#### Python
```python
import requests

def list_nfts(filters=None):
    url = 'https://nftsol.onrender.com/api/nfts'
    params = filters or {}
    response = requests.get(url, params=params)
    return response.json()

# Get all NFTs
all_nfts = list_nfts()

# Get by owner
owner_nfts = list_nfts({'owner': '11111111111111111111111111111111'})

# Get listed
listed = list_nfts({'status': 'listed'})
```

### Get NFT Details

Get detailed information about a specific NFT.

#### cURL
```bash
curl -X GET "https://nftsol.onrender.com/api/v1/nft/TokenkegQfeZyiNwAJsyFbPVwwQQfyanppFWUNqLjV"
```

#### JavaScript
```javascript
async function getNFTDetails(mintAddress) {
  const response = await fetch(
    `https://nftsol.onrender.com/api/v1/nft/${mintAddress}`
  );
  const data = await response.json();

  if (data.success) {
    console.log(`Name: ${data.data.name}`);
    console.log(`Owner: ${data.data.owner}`);
    console.log(`Listed: ${data.data.isListed}`);
    if (data.data.isListed) {
      console.log(`Price: ${data.data.price} SOL`);
    }
  }
  return data;
}

const nft = await getNFTDetails('TokenkegQfeZyiNwAJsyFbPVwwQQfyanppFWUNqLjV');
```

#### Python
```python
import requests

def get_nft_details(mint_address):
    url = f'https://nftsol.onrender.com/api/v1/nft/{mint_address}'
    response = requests.get(url)
    data = response.json()

    if data['success']:
        print(f"Name: {data['data']['name']}")
        print(f"Owner: {data['data']['owner']}")
        print(f"Listed: {data['data']['isListed']}")
    return data

nft = get_nft_details('TokenkegQfeZyiNwAJsyFbPVwwQQfyanppFWUNqLjV')
```

### Mint a New NFT

Create and mint a new NFT on Solana.

#### cURL
```bash
curl -X POST https://nftsol.onrender.com/api/v1/simple-mint \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: your-csrf-token" \
  -d '{
    "name": "My NFT",
    "description": "A beautiful digital artwork",
    "imageUrl": "https://example.com/image.jpg",
    "creatorWallet": "11111111111111111111111111111111"
  }'
```

#### JavaScript
```javascript
async function mintNFT(nftData) {
  // Get CSRF token first
  const csrfRes = await fetch('https://nftsol.onrender.com/api/v1/csrf-token');
  const { csrfToken } = await csrfRes.json();

  const response = await fetch(
    'https://nftsol.onrender.com/api/v1/simple-mint',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken
      },
      body: JSON.stringify(nftData)
    }
  );

  return await response.json();
}

const nft = await mintNFT({
  name: 'My NFT',
  description: 'A beautiful digital artwork',
  imageUrl: 'https://example.com/image.jpg',
  creatorWallet: '11111111111111111111111111111111'
});

console.log(`Minted! Mint Address: ${nft.data.mintAddress}`);
```

#### Python
```python
import requests

def mint_nft(nft_data):
    # Get CSRF token
    csrf_res = requests.get('https://nftsol.onrender.com/api/v1/csrf-token')
    csrf_token = csrf_res.json()['csrfToken']

    # Mint NFT
    response = requests.post(
        'https://nftsol.onrender.com/api/v1/simple-mint',
        headers={
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrf_token
        },
        json=nft_data
    )

    return response.json()

result = mint_nft({
    'name': 'My NFT',
    'description': 'A beautiful digital artwork',
    'imageUrl': 'https://example.com/image.jpg',
    'creatorWallet': '11111111111111111111111111111111'
})

if result['success']:
    print(f"Minted! {result['data']['mintAddress']}")
```

---

## Marketplace Operations

### Browse Marketplace

Get marketplace listings with pagination and filters.

#### cURL
```bash
# Get first page
curl -X GET "https://nftsol.onrender.com/api/v1/market?page=1&limit=50"

# Filter by collection
curl -X GET "https://nftsol.onrender.com/api/v1/market?collection=MyCollection&limit=20"
```

#### JavaScript
```javascript
async function browseMarketplace(page = 1, limit = 50, filters = {}) {
  const params = new URLSearchParams({
    page,
    limit,
    ...filters
  });

  const response = await fetch(
    `https://nftsol.onrender.com/api/v1/market?${params}`
  );
  return await response.json();
}

// Get first page
const page1 = await browseMarketplace(1, 50);
console.log(`Found ${page1.data.total} NFTs`);

// Filter by collection
const collection = await browseMarketplace(1, 50, {
  collection: 'MyCollection'
});
```

#### Python
```python
import requests

def browse_marketplace(page=1, limit=50, filters=None):
    params = {'page': page, 'limit': limit}
    if filters:
        params.update(filters)

    response = requests.get(
        'https://nftsol.onrender.com/api/v1/market',
        params=params
    )
    return response.json()

# Get first page
page1 = browse_marketplace(1, 50)
print(f"Found {page1['data']['total']} NFTs")

# Filter
collection = browse_marketplace(1, 50, {'collection': 'MyCollection'})
```

### List NFT for Sale

List an NFT on the marketplace.

#### cURL
```bash
curl -X POST https://nftsol.onrender.com/api/marketplace/list \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: your-csrf-token" \
  -d '{
    "mintAddress": "TokenkegQfeZyiNwAJsyFbPVwwQQfyanppFWUNqLjV",
    "seller": "11111111111111111111111111111111",
    "price": 2.5
  }'
```

#### JavaScript
```javascript
async function listNFTForSale(mintAddress, seller, price) {
  const csrfRes = await fetch('https://nftsol.onrender.com/api/v1/csrf-token');
  const { csrfToken } = await csrfRes.json();

  const response = await fetch(
    'https://nftsol.onrender.com/api/marketplace/list',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken
      },
      body: JSON.stringify({ mintAddress, seller, price })
    }
  );

  return await response.json();
}

const listing = await listNFTForSale(
  'TokenkegQfeZyiNwAJsyFbPVwwQQfyanppFWUNqLjV',
  '11111111111111111111111111111111',
  2.5
);
```

#### Python
```python
import requests

def list_nft_for_sale(mint_address, seller, price):
    # Get CSRF token
    csrf_res = requests.get('https://nftsol.onrender.com/api/v1/csrf-token')
    csrf_token = csrf_res.json()['csrfToken']

    # List NFT
    response = requests.post(
        'https://nftsol.onrender.com/api/marketplace/list',
        headers={
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrf_token
        },
        json={
            'mintAddress': mint_address,
            'seller': seller,
            'price': price
        }
    )

    return response.json()

listing = list_nft_for_sale(
    'TokenkegQfeZyiNwAJsyFbPVwwQQfyanppFWUNqLjV',
    '11111111111111111111111111111111',
    2.5
)
```

### Delist NFT

Remove an NFT from marketplace listing.

#### cURL
```bash
curl -X POST https://nftsol.onrender.com/api/marketplace/delist \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: your-csrf-token" \
  -d '{
    "mintAddress": "TokenkegQfeZyiNwAJsyFbPVwwQQfyanppFWUNqLjV",
    "seller": "11111111111111111111111111111111"
  }'
```

#### JavaScript
```javascript
async function delistNFT(mintAddress, seller) {
  const csrfRes = await fetch('https://nftsol.onrender.com/api/v1/csrf-token');
  const { csrfToken } = await csrfRes.json();

  const response = await fetch(
    'https://nftsol.onrender.com/api/marketplace/delist',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken
      },
      body: JSON.stringify({ mintAddress, seller })
    }
  );

  return await response.json();
}
```

#### Python
```python
import requests

def delist_nft(mint_address, seller):
    csrf_res = requests.get('https://nftsol.onrender.com/api/v1/csrf-token')
    csrf_token = csrf_res.json()['csrfToken']

    response = requests.post(
        'https://nftsol.onrender.com/api/marketplace/delist',
        headers={
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrf_token
        },
        json={
            'mintAddress': mint_address,
            'seller': seller
        }
    )

    return response.json()
```

---

## CLOUT Token

### Get CLOUT Balance

Get CLOUT token balance for a wallet.

#### cURL
```bash
curl -X GET "https://nftsol.onrender.com/api/clout/balance/11111111111111111111111111111111"
```

#### JavaScript
```javascript
async function getCloutBalance(wallet) {
  const response = await fetch(
    `https://nftsol.onrender.com/api/clout/balance/${wallet}`
  );
  const data = await response.json();

  if (data.success) {
    console.log(`CLOUT Balance: ${data.data.balance}`);
    console.log(`USD Value: $${data.data.cloutUSD}`);
  }
  return data;
}
```

#### Python
```python
import requests

def get_clout_balance(wallet):
    response = requests.get(
        f'https://nftsol.onrender.com/api/clout/balance/{wallet}'
    )
    return response.json()

balance = get_clout_balance('11111111111111111111111111111111')
print(f"CLOUT: {balance['data']['balance']}")
```

---

## Echo (Collaborative NFTs)

### Create Echo NFT

Create a new collaborative NFT with layers.

#### cURL
```bash
curl -X POST https://nftsol.onrender.com/api/echo/mint \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: your-csrf-token" \
  -d '{
    "baseMintAddress": "TokenkegQfeZyiNwAJsyFbPVwwQQfyanppFWUNqLjV",
    "creatorWallet": "11111111111111111111111111111111",
    "metadata": {
      "name": "Collaborative Echo",
      "description": "Multi-creator NFT"
    }
  }'
```

#### JavaScript
```javascript
async function createEcho(baseMintAddress, creatorWallet, metadata) {
  const csrfRes = await fetch('https://nftsol.onrender.com/api/v1/csrf-token');
  const { csrfToken } = await csrfRes.json();

  const response = await fetch(
    'https://nftsol.onrender.com/api/echo/mint',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken
      },
      body: JSON.stringify({
        baseMintAddress,
        creatorWallet,
        metadata
      })
    }
  );

  return await response.json();
}

const echo = await createEcho(
  'TokenkegQfeZyiNwAJsyFbPVwwQQfyanppFWUNqLjV',
  '11111111111111111111111111111111',
  {
    name: 'Collaborative Echo',
    description: 'Multi-creator NFT'
  }
);
```

#### Python
```python
import requests

def create_echo(base_mint_address, creator_wallet, metadata):
    csrf_res = requests.get('https://nftsol.onrender.com/api/v1/csrf-token')
    csrf_token = csrf_res.json()['csrfToken']

    response = requests.post(
        'https://nftsol.onrender.com/api/echo/mint',
        headers={
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrf_token
        },
        json={
            'baseMintAddress': base_mint_address,
            'creatorWallet': creator_wallet,
            'metadata': metadata
        }
    )

    return response.json()
```

### Get Echo Details

Get information about a specific Echo NFT.

#### cURL
```bash
curl -X GET "https://nftsol.onrender.com/api/echo/echo-id-123"
```

#### JavaScript
```javascript
async function getEchoDetails(echoId) {
  const response = await fetch(
    `https://nftsol.onrender.com/api/echo/${echoId}`
  );
  return await response.json();
}
```

#### Python
```python
import requests

def get_echo_details(echo_id):
    response = requests.get(
        f'https://nftsol.onrender.com/api/echo/{echo_id}'
    )
    return response.json()
```

---

## Archive Integration

### Search Archive

Search Internet Archive for public domain items.

#### cURL
```bash
# Basic search
curl -X GET "https://nftsol.onrender.com/api/archive/search?q=jazz&limit=20"

# Filter by media type
curl -X GET "https://nftsol.onrender.com/api/archive/search?q=historical%20speeches&mediaType=audio"

# Search by year
curl -X GET "https://nftsol.onrender.com/api/archive/search?q=moon%20landing&yearFrom=1950&yearTo=1980"
```

#### JavaScript
```javascript
async function searchArchive(query, filters = {}) {
  const params = new URLSearchParams({
    q: query,
    ...filters
  });

  const response = await fetch(
    `https://nftsol.onrender.com/api/archive/search?${params}`
  );
  return await response.json();
}

// Basic search
const jazzResults = await searchArchive('jazz', { limit: 20 });

// Search by media type
const audioResults = await searchArchive('historical speeches', {
  mediaType: 'audio'
});

// Search by year range
const historical = await searchArchive('moon landing', {
  yearFrom: 1950,
  yearTo: 1980
});
```

#### Python
```python
import requests

def search_archive(query, filters=None):
    params = {'q': query}
    if filters:
        params.update(filters)

    response = requests.get(
        'https://nftsol.onrender.com/api/archive/search',
        params=params
    )
    return response.json()

# Basic search
results = search_archive('jazz', {'limit': 20})

# By media type
audio = search_archive('historical speeches', {'mediaType': 'audio'})

# By year
historical = search_archive('moon landing', {
    'yearFrom': 1950,
    'yearTo': 1980
})

for item in historical['data']:
    print(f"{item['title']} ({item.get('year', 'Unknown')})")
```

---

## Grok AI Verification

### Verify with Grok AI

Verify NFT authenticity using Grok AI.

#### cURL
```bash
curl -X POST https://nftsol.onrender.com/api/grok/verify \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: your-csrf-token" \
  -d '{
    "nftMintAddress": "TokenkegQfeZyiNwAJsyFbPVwwQQfyanppFWUNqLjV",
    "contentUrl": "https://example.com/nft-image.jpg"
  }'
```

#### JavaScript
```javascript
async function verifyWithGrok(mintAddress, contentUrl) {
  const csrfRes = await fetch('https://nftsol.onrender.com/api/v1/csrf-token');
  const { csrfToken } = await csrfRes.json();

  const response = await fetch(
    'https://nftsol.onrender.com/api/grok/verify',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken
      },
      body: JSON.stringify({
        nftMintAddress: mintAddress,
        contentUrl
      })
    }
  );

  const data = await response.json();

  if (data.success) {
    console.log(`Confidence Score: ${data.data.confidenceScore}%`);
    console.log(`Authentic: ${data.data.isAuthentic}`);
  }

  return data;
}

const verification = await verifyWithGrok(
  'TokenkegQfeZyiNwAJsyFbPVwwQQfyanppFWUNqLjV',
  'https://example.com/nft-image.jpg'
);
```

#### Python
```python
import requests

def verify_with_grok(mint_address, content_url):
    csrf_res = requests.get('https://nftsol.onrender.com/api/v1/csrf-token')
    csrf_token = csrf_res.json()['csrfToken']

    response = requests.post(
        'https://nftsol.onrender.com/api/grok/verify',
        headers={
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrf_token
        },
        json={
            'nftMintAddress': mint_address,
            'contentUrl': content_url
        }
    )

    data = response.json()

    if data['success']:
        score = data['data']['confidenceScore']
        authentic = data['data']['isAuthentic']
        print(f"Confidence: {score}%")
        print(f"Authentic: {authentic}")

    return data
```

---

## Authentication

### Get CSRF Token

Get a CSRF token for secure requests.

#### cURL
```bash
curl -X GET https://nftsol.onrender.com/api/v1/csrf-token
```

#### JavaScript
```javascript
async function getCsrfToken() {
  const response = await fetch('https://nftsol.onrender.com/api/v1/csrf-token');
  const data = await response.json();
  return data.csrfToken;
}

const token = await getCsrfToken();
console.log('CSRF Token:', token);
```

#### Python
```python
import requests

def get_csrf_token():
    response = requests.get('https://nftsol.onrender.com/api/v1/csrf-token')
    data = response.json()
    return data['csrfToken']

token = get_csrf_token()
print(f"CSRF Token: {token}")
```

### Admin Authentication

Authenticate as admin using wallet signature.

#### JavaScript
```javascript
import { PublicKey, Transaction } from '@solana/web3.js';
import nacl from 'tweetnacl';
import bs58 from 'bs58';

async function authenticateAsAdmin(wallet) {
  // Create message to sign
  const message = `NFTSol Admin Authentication - ${Date.now()}`;

  // Sign with wallet (requires user to approve in wallet extension)
  const messageBytes = new TextEncoder().encode(message);
  const signatureBytes = await wallet.signMessage(messageBytes);
  const signature = bs58.encode(signatureBytes);

  // Send to API
  const response = await fetch(
    'https://nftsol.onrender.com/api/v1/auth/admin',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        walletAddress: wallet.publicKey.toString(),
        signature,
        message
      })
    }
  );

  const data = await response.json();

  if (data.success) {
    // Store JWT token for future authenticated requests
    localStorage.setItem('adminToken', data.data.token);
    console.log('Authenticated!');
  }

  return data;
}

// Use token in subsequent requests
async function makeAdminRequest(url, options = {}) {
  const token = localStorage.getItem('adminToken');

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  return await response.json();
}
```

#### Python
```python
import requests
from solana.publickey import PublicKey
from solders.keypair import Keypair
import nacl.signing
import base58
import time

def authenticate_as_admin(private_key_base58):
    # Load keypair
    keypair = Keypair.from_secret_key(base58.b58decode(private_key_base58))
    wallet_address = str(keypair.public_key)

    # Create message
    message = f"NFTSol Admin Authentication - {int(time.time() * 1000)}"

    # Sign message
    signing_key = nacl.signing.SigningKey(keypair.secret_key[:32])
    signed = signing_key.sign(message.encode())
    signature = base58.b58encode(bytes(signed.signature)).decode()

    # Authenticate
    response = requests.post(
        'https://nftsol.onrender.com/api/v1/auth/admin',
        json={
            'walletAddress': wallet_address,
            'signature': signature,
            'message': message
        }
    )

    data = response.json()

    if data['success']:
        token = data['data']['token']
        print(f"Authenticated! Token: {token}")
        return token
    else:
        print(f"Auth failed: {data['error']}")
        return None

# Use token in requests
def make_admin_request(url, token, method='GET', data=None):
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }

    if method == 'GET':
        response = requests.get(url, headers=headers)
    elif method == 'POST':
        response = requests.post(url, headers=headers, json=data)

    return response.json()
```

---

## Error Handling

All error responses follow this format:

```json
{
  "success": false,
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "requestId": "unique-request-id"
}
```

Common error codes:
- `VALIDATION_ERROR` - Invalid request parameters
- `MISSING_FIELDS` - Required fields missing
- `INVALID_PRICE` - Price validation failed
- `MISSING_ADDRESS` - Wallet address required
- `NOT_FOUND` - Resource not found
- `UNAUTHORIZED` - Authentication required
- `RATE_LIMIT_EXCEEDED` - Too many requests

---

## Rate Limits

Standard rate limits:
- 100 requests per 15 minutes per IP
- Health checks are unlimited
- Admin endpoints require JWT token

---

## Support

For questions or issues:
- GitHub Issues: https://github.com/TheoryofShadows/nftsol/issues
- API Docs: https://nftsol.onrender.com/api-docs

---

**Last Updated**: May 2026
