// Simple CLOUT Token Deployment
import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { createMint, getOrCreateAssociatedTokenAccount, mintTo, getMint } from '@solana/spl-token';

async function deployCLOUTToken() {
  console.log('🚀 Starting CLOUT Token Deployment...');
  
  try {
    // Connect to Solana devnet
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    console.log('✅ Connected to Solana devnet');

    // Generate demo keypair
    const treasuryKeypair = Keypair.generate();
    console.log(`📍 Treasury Public Key: ${treasuryKeypair.publicKey.toString()}`);
    
    // Airdrop SOL for demo
    console.log('💧 Requesting SOL airdrop...');
    try {
      const airdropSignature = await connection.requestAirdrop(
        treasuryKeypair.publicKey,
        2 * 1000000000 // 2 SOL
      );
      await connection.confirmTransaction(airdropSignature);
      console.log('✅ Airdrop successful');
    } catch (airdropError) {
      console.log('⚠️ Airdrop failed, continuing...');
    }

    // Create CLOUT token mint
    console.log('🪙 Creating CLOUT token mint...');
    const mintAddress = await createMint(
      connection,
      treasuryKeypair,
      treasuryKeypair.publicKey,
      treasuryKeypair.publicKey,
      9 // Decimals
    );

    console.log(`✅ CLOUT token mint created: ${mintAddress.toString()}`);

    // Create treasury token account
    const treasuryTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      treasuryKeypair,
      mintAddress,
      treasuryKeypair.publicKey
    );

    console.log(`✅ Treasury token account: ${treasuryTokenAccount.address.toString()}`);

    // Mint 1 million CLOUT tokens
    const mintAmount = 1000000 * Math.pow(10, 9);
    const mintSignature = await mintTo(
      connection,
      treasuryKeypair,
      mintAddress,
      treasuryTokenAccount.address,
      treasuryKeypair,
      mintAmount
    );

    console.log(`✅ Minted 1,000,000 CLOUT tokens. Signature: ${mintSignature}`);

    // Save deployment info
    const deploymentInfo = {
      mintAddress: mintAddress.toString(),
      treasuryTokenAccount: treasuryTokenAccount.address.toString(),
      deployedAt: new Date().toISOString(),
      network: 'devnet'
    };

    console.log('\n🎉 CLOUT Token Deployment Complete!');
    console.log(`📍 Mint Address: ${mintAddress.toString()}`);
    console.log(`🏦 Treasury Account: ${treasuryTokenAccount.address.toString()}`);
    console.log(`🔗 Explorer: https://explorer.solana.com/address/${mintAddress.toString()}`);

    return deploymentInfo;

  } catch (error) {
    console.error('❌ Deployment failed:', error);
    throw error;
  }
}

deployCLOUTToken().catch(console.error);
