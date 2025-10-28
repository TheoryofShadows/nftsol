// src/lib/solana.ts
import { Connection, Keypair, PublicKey, Transaction, SystemProgram, sendAndConfirmTransaction, Commitment } from '@solana/web3.js';
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
  throw new Error('Missing PLATFORM secret key env (PLATFORM_SECRET_KEY_BASE58 or PLATFORM_SECRET_KEY_JSON)');
}

export const platformKeypair = loadPlatformKeypair();
export const metaplex = Metaplex.make(connection).use(keypairIdentity(platformKeypair));

// Mint NFT and transfer to user
export async function mintNFT(toAddress: string, metadataUri: string, name: string, description?: string) {
  try {
    const toPublicKey = new PublicKey(toAddress);

    const { nft } = await metaplex.nfts().create({
      uri: metadataUri,
      name,
      symbol: 'NFTSOL',
      sellerFeeBasisPoints: 250, // 2.5% royalties
      updateAuthority: platformKeypair,
      mintAuthority: platformKeypair
    });

    // Transfer NFT to user
    const transferResult = await metaplex.nfts().transfer({
      nftOrSft: nft,
      toOwner: toPublicKey
    });

    return { 
      mintAddress: nft.address.toString(), 
      txSig: transferResult.response.signature,
      success: true
    };
  } catch (error) {
    console.error('NFT minting error:', error);
    return {
      success: false,
      error: (error as Error).message
    };
  }
}

// Send SOL to user
export async function sendSOL(toAddress: string, amountSol: number) {
  try {
    const toPublicKey = new PublicKey(toAddress);
    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: platformKeypair.publicKey,
        toPubkey: toPublicKey,
        lamports: amountSol * 1e9
      })
    );

    const txSig = await sendAndConfirmTransaction(connection, tx, [platformKeypair]);
    return { success: true, txSig };
  } catch (error) {
    console.error('SOL transfer error:', error);
    return {
      success: false,
      error: (error as Error).message
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
