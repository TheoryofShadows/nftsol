import { Connection, PublicKey, Keypair, Transaction } from '@solana/web3.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CLOUT Token Configuration
const TOKEN_SYMBOL = 'CLOUT';
const TOKEN_NAME = 'NFTSol CLOUT Token';
const TOKEN_DECIMALS = 9;
const INITIAL_SUPPLY = 1000000; // 1 million CLOUT tokens
const TREASURY_ADDRESS = 'FsoPx1WmXA6FDxYTSULRDko3tKbNG7KxdRTq2icQJGjM';

async function deployCLOUTToken() {
  let splToken;
  try {
    splToken = await import('@solana/spl-token');
  } catch (error) {
    console.error('⚠️  @solana/spl-token is required to run this script.');
    console.error('    Install it locally with: npm install @solana/spl-token');
    throw error;
  }
  const { createMint, getOrCreateAssociatedTokenAccount, mintTo, getMint } = splToken;
  console.log('🚀 Starting CLOUT Token Deployment...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    // Connect to Solana devnet for testing
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    console.log('✅ Connected to Solana devnet (for testing)');

    // For demonstration, we'll use a dummy keypair
    // In production, you would load your actual treasury keypair
    console.log('⚠️  DEMO MODE: Using devnet with placeholder keypair');
    console.log('⚠️  For production deployment, replace with mainnet and your treasury private key');
    
    const treasuryKeypair = Keypair.generate(); // DEMO ONLY
    console.log(`📍 Demo Treasury Public Key: ${treasuryKeypair.publicKey.toString()}`);
    
    // Airdrop SOL for demo (devnet only)
    console.log('\n💧 Requesting SOL airdrop for demo...');
    try {
      const airdropSignature = await connection.requestAirdrop(
        treasuryKeypair.publicKey,
        2 * 1000000000 // 2 SOL
      );
      await connection.confirmTransaction(airdropSignature);
      console.log('✅ Airdrop successful for demo');
    } catch (airdropError) {
      console.log('⚠️  Airdrop failed, continuing with available balance');
    }

    // Create the CLOUT token mint
    console.log('\n🪙 Creating CLOUT token mint...');
    const mintAddress = await createMint(
      connection,
      treasuryKeypair, // Payer
      treasuryKeypair.publicKey, // Mint authority
      treasuryKeypair.publicKey, // Freeze authority (optional)
      TOKEN_DECIMALS // Decimals
    );

    console.log(`✅ CLOUT token mint created: ${mintAddress.toString()}`);

    // Create treasury token account
    console.log('\n🏦 Creating treasury token account...');
    const treasuryTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      treasuryKeypair, // Payer
      mintAddress, // Mint
      treasuryKeypair.publicKey // Owner
    );

    console.log(`✅ Treasury token account: ${treasuryTokenAccount.address.toString()}`);

    // Mint initial supply to treasury
    console.log(`\n💰 Minting ${INITIAL_SUPPLY.toLocaleString()} CLOUT tokens...`);
    const mintAmount = INITIAL_SUPPLY * Math.pow(10, TOKEN_DECIMALS);
    
    const mintSignature = await mintTo(
      connection,
      treasuryKeypair, // Payer
      mintAddress, // Mint
      treasuryTokenAccount.address, // Destination
      treasuryKeypair, // Mint authority
      mintAmount // Amount
    );

    console.log(`✅ Minted tokens successfully. Signature: ${mintSignature}`);

    // Verify mint information
    const mintInfo = await getMint(connection, mintAddress);
    console.log('\n📊 Token Verification:');
    console.log(`   Supply: ${(Number(mintInfo.supply) / Math.pow(10, mintInfo.decimals)).toLocaleString()} CLOUT`);
    console.log(`   Decimals: ${mintInfo.decimals}`);
    console.log(`   Mint Authority: ${mintInfo.mintAuthority?.toString()}`);

    // Save deployment information
    const deploymentInfo = {
      tokenSymbol: TOKEN_SYMBOL,
      tokenName: TOKEN_NAME,
      mintAddress: mintAddress.toString(),
      treasuryWallet: treasuryKeypair.publicKey.toString(),
      treasuryTokenAccount: treasuryTokenAccount.address.toString(),
      initialSupply: INITIAL_SUPPLY,
      decimals: TOKEN_DECIMALS,
      mintSignature,
      deployedAt: new Date().toISOString(),
      network: 'devnet',
      explorerUrl: `https://explorer.solana.com/address/${mintAddress.toString()}`,
      transactionUrl: `https://explorer.solana.com/tx/${mintSignature}`
    };

    // Save to deployment file
    const deploymentPath = path.join(__dirname, '../clout-deployment.json');
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));

    console.log('\n🎉 CLOUT Token Deployment Complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📍 Mint Address: ${mintAddress.toString()}`);
    console.log(`🏦 Treasury Account: ${treasuryTokenAccount.address.toString()}`);
    console.log(`💰 Initial Supply: ${INITIAL_SUPPLY.toLocaleString()} CLOUT`);
    console.log(`🔗 Explorer: https://explorer.solana.com/address/${mintAddress.toString()}`);
    console.log(`📄 Deployment saved to: ${deploymentPath}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    console.log('\n⚠️  IMPORTANT SECURITY NOTES:');
    console.log('1. This demo used a generated keypair');
    console.log('2. For production, use your actual treasury private key');
    console.log('3. Store private keys securely and never commit them to version control');
    console.log('4. Consider using a hardware wallet for production deployments');

    return deploymentInfo;

  } catch (error) {
    console.error('\n❌ CLOUT Token Deployment Failed:');
    console.error(error);
    
    console.log('\n🛠️  Troubleshooting:');
    console.log('1. Ensure you have sufficient SOL for transaction fees');
    console.log('2. Check your network connection');
    console.log('3. Verify your treasury wallet private key');
    console.log('4. Try again after a few minutes');
    
    throw error;
  }
}

// Check if this is the main module (ES modules)
if (import.meta.url === `file://${process.argv[1]}`) {
  deployCLOUTToken()
    .then(() => {
      console.log('\n✅ Deployment script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Deployment script failed:', error);
      process.exit(1);
    });
}

export { deployCLOUTToken };
