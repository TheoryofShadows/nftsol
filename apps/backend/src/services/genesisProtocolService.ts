import { Connection, PublicKey, Keypair, Transaction, SystemProgram } from '@solana/web3.js';
import { AnchorProvider, Program, Idl, BN } from '@coral-xyz/anchor';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction } from '@solana/spl-token';
import { MerkleTree } from 'merkletreejs';
import { keccak256 } from 'ethers';
import fs from 'fs';
import path from 'path';

// Types for Genesis Protocol
export interface FairLaunchConfig {
  totalSupply: number;
  minAllocation: number;
  maxAllocation: number;
  delaySeconds: number;
  durationSeconds: number;
  whitelistRoot: string;
}

export interface GenesisLaunchConfig {
  name: string;
  symbol?: string;
  description: string;
  image?: string;
  totalSupply?: number;
  maxSupply: number;
  price?: number;
  pricePerNFT: number;
  startTime?: number;
  endTime?: number;
  launchDate: Date;
  endDate?: Date;
  whitelistRoot?: string;
  whitelistRequired?: boolean;
  maxPerWallet?: number;
  maxMintsPerWallet?: number;
  maxMintsPerTransaction?: number;
  creatorFee?: number;
  antiBotProtection?: boolean;
  tieredAccess?: boolean;
  tiers?: any[];
}

export interface GenesisTier {
  name: string;
  minHoldings: number;
  maxAllocation: number;
  discount: number;
  earlyAccess: boolean;
}

export interface FairLaunchData {
  fairLaunch: string;
  authority: string;
  tokenMint: string;
  treasury: string;
  config: FairLaunchConfig;
  status: 'Active' | 'Finalized' | 'Cancelled';
  totalParticipants: number;
  totalAllocated: number;
  createdAt: number;
  startTime: number;
  endTime: number;
  finalizedAt?: number;
}

export interface ParticipantData {
  participant: string;
  fairLaunch: string;
  wallet: string;
  amountAllocated: number;
  tokensClaimed: number;
  participatedAt: number;
  claimedAt?: number;
}

export interface WhitelistEntry {
  wallet: string;
  maxAllocation: number;
}

export class GenesisProtocolService {
  private connection: Connection;
  private program: Program<Idl> | null = null;
  private provider: AnchorProvider | null = null;
  public signer: Keypair | null = null;

  constructor(connection: Connection) {
    this.connection = connection;
    this.initializeProgram();
  }

  private async initializeProgram() {
    try {
      // TEMP: Skip Genesis Protocol init — using placeholder
      // We'll enable this when real Anchor program + IDL is deployed
      
      // COMMENTED OUT: IDL loading and program initialization
      // const idlPath = path.join(__dirname, '../../smart-contracts/solana_rewards/target/idl/governance.json');
      // const idl = JSON.parse(fs.readFileSync(idlPath, 'utf8'));
      
      // Create provider with wallet
      const wallet = Keypair.generate(); // In production, use actual wallet
      const walletAdapter = {
        publicKey: wallet.publicKey,
        signTransaction: async (tx: Transaction) => tx,
        signAllTransactions: async (txs: Transaction[]) => txs
      };
      this.provider = new AnchorProvider(
        this.connection,
        walletAdapter as any,
        { commitment: 'confirmed' }
      ) as any;

      // Mock program for dev
      this.program = {
        methods: {},
        account: {},
        instruction: {},
        // Add minimal methods you use
        mint: () => ({ instruction: () => ({}) }),
      } as any;

      console.log('✅ Genesis Protocol service initialized (placeholder mode)');
    } catch (error) {
      console.error('❌ Failed to initialize Genesis Protocol service:', error);
    }
  }

  /**
   * Create a fair launch campaign
   */
  async createFairLaunch(
    authority: Keypair,
    tokenMint: PublicKey,
    treasury: PublicKey,
    config: FairLaunchConfig
  ): Promise<{ fairLaunch: PublicKey; signature: string }> {
    if (!this.program) {
      throw new Error('Genesis Protocol service not initialized');
    }

    try {
      console.log('🎲 Creating fair launch campaign...');

      // Generate fair launch PDA
      const timestamp = Math.floor(Date.now() / 1000);
      const [fairLaunchPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('fair_launch'),
          tokenMint.toBuffer(),
          Buffer.from(timestamp.toString().padStart(8, '0'))
        ],
        this.program.programId
      );

      // Create fair launch transaction
      const tx = await this.program.methods
        .createFairLaunch({
          totalSupply: new BN(config.totalSupply),
          minAllocation: new BN(config.minAllocation),
          maxAllocation: new BN(config.maxAllocation),
          delaySeconds: new BN(config.delaySeconds),
          durationSeconds: new BN(config.durationSeconds),
          whitelistRoot: Buffer.from(config.whitelistRoot, 'hex')
        })
        .accounts({
          fairLaunch: fairLaunchPda,
          authority: authority.publicKey,
          tokenMint: tokenMint,
          treasury: treasury,
          systemProgram: SystemProgram.programId
        })
        .signers([authority])
        .rpc();

      console.log(`✅ Fair launch created: ${fairLaunchPda.toString()}`);
      console.log(`📝 Transaction: ${tx}`);

      return {
        fairLaunch: fairLaunchPda,
        signature: tx
      };

    } catch (error) {
      console.error('❌ Failed to create fair launch:', error);
      throw error;
    }
  }

  /**
   * Generate whitelist merkle tree
   */
  generateWhitelistTree(whitelist: WhitelistEntry[]): { root: string; tree: MerkleTree } {
    try {
      console.log(`🌳 Generating merkle tree for ${whitelist.length} participants...`);

      // Create leaves for merkle tree
      const leaves = whitelist.map(entry => {
        const data = Buffer.concat([
          Buffer.from(entry.wallet, 'hex'),
          Buffer.from(entry.maxAllocation.toString().padStart(16, '0'))
        ]);
        return keccak256(data);
      });

      // Create merkle tree
      const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
      const root = tree.getHexRoot();

      console.log(`✅ Merkle tree generated with root: ${root}`);

      return { root, tree };
    } catch (error) {
      console.error('❌ Failed to generate whitelist tree:', error);
      throw error;
    }
  }

  /**
   * Get merkle proof for participant
   */
  getMerkleProof(tree: MerkleTree, wallet: string, maxAllocation: number): string[] {
    try {
      const data = Buffer.concat([
        Buffer.from(wallet, 'hex'),
        Buffer.from(maxAllocation.toString().padStart(16, '0'))
      ]);
      const leaf = keccak256(data);
      
      const proof = tree.getHexProof(leaf);
      return proof;
    } catch (error) {
      console.error('❌ Failed to get merkle proof:', error);
      throw error;
    }
  }

  /**
   * Participate in fair launch
   */
  async participateInFairLaunch(
    participant: Keypair,
    fairLaunch: PublicKey,
    amount: number,
    merkleProof: string[]
  ): Promise<{ signature: string }> {
    if (!this.program) {
      throw new Error('Genesis Protocol service not initialized');
    }

    try {
      console.log(`🎯 Participating in fair launch with ${amount} tokens...`);

      // Generate participant PDA
      const [participantPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('participant'),
          fairLaunch.toBuffer(),
          participant.publicKey.toBuffer()
        ],
        this.program.programId
      );

      // Convert merkle proof to bytes
      const proofBytes = merkleProof.map(proof => Buffer.from(proof.slice(2), 'hex'));

      // Create participation transaction
      const tx = await this.program.methods
        .participateFairLaunch(
          new BN(amount),
          proofBytes
        )
        .accounts({
          fairLaunch: fairLaunch,
          participant: participantPda,
          participantWallet: participant.publicKey,
          participantSigner: participant.publicKey,
          systemProgram: SystemProgram.programId
        })
        .signers([participant])
        .rpc();

      console.log(`✅ Participation successful: ${tx}`);

      return { signature: tx };

    } catch (error) {
      console.error('❌ Failed to participate in fair launch:', error);
      throw error;
    }
  }

  /**
   * Finalize fair launch
   */
  async finalizeFairLaunch(
    authority: Keypair,
    fairLaunch: PublicKey
  ): Promise<{ signature: string }> {
    if (!this.program) {
      throw new Error('Genesis Protocol service not initialized');
    }

    try {
      console.log('🏁 Finalizing fair launch...');

      const tx = await this.program.methods
        .finalizeFairLaunch()
        .accounts({
          fairLaunch: fairLaunch,
          authority: authority.publicKey
        })
        .signers([authority])
        .rpc();

      console.log(`✅ Fair launch finalized: ${tx}`);

      return { signature: tx };

    } catch (error) {
      console.error('❌ Failed to finalize fair launch:', error);
      throw error;
    }
  }

  /**
   * Claim tokens after fair launch
   */
  async claimTokens(
    participant: Keypair,
    fairLaunch: PublicKey,
    tokenMint: PublicKey
  ): Promise<{ signature: string }> {
    if (!this.program) {
      throw new Error('Genesis Protocol service not initialized');
    }

    try {
      console.log('💰 Claiming tokens...');

      // Generate PDAs
      const [participantPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('participant'),
          fairLaunch.toBuffer(),
          participant.publicKey.toBuffer()
        ],
        this.program.programId
      );

      // Get fair launch data to find treasury
      const fairLaunchAccount = await (this.program as any).account.fairLaunch.fetch(fairLaunch);
      const treasury = fairLaunchAccount.treasury;

      // Get token accounts
      const participantTokenAccount = await getAssociatedTokenAddress(
        tokenMint,
        participant.publicKey
      );

      const treasuryTokenAccount = await getAssociatedTokenAddress(
        tokenMint,
        treasury
      );

      // Create claim transaction
      const tx = await this.program.methods
        .claimTokens()
        .accounts({
          fairLaunch: fairLaunch,
          participant: participantPda,
          participantWallet: participant.publicKey,
          participantSigner: participant.publicKey,
          treasuryTokenAccount: treasuryTokenAccount,
          participantTokenAccount: participantTokenAccount,
          treasury: treasury,
          tokenProgram: TOKEN_PROGRAM_ID
        })
        .signers([participant])
        .rpc();

      console.log(`✅ Tokens claimed: ${tx}`);

      return { signature: tx };

    } catch (error) {
      console.error('❌ Failed to claim tokens:', error);
      throw error;
    }
  }

  /**
   * Get fair launch data
   */
  async getFairLaunchData(fairLaunch: PublicKey): Promise<FairLaunchData | null> {
    if (!this.program) {
      throw new Error('Genesis Protocol service not initialized');
    }

    try {
      const account = await (this.program as any).account.fairLaunch.fetch(fairLaunch);
      
      return {
        fairLaunch: fairLaunch.toString(),
        authority: account.authority.toString(),
        tokenMint: account.tokenMint.toString(),
        treasury: account.treasury.toString(),
        config: {
          totalSupply: account.config.totalSupply.toNumber(),
          minAllocation: account.config.minAllocation.toNumber(),
          maxAllocation: account.config.maxAllocation.toNumber(),
          delaySeconds: account.config.delaySeconds.toNumber(),
          durationSeconds: account.config.durationSeconds.toNumber(),
          whitelistRoot: Buffer.from(account.config.whitelistRoot).toString('hex')
        },
        status: this.mapStatus(account.status),
        totalParticipants: account.totalParticipants.toNumber(),
        totalAllocated: account.totalAllocated.toNumber(),
        createdAt: account.createdAt.toNumber(),
        startTime: account.startTime.toNumber(),
        endTime: account.endTime.toNumber(),
        finalizedAt: account.finalizedAt ? account.finalizedAt.toNumber() : undefined
      };
    } catch (error) {
      console.error('❌ Failed to get fair launch data:', error);
      return null;
    }
  }

  /**
   * Get participant data
   */
  async getParticipantData(
    fairLaunch: PublicKey,
    participantWallet: PublicKey
  ): Promise<ParticipantData | null> {
    if (!this.program) {
      throw new Error('Genesis Protocol service not initialized');
    }

    try {
      const [participantPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('participant'),
          fairLaunch.toBuffer(),
          participantWallet.toBuffer()
        ],
        this.program.programId
      );

      const account = await (this.program as any).account.participant.fetch(participantPda);
      
      return {
        participant: participantPda.toString(),
        fairLaunch: account.fairLaunch.toString(),
        wallet: account.wallet.toString(),
        amountAllocated: account.amountAllocated.toNumber(),
        tokensClaimed: account.tokensClaimed.toNumber(),
        participatedAt: account.participatedAt.toNumber(),
        claimedAt: account.claimedAt ? account.claimedAt.toNumber() : undefined
      };
    } catch (error) {
      console.error('❌ Failed to get participant data:', error);
      return null;
    }
  }

  /**
   * Map Anchor enum to string
   */
  private mapStatus(status: any): 'Active' | 'Finalized' | 'Cancelled' {
    if (status.active) return 'Active';
    if (status.finalized) return 'Finalized';
    if (status.cancelled) return 'Cancelled';
    return 'Active';
  }

  /**
   * Check if fair launch is active
   */
  async isFairLaunchActive(fairLaunch: PublicKey): Promise<boolean> {
    const data = await this.getFairLaunchData(fairLaunch);
    if (!data) return false;

    const now = Math.floor(Date.now() / 1000);
    return data.status === 'Active' && 
           now >= data.startTime && 
           now <= data.endTime;
  }

  /**
   * Get fair launch statistics
   */
  async getFairLaunchStats(fairLaunch: PublicKey): Promise<{
    totalParticipants: number;
    totalAllocated: number;
    remainingSupply: number;
    participationRate: number;
  } | null> {
    const data = await this.getFairLaunchData(fairLaunch);
    if (!data) return null;

    const remainingSupply = data.config.totalSupply - data.totalAllocated;
    const participationRate = data.totalAllocated / data.config.totalSupply;

    return {
      totalParticipants: data.totalParticipants,
      totalAllocated: data.totalAllocated,
      remainingSupply,
      participationRate
    };
  }

  // Additional methods for Genesis Protocol routes
  setSigner(signer: Keypair): void {
    this.signer = signer;
  }

  async createLaunch(config: GenesisLaunchConfig): Promise<any> {
    // Placeholder implementation
    console.log('Creating Genesis launch:', config);
    return {
      id: 'launch_' + Date.now(),
      config,
      status: 'active',
      createdAt: Date.now()
    };
  }

  getAllLaunches(): any[] {
    // Placeholder implementation
    return [];
  }

  getActiveLaunches(): any[] {
    // Placeholder implementation
    return [];
  }

  getUpcomingLaunches(): any[] {
    // Placeholder implementation
    return [];
  }

  getLaunch(id: string): any {
    // Placeholder implementation
    return { id, status: 'active' };
  }

  getLaunchStats(id: string): any {
    // Placeholder implementation
    return { participants: 0, minted: 0 };
  }

  scheduleLaunch(id: string, date: Date): void {
    // Placeholder implementation
    console.log('Scheduling launch:', id, date);
  }

  activateLaunch(id: string): void {
    // Placeholder implementation
    console.log('Activating launch:', id);
  }

  pauseLaunch(id: string): void {
    // Placeholder implementation
    console.log('Pausing launch:', id);
  }

  resumeLaunch(id: string): void {
    // Placeholder implementation
    console.log('Resuming launch:', id);
  }

  completeLaunch(id: string): void {
    // Placeholder implementation
    console.log('Completing launch:', id);
  }

  addToWhitelist(id: string, wallet: string, tier: string, maxMints: number): void {
    // Placeholder implementation
    console.log('Adding to whitelist:', id, wallet, tier, maxMints);
  }

  removeFromWhitelist(id: string, wallet: string): void {
    // Placeholder implementation
    console.log('Removing from whitelist:', id, wallet);
  }

  async mintThroughGenesis(id: string, wallet: string, metadata: any, quantity: number): Promise<any> {
    // Placeholder implementation
    console.log('Minting through Genesis:', id, wallet, metadata, quantity);
    return Promise.resolve({ success: true, signature: 'placeholder_signature' });
  }
}

// Export singleton instance
let genesisProtocolService: GenesisProtocolService | null = null;

export function getGenesisProtocolService(connection: Connection): GenesisProtocolService {
  if (!genesisProtocolService) {
    genesisProtocolService = new GenesisProtocolService(connection);
  }
  return genesisProtocolService;
}