/**
 * Solana Service Initialization
 * 
 * This service handles the proper initialization of Solana services
 * including signer configuration and environment setup.
 */

import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { BubblegumService } from './bubblegumService';
import { GenesisProtocolService } from './genesisProtocolService';
import { getHeliusConfig } from '../config/environment';

export interface SolanaServiceConfig {
  connection: Connection;
  bubblegumService: BubblegumService;
  genesisProtocolService: GenesisProtocolService;
  isConfigured: boolean;
}

export class SolanaServiceManager {
  private static instance: SolanaServiceManager;
  private config: SolanaServiceConfig | null = null;
  private isInitialized: boolean = false;

  private constructor() {}

  static getInstance(): SolanaServiceManager {
    if (!SolanaServiceManager.instance) {
      SolanaServiceManager.instance = new SolanaServiceManager();
    }
    return SolanaServiceManager.instance;
  }

  /**
   * Initialize Solana services with proper configuration
   */
  async initialize(): Promise<SolanaServiceConfig> {
    if (this.isInitialized && this.config) {
      return this.config;
    }

    console.log('🔧 Initializing Solana services...');

    try {
      // Get Helius configuration
      const heliusConfig = getHeliusConfig();
      
      // Create connection
      const connection = new Connection(heliusConfig.rpcUrl, {
        commitment: 'confirmed',
        confirmTransactionInitialTimeout: 60000,
      });

      // Test connection
      await connection.getVersion();
      console.log('✅ Solana connection established');

      // Create services
      const bubblegumService = new BubblegumService(connection, heliusConfig.rpcUrl);
      const genesisProtocolService = new GenesisProtocolService(connection, heliusConfig.rpcUrl);

      // Configure signers if private keys are available
      let isConfigured = false;

      if (process.env.BUBBLEGUM_PRIVATE_KEY && process.env.BUBBLEGUM_PRIVATE_KEY !== 'your-bubblegum-private-key-here') {
        try {
          const keypair = this.createKeypairFromPrivateKey(process.env.BUBBLEGUM_PRIVATE_KEY);
          bubblegumService.setSigner(keypair);
          console.log('✅ BubblegumService signer configured');
          isConfigured = true;
        } catch (error) {
          console.warn('⚠️ Failed to configure BubblegumService signer:', error);
        }
      } else {
        console.warn('⚠️ BUBBLEGUM_PRIVATE_KEY not configured - service will be in read-only mode');
      }

      if (process.env.GENESIS_PRIVATE_KEY && process.env.GENESIS_PRIVATE_KEY !== 'your-genesis-private-key-here') {
        try {
          const keypair = this.createKeypairFromPrivateKey(process.env.GENESIS_PRIVATE_KEY);
          genesisProtocolService.setSigner(keypair);
          console.log('✅ GenesisProtocolService signer configured');
        } catch (error) {
          console.warn('⚠️ Failed to configure GenesisProtocolService signer:', error);
        }
      } else {
        console.warn('⚠️ GENESIS_PRIVATE_KEY not configured - service will be in read-only mode');
      }

      this.config = {
        connection,
        bubblegumService,
        genesisProtocolService,
        isConfigured,
      };

      this.isInitialized = true;
      console.log('✅ Solana services initialized successfully');

      return this.config;
    } catch (error) {
      console.error('❌ Failed to initialize Solana services:', error);
      throw error;
    }
  }

  /**
   * Get the current configuration
   */
  getConfig(): SolanaServiceConfig | null {
    return this.config;
  }

  /**
   * Create a keypair from a base58 private key string
   */
  private createKeypairFromPrivateKey(privateKeyString: string): Keypair {
    try {
      // Handle different private key formats
      let privateKeyBytes: Uint8Array;

      if (privateKeyString.startsWith('[') && privateKeyString.endsWith(']')) {
        // Array format: [1,2,3,...]
        const keyArray = JSON.parse(privateKeyString);
        privateKeyBytes = new Uint8Array(keyArray);
      } else {
        // Base58 format
        const bs58 = require('bs58');
        privateKeyBytes = bs58.decode(privateKeyString);
      }

      return Keypair.fromSecretKey(privateKeyBytes);
    } catch (error) {
      throw new Error(`Invalid private key format: ${error}`);
    }
  }

  /**
   * Generate a new keypair for testing/development
   */
  generateTestKeypair(): { keypair: Keypair; privateKey: string } {
    const keypair = Keypair.generate();
    const bs58 = require('bs58');
    const privateKey = bs58.encode(keypair.secretKey);
    
    return { keypair, privateKey };
  }

  /**
   * Test service connectivity
   */
  async testConnectivity(): Promise<{
    connection: boolean;
    bubblegum: boolean;
    genesis: boolean;
  }> {
    if (!this.config) {
      throw new Error('Services not initialized. Call initialize() first.');
    }

    const results = {
      connection: false,
      bubblegum: false,
      genesis: false,
    };

    try {
      // Test connection
      await this.config.connection.getVersion();
      results.connection = true;
    } catch (error) {
      console.error('❌ Connection test failed:', error);
    }

    try {
      // Test bubblegum service
      await this.config.connection.getAccountInfo(new PublicKey('11111111111111111111111111111112'));
      results.bubblegum = true;
    } catch (error) {
      console.error('❌ Bubblegum service test failed:', error);
    }

    try {
      // Test genesis protocol service
      await this.config.connection.getAccountInfo(new PublicKey('11111111111111111111111111111112'));
      results.genesis = true;
    } catch (error) {
      console.error('❌ Genesis protocol service test failed:', error);
    }

    return results;
  }

  /**
   * Reset the service manager (for testing)
   */
  reset(): void {
    this.config = null;
    this.isInitialized = false;
  }
}

// Export singleton instance
export const solanaServiceManager = SolanaServiceManager.getInstance();
