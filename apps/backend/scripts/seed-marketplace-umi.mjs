/**
 * 🌱 Seed Marketplace with Umi Framework
 * Modern Umi-based script for creating test NFTs and collections
 */

import fs from "fs";
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

// Umi framework imports
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { 
  createV1,
  mintV1,
  TokenStandard,
  mplTokenMetadata,
} from '@metaplex-foundation/mpl-token-metadata';
import {
  createTokenIfMissing,
  findAssociatedTokenPda,
  getSplAssociatedTokenProgramId,
  mplToolbox,
} from '@metaplex-foundation/mpl-toolbox';
import {
  generateSigner,
  percentAmount,
  signerIdentity,
  publicKey,
} from '@metaplex-foundation/umi';

const TOKEN_METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

// Configuration
const NETWORK = process.argv[2] || 'devnet';
const MINT_COUNT = parseInt(process.argv[3]) || 10;

const RPC_URL = NETWORK === 'mainnet-beta' 
  ? 'https://api.mainnet-beta.solana.com'
  : 'https://api.devnet.solana.com';

const COLLECTION_NAME = 'NFTSol Test Collection';
const COLLECTION_SYMBOL = 'NFTSOL';
const COLLECTION_DESCRIPTION = 'Test collection for NFTSol marketplace showcasing 2026 NFT standards with Umi framework';

// Test images
const TEST_IMAGES = [
  'https://picsum.photos/400/400?random=1',
  'https://picsum.photos/400/400?random=2',
  'https://picsum.photos/400/400?random=3',
  'https://picsum.photos/400/400?random=4',
  'https://picsum.photos/400/400?random=5',
];

function loadKeypair(path) {
  const raw = fs.readFileSync(path, "utf8");
  const json = JSON.parse(raw);
  if (Array.isArray(json)) return Keypair.fromSecretKey(Uint8Array.from(json));
  if (json?._keypair?.secretKey) return Keypair.fromSecretKey(Uint8Array.from(json._keypair.secretKey));
  if (json?.private_key) return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(json.private_key)));
  throw new Error(`Unrecognized keypair format in ${path}`);
}

async function uploadMetadataToIPFS(metadata) {
  try {
    // Mock IPFS upload
    const mockUri = `https://ipfs.io/ipfs/mock-${Date.now()}.json`;
    console.log(`📤 Mock metadata uploaded: ${mockUri}`);
    return mockUri;
  } catch (error) {
    console.error('❌ Error uploading metadata:', error);
    throw error;
  }
}

async function createCollection(umi, payer) {
  console.log(`🏗️ Creating collection with Umi: ${COLLECTION_NAME}`);

  // Generate mint signer
  const mint = generateSigner(umi);

  // Create collection metadata
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
        address: umi.identity.publicKey.toString(),
        share: 100,
        verified: true
      }]
    },
    attributes: [
      { trait_type: 'Collection', value: 'NFTSol Test' },
      { trait_type: 'Platform', value: 'Solana' },
      { trait_type: 'Standard', value: 'Umi Framework' }
    ],
    seller_fee_basis_points: 500
  };

  const metadataUri = await uploadMetadataToIPFS(collectionMetadata);

  // Create collection using Umi
  await createV1(umi, {
    mint,
    authority: umi.identity,
    name: COLLECTION_NAME,
    symbol: COLLECTION_SYMBOL,
    uri: metadataUri,
    sellerFeeBasisPoints: percentAmount(5),
    decimals: 0,
    tokenStandard: TokenStandard.NonFungible,
    isMutable: true,
    creators: [{
      address: umi.identity.publicKey,
      verified: true,
      share: 100
    }],
  }).sendAndConfirm(umi);

  // Create ATA and mint collection token
  await createTokenIfMissing(umi, {
    mint: mint.publicKey,
    owner: umi.identity.publicKey,
    ataProgram: getSplAssociatedTokenProgramId(umi),
  }).sendAndConfirm(umi);

  const ata = findAssociatedTokenPda(umi, {
    mint: mint.publicKey,
    owner: umi.identity.publicKey,
  })[0];

  await mintV1(umi, {
    mint: mint.publicKey,
    authority: umi.identity,
    amount: 1n,
    token: ata,
    tokenOwner: umi.identity.publicKey,
    tokenStandard: TokenStandard.NonFungible,
  }).sendAndConfirm(umi);

  console.log(`✅ Collection created: ${mint.publicKey}`);
  return { mint: new PublicKey(mint.publicKey) };
}

async function createNFT(umi, collectionMint, index) {
  console.log(`🎨 Creating NFT ${index + 1} with Umi...`);

  // Generate mint signer
  const mint = generateSigner(umi);

  // Create NFT metadata
  const nftMetadata = {
    name: `NFTSol Test NFT #${index + 1}`,
    symbol: 'TEST',
    description: `Test NFT #${index + 1} created with Umi framework`,
    image: TEST_IMAGES[index % TEST_IMAGES.length],
    external_url: 'https://nftsol.app',
    properties: {
      files: [{
        uri: TEST_IMAGES[index % TEST_IMAGES.length],
        type: 'image/png',
        cdn: false
      }],
      category: 'image',
      creators: [{
        address: umi.identity.publicKey.toString(),
        share: 100,
        verified: true
      }]
    },
    attributes: [
      { trait_type: 'Rarity', value: index % 3 === 0 ? 'Rare' : 'Common' },
      { trait_type: 'Color', value: ['Red', 'Blue', 'Green', 'Yellow', 'Purple'][index % 5] },
      { trait_type: 'Number', value: index + 1 }
    ],
    seller_fee_basis_points: 500
  };

  const metadataUri = await uploadMetadataToIPFS(nftMetadata);

  // Create NFT using Umi
  await createV1(umi, {
    mint,
    authority: umi.identity,
    name: nftMetadata.name,
    symbol: nftMetadata.symbol,
    uri: metadataUri,
    sellerFeeBasisPoints: percentAmount(5),
    decimals: 0,
    tokenStandard: TokenStandard.NonFungible,
    isMutable: true,
    creators: [{
      address: umi.identity.publicKey,
      verified: true,
      share: 100
    }],
    collection: collectionMint ? {
      key: publicKey(collectionMint.toBase58()),
      verified: false
    } : undefined,
  }).sendAndConfirm(umi);

  // Create ATA and mint NFT
  await createTokenIfMissing(umi, {
    mint: mint.publicKey,
    owner: umi.identity.publicKey,
    ataProgram: getSplAssociatedTokenProgramId(umi),
  }).sendAndConfirm(umi);

  const ata = findAssociatedTokenPda(umi, {
    mint: mint.publicKey,
    owner: umi.identity.publicKey,
  })[0];

  await mintV1(umi, {
    mint: mint.publicKey,
    authority: umi.identity,
    amount: 1n,
    token: ata,
    tokenOwner: umi.identity.publicKey,
    tokenStandard: TokenStandard.NonFungible,
  }).sendAndConfirm(umi);

  console.log(`✅ NFT created: ${mint.publicKey}`);
  return { mint: new PublicKey(mint.publicKey) };
}

async function main() {
  try {
    console.log(`🚀 Starting NFTSol marketplace seeding with Umi framework...`);
    console.log(`   Network: ${NETWORK}`);
    console.log(`   RPC: ${RPC_URL}`);
    console.log(`   NFT Count: ${MINT_COUNT}`);

    // Load payer keypair
    const payerPath = `./wallet-${NETWORK}.json`;
    if (!fs.existsSync(payerPath)) {
      console.error(`❌ Wallet file not found: ${payerPath}`);
      console.log('💡 Create a wallet file first');
      process.exit(1);
    }

    const payer = loadKeypair(payerPath);
    console.log(`👤 Payer: ${payer.publicKey.toBase58()}`);

    // Initialize Umi
    const umi = createUmi(RPC_URL)
      .use(mplTokenMetadata())
      .use(mplToolbox());

    // Set up signer
    const keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(payer.secretKey));
    const signer = createSignerFromKeypair(umi, keypair);
    umi.use(signerIdentity(signer));

    // Create collection
    const { mint: collectionMint } = await createCollection(umi, payer);
    console.log(`📁 Collection: ${collectionMint.toBase58()}`);

    // Create NFTs
    const nfts = [];
    for (let i = 0; i < MINT_COUNT; i++) {
      const { mint: nftMint } = await createNFT(umi, collectionMint, i);
      nfts.push({
        mint: nftMint.toBase58(),
        name: `NFTSol Test NFT #${i + 1}`,
        collection: collectionMint.toBase58()
      });
    }

    // Save results
    const results = {
      network: NETWORK,
      collection: collectionMint.toBase58(),
      nfts: nfts,
      summary: {
        totalNFTs: nfts.length,
        collectionMint: collectionMint.toBase58(),
        timestamp: new Date().toISOString()
      }
    };

    const resultsFile = `seed-results-${NETWORK}-${Date.now()}.json`;
    fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));

    console.log(`\n✅ Seeding completed successfully!`);
    console.log(`📁 Collection: ${collectionMint.toBase58()}`);
    console.log(`🎨 NFTs created: ${nfts.length}`);
    console.log(`📄 Results saved to: ${resultsFile}`);
    console.log(`🔗 Explorer: https://solana.fm/address/${collectionMint.toBase58()}?cluster=${NETWORK}-solana`);

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

main();
