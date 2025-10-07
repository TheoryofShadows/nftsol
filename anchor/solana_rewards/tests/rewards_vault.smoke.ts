import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
// Placeholder type import – will exist once we run anchor client generation.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { RewardsVault } from '../generated/types/rewards_vault';

describe('rewards_vault smoke test', () => {
  const provider = anchor.AnchorProvider.local();
  anchor.setProvider(provider);

  const program = anchor.workspace.RewardsVault as Program<RewardsVault>;

  it('prints vault PDA for manual verification', async () => {
    const rewardMint = anchor.web3.Keypair.generate();
    const [vaultConfig] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from('vault'), rewardMint.publicKey.toBuffer()],
      program.programId,
    );

    console.log('Vault config PDA', vaultConfig.toBase58());
    // Follow-up: once helper utilities to create the mint exist, assert the
    // initialize_vault instruction succeeds.
  });
});
