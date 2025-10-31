// src/lib/solana.ts
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
  Commitment,
} from '@solana/web3.js';
import { Metaplex, keypairIdentity } from '@metaplex-foundation/js';
import bs58 from 'bs58';

const RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
export const SOLANA_COMMITMENT: Commitment = 'confirmed';
export const connection = new Connection(RPC_URL, SOLANA_COMMITMENT);

// Debug logging
console.log('🔗 Solana RPC URL:', RPC_URL);
console.log('🔑 Platform Key Loaded:', !!process.env.PLATFORM_SECRET_KEY_BASE58);

export function loadPlatformKeypair(): Keypair {
  const base58 = process.env.PLATFORM_SECRET_KEY_BASE58;
  const json = process.env.PLATFORM_SECRET_KEY_JSON;
  if (base58) {
    const secret = bs58.decode(base58);
    return Keypair.fromSecretKey(Uint8Array.from(secret));
  }
  if (json) {
    const arr = JSON.parse(json);
    return Keypair.fromSecretKey(Uint8Array.from(arr));
  }
  throw new Error(
    'Missing PLATFORM secret key env (PLATFORM_SECRET_KEY_BASE58 or PLATFORM_SECRET_KEY_JSON)'
  );
}

// Lazy load platform keypair to prevent startup failures
let _platformKeypair: Keypair | null = null;
let _metaplex: any = null;

export function getPlatformKeypair(): Keypair | null {
  // Only load if env vars are set (development mode may not need it)
  if (!process.env.PLATFORM_SECRET_KEY_BASE58 && !process.env.PLATFORM_SECRET_KEY_JSON) {
    return null;
  }

  if (!_platformKeypair) {
    try {
      _platformKeypair = loadPlatformKeypair();
    } catch (error) {
      console.warn(
        '[Solana] Platform keypair not available:',
        error instanceof Error ? error.message : error
      );
      return null;
    }
  }
  return _platformKeypair;
}

export function getMetaplex() {
  const keypair = getPlatformKeypair();
  if (!keypair) {
    throw new Error(
      'Platform keypair not configured. Set PLATFORM_SECRET_KEY_BASE58 or PLATFORM_SECRET_KEY_JSON'
    );
  }

  if (!_metaplex) {
    _metaplex = Metaplex.make(connection).use(keypairIdentity(keypair));
  }
  return _metaplex;
}

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
    const toPublicKey = new PublicKey(toAddress);
    const metaplexInstance = getMetaplex();
    const keypair = getPlatformKeypair();

    const { nft } = await metaplexInstance.nfts().create({
      uri: metadataUri,
      name,
      symbol: 'NFTSOL',
      sellerFeeBasisPoints: 250, // 2.5% royalties
      updateAuthority: keypair,
      mintAuthority: keypair,
    });

    // Transfer NFT to user
    const transferResult = await metaplexInstance.nfts().transfer({
      nftOrSft: nft,
      toOwner: toPublicKey,
    });

    return {
      mintAddress: nft.address.toString(),
      txSig: transferResult.response.signature,
      success: true,
    };
  } catch (error) {
    console.error('NFT minting error:', error);
    // Don't expose internal error details to client
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: 'NFT minting failed',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
    };
  }
}

// Send SOL to user
export async function sendSOL(toAddress: string, amountSol: number) {
  try {
    const toPublicKey = new PublicKey(toAddress);
    const keypair = getPlatformKeypair();

    if (!keypair) {
      return {
        success: false,
        error: 'Platform keypair not available',
      };
    }

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
