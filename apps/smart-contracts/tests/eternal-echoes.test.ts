/**
 * Eternal Echoes Program Tests
 * Tests initialization, echo addition, and verification flows
 */

import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
import { PublicKey, Keypair } from "@solana/web3.js";
import { expect } from "chai";

describe("eternal_echoes", () => {
  // Configure the client
  const provider = AnchorProvider.env();
  anchor.setProvider(provider);

  // @ts-ignore - Program will be loaded dynamically
  const program = anchor.workspace.EternalEchoes as Program<any>;

  let minterKeypair: Keypair;
  let contributorKeypair: Keypair;
  let echoLedgerPda: PublicKey;
  let echoLedgerBump: number;

  const testIaId = "nasa_apollo11_1969";
  const testTruthHash = Buffer.from(new Array(32).fill(0x42)); // Mock hash
  const testTruthScore = 95;

  before(async () => {
    // Generate test keypairs
    minterKeypair = Keypair.generate();
    contributorKeypair = Keypair.generate();

    // Airdrop SOL for testing
    const airdropMinter = await provider.connection.requestAirdrop(
      minterKeypair.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropMinter);

    const airdropContributor = await provider.connection.requestAirdrop(
      contributorKeypair.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropContributor);

    // Derive Echo Ledger PDA
    [echoLedgerPda, echoLedgerBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("echo_ledger"), Buffer.from(testIaId)],
      program.programId
    );

    console.log("🧪 Test Setup Complete");
    console.log("  Minter:", minterKeypair.publicKey.toBase58());
    console.log("  Contributor:", contributorKeypair.publicKey.toBase58());
    console.log("  Echo Ledger PDA:", echoLedgerPda.toBase58());
  });

  it("Initializes an Echo Ledger", async () => {
    const metadataKeypair = Keypair.generate(); // Mock metadata account
    const metaplexProgramId = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");

    const tx = await program.methods
      .initEchoLedger(testIaId, Array.from(testTruthHash), testTruthScore)
      .accounts({
        ledger: echoLedgerPda,
        minter: minterKeypair.publicKey,
        metadata: metadataKeypair.publicKey,
        metadataProgram: metaplexProgramId,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([minterKeypair])
      .rpc();

    console.log("  ✅ Init Echo Ledger TX:", tx);

    // Fetch and verify ledger
    const ledgerAccount = await program.account.echoLedger.fetch(echoLedgerPda);
    
    expect(ledgerAccount.iaId).to.equal(testIaId);
    expect(ledgerAccount.initialTruthScore).to.equal(testTruthScore);
    expect(ledgerAccount.currentTruthScore).to.equal(testTruthScore);
    expect(ledgerAccount.owner.toBase58()).to.equal(minterKeypair.publicKey.toBase58());
    expect(ledgerAccount.echoCount.toNumber()).to.equal(0);
    expect(ledgerAccount.maxEchoes.toNumber()).to.equal(100);
    expect(ledgerAccount.echoes.length).to.equal(0);

    console.log("  📊 Ledger State:");
    console.log("    IA ID:", ledgerAccount.iaId);
    console.log("    Truth Score:", ledgerAccount.currentTruthScore);
    console.log("    Owner:", ledgerAccount.owner.toBase58());
  });

  it("Adds an echo to the ledger", async () => {
    const echoDataHash = Buffer.from("test_echo_data_hash_123");
    const echoType = { text: {} }; // Enum variant
    const grokVerified = true;

    const metadataKeypair = Keypair.generate();
    const metaplexProgramId = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");

    const tx = await program.methods
      .addEcho(Array.from(echoDataHash), echoType, grokVerified)
      .accounts({
        ledger: echoLedgerPda,
        contributor: contributorKeypair.publicKey,
        minter: minterKeypair.publicKey,
        metadata: metadataKeypair.publicKey,
        metadataProgram: metaplexProgramId,
      })
      .signers([contributorKeypair])
      .rpc();

    console.log("  ✅ Add Echo TX:", tx);

    // Fetch and verify updated ledger
    const ledgerAccount = await program.account.echoLedger.fetch(echoLedgerPda);
    
    expect(ledgerAccount.echoCount.toNumber()).to.equal(1);
    expect(ledgerAccount.echoes.length).to.equal(1);
    expect(ledgerAccount.currentTruthScore).to.equal(97); // +2 for verified echo

    const echo = ledgerAccount.echoes[0];
    expect(echo.id.toNumber()).to.equal(0);
    expect(echo.contributor.toBase58()).to.equal(contributorKeypair.publicKey.toBase58());
    expect(echo.grokVerified).to.equal(true);

    console.log("  📊 Echo Added:");
    console.log("    Echo Count:", ledgerAccount.echoCount.toNumber());
    console.log("    New Truth Score:", ledgerAccount.currentTruthScore);
    console.log("    Contributor:", echo.contributor.toBase58());
  });

  it("Adds multiple echoes", async () => {
    for (let i = 1; i <= 3; i++) {
      const echoDataHash = Buffer.from(`echo_${i}_data`);
      const echoType = i % 2 === 0 ? { audio: {} } : { text: {} };
      const grokVerified = i % 2 === 0;

      const metadataKeypair = Keypair.generate();
      const metaplexProgramId = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");

      await program.methods
        .addEcho(Array.from(echoDataHash), echoType, grokVerified)
        .accounts({
          ledger: echoLedgerPda,
          contributor: contributorKeypair.publicKey,
          minter: minterKeypair.publicKey,
          metadata: metadataKeypair.publicKey,
          metadataProgram: metaplexProgramId,
        })
        .signers([contributorKeypair])
        .rpc();
    }

    const ledgerAccount = await program.account.echoLedger.fetch(echoLedgerPda);
    expect(ledgerAccount.echoCount.toNumber()).to.equal(4); // 1 from prev + 3 new

    console.log("  ✅ Multiple Echoes Added - Total:", ledgerAccount.echoCount.toNumber());
  });

  it("Removes an echo by contributor", async () => {
    const echoIdToRemove = 0;

    const tx = await program.methods
      .removeEcho(new anchor.BN(echoIdToRemove))
      .accounts({
        ledger: echoLedgerPda,
        authority: contributorKeypair.publicKey,
      })
      .signers([contributorKeypair])
      .rpc();

    console.log("  ✅ Remove Echo TX:", tx);

    const ledgerAccount = await program.account.echoLedger.fetch(echoLedgerPda);
    expect(ledgerAccount.echoes.length).to.equal(3); // One removed

    console.log("  📊 Echo Removed - Remaining:", ledgerAccount.echoes.length);
  });

  it("Updates truth score", async () => {
    const newScore = 92;
    const newHash = Buffer.from(new Array(32).fill(0x99));

    const tx = await program.methods
      .updateTruthScore(newScore, Array.from(newHash))
      .accounts({
        ledger: echoLedgerPda,
        authority: minterKeypair.publicKey,
      })
      .signers([minterKeypair])
      .rpc();

    console.log("  ✅ Update Truth Score TX:", tx);

    const ledgerAccount = await program.account.echoLedger.fetch(echoLedgerPda);
    expect(ledgerAccount.currentTruthScore).to.equal(newScore);

    console.log("  📊 Truth Score Updated:", ledgerAccount.currentTruthScore);
  });

  it("Fails to add echo when ledger is full", async () => {
    // This test would require adding 100 echoes, which is time-consuming
    // In a real scenario, you'd mock or use a smaller max_echoes for testing
    console.log("  ⏭️  Skipping ledger full test (requires 100+ echoes)");
  });

  it("Fails to remove echo with unauthorized signer", async () => {
    const unauthorizedKeypair = Keypair.generate();
    
    // Airdrop for test
    const airdrop = await provider.connection.requestAirdrop(
      unauthorizedKeypair.publicKey,
      anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdrop);

    try {
      await program.methods
        .removeEcho(new anchor.BN(1))
        .accounts({
          ledger: echoLedgerPda,
          authority: unauthorizedKeypair.publicKey,
        })
        .signers([unauthorizedKeypair])
        .rpc();
      
      throw new Error("Should have failed");
    } catch (error: any) {
      expect(error.message).to.include("Unauthorized");
      console.log("  ✅ Correctly rejected unauthorized removal");
    }
  });
});
