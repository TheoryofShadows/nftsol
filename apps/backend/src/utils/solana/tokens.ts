import { TOKEN_PROGRAM_ID, createAssociatedTokenAccountInstruction, getAssociatedTokenAddress, createTransferInstruction } from '@solana/spl-token';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { getConnection } from './connection';

// Token Metadata Program ID (Metaplex)
const TOKEN_METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

/**
 * Get or create an associated token account
 */
export async function getOrCreateAssociatedTokenAccount(
  connection: Connection,
  mint: PublicKey,
  owner: PublicKey,
  payer: PublicKey,
  allowOwnerOffCurve = false
) {
  const associatedToken = await getAssociatedTokenAddress(
    mint,
    owner,
    allowOwnerOffCurve
  );

  // Check if the account exists
  const accountInfo = await connection.getAccountInfo(associatedToken);
  if (accountInfo) {
    return {
      address: associatedToken,
      isNew: false,
    };
  }

  // Create the associated token account if it doesn't exist
  const transaction = new Transaction().add(
    createAssociatedTokenAccountInstruction(
      payer,
      associatedToken,
      owner,
      mint
    )
  );

  return {
    address: associatedToken,
    isNew: true,
    transaction,
  };
}

/**
 * Get token balance for a specific account
 */
export async function getTokenBalance(account: PublicKey): Promise<number> {
  const connection = getConnection();
  const tokenAccount = await connection.getTokenAccountBalance(account);
  return tokenAccount.value.uiAmount || 0;
}

/**
 * Transfer tokens between accounts
 */
export async function transferTokens(
  source: PublicKey,
  destination: PublicKey,
  owner: PublicKey,
  amount: number,
  mint: PublicKey,
  decimals: number
): Promise<Transaction> {
  const transaction = new Transaction().add(
    createTransferInstruction(
      source,
      destination,
      owner,
      amount * Math.pow(10, decimals)
    )
  );

  return transaction;
}

/**
 * Get token info by mint address
 */
export async function getTokenInfo(mintAddress: string) {
  const connection = getConnection();
  const mintPublicKey = new PublicKey(mintAddress);
  
  // Get token supply
  const { value: tokenInfo } = await connection.getTokenSupply(mintPublicKey);
  
  // Get token metadata (if available)
  let metadata: Buffer | null = null;
  try {
    const metadataAddress = await PublicKey.findProgramAddress(
      [
        Buffer.from('metadata'),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        new PublicKey(mintAddress).toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID
    );
    
    const accountInfo = await connection.getAccountInfo(metadataAddress[0]);
    if (accountInfo && accountInfo.data) {
      metadata = accountInfo.data;
    }
  } catch (error) {
    console.error('Error fetching token metadata:', error);
  }

  return {
    ...tokenInfo,
    metadata: metadata ? Array.from(metadata) : null,
  };
}
