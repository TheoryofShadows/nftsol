# Mint Path — Pre-Deploy Verification Checklist

Use this before shipping changes that touch NFT minting to production
(`nftsol.onrender.com`). It exists because the mint path was migrated off the
deprecated `@metaplex-foundation/js` to `umi` + `mpl-token-metadata` (PR #193).
That change is covered by unit tests with mocked umi, but the **mint + transfer
to the buyer** only runs for real on-chain — so verify it on **devnet** first.

> ⚠️ Never run the smoke-test against mainnet. The script refuses any non-devnet
> RPC, but double-check `SOLANA_RPC_URL` anyway.

---

## 1. Prerequisites

- [ ] A **devnet** platform keypair (base58 secret). Do **not** reuse the
      mainnet `PLATFORM_SECRET_KEY_BASE58`.
- [ ] Devnet RPC URL: `https://api.devnet.solana.com` (or a devnet Helius
      endpoint).
- [ ] The platform wallet is funded on devnet:
      ```bash
      solana airdrop 1 <PLATFORM_PUBKEY> --url devnet
      ```
      Needs ≥ 0.02 SOL to mint.

## 2. Run the devnet smoke-test

From `apps/backend/`:

```bash
SOLANA_RPC_URL="https://api.devnet.solana.com" \
PLATFORM_SECRET_KEY_BASE58="<devnet platform secret>" \
npm run smoketest:mint -- <optional recipient address>
```

If no recipient is passed, the script generates a throwaway buyer keypair.

- [ ] Script prints `✅ Mint reported success` with a `mintAddress` and `txSig`.
- [ ] Script prints `🔍 Verified: mint account exists on-chain`.
- [ ] Open the printed Explorer link
      (`https://explorer.solana.com/tx/<sig>?cluster=devnet`) and confirm:
  - [ ] The transaction succeeded.
  - [ ] The NFT is held by the **recipient** wallet — **not** the platform
        wallet. (This is the migration's key behavior: mint → transfer to
        buyer.)
  - [ ] Metadata resolves: name, `NFTSOL` symbol, 2.5% royalty
        (`sellerFeeBasisPoints: 250`).

## 3. Code & dependency gates (CI already enforces these)

- [ ] `npm run build` passes (backend + client).
- [ ] `npm test` passes in `apps/backend/` (includes `mint-solana.test.ts`,
      which asserts the transfer-to-buyer step).
- [ ] `npm run type-check` clean.
- [ ] `npm audit` shows **no critical/high** advisories
      (moderate/low transitive ones are tracked separately).

## 4. Production environment sanity

- [ ] `PLATFORM_SECRET_KEY_BASE58` on Render is the **mainnet** platform key,
      never logged (CodeQL + GitGuardian enforce this; RPC URLs are redacted
      via `redactRpcUrl`).
- [ ] `SOLANA_RPC_URL` points at a paid mainnet RPC (Helius/QuickNode), not the
      public `api.mainnet-beta.solana.com`.
- [ ] Mainnet platform wallet is funded for expected mint volume.
- [ ] `CLOUT_MINT` / `REWARDS_OWNER` unchanged (see
      [CLAUDE.md](../CLAUDE.md) — these handle real assets).

## 5. Post-deploy smoke (mainnet, optional but recommended)

- [ ] Do one small real mint via the app and confirm the buyer receives the NFT
      and the Explorer link resolves. Budget the lamports; this is a real mint.

---

_Related: `apps/backend/scripts/devnet-mint-smoketest.ts`,
`apps/backend/src/lib/solana.ts` (`mintNFT`),
`apps/backend/src/__tests__/unit/mint-solana.test.ts`._
</content>
