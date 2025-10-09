import { useCallback, useEffect, useMemo, useState } from "react";
import { Buffer } from "buffer";
import { BN } from "@coral-xyz/anchor";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";

// Helper function to derive associated token address
function getAssociatedTokenAddressSync(mint: PublicKey, owner: PublicKey): PublicKey {
  const [address] = PublicKey.findProgramAddressSync(
    [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
  return address;
}
import { useSolanaWallet } from "./use-solana-wallet";
import { useToast } from "./use-toast";

type StakingPoolView = {
  authority: string;
  rewardVault: string;
  rewardMint: string;
  cloutMint: string;
  rewardRate: string;
  totalStaked: string;
  rewardPerTokenStored: string;
  lastUpdateTs: string;
};

type StakePositionView = {
  owner: string;
  pool: string;
  amount: string;
  rewardPerTokenPaid: string;
  pendingRewards: string;
  lastStakeTs: string;
} | null;

const CLOUT_MINT = new PublicKey(
  import.meta.env.VITE_CLOUT_STAKING_MINT ?? "7CLOutToKen1111111111111111111111111111111",
);

export function useSolanaRewards() {
  const { publicKey, connection: walletConnection } = useSolanaWallet();
  const { toast } = useToast();
  const [pool, setPool] = useState<StakingPoolView | null>(null);
  const [position, setPosition] = useState<StakePositionView>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connection = useMemo(
    () =>
      walletConnection ??
      new Connection(import.meta.env.VITE_SOLANA_RPC_URL ?? "https://api.devnet.solana.com"),
    [walletConnection],
  );

  const fetchState = useCallback(async () => {
    if (!publicKey) {
      setPool(null);
      setPosition(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const url = new URL(
        `/api/solana/rewards/staking/${CLOUT_MINT.toBase58()}`,
        window.location.origin,
      );
      url.searchParams.set("owner", publicKey.toBase58());
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`Failed to fetch staking state (${response.status})`);
      }
      const data = await response.json();
      setPool(data.pool);
      setPosition(data.position);
    } catch (err: any) {
      console.error("[useSolanaRewards] fetch failed:", err);
      setError(err.message ?? "Unable to load staking data");
    } finally {
      setLoading(false);
    }
  }, [publicKey]);

  useEffect(() => {
    void fetchState();
  }, [fetchState]);

  const requestStake = useCallback(
    async (amount: number) => {
      if (!publicKey) throw new Error("Wallet not connected");
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error("Invalid staking amount");
      }
      const rawAmount = new BN(Math.floor(amount).toString());
      const ata = getAssociatedTokenAddressSync(CLOUT_MINT, publicKey);

      const response = await fetch("/api/solana/rewards/staking/transactions/stake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cloutMint: CLOUT_MINT.toBase58(),
          staker: publicKey.toBase58(),
          amount: rawAmount.toString(),
          stakerTokenAccount: ata.toBase58(),
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? "Failed to build stake transaction");
      }

      const payload = await response.json();
      const tx = Transaction.from(Buffer.from(payload.transaction, "base64"));
      tx.feePayer = publicKey;

      const provider = (window as any).solana;
      if (!provider?.signAndSendTransaction) {
        throw new Error("Solana wallet provider not found");
      }

      const { signature } = await provider.signAndSendTransaction(tx);
      await connection.confirmTransaction(signature, "confirmed");
      toast({
        title: "Stake submitted",
        description: `Signature ${signature.slice(0, 8)}…${signature.slice(-8)}`,
      });
      await fetchState();
    },
    [connection, fetchState, publicKey, toast],
  );

  const requestUnstake = useCallback(
    async (amount: number) => {
      if (!publicKey) throw new Error("Wallet not connected");
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error("Invalid unstake amount");
      }

      const rawAmount = new BN(Math.floor(amount).toString());
      const ata = getAssociatedTokenAddressSync(CLOUT_MINT, publicKey);

      const response = await fetch("/api/solana/rewards/staking/transactions/unstake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cloutMint: CLOUT_MINT.toBase58(),
          staker: publicKey.toBase58(),
          amount: rawAmount.toString(),
          destinationTokenAccount: ata.toBase58(),
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? "Failed to build unstake transaction");
      }

      const payload = await response.json();
      const tx = Transaction.from(Buffer.from(payload.transaction, "base64"));
      tx.feePayer = publicKey;

      const provider = (window as any).solana;
      if (!provider?.signAndSendTransaction) {
        throw new Error("Solana wallet provider not found");
      }

      const { signature } = await provider.signAndSendTransaction(tx);
      await connection.confirmTransaction(signature, "confirmed");
      toast({
        title: "Unstake submitted",
        description: `Signature ${signature.slice(0, 8)}…${signature.slice(-8)}`,
      });
      await fetchState();
    },
    [connection, fetchState, publicKey, toast],
  );

  const requestHarvest = useCallback(async () => {
    if (!publicKey) throw new Error("Wallet not connected");

    const response = await fetch("/api/solana/rewards/staking/transactions/harvest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cloutMint: CLOUT_MINT.toBase58(),
        staker: publicKey.toBase58(),
      }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error ?? "Failed to build harvest transaction");
    }

    const payload = await response.json();
    const tx = Transaction.from(Buffer.from(payload.transaction, "base64"));
    tx.feePayer = publicKey;

    const provider = (window as any).solana;
    if (!provider?.signAndSendTransaction) {
      throw new Error("Solana wallet provider not found");
    }

    const { signature } = await provider.signAndSendTransaction(tx);
    await connection.confirmTransaction(signature, "confirmed");
    toast({
      title: "Harvest submitted",
      description: `Signature ${signature.slice(0, 8)}.${signature.slice(-8)}`,
    });
    await fetchState();
  }, [connection, fetchState, publicKey, toast]);

  return {
    pool,
    position,
    loading,
    error,
    refresh: fetchState,
    requestStake,
    requestUnstake,
    requestHarvest,
  };
}
