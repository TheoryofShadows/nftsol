const { Connection, Keypair } = require('@solana/web3.js');
const { createUmi } = require('@metaplex-foundation/umi-bundle-defaults');
const { createTree, mplBubblegum } = require('@metaplex-foundation/mpl-bubblegum');
const { createSignerFromKeypair, signerIdentity, generateSigner } = require('@metaplex-foundation/umi');
const bs58 = require('bs58');
const fs = require('fs');

async function createBubblegumTree() {
  console.log('🌳 Creating Bubblegum Tree for Compressed NFTs...\n');
  
  // Read platform key from .env
  const envContent = fs.readFileSync('.env', 'utf-8');
  const match = envContent.match(/PLATFORM_SECRET_KEY_BASE58=(.+)/);
  if (!match) {
    console.error('❌ PLATFORM_SECRET_KEY_BASE58 not found in .env');
    process.exit(1);
  }
  
  const secretKey = bs58.decode(match[1].trim());
  const keypair = Keypair.fromSecretKey(secretKey);
  
  // Determine cluster
  const clusterMatch = envContent.match(/SOLANA_CLUSTER=(.+)/);
  const cluster = (clusterMatch ? clusterMatch[1].trim() : 'devnet').toLowerCase();
  const rpcUrl = cluster === 'devnet' 
    ? 'https://api.devnet.solana.com'
    : 'https://api.mainnet-beta.solana.com';
  
  console.log('Cluster:', cluster);
  console.log('RPC:', rpcUrl);
  console.log('Platform wallet:', keypair.publicKey.toBase58());
  console.log('');
  
  // Create UMI instance
  const umi = createUmi(rpcUrl).use(mplBubblegum());
  
  // Convert Solana keypair to UMI format
  const umiKeypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(keypair.secretKey));
  const signer = createSignerFromKeypair(umi, umiKeypair);
  umi.use(signerIdentity(signer));
  
  // Generate tree signer
  const merkleTree = generateSigner(umi);
  
  console.log('Creating tree (this may take a moment)...');
  
  try {
    const builder = await createTree(umi, {
      merkleTree,
      maxDepth: 14,
      maxBufferSize: 64,
    });
    
    const result = await builder.sendAndConfirm(umi);
    
    console.log('\n✅ Bubblegum Tree Created!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Tree Address:', merkleTree.publicKey.toString());
    console.log('Transaction:', result.signature.toString());
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\nAdd this to your .env file:');
    console.log('BUBBLEGUM_TREE_ADDRESS=' + merkleTree.publicKey.toString());
    
  } catch (error) {
    console.error('\n❌ Error creating tree:', error.message);
    if (error.message.includes('insufficient funds')) {
      console.error('   Fund your platform wallet with SOL first:');
      console.error('   Platform wallet:', keypair.publicKey.toBase58());
      console.error('   Devnet faucet: https://faucet.solana.com/');
    }
  }
}

createBubblegumTree();
