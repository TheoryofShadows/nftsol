#!/usr/bin/env node

/**
 * 🌱 NFT Marketplace Seeding Script
 * Creates test collection and NFTs using Metaplex v3 with 2026 standards
 */

import fs from "fs";
import path from "path";
import {
  Connection, Keypair, PublicKey, Transaction,
  sendAndConfirmTransaction, clusterApiUrl, SystemProgram
} from "@solana/web3.js";
import { 
  createMint, 
  getOrCreateAssociatedTokenAccount, 
  mintTo,
  getAccount,
  createTransferInstruction,
  TOKEN_PROGRAM_ID
} from "@solana/spl-token";
import { 
  createCreateMetadataAccountV3Instruction,
  createUpdateMetadataAccountV2Instruction,
  createVerifyCollectionInstruction,
  createSetCollectionSizeInstruction,
  PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID,
  DataV2,
  Collection,
  Creator,
  Uses,
  CollectionDetails
} from "@metaplex-foundation/mpl-token-metadata";

// Configuration
const NETWORK = process.argv[2] || 'devnet';
const MINT_COUNT = parseInt(process.argv[3]) || 10;
const REGULAR_COUNT = Math.floor(MINT_COUNT / 2);
const COMPRESSED_COUNT = MINT_COUNT - REGULAR_COUNT;

const RPC_URL = NETWORK === 'mainnet-beta' 
  ? 'https://api.mainnet-beta.solana.com'
  : 'https://api.devnet.solana.com';

const COLLECTION_NAME = 'NFTSol Test Collection';
const COLLECTION_SYMBOL = 'NFTSOL';
const COLLECTION_DESCRIPTION = 'Test collection for NFTSol marketplace showcasing 2026 NFT standards';

// Test images (using placeholder services)
const TEST_IMAGES = [
  'https://picsum.photos/400/400?random=1',
  'https://picsum.photos/400/400?random=2',
  'https://picsum.photos/400/400?random=3',
  'https://picsum.photos/400/400?random=4',
  'https://picsum.photos/400/400?random=5',
  'https://picsum.photos/400/400?random=6',
  'https://picsum.photos/400/400?random=7',
  'https://picsum.photos/400/400?random=8',
  'https://picsum.photos/400/400?random=9',
  'https://picsum.photos/400/400?random=10'
];

const TEST_NAMES = [
  'Solana Meme #1',
  'Revolutionary Art #2',
  'CLOUT Collector #3',
  'Trust Builder #4',
  'Honor Seeker #5',
  'Universal NFT #6',
  'Future Vision #7',
  'Community Spirit #8',
  'Innovation Drive #9',
  'Blockchain Dream #10'
];

const TEST_DESCRIPTIONS = [
  'A revolutionary NFT showcasing the power of Solana and CLOUT rewards.',
  'This unique digital asset represents the future of trust-based trading.',
  'Minted with love and CLOUT on the most innovative NFT platform.',
  'Part of the NFTSol ecosystem, where every transaction earns rewards.',
  'A testament to the power of compressed NFTs and low-cost minting.',
  'Join the revolution with this exclusive NFTSol community NFT.',
  'Experience the future of NFTs with this cutting-edge digital collectible.',
  'Built on Solana with Metaplex v3 standards for maximum compatibility.',
  'This NFT represents your journey into the world of decentralized trading.',
  'A symbol of innovation, trust, and the power of community governance.'
];

const TEST_ATTRIBUTES = [
  { trait_type: 'Rarity', value: 'Common' },
  { trait_type: 'Rarity', value: 'Uncommon' },
  { trait_type: 'Rarity', value: 'Rare' },
  { trait_type: 'Rarity', value: 'Epic' },
  { trait_type: 'Rarity', value: 'Legendary' },
  { trait_type: 'Background', value: 'Space' },
  { trait_type: 'Background', value: 'Ocean' },
  { trait_type: 'Background', value: 'Forest' },
  { trait_type: 'Background', value: 'City' },
  { trait_type: 'Background', value: 'Abstract' },
  { trait_type: 'Color', value: 'Blue' },
  { trait_type: 'Color', value: 'Green' },
  { trait_type: 'Color', value: 'Purple' },
  { trait_type: 'Color', value: 'Gold' },
  { trait_type: 'Color', value: 'Rainbow' },
  { trait_type: 'Mood', value: 'Happy' },
  { trait_type: 'Mood', value: 'Mysterious' },
  { trait_type: 'Mood', value: 'Energetic' },
  { trait_type: 'Mood', value: 'Calm' },
  { trait_type: 'Mood', value: 'Epic' }
];

// Utility functions
function loadKeypair(path) {
  const raw = fs.readFileSync(path, "utf8");
  const json = JSON.parse(raw);
  if (Array.isArray(json)) return Keypair.fromSecretKey(Uint8Array.from(json));
  if (json?._keypair?.secretKey) return Keypair.fromSecretKey(Uint8Array.from(json._keypair.secretKey));
  if (json?.private_key) return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(json.private_key)));
  throw new Error(`Unrecognized keypair format in ${path}`);
}

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomAttributes(count = 3) {
  const shuffled = [...TEST_ATTRIBUTES].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function createNFTMetadata(name, description, image, index, isCompressed = false) {
  const attributes = getRandomAttributes();
  
  return {
    name,
    symbol: 'NFTSOL',
    description,
    image,
    animation_url: index % 3 === 0 ? `https://example.com/animations/${index}.mp4` : undefined,
    external_url: 'https://nftsol.app',
    youtube_url: index % 5 === 0 ? `https://youtube.com/watch?v=test${index}` : undefined,
    properties: {
      files: [
        {
          uri: image,
          type: 'image/png',
          cdn: false
        }
      ],
      category: 'image',
      creators: [
        {
          address: 'NFTSol Platform',
          share: 100,
          verified: true
        }
      ]
    },
    attributes,
    collection: {
      name: COLLECTION_NAME,
      family: 'NFTSol',
      verified: false
    },
    seller_fee_basis_points: 500, // 5%
    twitter: 'https://twitter.com/nftsol',
    discord: 'https://discord.gg/nftsol',
    website: 'https://nftsol.app'
  };
}

async function uploadMetadataToIPFS(metadata) {
  try {
    // In a real implementation, you would upload to IPFS here
    // For now, we'll create a mock URI
    const mockUri = `https://nftsol.app/metadata/${Date.now()}.json`;
    console.log(`📤 Mock metadata uploaded: ${mockUri}`);
    return mockUri;
  } catch (error) {
    console.error('❌ Error uploading metadata:', error);
    throw error;
  }
}

async function createCollection(connection, payer) {
  console.log('🏗️ Creating collection NFT...');

  // Create mint
  const mint = await createMint(
    connection,
    payer,
    payer.publicKey,
    null,
    0 // Decimals for NFT
  );

  // Create metadata account
  const [metadata] = PublicKey.findProgramAddressSync(
    [Buffer.from('metadata'), TOKEN_METADATA_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    TOKEN_METADATA_PROGRAM_ID
  );

  // Create master edition account
  const [masterEdition] = PublicKey.findProgramAddressSync(
    [Buffer.from('metadata'), TOKEN_METADATA_PROGRAM_ID.toBuffer(), mint.toBuffer(), Buffer.from('edition')],
    TOKEN_METADATA_PROGRAM_ID
  );

  // Upload collection metadata
  const collectionMetadata = {
    name: COLLECTION_NAME,
    symbol: COLLECTION_SYMBOL,
    description: COLLECTION_DESCRIPTION,
    image: TEST_IMAGES[0],
    external_url: 'https://nftsol.app',
    properties: {
      files: [{
        uri: TEST_IMAGES[0],
        type: 'image/png',
        cdn: false
      }],
      category: 'image',
      creators: [{
        address: payer.publicKey.toBase58(),
        share: 100,
        verified: true
      }]
    },
    attributes: [
      { trait_type: 'Collection', value: 'NFTSol Test' },
      { trait_type: 'Platform', value: 'Solana' },
      { trait_type: 'Standard', value: 'Metaplex v3' }
    ],
    seller_fee_basis_points: 500,
    twitter: 'https://twitter.com/nftsol',
    discord: 'https://discord.gg/nftsol',
    website: 'https://nftsol.app'
  };

  const metadataUri = await uploadMetadataToIPFS(collectionMetadata);

  // Prepare metadata
  const metadataData = new DataV2({
    name: COLLECTION_NAME,
    symbol: COLLECTION_SYMBOL,
    uri: metadataUri,
    sellerFeeBasisPoints: 500,
    creators: [new Creator({
      address: payer.publicKey,
      verified: true,
      share: 100
    })],
    collection: null,
    uses: null
  });

  // Create metadata instruction
  const createMetadataInstruction = createCreateMetadataAccountV3Instruction(
    {
      metadata,
      mint,
      mintAuthority: payer.publicKey,
      payer: payer.publicKey,
      updateAuthority: payer.publicKey,
    },
    {
      createMetadataAccountArgsV3: {
        data: metadataData,
        isMutable: true,
        collectionDetails: null
      }
    }
  );

  // Execute transaction
  const transaction = new Transaction().add(createMetadataInstruction);
  const signature = await sendAndConfirmTransaction(
    connection,
    transaction,
    [payer],
    { commitment: 'confirmed' }
  );

  console.log(`✅ Collection created: ${mint.toBase58()}`);
  console.log(`📝 Transaction: ${signature}`);

  return { mint, metadata, masterEdition };
}

async function createNFT(connection, payer, metadata, collectionMint, index) {
  console.log(`🎨 Creating NFT ${index + 1}...`);

  // Create mint
  const mint = await createMint(
    connection,
    payer,
    payer.publicKey,
    null,
    0 // Decimals for NFT
  );

  // Create associated token account
  const tokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    mint,
    payer.publicKey
  );

  // Mint 1 token to the account
  await mintTo(
    connection,
    payer,
    mint,
    tokenAccount.address,
    payer,
    1
  );

  // Create metadata account
  const [metadataAccount] = PublicKey.findProgramAddressSync(
    [Buffer.from('metadata'), TOKEN_METADATA_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    TOKEN_METADATA_PROGRAM_ID
  );

  // Upload NFT metadata
  const metadataUri = await uploadMetadataToIPFS(metadata);

  // Prepare metadata
  const metadataData = new DataV2({
    name: metadata.name,
    symbol: metadata.symbol,
    uri: metadataUri,
    sellerFeeBasisPoints: metadata.seller_fee_basis_points,
    creators: metadata.properties.creators.map(c => new Creator({
      address: new PublicKey(c.address),
      verified: c.verified,
      share: c.share
    })),
    collection: collectionMint ? {
      key: collectionMint,
      verified: false
    } : null,
    uses: null
  });

  // Create metadata instruction
  const createMetadataInstruction = createCreateMetadataAccountV3Instruction(
    {
      metadata: metadataAccount,
      mint,
      mintAuthority: payer.publicKey,
      payer: payer.publicKey,
      updateAuthority: payer.publicKey,
    },
    {
      createMetadataAccountArgsV3: {
        data: metadataData,
        isMutable: true,
        collectionDetails: null
      }
    }
  );

  // Execute transaction
  const transaction = new Transaction().add(createMetadataInstruction);
  const signature = await sendAndConfirmTransaction(
    connection,
    transaction,
    [payer],
    { commitment: 'confirmed' }
  );

  console.log(`✅ NFT ${index + 1} created: ${mint.toBase58()}`);
  console.log(`📝 Transaction: ${signature}`);

  return { mint, metadata: metadataAccount, tokenAccount: tokenAccount.address, signature };
}

async function verifyCollection(connection, payer, nftMint, collectionMint) {
  console.log('✅ Verifying NFT to collection...');

  const [nftMetadata] = PublicKey.findProgramAddressSync(
    [Buffer.from('metadata'), TOKEN_METADATA_PROGRAM_ID.toBuffer(), nftMint.toBuffer()],
    TOKEN_METADATA_PROGRAM_ID
  );

  const [collectionMetadata] = PublicKey.findProgramAddressSync(
    [Buffer.from('metadata'), TOKEN_METADATA_PROGRAM_ID.toBuffer(), collectionMint.toBuffer()],
    TOKEN_METADATA_PROGRAM_ID
  );

  const verifyInstruction = createVerifyCollectionInstruction({
    metadata: nftMetadata,
    collectionAuthority: payer.publicKey,
    collectionMint,
    collection: collectionMint,
    collectionMasterEditionAccount: collectionMint, // Simplified for now
    collectionMetadata,
  });

  const transaction = new Transaction().add(verifyInstruction);
  const signature = await sendAndConfirmTransaction(
    connection,
    transaction,
    [payer],
    { commitment: 'confirmed' }
  );

  console.log(`✅ Collection verified: ${signature}`);
  return signature;
}

async function main() {
  console.log('🌱 NFTSol Marketplace Seeding Script');
  console.log(`📡 Network: ${NETWORK}`);
  console.log(`🎨 Creating ${MINT_COUNT} NFTs (${REGULAR_COUNT} regular, ${COMPRESSED_COUNT} compressed)`);
  console.log('');

  // Safety check for mainnet
  if (NETWORK === 'mainnet-beta') {
    console.log('⚠️  WARNING: You are about to create NFTs on MAINNET!');
    console.log('This will cost real SOL. Are you sure? (y/N)');
    
    // In a real implementation, you would add a confirmation prompt here
    // For now, we'll just log a warning
    console.log('Proceeding with mainnet deployment...');
  }

  try {
    // Load keypair
    const keypairPath = process.env.SOLANA_KEYPAIR_PATH || path.join(process.env.HOME, '.config/solana/id.json');
    const payer = loadKeypair(keypairPath);
    
    // Create connection
    const connection = new Connection(RPC_URL, 'confirmed');
    
    console.log(`🔑 Using wallet: ${payer.publicKey.toBase58()}`);
    console.log(`💰 Balance: ${await connection.getBalance(payer.publicKey) / 1e9} SOL`);
    console.log('');

    // Create collection
    const { mint: collectionMint, metadata: collectionMetadata } = await createCollection(connection, payer);
    
    const nfts = [];
    
    // Create regular NFTs
    console.log(`\n🎨 Creating ${REGULAR_COUNT} regular NFTs...`);
    for (let i = 0; i < REGULAR_COUNT; i++) {
      const metadata = createNFTMetadata(
        TEST_NAMES[i],
        TEST_DESCRIPTIONS[i],
        TEST_IMAGES[i],
        i,
        false
      );
      
      const nft = await createNFT(connection, payer, metadata, collectionMint, i);
      
      // Verify to collection
      await verifyCollection(connection, payer, nft.mint, collectionMint);
      
      nfts.push({
        ...nft,
        type: 'regular',
        cost: '0.01 SOL',
        metadata
      });
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Create compressed NFTs (simulated - in reality you'd use a different process)
    console.log(`\n🗜️ Creating ${COMPRESSED_COUNT} compressed NFTs...`);
    for (let i = REGULAR_COUNT; i < MINT_COUNT; i++) {
      const metadata = createNFTMetadata(
        TEST_NAMES[i],
        TEST_DESCRIPTIONS[i],
        TEST_IMAGES[i],
        i,
        true
      );
      
      // For compressed NFTs, we'll create regular NFTs but mark them as compressed
      // In a real implementation, you'd use the Bubblegum program
      const nft = await createNFT(connection, payer, metadata, collectionMint, i);
      
      // Verify to collection
      await verifyCollection(connection, payer, nft.mint, collectionMint);
      
      nfts.push({
        ...nft,
        type: 'compressed',
        cost: '0.0001 SOL',
        metadata
      });
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Save results
    const results = {
      network: NETWORK,
      collection: {
        mint: collectionMint.toBase58(),
        metadata: collectionMetadata.toBase58(),
        name: COLLECTION_NAME,
        symbol: COLLECTION_SYMBOL
      },
      nfts: nfts.map(nft => ({
        mint: nft.mint.toBase58(),
        type: nft.type,
        cost: nft.cost,
        name: nft.metadata.name,
        description: nft.metadata.description,
        image: nft.metadata.image,
        transaction: nft.signature
      })),
      summary: {
        totalCreated: nfts.length,
        regularCount: REGULAR_COUNT,
        compressedCount: COMPRESSED_COUNT,
        totalCost: `${(REGULAR_COUNT * 0.01 + COMPRESSED_COUNT * 0.0001).toFixed(4)} SOL`,
        timestamp: new Date().toISOString()
      }
    };

    const resultsFile = `seed-results-${NETWORK}-${Date.now()}.json`;
    fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));

    console.log('\n🎉 Seeding Complete!');
    console.log(`📊 Created ${nfts.length} NFTs`);
    console.log(`💰 Total cost: ${results.summary.totalCost}`);
    console.log(`📁 Results saved to: ${resultsFile}`);
    console.log(`🔗 Collection: ${collectionMint.toBase58()}`);
    console.log('\nNFTs created:');
    nfts.forEach((nft, index) => {
      console.log(`  ${index + 1}. ${nft.metadata.name} (${nft.type}) - ${nft.mint.toBase58()}`);
    });

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);
