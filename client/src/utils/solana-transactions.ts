// Solana transaction utilities for NFT marketplace

export interface TransactionResult {
  success: boolean;
  signature?: string;
  error?: string;
}

/**
 * Create a simple SOL transfer transaction
 */
export async function createTransferTransaction(
  fromPublicKey: string,
  toPublicKey: string,
  amount: number // in SOL
): Promise<any> {
  const rpcUrl = import.meta.env.VITE_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
  
  // Get recent blockhash
  const blockhashResponse = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'getLatestBlockhash'
    })
  });
  
  const blockhashData = await blockhashResponse.json();
  const recentBlockhash = blockhashData.result.value.blockhash;
  
  // Convert SOL to lamports (1 SOL = 1,000,000,000 lamports)
  const lamports = Math.floor(amount * 1000000000);
  
  // Create transaction instruction
  const transaction = {
    recentBlockhash,
    feePayer: fromPublicKey,
    instructions: [{
      programId: '11111111111111111111111111111111', // System Program
      accounts: [
        { pubkey: fromPublicKey, isSigner: true, isWritable: true },
        { pubkey: toPublicKey, isSigner: false, isWritable: true }
      ],
      data: createTransferInstruction(lamports)
    }]
  };
  
  return transaction;
}

/**
 * Create transfer instruction data
 */
function createTransferInstruction(lamports: number): string {
  // System Program Transfer instruction (type 2)
  const instructionData = new Uint8Array(12);
  instructionData[0] = 2; // Transfer instruction
  
  // Amount in lamports (8 bytes, little endian)
  const lamportsBuffer = new ArrayBuffer(8);
  const lamportsView = new DataView(lamportsBuffer);
  lamportsView.setBigUint64(0, BigInt(lamports), true);
  instructionData.set(new Uint8Array(lamportsBuffer), 4);
  
  return Array.from(instructionData).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Send transaction through connected wallet
 */
export async function sendTransaction(transaction: any): Promise<TransactionResult> {
  try {
    if (!window.solana?.isConnected) {
      return { success: false, error: 'Wallet not connected' };
    }

    // Sign transaction with wallet
    const signedTransaction = await window.solana.signTransaction(transaction);
    
    // Send transaction to network
    const rpcUrl = import.meta.env.VITE_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'sendTransaction',
        params: [signedTransaction, { encoding: 'base64' }]
      })
    });
    
    const result = await response.json();
    
    if (result.error) {
      return { success: false, error: result.error.message };
    }
    
    return { success: true, signature: result.result };
  } catch (error: any) {
    return { success: false, error: error.message || 'Transaction failed' };
  }
}

/**
 * Get wallet balance in SOL
 */
export async function getWalletBalance(publicKey: string): Promise<number> {
  try {
    const rpcUrl = import.meta.env.VITE_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getBalance',
        params: [publicKey]
      })
    });
    
    const data = await response.json();
    return data.result?.value ? data.result.value / 1000000000 : 0;
  } catch (error) {
    console.error('Failed to fetch balance:', error);
    return 0;
  }
}

/**
 * Simulate NFT purchase transaction
 */
export async function simulateNFTPurchase(
  buyerPublicKey: string,
  sellerPublicKey: string,
  priceInSOL: number
): Promise<TransactionResult> {
  try {
    // In a real implementation, this would create an NFT transfer + SOL payment transaction
    // For now, we'll simulate with a simple SOL transfer
    
    const transaction = await createTransferTransaction(
      buyerPublicKey,
      sellerPublicKey,
      priceInSOL
    );
    
    // For simulation, we just return success after a delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return {
      success: true,
      signature: `sim${Date.now()}${Math.random().toString(36).substring(7)}`
    };
  } catch (error: any) {
    return { success: false, error: error.message || 'NFT purchase failed' };
  }
}