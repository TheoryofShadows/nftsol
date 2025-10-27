/**
 * 🧪 Test Setup for Smart Contracts
 * Configuration and utilities for testing Anchor programs
 */

import { AnchorProvider, Program } from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { expect } from 'chai';

// Test configuration
export const TEST_CONFIG = {
  RPC_URL: process.env.ANCHOR_PROVIDER_URL || 'http://127.0.0.1:8899',
  COMMITMENT: 'confirmed' as const,
  SKIP_PREFLIGHT: true,
};

// Test utilities
export class TestUtils {
  static async createTestKeypair(): Promise<Keypair> {
    return Keypair.generate();
  }

  static async airdropSol(
    connection: Connection,
    publicKey: PublicKey,
    lamports: number = 1000000000 // 1 SOL
  ): Promise<void> {
    try {
      const signature = await connection.requestAirdrop(publicKey, lamports);
      await connection.confirmTransaction(signature);
      console.log(`💰 Airdropped ${lamports / 1000000000} SOL to ${publicKey.toBase58()}`);
    } catch (error) {
      console.error('❌ Airdrop failed:', error);
      throw error;
    }
  }

  static async getBalance(
    connection: Connection,
    publicKey: PublicKey
  ): Promise<number> {
    const balance = await connection.getBalance(publicKey);
    return balance / 1000000000; // Convert to SOL
  }

  static async waitForConfirmation(
    connection: Connection,
    signature: string,
    timeout: number = 30000
  ): Promise<void> {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const status = await connection.getSignatureStatus(signature);
      if (status.value?.confirmationStatus === 'confirmed') {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    throw new Error('Transaction confirmation timeout');
  }
}

// Test data factories
export class TestDataFactory {
  static createNFTMetadata() {
    return {
      name: 'Test NFT',
      symbol: 'TEST',
      description: 'A test NFT for testing purposes',
      image: 'https://example.com/test-image.png',
      attributes: [
        { trait_type: 'Rarity', value: 'Common' },
        { trait_type: 'Color', value: 'Blue' }
      ],
      properties: {
        files: [
          {
            uri: 'https://example.com/test-image.png',
            type: 'image/png'
          }
        ],
        category: 'image'
      },
      seller_fee_basis_points: 500
    };
  }

  static createCollectionMetadata() {
    return {
      name: 'Test Collection',
      symbol: 'TCOL',
      description: 'A test collection for testing purposes',
      image: 'https://example.com/collection-image.png',
      seller_fee_basis_points: 250
    };
  }

  static createMarketplaceConfig() {
    return {
      feeBasisPoints: 250, // 2.5%
      treasury: Keypair.generate().publicKey,
      authority: Keypair.generate().publicKey
    };
  }
}

// Test assertions
export class TestAssertions {
  static assertTransactionSuccess(signature: string) {
    expect(signature).to.be.a('string');
    expect(signature.length).to.be.greaterThan(0);
  }

  static assertPublicKey(publicKey: PublicKey) {
    expect(publicKey).to.be.instanceOf(PublicKey);
    expect(publicKey.toBase58().length).to.equal(44);
  }

  static assertBalance(balance: number, expectedMin: number) {
    expect(balance).to.be.a('number');
    expect(balance).to.be.greaterThanOrEqual(expectedMin);
  }
}

// Test environment setup
export async function setupTestEnvironment(): Promise<{
  connection: Connection;
  provider: AnchorProvider;
}> {
  console.log('🔧 Setting up test environment...');
  
  const connection = new Connection(TEST_CONFIG.RPC_URL, TEST_CONFIG.COMMITMENT);
  
  // Create a test wallet
  const wallet = Keypair.generate();
  
  // Airdrop SOL for testing
  await TestUtils.airdropSol(connection, wallet.publicKey, 10000000000); // 10 SOL
  
  const provider = new AnchorProvider(
    connection,
    { publicKey: wallet.publicKey, signTransaction: async () => null, signAllTransactions: async () => [] },
    { commitment: TEST_CONFIG.COMMITMENT, skipPreflightChecks: TEST_CONFIG.SKIP_PREFLIGHT }
  );

  console.log('✅ Test environment ready');
  console.log(`📡 RPC: ${TEST_CONFIG.RPC_URL}`);
  console.log(`👛 Wallet: ${wallet.publicKey.toBase58()}`);
  console.log(`💰 Balance: ${await TestUtils.getBalance(connection, wallet.publicKey)} SOL`);

  return { connection, provider };
}

export default {
  TEST_CONFIG,
  TestUtils,
  TestDataFactory,
  TestAssertions,
  setupTestEnvironment
};
