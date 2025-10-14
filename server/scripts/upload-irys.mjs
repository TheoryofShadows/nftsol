import fs from "fs";
import { Uploader } from "@irys/upload";
import { Solana } from "@irys/upload-solana";

async function main() {
  // Load your devnet keypair (array of 64 bytes)
  const kp = JSON.parse(fs.readFileSync(`${process.env.HOME}/.config/solana/devnet.json`, "utf8"));
  const privateKey = Uint8Array.from(kp);

  // Init Irys for Solana (auto-picks a funded node)
  const irys = await Uploader(Solana).withWallet(privateKey);

  // 1) Upload image
  const img = fs.readFileSync("assets/image.png");
  const imgRes = await irys.upload(img, { tags: [{ name: "Content-Type", value: "image/png" }] });
  const AR_IMG_URL = `https://arweave.net/${imgRes.id}`;
  console.log("AR_IMG_URL:", AR_IMG_URL);

  // 2) Build metadata that points to that Arweave image
  const metadata = {
    name: "NFTSol Dev Test",
    symbol: "NFSOL",
    description: "Test mint for NFTSol devnet.",
    image: AR_IMG_URL,
    attributes: [{ trait_type: "Series", value: "Dev" }],
    properties: {
      files: [{ uri: AR_IMG_URL, type: "image/png" }],
      category: "image",
      creators: [{ address: "Bq4mvvmiBZ2aTQ4DUa6cCuMP8zaQZfSPvTUBSF5oywYv", share: 100 }]
    }
  };

  // 3) Upload metadata JSON
  const metaRes = await irys.upload(Buffer.from(JSON.stringify(metadata)), {
    tags: [{ name: "Content-Type", value: "application/json" }]
  });
  const AR_META_URL = `https://arweave.net/${metaRes.id}`;
  console.log("AR_META_URL:", AR_META_URL);
}

main().catch(e => { console.error(e); process.exit(1); });
