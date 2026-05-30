// src/lib/solana.ts
import logger from '../utils/logger';
import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
  Commitment,
  ComputeBudgetProgram,
} from '@solana/web3.js';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import {
  createNft,
  transferV1,
  TokenStandard,
} from '@metaplex-foundation/mpl-token-metadata';
import {
  createSignerFromKeypair,
  signerIdentity,
  generateSigner,
  percentAmount,
  publicKey as umiPublicKey,
  type Umi,
} from '@metaplex-foundation/umi';
import bs58 from 'bs58';
import { getPlatformKeypair } from './platformKeypair';
import { ensurePlatformBalance } from './checkBalance';

const RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
export const SOLANA_COMMITMENT: Commitment = 'confirmed';
export const connection = new Connection(RPC_URL, SOLANA_COMMITMENT);

// Blockhash cache - Solana blockhashes are valid ~60 seconds; cache for 30s to reduce RPC calls
interface BlockhashCache {
  blockhash: string;
  lastValidBlockHeight: number;
  timestamp: number;
}
let _blockhashCache: BlockhashCache | null = null;
const BLOCKHASH_CACHE_TTL_MS = 30_000;

export async function getCachedBlockhash(): Promise<{ blockhash: string; lastValidBlockHeight: number }> {
  const now = Date.now();
  if (_blockhashCache && now - _blockhashCache.timestamp < BLOCKHASH_CACHE_TTL_MS) {
    return { blockhash: _blockhashCache.blockhash, lastValidBlockHeight: _blockhashCache.lastValidBlockHeight };
  }
  const result = await connection.getLatestBlockhash(SOLANA_COMMITMENT);
  _blockhashCache = { blockhash: result.blockhash, lastValidBlockHeight: result.lastValidBlockHeight, timestamp: now };
  return result;
}

let _umi: Umi | null = null;

/**
 * Lazily build a UMI instance signing with the platform keypair.
 * Replaces the deprecated @metaplex-foundation/js client; uses the same
 * platform keypair so on-chain authorities are unchanged.
 */
export function getMetaplex(): Umi {
  if (!_umi) {
    const keypair = getPlatformKeypair();
    const umi = createUmi(RPC_URL);
    const umiKeypair = umi.eddsa.createKeypairFromSecretKey(keypair.secretKey);
    const signer = createSignerFromKeypair(umi, umiKeypair);
    umi.use(signerIdentity(signer));
    _umi = umi;
  }
  return _umi;
}

// Legacy export for backward compatibility
/**
 * @deprecated Use getPlatformKeypair() instead
 */
export const loadPlatformKeypair = getPlatformKeypair;

// Legacy exports removed - use getPlatformKeypair() and getMetaplex() directly
// This prevents startup failures when platform keypair is not configured

// Mint NFT and transfer to user
export async function mintNFT(
  toAddress: string,
  metadataUri: string,
  name: string,
  _description?: string
) {
  try {
    // Check platform wallet balance BEFORE attempting mint
    const balance = await ensurePlatformBalance(0.02); // Need at least 0.02 SOL
    logger.info(`[Mint] Platform balance: ${balance.toFixed(4)} SOL`);

    // Validate RPC connection by getting latest blockhash
    try {
      await connection.getLatestBlockhash('confirmed');
    } catch (error) {
      throw new Error(`RPC connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Validate recipient address up front (throws on malformed input).
    const toPublicKey = new PublicKey(toAddress);
    const umi = getMetaplex();

    logger.info(`[Mint] Minting NFT "${name}" to ${toAddress}`);

    // Mint to the platform wallet (the UMI identity), then transfer to the buyer.
    const mint = generateSigner(umi);
    await createNft(umi, {
      mint,
      name,
      symbol: 'NFTSOL',
      uri: metadataUri,
      sellerFeeBasisPoints: percentAmount(2.5), // 2.5% royalties
    }).sendAndConfirm(umi);

    const mintAddress = mint.publicKey.toString();
    logger.info(`[Mint] NFT created: ${mintAddress}`);

    // Transfer NFT to the buyer's wallet.
    const transferResult = await transferV1(umi, {
      mint: mint.publicKey,
      authority: umi.identity,
      tokenOwner: umi.identity.publicKey,
      destinationOwner: umiPublicKey(toPublicKey.toBase58()),
      tokenStandard: TokenStandard.NonFungible,
    }).sendAndConfirm(umi);

    const txSig = bs58.encode(transferResult.signature);
    logger.info(`[Mint] ✅ Success! Signature: ${txSig}`);

    return {
      mintAddress,
      txSig,
      success: true,
    };
  } catch (error) {
    logger.error('[Mint] ❌ NFT minting error:', error);

    // Provide detailed error in development, generic in production
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorDetails = {
      message: errorMessage,
      // Include helpful hints
      hints: [] as string[],
    };

    // Add helpful hints based on error type
    if (errorMessage.includes('PLATFORM_KEYPAIR') || errorMessage.includes('PLATFORM_SECRET_KEY')) {
      errorDetails.hints.push('Check PLATFORM_SECRET_KEY_BASE58 or PLATFORM_KEYPAIR environment variable');
    }
    if (errorMessage.includes('balance') || errorMessage.includes('insufficient')) {
      errorDetails.hints.push('Platform wallet needs at least 0.02 SOL for minting');
      errorDetails.hints.push(`Platform wallet: ${getPlatformKeypair().publicKey.toBase58()}`);
    }
    if (errorMessage.includes('connection') || errorMessage.includes('RPC')) {
      errorDetails.hints.push('Check SOLANA_RPC_URL environment variable');
      errorDetails.hints.push(`Current RPC: ${RPC_URL}`);
    }

    return {
      success: false,
      error: process.env.NODE_ENV === 'development'
        ? `NFT minting failed: ${errorMessage}`
        : 'NFT minting failed. Please check platform wallet balance and RPC connection.',
      details: process.env.NODE_ENV === 'development' ? errorDetails : undefined,
    };
  }
}

// Send SOL to user
export async function sendSOL(toAddress: string, amountSol: number) {
  try {
    const toPublicKey = new PublicKey(toAddress);
    const keypair = getPlatformKeypair();

    // Validate amount
    if (amountSol <= 0 || !Number.isFinite(amountSol)) {
      return {
        success: false,
        error: 'Invalid amount',
      };
    }

    // Check platform wallet balance
    const balance = await connection.getBalance(keypair.publicKey);
    const requiredLamports = Math.floor(amountSol * 1e9);

    if (balance < requiredLamports) {
      return {
        success: false,
        error: 'Insufficient platform balance',
      };
    }

    const tx = new Transaction().add(
      // Priority fee: 1000 microLamports/compute unit for reliable inclusion
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1000 }),
      // Explicit compute limit for SOL transfer (minimal units needed)
      ComputeBudgetProgram.setComputeUnitLimit({ units: 300 }),
      SystemProgram.transfer({
        fromPubkey: keypair.publicKey,
        toPubkey: toPublicKey,
        lamports: requiredLamports,
      })
    );

    // Use cached blockhash to reduce RPC calls; set fee payer
    const { blockhash, lastValidBlockHeight } = await getCachedBlockhash();
    tx.recentBlockhash = blockhash;
    tx.lastValidBlockHeight = lastValidBlockHeight;
    tx.feePayer = keypair.publicKey;

    const txSig = await sendAndConfirmTransaction(connection, tx, [keypair], {
      commitment: 'confirmed',
      maxRetries: 3,
    });

    return { success: true, txSig };
  } catch (error) {
    logger.error('SOL transfer error:', error);
    // Don't expose internal error details to client
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: 'SOL transfer failed',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
    };
  }
}

// Get wallet balance
export async function getWalletBalance(address: string) {
  try {
    const publicKey = new PublicKey(address);
    const balance = await connection.getBalance(publicKey);
    return balance / 1e9; // Convert lamports to SOL
  } catch (error) {
    logger.error('Balance check error:', error);
    return 0;
  }
}

// Check if account exists
export async function accountExists(address: string) {
  try {
    const publicKey = new PublicKey(address);
    const accountInfo = await connection.getAccountInfo(publicKey);
    return accountInfo !== null;
  } catch {
    return false;
  }
}

// Legacy function for backward compatibility
export async function sendSolFromPlatform(toPubkeyStr: string, lamports: bigint) {
  const result = await sendSOL(toPubkeyStr, Number(lamports) / 1e9);
  return result.txSig;
}
