# Missing Environment Variables

## 🔴 CRITICAL - Required (Backend will fail without these in production):

```
PORT=3001
```
**Note:** Defaults to 3000 if not set, but Render needs explicit PORT

## ⚠️ IMPORTANT - Needed for Specific Features:

### Admin Authentication:
```
JWT_SECRET=<generate-random-32-char-string>
```
**Generate with:** `openssl rand -base64 32` or use any random string generator

### Withdrawals & CLOUT Vault Operations:
```
PLATFORM_SECRET_KEY_BASE58=<your-platform-wallet-secret-key-base58>
```
**OR**
```
PLATFORM_SECRET_KEY_JSON=<your-platform-wallet-secret-key-json>
```
**Note:** This is the secret key for your platform wallet that manages withdrawals and CLOUT rewards vault

### Helius Services:
```
HELIUS_API_KEY=ea0ed024-cd7c-4338-8b9b-b6be4d004d36
```
**Note:** You have this in your RPC URL, but some services expect it separately

### IPFS/Pinata Uploads:
```
PINATA_JWT=<your-pinata-jwt-token>
PINATA_SECRET_KEY=<your-pinata-secret-key>
```
**Note:** You have PINATA_API_KEY but missing JWT and SECRET_KEY for full Pinata integration

### Irys Uploads (Eternal Echoes):
```
IRYS_WALLET_PRIVATE_KEY=<your-irys-wallet-private-key>
```
**Note:** For decentralized storage uploads

## ✅ Already Set (Good to Go):

All your CLOUT, Solana, Database, and other core variables are properly configured!

## 📋 Complete List You Need to Add:

Add these to your Render environment variables:

1. **PORT=3001** (or whatever port Render assigns)
2. **JWT_SECRET=<random-secret>** (generate a secure random string)
3. **PLATFORM_SECRET_KEY_BASE58=<your-key>** (if you need withdrawals/vault ops)
4. **HELIUS_API_KEY=ea0ed024-cd7c-4338-8b9b-b6be4d004d36** (if using orbService)
5. **PINATA_JWT=<token>** (if using Pinata IPFS)
6. **PINATA_SECRET_KEY=<secret>** (if using Pinata IPFS)
7. **IRYS_WALLET_PRIVATE_KEY=<key>** (if using Irys uploads)

