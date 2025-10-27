import fs from "fs";
import {
  Connection, Keypair, PublicKey, Transaction,
  sendAndConfirmTransaction, clusterApiUrl, SystemProgram
} from "@solana/web3.js";
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

function usage() {
  console.log(`Usage:
  node scripts/set-metadata.mjs <MINT> "<NAME>" "<SYMBOL>" "<URI>" [SELLER_FEE_BPS]
`);}
async function main() {
  const [mintStr, name, symbol, uri, feeStr] = process.argv.slice(2);
  if (!mintStr || !name || !symbol || !uri) { usage(); process.exit(1); }
  const sellerFeeBasisPoints = Number(feeStr ?? 500);

  const keypairPath = process.env.SOLANA_KEYPAIR_PATH || "/home/khk89/.config/solana/devnet.json";
  const payer = loadKeypair(keypairPath);

  const endpoint = process.env.SOLANA_RPC || clusterApiUrl("devnet");
  const connection = new Connection(endpoint, "confirmed");

  const mint = new PublicKey(mintStr);
  const metadataPda = findMetadataPda(mint);

  // Detect helpers available in the installed package (v2 exposes V3/V2/V1 helpers)
  const hasV3 = typeof tokenMetaPkg.createCreateMetadataAccountV3Instruction === "function";
  const hasV2 = typeof tokenMetaPkg.createCreateMetadataAccountV2Instruction === "function";
  const hasV1 = typeof tokenMetaPkg.createCreateMetadataAccountInstruction === "function";
  if (!hasV3 && !hasV2 && !hasV1) {
    throw new Error("No createCreateMetadataAccount* instruction found in your mpl-token-metadata version.");
  }

  const accounts = {
    metadata: metadataPda,
    mint,
    mintAuthority: payer.publicKey,
    payer: payer.publicKey,
    updateAuthority: payer.publicKey,
    systemProgram: SystemProgram.programId,
  };

  const dataCommon = {
    name,
    symbol,
    uri,
    sellerFeeBasisPoints,
    creators: [{ address: payer.publicKey, verified: true, share: 100 }],
    collection: null,
    uses: null,
  };

  let ix;
  if (hasV3) {
    const { createCreateMetadataAccountV3Instruction } = tokenMetaPkg;
    ix = createCreateMetadataAccountV3Instruction(accounts, {
      createMetadataAccountArgsV3: { data: dataCommon, isMutable: true, collectionDetails: null },
    });
  } else if (hasV2) {
    const { createCreateMetadataAccountV2Instruction } = tokenMetaPkg;
    ix = createCreateMetadataAccountV2Instruction(accounts, {
      createMetadataAccountArgsV2: { data: dataCommon, isMutable: true },
    });
  } else {
    const { createCreateMetadataAccountInstruction } = tokenMetaPkg;
    ix = createCreateMetadataAccountInstruction(accounts, {
      createMetadataAccountArgs: { data: dataCommon, isMutable: true },
    });
  }

  const tx = new Transaction().add(ix);
  const sig = await sendAndConfirmTransaction(connection, tx, [payer], { commitment: "confirmed" });
  console.log("✅ Metadata created");
  console.log("Tx:", sig);
  console.log("Mint:", mint.toBase58());
  console.log("Metadata PDA:", metadataPda.toBase58());
}
main().catch((e) => { console.error("❌ Failed to set metadata:", e); process.exit(1); });
