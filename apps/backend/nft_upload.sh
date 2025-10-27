#!/usr/bin/env bash
set +e  # do NOT exit on error
echo "TOKEN_LEN=${#NFT_STORAGE_TOKEN}"
mkdir -p assets
if [ ! -f assets/image.png ]; then
  cat > assets/image.png.b64 <<'EOF'
iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQAB
DQottAAAAABJRU5ErkJggg==
EOF
  base64 -d assets/image.png.b64 > assets/image.png
fi
RESP=$(curl -sS -X POST -H "Authorization: Bearer $NFT_STORAGE_TOKEN" \
  -H "Content-Type: application/octet-stream" --data-binary @assets/image.png \
  https://api.nft.storage/upload)
echo "$RESP" | jq .
IMG_CID=$(echo "$RESP" | jq -r '.value.cid // empty')
echo "IMG_CID=$IMG_CID"
if [ -z "$IMG_CID" ]; then
  echo "Image upload failed or token invalid."
  exit 0
fi
cat > metadata.json <<EOF
{
  "name": "NFTSol Dev Test",
  "symbol": "NFSOL",
  "description": "Test mint for NFTSol devnet.",
  "image": "ipfs://$IMG_CID",
  "attributes": [{ "trait_type": "Series", "value": "Dev" }],
  "properties": {
    "files": [{ "uri": "ipfs://$IMG_CID", "type": "image/png" }],
    "category": "image",
    "creators": [
      { "address": "Bq4mvvmiBZ2aTQ4DUa6cCuMP8zaQZfSPvTUBSF5oywYv", "share": 100 }
    ]
  }
}
EOF
META_RESP=$(curl -sS -X POST -H "Authorization: Bearer $NFT_STORAGE_TOKEN" \
  -H "Content-Type: application/octet-stream" --data-binary @metadata.json \
  https://api.nft.storage/upload)
echo "$META_RESP" | jq .
META_CID=$(echo "$META_RESP" | jq -r '.value.cid // empty')
echo "META_CID=$META_CID"
if [ -z "$META_CID" ]; then
  echo "Metadata upload failed."
  exit 0
fi
export TARGET_MINT=7HZD3v89ekJDmckztH4nJxQ9ajF1PhP3ar2u9zudDdM9
export URI="https://ipfs.io/ipfs/$META_CID"
node scripts/update-metadata-safe.mjs "$TARGET_MINT" "NFTSol Dev Test" "NFSOL" "$URI" 500
