/**
 * Irys Upload Utility
 * Migrated from deprecated Bundlr to Irys SDK v0.2.11
 * Handles uploading metadata and images to Arweave via Irys
 * This resolves nested axios vulnerabilities from deprecated Bundlr
 */

import Irys from '@irys/sdk';
import { Keypair, Connection } from '@solana/web3.js';

export interface IrysUploadOptions {
  connection: Connection;
  keypair: Keypair;
  network?: 'mainnet-beta' | 'devnet';
}

export interface IrysUploadResult {
  uri: string;
  transactionId: string;
}

/**
 * Creates an Irys node instance for Solana
 * Uses latest Irys SDK API (v0.2.11)
 */
export async function createIrysNode(options: IrysUploadOptions): Promise<Irys> {
  const network = options.network || 'mainnet-beta';
  
  // Irys gateway URLs
  const gatewayUrl = network === 'mainnet-beta' 
    ? 'https://node1.irys.xyz'
    : 'https://devnet.irys.xyz';

  // Initialize Irys with Solana wallet
  // Irys SDK v0.2.11 API: key should be Uint8Array, and we set RPC via config
  const irys = new Irys({
    url: gatewayUrl,
    token: 'solana',
    key: new Uint8Array(options.keypair.secretKey),
    config: {
      providerUrl: options.connection.rpcEndpoint,
      timeout: 60000,
    },
  });

  // Ensure Irys is ready
  await irys.ready();

  return irys;
}

/**
 * Uploads data to Irys/Arweave and returns the Arweave URI
 * @param data - Data to upload (Buffer, Uint8Array, or string)
 * @param options - Irys configuration options
 * @returns Arweave URI and transaction ID
 */
export async function uploadToIrys(
  data: Buffer | Uint8Array | string,
  options: IrysUploadOptions
): Promise<IrysUploadResult> {
  try {
    const irys = await createIrysNode(options);

    // Convert data to Buffer if needed
    let dataBuffer: Buffer;
    if (typeof data === 'string') {
      dataBuffer = Buffer.from(data, 'utf-8');
    } else if (data instanceof Uint8Array) {
      dataBuffer = Buffer.from(data);
    } else {
      dataBuffer = data;
    }

    // Upload the data with tags
    const receipt = await irys.upload(dataBuffer, {
      tags: [
        { name: 'Content-Type', value: 'application/json' },
        { name: 'App-Name', value: 'NFTSol' },
        { name: 'App-Version', value: '1.0.0' },
      ],
    });

    // Return Arweave URI
    const uri = `https://arweave.net/${receipt.id}`;

    return {
      uri,
      transactionId: receipt.id,
    };
  } catch (error) {
    console.error('Irys upload failed:', error);
    throw new Error(`Failed to upload to Irys: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Uploads JSON metadata to Irys
 */
export async function uploadMetadata(
  metadata: Record<string, any>,
  options: IrysUploadOptions
): Promise<IrysUploadResult> {
  const jsonString = JSON.stringify(metadata);
  return uploadToIrys(jsonString, options);
}

/**
 * Checks if Irys node is funded (has sufficient balance)
 * @param irys - Irys instance
 * @param requiredBytes - Required bytes for upload (optional)
 * @returns true if funded, false otherwise
 */
export async function checkIrysBalance(
  irys: Irys,
  requiredBytes?: number
): Promise<boolean> {
  try {
    const balance = await irys.getLoadedBalance();
    const balanceNumber = Number(balance);
    if (requiredBytes) {
      return balanceNumber > requiredBytes;
    }
    // Default: check if balance > 0
    return balanceNumber > 0;
  } catch (error) {
    console.error('Failed to check Irys balance:', error);
    return false;
  }
}

/**
 * Funds Irys node with SOL (if needed)
 * @param irys - Irys instance
 * @param amount - Amount in SOL (default: 0.1 SOL for small uploads)
 */
export async function fundIrys(
  irys: Irys,
  amount: number = 0.1
): Promise<void> {
  try {
    const amountInAtomic = amount * 1_000_000_000; // Convert SOL to lamports
    await irys.fund(amountInAtomic);
    console.log(`Funded Irys with ${amount} SOL`);
  } catch (error) {
    console.error('Failed to fund Irys:', error);
    throw new Error(`Failed to fund Irys: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

