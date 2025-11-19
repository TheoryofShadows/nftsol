// src/lib/solana.ts
import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
  Commitment,
} from '@solana/web3.js';
import { Metaplex, keypairIdentity } from '@metaplex-foundation/js';
import { getPlatformKeypair } from './platformKeypair';
import { ensurePlatformBalance } from './checkBalance';

const RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
export const SOLANA_COMMITMENT: Commitment = 'confirmed';
export const connection = new Connection(RPC_URL, SOLANA_COMMITMENT);

let _metaplex: any = null;

export function getMetaplex() {
  const keypair = getPlatformKeypair();
  if (!_metaplex) {
    _metaplex = Metaplex.make(connection).use(keypairIdentity(keypair));
  }
  return _metaplex;
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
  description?: string
) {
  try {
    // Check platform wallet balance BEFORE attempting mint
    const balance = await ensurePlatformBalance(0.02); // Need at least 0.02 SOL
    console.log(`[Mint] Platform balance: ${balance.toFixed(4)} SOL`);

    // Validate RPC connection by getting latest blockhash
    try {
      await connection.getLatestBlockhash('confirmed');
    } catch (error) {
      throw new Error(`RPC connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    const toPublicKey = new PublicKey(toAddress);
    const metaplexInstance = getMetaplex();
    const keypair = getPlatformKeypair();

    console.log(`[Mint] Minting NFT "${name}" to ${toAddress}`);

    const { nft } = await metaplexInstance.nfts().create({
      uri: metadataUri,
      name,
      symbol: 'NFTSOL',
      sellerFeeBasisPoints: 250, // 2.5% royalties
      updateAuthority: keypair,
      mintAuthority: keypair,
    });

    console.log(`[Mint] NFT created: ${nft.address.toString()}`);

    // Transfer NFT to user
    const transferResult = await metaplexInstance.nfts().transfer({
      nftOrSft: nft,
      toOwner: toPublicKey,
    });

    console.log(`[Mint] ✅ Success! Signature: ${transferResult.response.signature}`);

    return {
      mintAddress: nft.address.toString(),
      txSig: transferResult.response.signature,
      success: true,
    };
  } catch (error) {
    console.error('[Mint] ❌ NFT minting error:', error);

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
      SystemProgram.transfer({
        fromPubkey: keypair.publicKey,
        toPubkey: toPublicKey,
        lamports: requiredLamports,
      })
    );

    // Get recent blockhash and set fee payer
    const { blockhash } = await connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;
    tx.feePayer = keypair.publicKey;

    const txSig = await sendAndConfirmTransaction(connection, tx, [keypair], {
      commitment: 'confirmed',
      maxRetries: 3,
    });

    return { success: true, txSig };
  } catch (error) {
    console.error('SOL transfer error:', error);
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
    console.error('Balance check error:', error);
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
