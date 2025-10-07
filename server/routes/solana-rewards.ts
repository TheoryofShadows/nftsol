import { Router } from "express";
import { BN } from "@coral-xyz/anchor";
import { PublicKey, Transaction } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { getSolanaRewardsService } from "../solana-rewards-provider";

const router = Router();

router.get("/staking/:cloutMint", async (req, res) => {
  try {
    const cloutMint = safePublicKey(req.params.cloutMint, "cloutMint");
    const owner = req.query.owner ? safePublicKey(String(req.query.owner), "owner") : undefined;

    const service = await getSolanaRewardsService();
    const { poolPda, pool } = await service.fetchStakingPool(cloutMint);
    const addresses = service.getStakingAddresses(cloutMint, owner);

    let position: any = null;
    if (owner) {
      const fetched = await service.fetchStakePosition(cloutMint, owner);
      position = fetched.position
        ? serializeStakePosition(fetched.position)
        : null;
    }

    res.json({
      pool: serializeStakingPool(pool),
      derived: {
        pool: poolPda.toBase58(),
        poolVault: addresses.poolVault.toBase58(),
        poolSigner: addresses.poolSigner.toBase58(),
        position: addresses.position?.toBase58() ?? null,
      },
      position,
    });
  } catch (error: any) {
    console.error("[solana-rewards] staking GET failed:", error);
    res.status(400).json({ error: error.message ?? "failed_to_fetch_staking_pool" });
  }
});

router.post("/staking/transactions/stake", async (req, res) => {
  try {
    const { cloutMint, staker, amount, stakerTokenAccount } = req.body ?? {};

    const amountBn = new BN(String(amount));
    const cloutMintPk = safePublicKey(cloutMint, "cloutMint");
    const stakerPk = safePublicKey(staker, "staker");
    const stakerTokenPk = stakerTokenAccount
      ? safePublicKey(stakerTokenAccount, "stakerTokenAccount")
      : deriveAta(cloutMintPk, stakerPk);

    const service = await getSolanaRewardsService();
    const tx = await service.buildStakeTransaction({
      cloutMint: cloutMintPk,
      staker: stakerPk,
      stakerTokenAccount: stakerTokenPk,
      amount: amountBn,
    });

    res.json({
      transaction: serializeTransaction(tx),
    });
  } catch (error: any) {
    console.error("[solana-rewards] stake transaction build failed:", error);
    res.status(400).json({ error: error.message ?? "stake_transaction_failed" });
  }
});

router.post("/staking/transactions/unstake", async (req, res) => {
  try {
    const { cloutMint, staker, amount, destinationTokenAccount } = req.body ?? {};

    const amountBn = new BN(String(amount));
    const cloutMintPk = safePublicKey(cloutMint, "cloutMint");
    const stakerPk = safePublicKey(staker, "staker");
    const destinationPk = destinationTokenAccount
      ? safePublicKey(destinationTokenAccount, "destinationTokenAccount")
      : deriveAta(cloutMintPk, stakerPk);

    const service = await getSolanaRewardsService();
    const tx = await service.buildUnstakeTransaction({
      cloutMint: cloutMintPk,
      staker: stakerPk,
      destinationTokenAccount: destinationPk,
      amount: amountBn,
    });

    res.json({
      transaction: serializeTransaction(tx),
    });
  } catch (error: any) {
    console.error("[solana-rewards] unstake transaction build failed:", error);
    res.status(400).json({ error: error.message ?? "unstake_transaction_failed" });
  }
});

router.post("/staking/transactions/harvest", async (req, res) => {
  try {
    const { cloutMint, staker, recipientTokenAccount } = req.body ?? {};
    const cloutMintPk = safePublicKey(cloutMint, "cloutMint");
    const stakerPk = safePublicKey(staker, "staker");

    const service = await getSolanaRewardsService();
    const { pool } = await service.fetchStakingPool(cloutMintPk);
    const rewardMintPk = new PublicKey(pool.rewardMint);
    const recipientPk = recipientTokenAccount
      ? safePublicKey(recipientTokenAccount, "recipientTokenAccount")
      : deriveAta(rewardMintPk, stakerPk);

    const tx = await service.buildHarvestTransaction({
      cloutMint: cloutMintPk,
      staker: stakerPk,
      recipientTokenAccount: recipientPk,
    });

    res.json({
      transaction: serializeTransaction(tx),
      partialSigners: ["authority"],
    });
  } catch (error: any) {
    console.error("[solana-rewards] harvest transaction build failed:", error);
    res.status(400).json({ error: error.message ?? "harvest_transaction_failed" });
  }
});

router.post("/loyalty/transactions/record", async (req, res) => {
  try {
    const { profile, registryConfig, actor, volumeLamports, bonusPoints } = req.body ?? {};
    const profilePk = safePublicKey(profile, "profile");
    const registryPk = safePublicKey(registryConfig, "registryConfig");
    const actorPk = safePublicKey(actor, "actor");
    const volumeBn = new BN(String(volumeLamports ?? 0));
    const bonusBn = new BN(String(bonusPoints ?? 0));

    const service = await getSolanaRewardsService();
    const tx = await service.buildRecordLoyaltyTransaction({
      profile: profilePk,
      registryConfig: registryPk,
      actor: actorPk,
      volumeLamports: volumeBn,
      bonusPoints: bonusBn,
    });

    res.json({
      transaction: serializeTransaction(tx),
      partialSigners: ["authority"],
    });
  } catch (error: any) {
    console.error("[solana-rewards] loyalty transaction build failed:", error);
    res.status(400).json({ error: error.message ?? "loyalty_transaction_failed" });
  }
});

router.post("/market/transactions/settle", async (req, res) => {
  try {
    const {
      listing,
      escrowVault,
      receipt,
      seller,
      buyer,
      treasuryDestination,
      marketplaceFeeDestination,
      royaltyDestination,
      rewardVault,
      rewardMint,
      buyerRewardAccount,
      loyaltyProfile,
      loyaltyRegistryConfig,
      rewardAmount,
      loyaltyBonusPoints,
    } = req.body ?? {};

    const listingPk = safePublicKey(listing, "listing");
    const escrowVaultPk = safePublicKey(escrowVault, "escrowVault");
    const receiptPk = safePublicKey(receipt, "receipt");
    const sellerPk = safePublicKey(seller, "seller");
    const buyerPk = safePublicKey(buyer, "buyer");
    const treasuryPk = safePublicKey(treasuryDestination, "treasuryDestination");
    const marketplacePk = safePublicKey(marketplaceFeeDestination, "marketplaceFeeDestination");
    const royaltyPk = safePublicKey(royaltyDestination, "royaltyDestination");
    const rewardVaultPk = safePublicKey(rewardVault, "rewardVault");
    const rewardMintPk = safePublicKey(rewardMint, "rewardMint");
    const buyerRewardPk = safePublicKey(buyerRewardAccount, "buyerRewardAccount");
    const loyaltyProfilePk = safePublicKey(loyaltyProfile, "loyaltyProfile");
    const loyaltyRegistryPk = safePublicKey(loyaltyRegistryConfig, "loyaltyRegistryConfig");
    const rewardAmountBn = new BN(String(rewardAmount ?? 0));
    const loyaltyBonusBn = new BN(String(loyaltyBonusPoints ?? 0));

    const service = await getSolanaRewardsService();
    const tx = await service.buildSettlementTransaction({
      listing: listingPk,
      escrowVault: escrowVaultPk,
      receipt: receiptPk,
      seller: sellerPk,
      buyer: buyerPk,
      treasuryDestination: treasuryPk,
      marketplaceFeeDestination: marketplacePk,
      royaltyDestination: royaltyPk,
      rewardVault: rewardVaultPk,
      rewardMint: rewardMintPk,
      buyerRewardAccount: buyerRewardPk,
      loyaltyProfile: loyaltyProfilePk,
      loyaltyRegistryConfig: loyaltyRegistryPk,
      rewardAmount: rewardAmountBn,
      loyaltyBonusPoints: loyaltyBonusBn,
    });

    res.json({
      transaction: serializeTransaction(tx),
      partialSigners: ["authority"],
    });
  } catch (error: any) {
    console.error("[solana-rewards] settlement transaction build failed:", error);
    res.status(400).json({ error: error.message ?? "settlement_transaction_failed" });
  }
});

function safePublicKey(value: string, field: string): PublicKey {
  try {
    return new PublicKey(value);
  } catch (error) {
    throw new Error(`Invalid public key for ${field}`);
  }
}

function deriveAta(mint: PublicKey, owner: PublicKey): PublicKey {
  return getAssociatedTokenAddressSync(mint, owner);
}

function serializeTransaction(tx: Transaction): string {
  return tx.serialize({ requireAllSignatures: false }).toString("base64");
}

function serializeStakingPool(pool: any) {
  return {
    authority: pool.authority.toBase58(),
    rewardVault: pool.rewardVault.toBase58(),
    rewardMint: pool.rewardMint.toBase58(),
    cloutMint: pool.cloutMint.toBase58(),
    rewardRate: pool.rewardRate.toString(),
    totalStaked: pool.totalStaked.toString(),
    rewardPerTokenStored: pool.rewardPerTokenStored.toString(),
    lastUpdateTs: pool.lastUpdateTs.toString(),
  };
}

function serializeStakePosition(position: any) {
  return {
    owner: position.owner.toBase58(),
    pool: position.pool.toBase58(),
    amount: position.amount.toString(),
    rewardPerTokenPaid: position.rewardPerTokenPaid.toString(),
    pendingRewards: position.pendingRewards.toString(),
    lastStakeTs: position.lastStakeTs.toString(),
  };
}

export default router;
