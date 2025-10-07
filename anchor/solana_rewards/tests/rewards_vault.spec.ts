import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
// @ts-ignore - generated after running anchor build --ts
import { RewardsVault } from '../generated/types/rewards_vault';
import {
  Keypair,\n  PublicKey,\n  SystemProgram,\n  Transaction,\n  TransactionInstruction,\n  SYSVAR_RENT_PUBKEY,
} from '@solana/web3.js';

const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey('ATokenGPvR93dTqTRwpebEWBzZ7z7bP1PkHphnCwW1ns');

function createInitializeMintInstruction(
  mint: PublicKey,
  decimals: number,
  mintAuthority: PublicKey,
): TransactionInstruction {
  const data = Buffer.alloc(1 + 1 + 32 + 1);\n  data.writeUInt8(0, 0); // InitializeMint tag\n  data.writeUInt8(decimals, 1);\n  mintAuthority.toBuffer().copy(data, 2);\n  data.writeUInt8(0, 34); // no freeze authority\n  return new TransactionInstruction({\n    programId: TOKEN_PROGRAM_ID,\n    keys: [\n      { pubkey: mint, isSigner: false, isWritable: true },\n      { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },\n    ],\n    data,\n  });
}

function createAssociatedTokenAccountInstruction(
  payer: PublicKey,
  ata: PublicKey,
  owner: PublicKey,
  mint: PublicKey,
): TransactionInstruction {
  return new TransactionInstruction({
    programId: ASSOCIATED_TOKEN_PROGRAM_ID,
    keys: [
      { pubkey: payer, isSigner: true, isWritable: true },
      { pubkey: ata, isSigner: false, isWritable: true },
      { pubkey: owner, isSigner: false, isWritable: false },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
    ],
    data: Buffer.alloc(0),
  });
}

function readTokenAmount(accountData: Buffer): bigint {
  return accountData.readBigUInt64LE(64);
}

describe('rewards_vault program', () => {
  const provider = anchor.AnchorProvider.local();
  anchor.setProvider(provider);

  const program = anchor.workspace.RewardsVault as Program<RewardsVault>;
  const connection = provider.connection;
  const wallet = provider.wallet as anchor.Wallet;

  it('initializes vault and mints rewards', async () => {
    const airdropSig = await connection.requestAirdrop(
      wallet.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL,
    );
    await connection.confirmTransaction(airdropSig);

    const rewardMint = Keypair.generate();
    const mintRent = await connection.getMinimumBalanceForRentExemption(82);

    const createMintTx = new Transaction().add(
      SystemProgram.createAccount({
        fromPubkey: wallet.publicKey,
        newAccountPubkey: rewardMint.publicKey,
        lamports: mintRent,
        space: 82,
        programId: TOKEN_PROGRAM_ID,
      }),
      createInitializeMintInstruction(rewardMint.publicKey, 9, wallet.publicKey),
    );
    await provider.sendAndConfirm(createMintTx, [rewardMint]);

    const [vaultConfig, configBump] = PublicKey.findProgramAddressSync(
      [Buffer.from('vault-config'), rewardMint.publicKey.toBuffer()],
      program.programId,
    );
    const [vaultSigner, signerBump] = PublicKey.findProgramAddressSync(
      [Buffer.from('vault-signer'), rewardMint.publicKey.toBuffer()],
      program.programId,
    );

    const ata = PublicKey.findProgramAddressSync(
      [wallet.publicKey.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), rewardMint.publicKey.toBuffer()],
      ASSOCIATED_TOKEN_PROGRAM_ID,
    )[0];
    const createAtaIx = createAssociatedTokenAccountInstruction(
      wallet.publicKey,
      ata,
      wallet.publicKey,
      rewardMint.publicKey,
    );
    await provider.sendAndConfirm(new Transaction().add(createAtaIx));

    await program.methods
      .initializeVault(configBump, signerBump)
      .accounts({
        vaultConfig,
        vaultSigner,
        rewardMint: rewardMint.publicKey,
        authority: wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    await program.methods
      .setEmissionRate(new anchor.BN(1_000))
      .accounts({
        vaultConfig,
        authority: wallet.publicKey,
      })
      .rpc();

    const mintAmount = new anchor.BN(5_000);
    await program.methods
      .mintRewards(mintAmount)
      .accounts({
        vaultConfig,
        vaultSigner,
        rewardMint: rewardMint.publicKey,
        recipient: ata,
        authority: wallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    const tokenAccount = await connection.getAccountInfo(ata);
    if (!tokenAccount) {
      throw new Error('Failed to fetch token account');
    }
    const balance = readTokenAmount(tokenAccount.data);
    if (balance !== mintAmount.toBigInt()) {
      throw new Error(`Unexpected reward balance ${balance.toString()}`);
    }
  });
});


