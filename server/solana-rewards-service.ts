import { AnchorProvider, BN, Idl, Program } from "@coral-xyz/anchor";
import {
  Connection,
  Keypair,
  PublicKey,
  Signer,
  Transaction,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import type { RewardsVault } from "../anchor/solana_rewards/generated/types/rewards_vault.ts";
import type { CloutStaking } from "../anchor/solana_rewards/generated/types/clout_staking.ts";
import type { MarketEscrow } from "../anchor/solana_rewards/generated/types/market_escrow.ts";
import type { LoyaltyRegistry } from "../anchor/solana_rewards/generated/types/loyalty_registry.ts";

const VAULT_SIGNER_SEED = Buffer.from("vault-signer");

/**
 * Runtime metadata for a rewards program.
 * We memoize the Program instance alongside strongly-typed IDL definitions.
 */
type ProgramDescriptor<TIdl extends Idl> = {
  idl: TIdl;
  address: PublicKey;
  program: Program<TIdl>;
};

export type SettlementAccounts = {
  listing: PublicKey;
  escrowVault: PublicKey;
  receipt: PublicKey;
  rewardVault: PublicKey;
  rewardMint: PublicKey;
  buyerRewardAccount: PublicKey;
  loyaltyProfile: PublicKey;
  loyaltyRegistryConfig: PublicKey;
  royaltyDestination: PublicKey;
};

export type RewardsServiceConfig = {
  connection: Connection;
  authorityKeypair?: Keypair;
  wallet?: AnchorProvider["wallet"];
  rewardVaultProgramId: PublicKey;
  stakingProgramId: PublicKey;
  escrowProgramId: PublicKey;
  loyaltyProgramId: PublicKey;
  developerWallet: PublicKey;
  rewardsPool: PublicKey;
  opsTreasury: PublicKey;
  idlLoaders: {
    loadRewardsVaultIdl: () => Promise<RewardsVault>;
    loadStakingIdl: () => Promise<CloutStaking>;
    loadEscrowIdl: () => Promise<MarketEscrow>;
    loadLoyaltyIdl: () => Promise<LoyaltyRegistry>;
  };
};

/**
 * SolanaRewardsService wires generated Anchor clients to the rest of the Node runtime.
 * All methods return lightweight DTOs so REST handlers can finalise signing / serialization.
 */
export class SolanaRewardsService {
  private readonly provider: AnchorProvider;

  private rewardsVault?: ProgramDescriptor<RewardsVault>;
  private staking?: ProgramDescriptor<CloutStaking>;
  private escrow?: ProgramDescriptor<MarketEscrow>;
  private loyalty?: ProgramDescriptor<LoyaltyRegistry>;

  constructor(private readonly config: RewardsServiceConfig) {
    const wallet = config.wallet ?? AnchorProvider.local().wallet;
    this.provider = new AnchorProvider(config.connection, wallet, {
      preflightCommitment: "processed",
    });
  }

  async refreshPrograms(): Promise<void> {
    const [rewardsVaultIdl, stakingIdl, escrowIdl, loyaltyIdl] = await Promise.all([
      this.config.idlLoaders.loadRewardsVaultIdl(),
      this.config.idlLoaders.loadStakingIdl(),
      this.config.idlLoaders.loadEscrowIdl(),
      this.config.idlLoaders.loadLoyaltyIdl(),
    ]);

    this.rewardsVault = this.instantiateProgram(rewardsVaultIdl, this.config.rewardVaultProgramId);
    this.staking = this.instantiateProgram(stakingIdl, this.config.stakingProgramId);
    this.escrow = this.instantiateProgram(escrowIdl, this.config.escrowProgramId);
    this.loyalty = this.instantiateProgram(loyaltyIdl, this.config.loyaltyProgramId);
  }

  async settleMarketplaceSale(args: {
    priceLamports: BN;
    rewardAmount: BN;
    loyaltyBonusPoints: BN;
    buyer: PublicKey;
    seller: Signer;
    settlement: SettlementAccounts;
  }): Promise<string> {
    const escrow = await this.requireProgram(this.escrow, "market_escrow");
    const rewardsVault = await this.requireProgram(this.rewardsVault, "rewards_vault");
    const authority = this.config.authorityKeypair?.publicKey ?? this.provider.wallet.publicKey;
    const vaultConfig = await rewardsVault.program.account.vaultConfig.fetch(
      args.settlement.rewardVault,
    );
    if (!vaultConfig.authority.equals(authority)) {
      throw new Error("Configured authority does not match rewards vault authority.");
    }
    const vaultSigner = this.deriveVaultSigner(args.settlement.rewardMint);
    await this.requireProgram(this.loyalty, "loyalty_registry");

    return escrow.program.methods
      .settleSale(args.rewardAmount, args.loyaltyBonusPoints)
      .accounts({
        listing: args.settlement.listing,
        escrowVault: args.settlement.escrowVault,
        seller: args.seller.publicKey,
        buyer: args.buyer,
        developerWallet: this.config.developerWallet,
        rewardsPoolDestination: this.config.rewardsPool,
        opsTreasuryDestination: this.config.opsTreasury,
        royaltyDestination: args.settlement.royaltyDestination,
        receipt: args.settlement.receipt,
        rewardVault: args.settlement.rewardVault,
        vaultSigner,
        rewardMint: args.settlement.rewardMint,
        buyerRewardAccount: args.settlement.buyerRewardAccount,
        rewardAuthority: authority,
        loyaltyProfile: args.settlement.loyaltyProfile,
        loyaltyRegistryConfig: args.settlement.loyaltyRegistryConfig,
        loyaltyAuthority: authority,
        tokenProgram: TOKEN_PROGRAM_ID,
        rewardsVaultProgram: this.config.rewardVaultProgramId,
        loyaltyProgram: this.config.loyaltyProgramId,
        systemProgram: SystemProgram.programId,
      })
      .signers([args.seller])
      .rpc();
  }

  async recordLoyaltyActivity(args: {
    actor: Signer;
    profile: PublicKey;
    registryConfig: PublicKey;
    authority: Signer;
    volumeLamports: BN;
    bonusPoints: BN;
  }): Promise<string> {
    const loyalty = await this.requireProgram(this.loyalty, "loyalty_registry");
    return loyalty.program.methods
      .recordActivity(args.volumeLamports, args.bonusPoints)
      .accounts({
        profile: args.profile,
        actor: args.actor.publicKey,
        registryConfig: args.registryConfig,
        authority: args.authority.publicKey,
      })
      .signers([args.actor, args.authority])
      .rpc();
  }

  private instantiateProgram<T extends Idl>(idl: T, address: PublicKey): ProgramDescriptor<T> {
    const program = new Program<T>(idl, address, this.provider);
    return { idl, address, program };
  }

  private async requireProgram<T extends Idl>(
    descriptor: ProgramDescriptor<T> | undefined,
    name: string,
  ): Promise<ProgramDescriptor<T>> {
    if (!descriptor) {
      await this.refreshPrograms();
    }
    if (!descriptor) {
      throw new Error(`Program ${name} is not initialised`);
    }
    return descriptor;
  }

  // Staking helpers --------------------------------------------------------

  async fetchStakingPool(cloutMint: PublicKey) {
    const staking = await this.requireProgram(this.staking, "clout_staking");
    const poolPda = this.derivePoolPda(cloutMint);
    const pool = await staking.program.account.stakingPool.fetch(poolPda);
    return { poolPda, pool };
  }

  async fetchStakePosition(cloutMint: PublicKey, owner: PublicKey) {
    const staking = await this.requireProgram(this.staking, "clout_staking");
    const poolPda = this.derivePoolPda(cloutMint);
    const positionPda = this.derivePositionPda(poolPda, owner);
    try {
      const position = await staking.program.account.stakePosition.fetch(positionPda);
      return { positionPda, position };
    } catch (error: any) {
      if (error?.message?.includes("Account does not exist")) {
        return { positionPda, position: null };
      }
      throw error;
    }
  }

  async buildStakeTransaction(args: {
    cloutMint: PublicKey;
    staker: PublicKey;
    stakerTokenAccount: PublicKey;
    amount: BN;
  }): Promise<Transaction> {
    const staking = await this.requireProgram(this.staking, "clout_staking");
    const { poolPda } = await this.fetchStakingPool(args.cloutMint);

    const poolVault = this.derivePoolVaultPda(args.cloutMint);
    const poolSigner = this.derivePoolSigner(args.cloutMint);
    const position = this.derivePositionPda(poolPda, args.staker);

    const tx = await staking.program.methods.stake(args.amount).accounts({
      pool: poolPda,
      poolVault,
      position,
      staker: args.staker,
      stakerToken: args.stakerTokenAccount,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
    }).transaction();

    await this.prepareTransaction(tx, args.staker);
    return tx;
  }

  async buildUnstakeTransaction(args: {
    cloutMint: PublicKey;
    staker: PublicKey;
    destinationTokenAccount: PublicKey;
    amount: BN;
  }): Promise<Transaction> {
    const staking = await this.requireProgram(this.staking, "clout_staking");
    const { poolPda } = await this.fetchStakingPool(args.cloutMint);

    const poolVault = this.derivePoolVaultPda(args.cloutMint);
    const poolSigner = this.derivePoolSigner(args.cloutMint);
    const position = this.derivePositionPda(poolPda, args.staker);

    const tx = await staking.program.methods.unstake(args.amount).accounts({
      pool: poolPda,
      poolVault,
      position,
      staker: args.staker,
      destinationToken: args.destinationTokenAccount,
      poolSigner,
      tokenProgram: TOKEN_PROGRAM_ID,
    }).transaction();

    await this.prepareTransaction(tx, args.staker);
    return tx;
  }

  async buildHarvestTransaction(args: {
    cloutMint: PublicKey;
    staker: PublicKey;
    recipientTokenAccount: PublicKey;
  }): Promise<Transaction> {
    const authority = this.config.authorityKeypair;
    if (!authority) {
      throw new Error("Authority keypair is required to build harvest transactions.");
    }

    const staking = await this.requireProgram(this.staking, "clout_staking");
    const rewardsVault = await this.requireProgram(this.rewardsVault, "rewards_vault");

    const { poolPda, pool } = await this.fetchStakingPool(args.cloutMint);
    const position = this.derivePositionPda(poolPda, args.staker);
    const poolSigner = this.derivePoolSigner(args.cloutMint);

    const rewardVaultPk = new PublicKey(pool.rewardVault);
    const vaultConfig = await rewardsVault.program.account.vaultConfig.fetch(rewardVaultPk);
    if (!vaultConfig.authority.equals(authority.publicKey)) {
      throw new Error("Configured authority does not match rewards vault authority.");
    }
    const rewardMintPk = new PublicKey(pool.rewardMint);
    const vaultSigner = this.deriveVaultSigner(rewardMintPk);

    const tx = await staking.program.methods.harvest().accounts({
      pool: poolPda,
      position,
      staker: args.staker,
      rewardVault: rewardVaultPk,
      vaultSigner,
      rewardMint: rewardMintPk,
      recipientToken: args.recipientTokenAccount,
      poolAuthority: authority.publicKey,
      poolSigner,
      tokenProgram: TOKEN_PROGRAM_ID,
      rewardsVaultProgram: this.config.rewardVaultProgramId,
    }).transaction();

    await this.prepareTransaction(tx, args.staker);
    tx.partialSign(authority);
    return tx;
  }

  async buildRecordLoyaltyTransaction(args: {
    profile: PublicKey;
    registryConfig: PublicKey;
    actor: PublicKey;
    volumeLamports: BN;
    bonusPoints: BN;
  }): Promise<Transaction> {
    const authority = this.config.authorityKeypair;
    if (!authority) {
      throw new Error("Authority keypair is required to build loyalty transactions.");
    }

    const loyalty = await this.requireProgram(this.loyalty, "loyalty_registry");
    const tx = await loyalty.program.methods
      .recordActivity(args.volumeLamports, args.bonusPoints)
      .accounts({
        profile: args.profile,
        actor: args.actor,
        registryConfig: args.registryConfig,
        authority: authority.publicKey,
      })
      .transaction();

    await this.prepareTransaction(tx, args.actor);
    tx.partialSign(authority);
    return tx;
  }

  async buildSettlementTransaction(args: {
    listing: PublicKey;
    escrowVault: PublicKey;
    receipt: PublicKey;
    seller: PublicKey;
    buyer: PublicKey;
    royaltyDestination: PublicKey;
    rewardVault: PublicKey;
    rewardMint: PublicKey;
    buyerRewardAccount: PublicKey;
    loyaltyProfile: PublicKey;
    loyaltyRegistryConfig: PublicKey;
    rewardAmount: BN;
    loyaltyBonusPoints: BN;
  }): Promise<Transaction> {
    const authority = this.config.authorityKeypair;
    if (!authority) {
      throw new Error("Authority keypair is required to build settlement transactions.");
    }

    const escrow = await this.requireProgram(this.escrow, "market_escrow");
    const rewardsVault = await this.requireProgram(this.rewardsVault, "rewards_vault");
    await this.requireProgram(this.loyalty, "loyalty_registry");

    const vaultConfig = await rewardsVault.program.account.vaultConfig.fetch(args.rewardVault);
    if (!vaultConfig.authority.equals(authority.publicKey)) {
      throw new Error("Configured authority does not match rewards vault authority.");
    }
    const vaultSigner = this.deriveVaultSigner(args.rewardMint);

    const tx = await escrow.program.methods
      .settleSale(args.rewardAmount, args.loyaltyBonusPoints)
      .accounts({
        listing: args.listing,
        escrowVault: args.escrowVault,
        seller: args.seller,
        buyer: args.buyer,
        developerWallet: this.config.developerWallet,
        rewardsPoolDestination: this.config.rewardsPool,
        opsTreasuryDestination: this.config.opsTreasury,
        royaltyDestination: args.royaltyDestination,
        receipt: args.receipt,
        rewardVault: args.rewardVault,
        vaultSigner,
        rewardMint: args.rewardMint,
        buyerRewardAccount: args.buyerRewardAccount,
        rewardAuthority: authority.publicKey,
        loyaltyProfile: args.loyaltyProfile,
        loyaltyRegistryConfig: args.loyaltyRegistryConfig,
        loyaltyAuthority: authority.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        rewardsVaultProgram: this.config.rewardVaultProgramId,
        loyaltyProgram: this.config.loyaltyProgramId,
        systemProgram: SystemProgram.programId,
      })
      .transaction();

    await this.prepareTransaction(tx, args.seller);
    tx.partialSign(authority);
    return tx;
  }

  private derivePoolPda(cloutMint: PublicKey): PublicKey {
    const [pool] = PublicKey.findProgramAddressSync(
      [Buffer.from("pool"), cloutMint.toBuffer()],
      this.config.stakingProgramId,
    );
    return pool;
  }

  private derivePoolVaultPda(cloutMint: PublicKey): PublicKey {
    const [vault] = PublicKey.findProgramAddressSync(
      [Buffer.from("pool-vault"), cloutMint.toBuffer()],
      this.config.stakingProgramId,
    );
    return vault;
  }

  private derivePoolSigner(cloutMint: PublicKey): PublicKey {
    const [signer] = PublicKey.findProgramAddressSync(
      [Buffer.from("pool-signer"), cloutMint.toBuffer()],
      this.config.stakingProgramId,
    );
    return signer;
  }

  private derivePositionPda(pool: PublicKey, owner: PublicKey): PublicKey {
    const [position] = PublicKey.findProgramAddressSync(
      [Buffer.from("position"), pool.toBuffer(), owner.toBuffer()],
      this.config.stakingProgramId,
    );
    return position;
  }

  private deriveVaultSigner(rewardMint: PublicKey): PublicKey {
    const [vaultSigner] = PublicKey.findProgramAddressSync(
      [VAULT_SIGNER_SEED, rewardMint.toBuffer()],
      this.config.rewardVaultProgramId,
    );
    return vaultSigner;
  }

  getStakingAddresses(cloutMint: PublicKey, owner?: PublicKey) {
    const pool = this.derivePoolPda(cloutMint);
    const poolVault = this.derivePoolVaultPda(cloutMint);
    const poolSigner = this.derivePoolSigner(cloutMint);
    const position = owner ? this.derivePositionPda(pool, owner) : undefined;
    return { pool, poolVault, poolSigner, position };
  }

  private async prepareTransaction(tx: Transaction, feePayer: PublicKey) {
    const { blockhash } = await this.provider.connection.getLatestBlockhash("confirmed");
    tx.recentBlockhash = blockhash;
    tx.feePayer = feePayer;
  }
}

/**
 * Helper loader that reads a JSON file from disk lazily.
 * Used by runtime configuration; kept in this module for convenience.
 */
export const loadIdlFromFs = async <T extends Idl>(path: string): Promise<T> => {
  const fs = await import("fs/promises");
  const raw = await fs.readFile(path, "utf-8");
  return JSON.parse(raw) as T;
};
