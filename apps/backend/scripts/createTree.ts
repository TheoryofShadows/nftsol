import { BubblegumService } from '../src/services/bubblegumService-production';
import { Keypair } from '@solana/web3.js';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

(async () => {
  console.log('🌳 Creating Merkle Tree for Eternal Echoes...\n');

  // Load payer keypair
  const keypairPath = process.env.SOLANA_KEYPAIR_PATH || 
                      path.join(process.env.HOME || '', '.config/solana/id.json');
  
  if (!fs.existsSync(keypairPath)) {
    console.error(`❌ Keypair not found at: ${keypairPath}`);
    console.log('💡 Set SOLANA_KEYPAIR_PATH or create keypair with: solana-keygen new');
    process.exit(1);
  }

  const secretKey = Uint8Array.from(
    JSON.parse(fs.readFileSync(keypairPath, 'utf-8'))
  );
  const payer = Keypair.fromSecretKey(secretKey);

  console.log(`👛 Payer: ${payer.publicKey.toBase58()}`);
  console.log(`🌐 RPC: ${process.env.SOLANA_RPC_URL}\n`);

  const svc = new BubblegumService();
  
  console.log('⏳ Creating tree (this takes ~30 seconds)...\n');
  
  const { success, treeAddress, signature, error } = await svc.createTree(payer);

  if (!success) {
    console.error(`❌ Tree creation failed: ${error}`);
    process.exit(1);
  }

  console.log('✅ Tree created successfully!\n');
  console.log(`🌳 Tree Address: ${treeAddress}`);
  console.log(`📝 Signature: ${signature}\n`);

  // Update .env file
  const envPath = path.join(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    let env = fs.readFileSync(envPath, 'utf-8');
    env = env.replace(
      /MERKLE_TREE_ADDRESS=.*/,
      `MERKLE_TREE_ADDRESS=${treeAddress}`
    );
    fs.writeFileSync(envPath, env);
    console.log('✅ Updated .env with MERKLE_TREE_ADDRESS\n');
  }

  // Save to deployment info
  const deployInfo = {
    treeAddress,
    signature,
    createdAt: new Date().toISOString(),
    payer: payer.publicKey.toBase58(),
    cluster: process.env.CLUSTER || 'mainnet-beta',
  };

  fs.writeFileSync(
    path.join(__dirname, '../tree-deployment.json'),
    JSON.stringify(deployInfo, null, 2)
  );

  console.log('📄 Saved deployment info to tree-deployment.json\n');
  console.log('🎉 Ready to mint Eternal Echoes!');
})();
