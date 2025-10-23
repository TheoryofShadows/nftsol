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
import tokenMetaPkg from "@metaplex-foundation/mpl-token-metadata";

const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

function loadKeypair(path) {
  const raw = fs.readFileSync(path, "utf8");
  const json = JSON.parse(raw);
  if (Array.isArray(json)) return Keypair.fromSecretKey(Uint8Array.from(json));
  if (json?._keypair?.secretKey) return Keypair.fromSecretKey(Uint8Array.from(json._keypair.secretKey));
  if (json?.private_key) return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(json.private_key)));
  throw new Error(`Unrecognized keypair format in ${path}`);
}

function findMetadataPda(mint) {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("metadata"), TOKEN_METADATA_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    TOKEN_METADATA_PROGRAM_ID
  );
  return pda;
}

async function deployCLOUTToken() {
  console.log("🚀 Deploying CLOUT Token...");
  
  // Load platform wallets
  const keypairPath = process.env.SOLANA_KEYPAIR_PATH || "C:\\Users\\KHK89\\.config\\solana\\id.json";
  const payer = loadKeypair(keypairPath);
  
  const endpoint = process.env.SOLANA_RPC || clusterApiUrl("devnet");
  const connection = new Connection(endpoint, "confirmed");
  
  console.log(`Using RPC: ${endpoint}`);
  console.log(`Payer: ${payer.publicKey.toBase58()}`);
  
  try {
    // 1. Create CLOUT token mint
    console.log("Creating CLOUT token mint...");
    const cloutMint = await createMint(
      connection,
      payer,
      payer.publicKey, // mint authority
      payer.publicKey, // freeze authority
      9 // decimals
    );
    
    console.log(`✅ CLOUT Token Mint: ${cloutMint.toBase58()}`);
    
    // 2. Create metadata for CLOUT token
    console.log("Creating CLOUT token metadata...");
    const metadataPda = findMetadataPda(cloutMint);
    
    const metadataTx = new Transaction();
    
    // Use V3 instruction if available
    if (typeof tokenMetaPkg.createCreateMetadataAccountV3Instruction === "function") {
      metadataTx.add(
        tokenMetaPkg.createCreateMetadataAccountV3Instruction(
          {
            metadata: metadataPda,
            mint: cloutMint,
            mintAuthority: payer.publicKey,
            payer: payer.publicKey,
            updateAuthority: payer.publicKey,
          },
          {
            createMetadataAccountArgsV3: {
              data: {
                name: "CLOUT Token",
                symbol: "CLOUT",
                uri: "https://nftsol.app/api/clout-metadata",
                sellerFeeBasisPoints: 0,
                creators: [{
                  address: payer.publicKey,
                  verified: true,
                  share: 100
                }],
                collection: null,
                uses: null
              },
              isMutable: true,
              collectionDetails: null
            }
          }
        )
      );
    }
    
    await sendAndConfirmTransaction(connection, metadataTx, [payer]);
    console.log("✅ CLOUT metadata created");
    
    // 3. Create token accounts for platform wallets
    const platformWallets = {
      treasury: 'J9msWkhEUPMLBXzkycwZjuU6B5vjfvNguASHLxJKAAfh',
      feeCollector: '5Gu3RnFApFEDmMJj5czHTFPRf6A5xNypSRPrqewmPLHW',
      developer: '7pRUDnHS1y3b7EycVm7xtV2MgBArKFcAnFpdZCMPvLio'
    };
    
    console.log("Creating token accounts for platform wallets...");
    for (const [name, walletAddress] of Object.entries(platformWallets)) {
      try {
        const walletPubkey = new PublicKey(walletAddress);
        const tokenAccount = await getOrCreateAssociatedTokenAccount(
          connection,
          payer,
          cloutMint,
          walletPubkey
        );
        console.log(`✅ ${name} token account: ${tokenAccount.address.toBase58()}`);
      } catch (error) {
        console.log(`⚠️ Could not create token account for ${name}: ${error.message}`);
      }
    }
    
    // 4. Mint initial CLOUT supply to treasury
    console.log("Minting initial CLOUT supply...");
    const treasuryPubkey = new PublicKey(platformWallets.treasury);
    const treasuryTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      payer,
      cloutMint,
      treasuryPubkey
    );
    
    // Mint 1 billion CLOUT tokens (1,000,000,000 * 10^9)
    const initialSupply = 1_000_000_000 * Math.pow(10, 9);
    await mintTo(
      connection,
      payer,
      cloutMint,
      treasuryTokenAccount.address,
      payer,
      initialSupply
    );
    
    console.log(`✅ Minted ${initialSupply / Math.pow(10, 9)} CLOUT tokens to treasury`);
    
    // 5. Save deployment info
    const deploymentInfo = {
      mint: cloutMint.toBase58(),
      metadata: metadataPda.toBase58(),
      treasury: platformWallets.treasury,
      feeCollector: platformWallets.feeCollector,
      developer: platformWallets.developer,
      initialSupply: initialSupply,
      decimals: 9,
      deployedAt: new Date().toISOString(),
      network: endpoint.includes('devnet') ? 'devnet' : 'mainnet-beta'
    };
    
    fs.writeFileSync('clout-deployment.json', JSON.stringify(deploymentInfo, null, 2));
    console.log("✅ Deployment info saved to clout-deployment.json");
    
    return deploymentInfo;
    
  } catch (error) {
    console.error("❌ CLOUT deployment failed:", error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  deployCLOUTToken()
    .then((info) => {
      console.log("🎉 CLOUT Token deployed successfully!");
      console.log(JSON.stringify(info, null, 2));
    })
    .catch((error) => {
      console.error("💥 Deployment failed:", error);
      process.exit(1);
    });
}

// Run the deployment
deployCLOUTToken();
