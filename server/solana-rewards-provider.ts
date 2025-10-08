import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";
import path from "path";
import fs from "fs";
import { SolanaRewardsService, loadIdlFromFs } from "./solana-rewards-service";
import type { Wallet } from "@coral-xyz/anchor";

let servicePromise: Promise<SolanaRewardsService> | null = null;

const DEFAULT_RPC = process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
const DEFAULT_REWARD_VAULT = "YBSSnuhAgYq6SN1yofjNt8XyLW7B3mQQQFUBF8gwH6J";
const DEFAULT_STAKING = "4mUWjVdfVWP9TT5wT9x2P2Uhd8NQgzWXXMGKM8xxmM9E";
const DEFAULT_ESCROW = "8um9wXkGXVuxs9jVCpt3DrzkmMAiLDKrKkaHSLyPqPcX";
const DEFAULT_LOYALTY = "GgfPQkNHuNbSw6cyDpzHeTLbTxSA2ZPUa2F1ZascnJur";

const workspaceRoot = path.resolve(process.cwd(), "anchor", "solana_rewards");

function loadKeypair(): Keypair | undefined {
  const keypairPath = process.env.SOLANA_ADMIN_KEYPAIR;
  if (!keypairPath) return undefined;
  const absolute = path.isAbsolute(keypairPath)
    ? keypairPath
    : path.join(process.cwd(), keypairPath);
  if (!fs.existsSync(absolute)) {
    console.warn(`[solana-rewards] Keypair not found at ${absolute}`);
    return undefined;
  }
  const secret = JSON.parse(fs.readFileSync(absolute, "utf-8"));
  return Keypair.fromSecretKey(Uint8Array.from(secret));
}

async function createService(): Promise<SolanaRewardsService> {
  const connection = new Connection(DEFAULT_RPC, "confirmed");
  const authorityKeypair = loadKeypair();
  const signer = authorityKeypair ?? Keypair.generate();
  const signWithAuthority = <T extends Transaction | VersionedTransaction>(
    tx: T,
  ): T => {
    if (tx instanceof Transaction) {
      tx.partialSign(signer);
      return tx;
    }

    tx.sign([signer]);
    return tx;
  };

  const wallet: Wallet = {
    publicKey: signer.publicKey,
    payer: signer,
    async signTransaction<T extends Transaction | VersionedTransaction>(tx: T) {
      return signWithAuthority(tx);
    },
    async signAllTransactions<T extends Transaction | VersionedTransaction>(txs: T[]) {
      return txs.map((tx) => signWithAuthority(tx));
    },
  };

  return new SolanaRewardsService({
    connection,
    authorityKeypair,
    wallet,
    rewardVaultProgramId: new PublicKey(process.env.REWARDS_VAULT_PROGRAM_ID ?? DEFAULT_REWARD_VAULT),
    stakingProgramId: new PublicKey(process.env.CLOUT_STAKING_PROGRAM_ID ?? DEFAULT_STAKING),
    escrowProgramId: new PublicKey(process.env.MARKET_ESCROW_PROGRAM_ID ?? DEFAULT_ESCROW),
    loyaltyProgramId: new PublicKey(process.env.LOYALTY_REGISTRY_PROGRAM_ID ?? DEFAULT_LOYALTY),
    idlLoaders: {
      loadRewardsVaultIdl: () =>
        loadIdlFromFs(path.join(workspaceRoot, "generated", "idl", "rewards_vault.json")),
      loadStakingIdl: () =>
        loadIdlFromFs(path.join(workspaceRoot, "generated", "idl", "clout_staking.json")),
      loadEscrowIdl: () =>
        loadIdlFromFs(path.join(workspaceRoot, "generated", "idl", "market_escrow.json")),
      loadLoyaltyIdl: () =>
        loadIdlFromFs(path.join(workspaceRoot, "generated", "idl", "loyalty_registry.json")),
    },
  });
}

export const getSolanaRewardsService = (): Promise<SolanaRewardsService> => {
  if (!servicePromise) {
    servicePromise = createService().then(async (service) => {
      await service.refreshPrograms();
      return service;
    });
  }
  return servicePromise;
};
