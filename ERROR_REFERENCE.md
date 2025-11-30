# NFTSol Error Code Reference

## Overview

All API errors in NFTSol use standardized error codes for consistency and easier debugging. Each error includes:
- **Code**: Unique identifier (e.g., `WALLET_001`)
- **Message**: Human-readable error description
- **HTTP Status**: Standard HTTP status code
- **Retryable**: Whether the operation can be retried
- **User Message**: Consumer-friendly error message
- **Suggestion**: How to fix the error

## Error Code Categories

### Wallet Errors (WALLET_xxx)

#### WALLET_001: Wallet Not Found
- **Status**: 404 Not Found
- **Retryable**: No
- **Cause**: The wallet address is not registered in the system
- **User Message**: "This wallet has not been registered yet"
- **How to Fix**:
  1. Verify the wallet address is correct
  2. Connect your wallet to the app
  3. Try again

---

#### WALLET_002: Invalid Wallet Address
- **Status**: 400 Bad Request
- **Retryable**: No
- **Cause**: The wallet address format is invalid
- **User Message**: "The wallet address format is invalid"
- **How to Fix**:
  1. Check that the address is a valid Solana wallet
  2. Solana addresses are 44 characters long (e.g., `9B5X...`)
  3. Ensure there are no typos

---

#### WALLET_003: Insufficient Balance
- **Status**: 402 Payment Required
- **Retryable**: No
- **Cause**: The wallet doesn't have enough SOL or tokens
- **User Message**: "Your wallet balance is insufficient for this operation"
- **How to Fix**:
  1. Check your wallet balance
  2. Add more SOL to your wallet
  3. Try the operation again

---

#### WALLET_004: Wallet Operation Failed
- **Status**: 500 Internal Server Error
- **Retryable**: Yes
- **Cause**: An unexpected error occurred during wallet operation
- **User Message**: "Failed to process wallet operation"
- **How to Fix**:
  1. Wait a few moments
  2. Try the operation again
  3. If problem persists, contact support

---

#### WALLET_005: Wallet Not Connected
- **Status**: 401 Unauthorized
- **Retryable**: No
- **Cause**: Your wallet is not currently connected
- **User Message**: "Your wallet is not connected"
- **How to Fix**:
  1. Click "Connect Wallet"
  2. Approve the connection in your wallet extension
  3. Try again

---

### NFT Errors (NFT_xxx)

#### NFT_001: NFT Not Found
- **Status**: 404 Not Found
- **Retryable**: No
- **Cause**: The NFT mint address doesn't exist
- **User Message**: "This NFT does not exist"
- **How to Fix**:
  1. Verify the NFT mint address
  2. Check it exists on blockchain
  3. Copy-paste the address carefully

---

#### NFT_002: NFT Already Minted
- **Status**: 409 Conflict
- **Retryable**: No
- **Cause**: This NFT has already been minted
- **User Message**: "This NFT has already been minted"
- **How to Fix**:
  1. The NFT already exists
  2. Try minting a different NFT

---

#### NFT_003: Invalid Metadata
- **Status**: 400 Bad Request
- **Retryable**: No
- **Cause**: The NFT metadata is missing or invalid
- **User Message**: "The NFT metadata is invalid"
- **How to Fix**:
  1. Check all metadata fields (name, description, image)
  2. Ensure name is not empty
  3. Ensure description is not too long (max 500 chars)
  4. Verify image URL is valid

**Required Fields**:
- `name`: String, 1-50 characters
- `description`: String, max 500 characters
- `creatorWallet`: Valid Solana address
- `imageUrl` or `file`: Either URL or file upload

---

#### NFT_004: NFT Mint Failed
- **Status**: 500 Internal Server Error
- **Retryable**: Yes
- **Cause**: The blockchain transaction failed
- **User Message**: "Failed to mint NFT"
- **How to Fix**:
  1. Check your wallet has enough SOL (min 1 SOL recommended)
  2. Ensure you're connected to the right network
  3. Try again in a few moments

---

#### NFT_005: NFT Transfer Failed
- **Status**: 500 Internal Server Error
- **Retryable**: Yes
- **Cause**: The NFT transfer transaction failed
- **User Message**: "Failed to transfer NFT"
- **How to Fix**:
  1. Verify the recipient wallet address
  2. Ensure you own the NFT
  3. Check network connectivity
  4. Try again

---

### Solana Errors (SOLANA_xxx)

#### SOLANA_001: RPC Error
- **Status**: 503 Service Unavailable
- **Retryable**: Yes
- **Cause**: Unable to connect to Solana blockchain
- **User Message**: "Unable to communicate with Solana blockchain"
- **How to Fix**:
  1. Check your internet connection
  2. Wait a few moments
  3. Try again

---

#### SOLANA_002: Transaction Failed
- **Status**: 500 Internal Server Error
- **Retryable**: Yes
- **Cause**: The blockchain transaction was rejected
- **User Message**: "Transaction failed on blockchain"
- **How to Fix**:
  1. Verify your wallet balance is sufficient
  2. Check network connection
  3. Try the operation again
  4. If persists, contact support

**Common Reasons**:
- Insufficient SOL balance
- Network congestion
- Account doesn't exist
- Invalid transaction format

---

#### SOLANA_003: Blockhash Expired
- **Status**: 400 Bad Request
- **Retryable**: Yes
- **Cause**: Transaction took too long to process
- **User Message**: "Transaction became invalid"
- **How to Fix**:
  1. Retry the operation
  2. It should work immediately

This happens when a transaction is signed but not confirmed within ~60 seconds.

---

### Authentication Errors (AUTH_xxx)

#### AUTH_001: Unauthorized
- **Status**: 401 Unauthorized
- **Retryable**: No
- **Cause**: You are not authenticated
- **User Message**: "You are not authenticated"
- **How to Fix**:
  1. Sign in with your wallet
  2. Approve the signature request

---

#### AUTH_002: Token Expired
- **Status**: 401 Unauthorized
- **Retryable**: Yes
- **Cause**: Your session token has expired
- **User Message**: "Your session has expired"
- **How to Fix**:
  1. Refresh the page
  2. Sign in again
  3. Request a new token using refresh endpoint

---

#### AUTH_003: Invalid Signature
- **Status**: 401 Unauthorized
- **Retryable**: No
- **Cause**: The wallet signature verification failed
- **User Message**: "Signature verification failed"
- **How to Fix**:
  1. Ensure your wallet is properly connected
  2. Try disconnecting and reconnecting
  3. Try signing again

---

### Validation Errors (VALIDATION_xxx)

#### VALIDATION_001: Validation Failed
- **Status**: 400 Bad Request
- **Retryable**: No
- **Cause**: Request data failed validation
- **User Message**: "Invalid request data"
- **How to Fix**:
  1. Check all required fields are filled
  2. Verify field formats
  3. Check field value ranges

**Response includes**:
```json
{
  "error": {
    "code": "VALIDATION_001",
    "message": "Invalid request data",
    "details": {
      "field_name": "error message for that field"
    }
  }
}
```

---

#### VALIDATION_002: Missing Required Field
- **Status**: 400 Bad Request
- **Retryable**: No
- **Cause**: A required field is missing from the request
- **User Message**: "A required field is missing"
- **How to Fix**:
  1. Check the API documentation
  2. Include all required fields
  3. Try again

---

### Rate Limiting (RATE_LIMIT_xxx)

#### RATE_LIMIT_001: Rate Limited
- **Status**: 429 Too Many Requests
- **Retryable**: Yes
- **Cause**: You've made too many requests in a short time
- **User Message**: "Too many requests"
- **How to Fix**:
  1. Wait before making more requests
  2. Default limit: 100 requests per minute per IP
  3. Use exponential backoff for retries

**Response includes**:
```json
{
  "error": {
    "code": "RATE_LIMIT_001",
    "retryable": true,
    "suggestion": "Wait 60 seconds before retrying"
  }
}
```

---

### Server Errors (SYSTEM_xxx)

#### SYSTEM_001: Internal Server Error
- **Status**: 500 Internal Server Error
- **Retryable**: Yes
- **Cause**: An unexpected error occurred on the server
- **User Message**: "Something went wrong"
- **How to Fix**:
  1. Try again in a few moments
  2. If problem persists, contact support
  3. Include error code in support request

---

#### SYSTEM_003: Service Unavailable
- **Status**: 503 Service Unavailable
- **Retryable**: Yes
- **Cause**: The service is temporarily unavailable
- **User Message**: "The service is temporarily unavailable"
- **How to Fix**:
  1. Wait a few moments
  2. Check status page
  3. Try again

---

#### SYSTEM_004: Maintenance Mode
- **Status**: 503 Service Unavailable
- **Retryable**: Yes
- **Cause**: The service is under maintenance
- **User Message**: "The service is under maintenance"
- **How to Fix**:
  1. Check the status page for ETA
  2. Try again later

---

## Error Response Format

All API errors return responses in this standard format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE_xxx",
    "message": "Human-readable message",
    "suggestion": "How to fix it",
    "retryable": true
  },
  "timestamp": "2025-11-30T12:00:00Z",
  "path": "/api/v1/nfts/mint"
}
```

**In Development Mode**, additional debugging info is included:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE_xxx",
    "message": "Human-readable message",
    "details": { "debug": "info" },
    "suggestion": "How to fix it"
  },
  "stack": "Error stack trace...",
  "timestamp": "2025-11-30T12:00:00Z",
  "path": "/api/v1/nfts/mint"
}
```

---

## Implementing Error Codes

### Using Error Codes in Routes

```typescript
import { AppError, ERROR_CODES, asyncHandler } from '@/errors';

app.post('/api/v1/nfts/mint', asyncHandler(async (req, res) => {
  const { wallet } = req.body;

  if (!wallet) {
    throw new AppError(
      ERROR_CODES.MISSING_REQUIRED_FIELD,
      'Wallet address is required',
      400
    );
  }

  if (!isValidSolanaAddress(wallet)) {
    throw new AppError(
      ERROR_CODES.INVALID_WALLET_ADDRESS,
      'Invalid wallet address format',
      400
    );
  }

  const balance = await getBalance(wallet);
  if (balance < 1) {
    throw new AppError(
      ERROR_CODES.WALLET_BALANCE_INSUFFICIENT,
      'Insufficient wallet balance',
      402,
      { balance, required: 1 }
    );
  }

  // ... rest of implementation
}));
```

### Using Helper Functions

```typescript
import {
  walletNotFound,
  invalidWalletAddress,
  insufficientBalance
} from '@/errors/handler';

// Instead of creating AppError manually:
if (!wallet) throw missingRequiredField('wallet');
if (!isValid(wallet)) throw invalidWalletAddress();
if (balance < 1) throw insufficientBalance();
```

---

## HTTP Status Codes Summary

| Status | Meaning | When to Use |
|--------|---------|------------|
| 400 | Bad Request | Input validation failed |
| 401 | Unauthorized | Authentication required/failed |
| 402 | Payment Required | Insufficient balance |
| 403 | Forbidden | Permission denied |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource already exists |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Error | Server error |
| 503 | Unavailable | Service down/maintenance |

---

## Best Practices

1. **Always use standardized error codes** - Don't create new ones on the fly
2. **Include sufficient context** - Add details that help debugging
3. **Use appropriate HTTP status codes** - Clients rely on these
4. **Be specific** - Use the most specific code, not generic SYSTEM_001
5. **Provide actionable suggestions** - Help users fix the problem
6. **Log with context** - Include request ID, user info, etc.
7. **Don't expose sensitive data** - Filter production errors

---

## Adding New Error Codes

When you need a new error code:

1. **Define in `ERROR_CODES`** (`apps/backend/src/errors/codes.ts`)
2. **Add metadata** to `ERROR_CODE_DESCRIPTIONS`
3. **Create helper function** if it's common (in `handler.ts`)
4. **Document it here** with examples
5. **Update client error handling** if needed

```typescript
// In codes.ts
NEW_ERROR: 'CATEGORY_NNN',

// In ERROR_CODE_DESCRIPTIONS
NEW_ERROR: {
  description: '...',
  statusCode: XXX,
  retryable: boolean,
  userMessage: '...',
  suggestion: '...'
},

// In handler.ts
export function newError(details?: string) {
  return new AppError(
    ERROR_CODES.NEW_ERROR,
    'Error message',
    statusCode,
    details
  );
}
```

---

## Client Implementation

Clients should handle errors like this:

```javascript
// JavaScript example
fetch('/api/v1/nfts/mint', { ... })
  .then(res => res.json())
  .then(data => {
    if (!data.success) {
      const { code, message, retryable, suggestion } = data.error;

      // Show error to user
      showError(message);

      // Log for debugging
      logError({ code, path: data.path });

      // Retry if possible
      if (retryable) {
        setTimeout(() => retry(), 3000);
      }
    }
  });
```

---

## Support

For questions about error codes or implementation:
1. Check this reference
2. Review error handler code
3. Contact development team
4. Open an issue on GitHub

---

**Last Updated**: November 30, 2025
**Document Version**: 1.0
