use anchor_lang::prelude::*;

declare_id!("14Z6HF4jSdKJse3C6uL6pyodepAZojVgqcMGDARwgNFG");

#[program]
pub mod eternal_echoes {
    use super::*;

    /// Initialize an Echo Ledger for an Internet Archive video
    /// This creates the base cNFT and ledger to track collaborative echoes
    pub fn init_echo_ledger(
        ctx: Context<InitEchoLedger>,
        ia_id: String,
        grok_truth_hash: [u8; 32],
        initial_truth_score: u8,
    ) -> Result<()> {

        require!(ia_id.len() > 0 && ia_id.len() <= 64, ErrorCode::InvalidIaId);
        require!(initial_truth_score <= 100, ErrorCode::InvalidTruthScore);

        let ledger = &mut ctx.accounts.ledger;
        let clock = Clock::get()?;

        ledger.bump = ctx.bumps.ledger;
        ledger.ia_id = ia_id.clone();
        ledger.truth_hash = grok_truth_hash;
        ledger.initial_truth_score = initial_truth_score;
        ledger.current_truth_score = initial_truth_score;
        ledger.owner = ctx.accounts.minter.key();
        ledger.echo_count = 0;
        ledger.max_echoes = 100; // Keep on-chain data lean
        ledger.created_at = clock.unix_timestamp;
        ledger.last_updated = clock.unix_timestamp;

        // Emit event for indexing
        emit!(EchoInited {
            ledger: ledger.key(),
            ia_id,
            truth_score: initial_truth_score,
            owner: ctx.accounts.minter.key(),
        });

        msg!("🎬 Eternal Echo initialized! IA ID: {}, Truth Score: {}%", 
            ledger.ia_id, initial_truth_score);

        Ok(())
    }

    /// Add a new echo (text/audio layer) to the NFT
    /// Remix magic happens here!
    pub fn add_echo(
        ctx: Context<AddEcho>,
        echo_data_hash: Vec<u8>,
        echo_type: EchoType,
        grok_verified: bool,
    ) -> Result<()> {

        let ledger = &mut ctx.accounts.ledger;
        let clock = Clock::get()?;

        require!((ledger.echoes.len() as u64) < ledger.max_echoes, ErrorCode::LedgerFull);
        require!(!echo_data_hash.is_empty() && echo_data_hash.len() <= 256, ErrorCode::EchoDataTooLarge);

        // Create new echo entry
        let echo = Echo {
            id: ledger.echo_count,
            data_hash: echo_data_hash.clone(),
            echo_type,
            contributor: ctx.accounts.contributor.key(),
            timestamp: clock.unix_timestamp,
            grok_verified,
        };

        // Add to ledger
        ledger.echoes.push(echo);
        ledger.echo_count = ledger.echoes.len() as u64;
        ledger.last_updated = clock.unix_timestamp;

        // Update truth score if verified
        if grok_verified {
            ledger.current_truth_score = std::cmp::min(100, ledger.current_truth_score.saturating_add(2));
        }

        // Emit event for real-time updates
        emit!(EchoAdded {
            ledger: ledger.key(),
            echo_id: ledger.echo_count - 1,
            contributor: ctx.accounts.contributor.key(),
            verified: grok_verified,
            echo_depth: ledger.echo_count,
        });

        msg!("✨ Echo added! Depth: {}/{}, Verified: {}", 
            ledger.echo_count, ledger.max_echoes, grok_verified);

        Ok(())
    }

    /// Remove an echo (only by original contributor or owner)
    pub fn remove_echo(
        ctx: Context<RemoveEcho>,
        echo_id: u64,
    ) -> Result<()> {
        let ledger = &mut ctx.accounts.ledger;
        
        require!(echo_id < ledger.echo_count, ErrorCode::InvalidEchoId);

        // Find and verify permissions
        let echo_index = ledger.echoes.iter()
            .position(|e| e.id == echo_id)
            .ok_or(ErrorCode::InvalidEchoId)?;

        let echo = &ledger.echoes[echo_index];
        let signer = ctx.accounts.authority.key();

        require!(
            echo.contributor == signer || ledger.owner == signer,
            ErrorCode::Unauthorized
        );

        // Remove the echo and sync count with actual vec length
        ledger.echoes.remove(echo_index);
        ledger.echo_count = ledger.echoes.len() as u64;
        ledger.last_updated = Clock::get()?.unix_timestamp;

        emit!(EchoRemoved {
            ledger: ledger.key(),
            echo_id,
        });

        Ok(())
    }

    /// Update truth score after re-verification
    pub fn update_truth_score(
        ctx: Context<UpdateTruthScore>,
        new_score: u8,
        new_hash: [u8; 32],
    ) -> Result<()> {
        require!(new_score <= 100, ErrorCode::InvalidTruthScore);

        let ledger = &mut ctx.accounts.ledger;

        require!(
            ctx.accounts.authority.key() == ledger.owner,
            ErrorCode::Unauthorized
        );

        let old_score = ledger.current_truth_score;
        ledger.current_truth_score = new_score;
        ledger.truth_hash = new_hash;
        ledger.last_updated = Clock::get()?.unix_timestamp;

        emit!(TruthScoreUpdated {
            ledger: ledger.key(),
            old_score,
            new_score,
        });

        Ok(())
    }
}

// ============================================================================
// Account Structs
// ============================================================================

#[derive(Accounts)]
#[instruction(ia_id: String)]
pub struct InitEchoLedger<'info> {
    #[account(
        init,
        payer = minter,
        space = 8 + EchoLedger::INIT_SPACE,
        seeds = [b"echo_ledger", ia_id.as_bytes()],
        bump
    )]
    pub ledger: Account<'info, EchoLedger>,

    #[account(mut)]
    pub minter: Signer<'info>,

    /// CHECK: Metadata account for Bubblegum cNFT (created externally)
    #[account(mut)]
    pub metadata: UncheckedAccount<'info>,

    /// CHECK: Metaplex program for cNFT operations
    pub metadata_program: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AddEcho<'info> {
    #[account(
        mut,
        seeds = [b"echo_ledger", ledger.ia_id.as_bytes()],
        bump = ledger.bump
    )]
    pub ledger: Account<'info, EchoLedger>,

    #[account(mut)]
    pub contributor: Signer<'info>,

    /// CHECK: Minter for potential CLOUT boost
    pub minter: UncheckedAccount<'info>,

    /// CHECK: Metadata account for updates
    #[account(mut)]
    pub metadata: UncheckedAccount<'info>,

    /// CHECK: Metaplex program
    pub metadata_program: UncheckedAccount<'info>,
}

#[derive(Accounts)]
pub struct RemoveEcho<'info> {
    #[account(
        mut,
        seeds = [b"echo_ledger", ledger.ia_id.as_bytes()],
        bump = ledger.bump
    )]
    pub ledger: Account<'info, EchoLedger>,

    #[account(mut)]
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct UpdateTruthScore<'info> {
    #[account(
        mut,
        seeds = [b"echo_ledger", ledger.ia_id.as_bytes()],
        bump = ledger.bump
    )]
    pub ledger: Account<'info, EchoLedger>,

    #[account(mut)]
    pub authority: Signer<'info>,
}

// ============================================================================
// Data Structures
// ============================================================================

#[account]
#[derive(InitSpace)]
pub struct EchoLedger {
    pub bump: u8,
    #[max_len(64)]
    pub ia_id: String, // Internet Archive item ID
    pub truth_hash: [u8; 32], // SHA256 of Grok verification summary
    pub initial_truth_score: u8, // 0-100% pre-mint verification
    pub current_truth_score: u8, // Evolves with verified echoes
    pub owner: Pubkey, // Original minter
    pub echo_count: u64,
    pub max_echoes: u64,
    #[max_len(100)]
    pub echoes: Vec<Echo>, // Collaborative layers (capped at 100 for <2KB)
    pub created_at: i64,
    pub last_updated: i64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace)]
pub struct Echo {
    pub id: u64,
    #[max_len(256)]
    pub data_hash: Vec<u8>, // Hash of off-chain data (text/audio)
    pub echo_type: EchoType,
    pub contributor: Pubkey,
    pub timestamp: i64,
    pub grok_verified: bool, // Verified by Grokipedia
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, InitSpace)]
pub enum EchoType {
    Text,
    Audio,
    Annotation,
}

// ============================================================================
// Events
// ============================================================================

#[event]
pub struct EchoInited {
    pub ledger: Pubkey,
    pub ia_id: String,
    pub truth_score: u8,
    pub owner: Pubkey,
}

#[event]
pub struct EchoAdded {
    pub ledger: Pubkey,
    pub echo_id: u64,
    pub contributor: Pubkey,
    pub verified: bool,
    pub echo_depth: u64,
}

#[event]
pub struct EchoRemoved {
    pub ledger: Pubkey,
    pub echo_id: u64,
}

#[event]
pub struct TruthScoreUpdated {
    pub ledger: Pubkey,
    pub old_score: u8,
    pub new_score: u8,
}

// ============================================================================
// Error Codes
// ============================================================================

#[error_code]
pub enum ErrorCode {
    #[msg("Internet Archive ID must be 1-64 characters")]
    InvalidIaId,
    #[msg("Truth score must be 0-100")]
    InvalidTruthScore,
    #[msg("Echo ledger is full (max 100 echoes)")]
    LedgerFull,
    #[msg("Echo data hash too large (max 256 bytes)")]
    EchoDataTooLarge,
    #[msg("Invalid echo ID")]
    InvalidEchoId,
    #[msg("Unauthorized: Only contributor or owner can perform this action")]
    Unauthorized,
}
