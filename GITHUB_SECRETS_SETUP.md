# GitHub Secrets Setup Guide

## Overview
This guide explains how to configure GitHub Secrets for the NFTSol CI/CD pipeline. These secrets are required for the backend to build, test, and deploy successfully.

## Required Secrets

### CLOUT Token Configuration
These are **required** for the backend build and all CI/CD jobs:

| Secret Name | Value | Notes |
|---|---|---|
| `CLOUT_MINT` | `26iJ37BE3icVtoo2QRkfjtYXFHMudG2sbTHAnhF2D6ab` | CLOUT token mint address on Solana mainnet |
| `CLOUT_PROGRAM_ID` | `<program-id>` | CLOUT token program ID (varies per deployment) |

### Solana Configuration
Required for backend runtime and API operations:

| Secret Name | Value | Notes |
|---|---|---|
| `SOLANA_RPC_URL` | Helius or QuickNode RPC endpoint | Example: `https://mainnet.helius-rpc.com/?api-key=YOUR_KEY` |
| `PLATFORM_SECRET_KEY_BASE58` | Platform wallet private key in Base58 format | Used for signing transactions and operations |
| `JWT_SECRET` | Random 32+ character secret | Used for JWT token signing in authentication |

### Deployment Configuration
Required for automatic deployments:

| Secret Name | Value | Notes |
|---|---|---|
| `RENDER_SERVICE_ID` | Your Render service ID | Found in Render dashboard for backend service |
| `RENDER_API_KEY` | Render API authentication key | Generated in Render account settings |
| `NETLIFY_AUTH_TOKEN` | Netlify personal access token | Generated in Netlify account settings |
| `NETLIFY_SITE_ID` | Your Netlify site ID | Found in Netlify site settings |

### Optional Configuration
For optional features:

| Secret Name | Value | Notes |
|---|---|---|
| `VITE_API_BASE` | Backend API URL | Default: `https://nftsol.onrender.com` |
| `VITE_SOLANA_RPC_URL` | Frontend Solana RPC | Can differ from backend RPC |
| `VITE_HELIUS_API_KEY` | Helius API key for frontend | For NFT data fetching in UI |
| `VITE_GA_TRACKING_ID` | Google Analytics tracking ID | For analytics tracking |
| `PINATA_JWT` | Pinata JWT token | For video/image IPFS storage |
| `XAI_API_KEY` | xAI Grok API key | For video authenticity verification |

## How to Add Secrets to GitHub

### Method 1: GitHub Web UI (Recommended for Individual Secrets)

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Enter the secret name and value
5. Click **Add secret**

### Method 2: GitHub CLI (Recommended for Bulk Setup)

```bash
# Install GitHub CLI if needed
# https://cli.github.com/

# Authenticate
gh auth login

# Add individual secrets
gh secret set CLOUT_MINT --body "26iJ37BE3icVtoo2QRkfjtYXFHMudG2sbTHAnhF2D6ab"
gh secret set CLOUT_PROGRAM_ID --body "your-program-id"
gh secret set SOLANA_RPC_URL --body "your-rpc-url"
gh secret set PLATFORM_SECRET_KEY_BASE58 --body "your-private-key"
gh secret set JWT_SECRET --body "your-jwt-secret"
gh secret set RENDER_SERVICE_ID --body "your-render-service-id"
gh secret set RENDER_API_KEY --body "your-render-api-key"
gh secret set NETLIFY_AUTH_TOKEN --body "your-netlify-token"
gh secret set NETLIFY_SITE_ID --body "your-netlify-site-id"
```

## Security Best Practices

⚠️ **IMPORTANT SECURITY NOTES:**

1. **Never commit secrets to git** - They should only exist in GitHub Secrets
2. **Use unique values** - Generate unique JWT_SECRET and similar cryptographic values
3. **Rotate regularly** - Especially for API keys and authentication tokens
4. **Use service accounts** - Create dedicated service accounts for CI/CD if possible
5. **Limit permissions** - Restrict API keys to only necessary scopes
6. **Audit access** - Regularly review who has access to repository secrets

## Verifying Secrets Are Set Correctly

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. You should see a list of all configured secrets
3. Secrets show as masked (`***`) in the UI for security
4. You can update or delete secrets from this page

## Troubleshooting

### Secret Not Found Error in Workflow
```
Error: Secret 'CLOUT_MINT' is not set
```
**Solution:** Ensure the secret name matches exactly (case-sensitive) what's referenced in the workflow file.

### Build Still Fails with Secrets Set
- Check that the secret **values** are correct (not just that the secret exists)
- Verify the secret is set in the correct repository (not an organization secret)
- Run the workflow again if it was created before the secret was added

### How to Verify Secrets in Running Workflow
Secrets are automatically available to all workflow jobs in the repository. They're injected at runtime and won't appear in logs.

## Values Reference

### From CLAUDE.md
```
CLOUT Token: 26iJ37BE3icVtoo2QRkfjtYXFHMudG2sbTHAnhF2D6ab
Rewards Vault: 7SBYHw5KQasPKajH6gCDnpWmb5QAh9EBvTi3cUnFAc1v
Network: Solana Mainnet (configurable to devnet)
```

### Generated Values (You Need to Create These)
- `JWT_SECRET`: Generate with: `openssl rand -base64 32`
- `PLATFORM_SECRET_KEY_BASE58`: Platform wallet private key (keep safe!)
- `SOLANA_RPC_URL`: Get from Helius or QuickNode

## Workflow Files Using These Secrets

The following workflow files use these secrets:

- `.github/workflows/main.yml` - Primary CI/CD pipeline (all backend jobs)
- `.github/workflows/deploy.yml` - Deployment to Render and Netlify
- `.github/workflows/ci.yml` - Continuous integration checks

## Additional Resources

- [GitHub Actions: Using secrets](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions)
- [Render Deployment Keys](https://render.com/docs/infrastructure-as-code)
- [Netlify Environment Variables](https://docs.netlify.com/configure-builds/environment-variables/)
- [Solana RPC Providers](https://docs.solana.com/clusters)

---

**Last Updated:** November 2025
**Status:** Complete - All secrets configured in main.yml workflow
