#!/usr/bin/env bash
set -euo pipefail

WORKSPACE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PROGRAMS_DIR="$WORKSPACE_DIR/anchor/solana_rewards/target/deploy"
IDL_DIR="$WORKSPACE_DIR/anchor/solana_rewards/target/idl"
GENERATED_DIR="$WORKSPACE_DIR/anchor/solana_rewards/generated"

anchor --version

echo "Building Anchor workspace..."
cd "$WORKSPACE_DIR/anchor/solana_rewards"
anchor build

echo "Deploying programs to devnet..."
while IFS= read -r program_keypair; do
  solana program deploy "$PROGRAMS_DIR/$program_keypair" --program-id "$PROGRAMS_DIR/${program_keypair%.so}-keypair.json" --url devnet
done < <(find "$PROGRAMS_DIR" -name "*.so" -exec basename {} \;)

echo "Copying IDLs into generated/idl..."
mkdir -p "$GENERATED_DIR/idl" "$GENERATED_DIR/types"
cp "$IDL_DIR"/*.json "$GENERATED_DIR/idl/"

echo "Generating TypeScript types..."
for idl in "$GENERATED_DIR"/idl/*.json; do
  program_name="$(basename "$idl" .json)"
  anchor idl type "$idl" --out "$GENERATED_DIR/types/${program_name}.ts"
done

echo "Devnet deployment complete. Remember to update Anchor.toml and env files with new program IDs."
