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

  constructor(connection: Connection) {
    this.connection = connection;
    this.initializeProgram();
  }

  private async initializeProgram() {
    try {
      // Load the governance program IDL
      const idlPath = path.join(__dirname, '../../smart-contracts/solana_rewards/target/idl/governance.json');
      const idl = JSON.parse(fs.readFileSync(idlPath, 'utf8'));
      
      // Create provider with wallet
      const wallet = Keypair.generate(); // In production, use actual wallet
      this.provider = new AnchorProvider(
        this.connection,
        { publicKey: wallet.publicKey, signTransaction: async (tx) => tx, signAllTransactions: async (txs) => txs },
        { commitment: 'confirmed' }
      );

      // Initialize program
      const programId = new PublicKey('GvnmNTy8XJ3c2d4K9vR7wE1sP5qA8bC2fH6jL9mN3pQ7');
      this.program = new Program(idl, programId, this.provider);

      console.log('✅ Genesis Protocol service initialized');
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
}

// Export singleton instance
let genesisProtocolService: GenesisProtocolService | null = null;

export function getGenesisProtocolService(connection: Connection): GenesisProtocolService {
  if (!genesisProtocolService) {
    genesisProtocolService = new GenesisProtocolService(connection);
  }
  return genesisProtocolService;
}