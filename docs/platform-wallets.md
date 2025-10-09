# Platform Wallet Setup Guide

The marketplace relies on four dedicated Solana wallets. These wallets should
be controlled in Phantom (or another audited signer) and **must never** have
their private keys copied into this repository or server runtime. Only public
keys are referenced by the application.

## Required Accounts

| Wallet                | Purpose                                                     | Env variable                          |
|-----------------------|-------------------------------------------------------------|---------------------------------------|
| Developer Wallet      | Receives the hard‑baked 1% royalty on every marketplace sale | `DEVELOPER_WALLET_PUBLIC_KEY`         |
| CLOUT Treasury        | Funds monthly Clout rewards and community incentives        | `CLOUT_TREASURY_WALLET`               |
| Marketplace Treasury  | Holds Ops/Treasury reserves from the 0.25% platform fee     | `MARKETPLACE_TREASURY_WALLET`         |
| Creator Escrow        | Escrows royalty payouts pending settlement                  | `CREATOR_ESCROW_WALLET`               |

The backend also expects:

* `DEVELOPER_WALLET_ADDRESS` – same value as `DEVELOPER_WALLET_PUBLIC_KEY`, used by the Solana rewards service.
* `REWARD_POOL_WALLET` and `OPS_TREASURY_WALLET` – optional override addresses. If not set they default to the developer wallet during development; set them explicitly before production.

## 1. Create the wallets in Phantom

1. Open Phantom → Accounts → “Add / Connect Wallet” → “Create new wallet”.
2. Create four wallets, labelling each clearly (e.g., `NFTSol • Developer`, `NFTSol • Clout Treasury`, etc.).
3. Backup the recovery phrases in an offline password manager or hardware device.
4. For the dev/staging environment you can create additional throwaway wallets, but do **not** reuse the production seed phrases.

## 2. Record the public keys

For each wallet:

1. In Phantom click the account name → “Copy address”.\
2. Paste the address into your `.env` (or secret manager) under the matching variable.

Example `.env` snippet:

```ini
DEVELOPER_WALLET_PUBLIC_KEY=FsoPx1WmXA6FDxYTSULRDko3tKbNG7KxdRTq2icQJGjM
DEVELOPER_WALLET_ADDRESS=FsoPx1WmXA6FDxYTSULRDko3tKbNG7KxdRTq2icQJGjM
CLOUT_TREASURY_WALLET=7hvG1... (replace)
MARKETPLACE_TREASURY_WALLET=5a1t... (replace)
CREATOR_ESCROW_WALLET=4qzP... (replace)
REWARD_POOL_WALLET=8nQb... (replace if separate from treasury)
OPS_TREASURY_WALLET=9n2A... (replace if separate)
```

> **Tip:** Keep `.env` out of version control. Commit only `.env.example` with blank placeholders.

## 3. Verify the addresses

Use the Solana CLI (inside WSL to match the build toolchain) to confirm the
addresses are valid base58 public keys:

```bash
wsl -e bash -lc "solana-keygen verify DEVELOPER_PUBKEY"
```

Each command should print `Signature verified`, confirming the format is correct.

## 4. Configure the backend

* The server now reads all wallet public keys from environment variables via `server/wallet-config.ts`.
* Missing variables throw an error in production; during local development the code falls back to placeholder addresses and logs a warning.
* No private keys are generated or stored. Any actions requiring a signature (e.g., monthly reward distribution) should be initiated from a secure workstation where Phantom can sign the transaction.

Restart the backend after updating the environment. The health endpoint
(`/api/wallet/security/health`) surfaces whether each wallet is configured and
whether we’re still relying on placeholders.

## 5. Security Checklist

- [ ] Seed phrases stored offline (hardware, vault, or institutional custodian)
- [ ] Public keys populated in `.env` for every environment
- [ ] `.env` **not** committed to git
- [ ] Phantom configured to require biometric/passcode before signing
- [ ] Hardware wallet (Ledger/Trezor) attached to Phantom for high-value accounts (recommended)
- [ ] Multisig enabled for the treasury wallets before mainnet launch (via Squads, Realms, or similar)

Keeping these wallets isolated ensures the protocol-fee split hard-coded in the
programs remains enforceable while giving the team confidence that funds and
reward pools are safeguarded. 
