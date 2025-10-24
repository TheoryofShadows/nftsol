import { Connection, Keypair, PublicKey, Transaction } from '@solana/web3.js';
import { 
  createCreateMetadataAccountV3Instruction,
  PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID
} from '@metaplex-foundation/mpl-token-metadata';
import { 
  createMint,
  createAssociatedTokenAccount,
  mintTo,
  getAssociatedTokenAddress
} from '@solana/spl-token';
import { getHeliusConfig } from '../config/environment';
import { db } from '../db';
import { nfts, nftTransactions } from '../schema';
import { eq } from 'drizzle-orm';

export class NFTMintingService {
  private connection: Connection;
  private heliusConfig: any;

  constructor() {
    this.heliusConfig = getHeliusConfig();
    this.connection = new Connection(this.heliusConfig.rpcUrl, 'confirmed');
  }

  async mintNFT(
    creatorWallet: string,
    name: string,
    description: string,
    imageUrl: string,
    attributes: any[] = [],
    collection?: string
  ) {
    try {
      // 1. Create new mint account
      const mintKeypair = Keypair.generate();
      const mintAddress = mintKeypair.publicKey.toString();

      // 2. Create metadata
      const metadata = {
        name,
        symbol: "NFT",
        description,
        image: imageUrl,
        attributes,
        properties: {
          files: [{ uri: imageUrl, type: "image/png" }],
          category: "image"
        }
      };

      // 3. Upload metadata to IPFS/Storacha
      const metadataUri = await this.uploadMetadata(metadata);

      // 4. Create the NFT on Solana
      const transaction = new Transaction();
      
      // Create metadata account
      const metadataAccount = PublicKey.findProgramAddressSync(
        [
          Buffer.from("metadata"),
          TOKEN_METADATA_PROGRAM_ID.toBuffer(),
          mintKeypair.publicKey.toBuffer(),
        ],
        TOKEN_METADATA_PROGRAM_ID
      )[0];

      transaction.add(
        createCreateMetadataAccountV3Instruction(
          {
            metadata: metadataAccount,
            mint: mintKeypair.publicKey,
            mintAuthority: new PublicKey(creatorWallet),
            payer: new PublicKey(creatorWallet),
            updateAuthority: new PublicKey(creatorWallet),
          },
          {
            createMetadataAccountArgsV3: {
              data: {
                name,
                symbol: "NFT",
                uri: metadataUri,
                sellerFeeBasisPoints: 250, // 2.5% royalty
                creators: [{
                  address: new PublicKey(creatorWallet),
                  verified: true,
                  share: 100
                }],
                collection: collection ? {
                  key: new PublicKey(collection),
                  verified: false
                } : null,
                uses: null
              },
              isMutable: true,
              collectionDetails: null
            }
          }
        )
      );

      // 5. Send transaction
      const signature = await this.connection.sendTransaction(transaction, [mintKeypair]);

      // 6. Save to database
      const [nft] = await db.insert(nfts).values({
        mintAddress,
        name,
        description,
        image: imageUrl,
        metadataUri,
        creator: creatorWallet,
        owner: creatorWallet,
        collection,
        attributes,
        status: 'minted'
      }).returning();

      // 7. Record transaction
      await db.insert(nftTransactions).values({
        nftId: nft.id,
        mintAddress,
        toWallet: creatorWallet,
        transactionType: 'mint',
        signature,
        blockTime: new Date()
      });

      return {
        success: true,
        mintAddress,
        signature,
        nft
      };

    } catch (error: any) {
      console.error('NFT minting failed:', error);
      throw new Error(`Failed to mint NFT: ${error.message}`);
    }
  }

  private async uploadMetadata(metadata: any): Promise<string> {
    try {
      const { SimpleIPFSService } = await import('./simpleIPFSService');
      const ipfsService = new SimpleIPFSService();
      
      const result = await ipfsService.uploadJSON(metadata, `nft-metadata-${metadata.name}-${Date.now()}`);
      
      if (result.success && result.ipfsUrl) {
        return result.ipfsUrl;
      } else {
        throw new Error(result.error || 'IPFS upload failed');
      }
    } catch (error) {
      console.error('IPFS metadata upload failed:', error);
      throw new Error('Failed to upload metadata to IPFS');
    }
  }
}
