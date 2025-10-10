import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
// @ts-ignore - generated after running anchor build --ts
import { RewardsVault } from '../generated/types/rewards_vault';
import {
  TOKEN_PROGRAM_ID,
  createInitializeMintInstruction,
  getAccount,
  getMinimumBalanceForRentExemptMint,
  createAssociatedTokenAccountInstruction,
} from '@solana/spl-token';
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';

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
    const mintRent = await getMinimumBalanceForRentExemptMint(connection);

    const createMintTx = new Transaction().add(
      SystemProgram.createAccount({
        fromPubkey: wallet.publicKey,
        newAccountPubkey: rewardMint.publicKey,
        lamports: mintRent,
        space: 82,
        programId: TOKEN_PROGRAM_ID,
      }),
      createInitializeMintInstruction(rewardMint.publicKey, 9, wallet.publicKey, null),
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
      new PublicKey('ATokenGPvR93dTqTRwpebEWBzZ7z7bP1PkHphnCwW1ns'),
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

    const tokenAccount = await getAccount(connection, ata);
    if (tokenAccount.amount.toString() !== mintAmount.toString()) {
      throw new Error(`Unexpected reward balance ${tokenAccount.amount.toString()}`);
    }
  });
});
