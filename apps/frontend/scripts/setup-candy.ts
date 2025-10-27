/**
 * 🍭 Sugar CLI Integration Script
 * Sets up Candy Machine drops using Sugar CLI
 */

import { execSync } from 'child_process';
import { existsSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

export interface CandyMachineConfig {
  price: number;
  number: number;
  symbol: string;
  sellerFeeBasisPoints: number;
  goLiveDate: string;
  endSettings?: {
    endSettingType: 'Date' | 'Amount';
    value: number;
  };
  whitelistMintSettings?: {
    mode: 'burnEveryTime' | 'neverBurn';
    mint: string;
    presale: boolean;
    discountPrice?: number;
  };
  hiddenSettings?: {
    name: string;
    uri: string;
    hash: string;
  };
}

export class SugarSetup {
  private configPath: string;
  private assetsPath: string;

  constructor(projectRoot: string) {
    this.configPath = join(projectRoot, 'config', 'candy-machine.json');
    this.assetsPath = join(projectRoot, 'assets');
  }

  /**
   * Initialize Sugar project
   */
  async init(): Promise<void> {
    console.log('🍭 Initializing Sugar project...');
    
    try {
      // Check if Sugar CLI is installed
      execSync('sugar --version', { stdio: 'pipe' });
      console.log('✅ Sugar CLI found');
    } catch (error) {
      console.log('❌ Sugar CLI not found. Installing...');
      execSync('npm install -g @metaplex-foundation/sugar', { stdio: 'inherit' });
    }

    // Create assets directory if it doesn't exist
    if (!existsSync(this.assetsPath)) {
      mkdirSync(this.assetsPath, { recursive: true });
      console.log('📁 Created assets directory');
    }

    // Initialize Sugar project
    execSync('sugar init', { 
      cwd: join(process.cwd(), 'apps', 'frontend'),
      stdio: 'inherit' 
    });

    console.log('✅ Sugar project initialized');
  }

  /**
   * Create Candy Machine configuration
   */
  createConfig(config: CandyMachineConfig): void {
    console.log('📝 Creating Candy Machine configuration...');

    const sugarConfig = {
      price: config.price,
      number: config.number,
      symbol: config.symbol,
      sellerFeeBasisPoints: config.sellerFeeBasisPoints,
      goLiveDate: config.goLiveDate,
      endSettings: config.endSettings,
      whitelistMintSettings: config.whitelistMintSettings,
      hiddenSettings: config.hiddenSettings,
      storage: {
        storageType: 'bundlr',
        awsS3Bucket: null
      },
      uploadMethod: {
        method: 'bundlr',
        awsS3Bucket: null
      },
      awsConfig: null,
      nftStorageAuthToken: null,
      shdwStorageAccount: null,
      pinataJwt: null,
      pinataGateway: null,
      arweaveJwk: null,
      bundlrAddress: 'https://node1.bundlr.network',
      bundlrProviderUrl: 'https://api.devnet.solana.com',
      bundlrCurrencyName: 'solana',
      bundlrAddressTable: null,
      bundlrSignerKeypair: null,
      bundlrStorageConfig: null,
      v2: {
        candyMachine: null,
        candyGuard: null,
        uuid: null,
        wallet: null
      }
    };

    writeFileSync(this.configPath, JSON.stringify(sugarConfig, null, 2));
    console.log('✅ Configuration saved to candy-machine.json');
  }

  /**
   * Upload assets to IPFS
   */
  async uploadAssets(): Promise<void> {
    console.log('📤 Uploading assets to IPFS...');
    
    try {
      execSync('sugar upload', {
        cwd: join(process.cwd(), 'apps', 'frontend'),
        stdio: 'inherit'
      });
      console.log('✅ Assets uploaded successfully');
    } catch (error) {
      console.error('❌ Failed to upload assets:', error);
      throw error;
    }
  }

  /**
   * Deploy Candy Machine
   */
  async deploy(): Promise<void> {
    console.log('🚀 Deploying Candy Machine...');
    
    try {
      execSync('sugar deploy', {
        cwd: join(process.cwd(), 'apps', 'frontend'),
        stdio: 'inherit'
      });
      console.log('✅ Candy Machine deployed successfully');
    } catch (error) {
      console.error('❌ Failed to deploy Candy Machine:', error);
      throw error;
    }
  }

  /**
   * Mint from Candy Machine
   */
  async mint(amount: number = 1): Promise<void> {
    console.log(`🍭 Minting ${amount} NFT(s)...`);
    
    try {
      execSync(`sugar mint ${amount}`, {
        cwd: join(process.cwd(), 'apps', 'frontend'),
        stdio: 'inherit'
      });
      console.log('✅ Minting completed successfully');
    } catch (error) {
      console.error('❌ Failed to mint:', error);
      throw error;
    }
  }

  /**
   * Get Candy Machine status
   */
  async getStatus(): Promise<any> {
    console.log('📊 Getting Candy Machine status...');
    
    try {
      const output = execSync('sugar show', {
        cwd: join(process.cwd(), 'apps', 'frontend'),
        encoding: 'utf8'
      });
      
      console.log('✅ Status retrieved successfully');
      return JSON.parse(output);
    } catch (error) {
      console.error('❌ Failed to get status:', error);
      throw error;
    }
  }

  /**
   * Create sample assets for testing
   */
  createSampleAssets(count: number = 5): void {
    console.log(`🎨 Creating ${count} sample assets...`);
    
    for (let i = 0; i < count; i++) {
      const assetPath = join(this.assetsPath, `${i}.json`);
      const imagePath = join(this.assetsPath, `${i}.png`);
      
      const metadata = {
        name: `NFTSol Test #${i + 1}`,
        symbol: 'TEST',
        description: `A test NFT for NFTSol #${i + 1}`,
        image: `${i}.png`,
        attributes: [
          { trait_type: 'Rarity', value: 'Common' },
          { trait_type: 'Number', value: i + 1 }
        ],
        properties: {
          files: [
            {
              uri: `${i}.png`,
              type: 'image/png'
            }
          ],
          category: 'image'
        },
        seller_fee_basis_points: 500
      };

      writeFileSync(assetPath, JSON.stringify(metadata, null, 2));
      
      // Create a placeholder image file (in real implementation, you'd have actual images)
      writeFileSync(imagePath, 'placeholder-image-data');
    }

    console.log('✅ Sample assets created');
  }

  /**
   * Create default configuration
   */
  createDefaultConfig(): CandyMachineConfig {
    return {
      price: 0.1, // 0.1 SOL
      number: 100,
      symbol: 'NFTSOL',
      sellerFeeBasisPoints: 500, // 5%
      goLiveDate: new Date().toISOString(),
      endSettings: {
        endSettingType: 'Date',
        value: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days from now
      }
    };
  }
}

// CLI interface
export async function setupCandyMachine() {
  const sugar = new SugarSetup(process.cwd());
  
  try {
    // Initialize Sugar
    await sugar.init();
    
    // Create sample assets
    sugar.createSampleAssets(10);
    
    // Create configuration
    const config = sugar.createDefaultConfig();
    sugar.createConfig(config);
    
    // Upload assets
    await sugar.uploadAssets();
    
    // Deploy Candy Machine
    await sugar.deploy();
    
    console.log('🎉 Candy Machine setup completed successfully!');
  } catch (error) {
    console.error('❌ Candy Machine setup failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  setupCandyMachine();
}

export default SugarSetup;
