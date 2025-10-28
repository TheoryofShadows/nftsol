use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Mint};
use solana_program::compute_budget;

declare_id!("GvnmNTy8XJ3c2d4K9vR7wE1sP5qA8bC2fH6jL9mN3pQ7");

#[program]
pub mod governance {
    use super::*;

    /// Initialize governance configuration
    pub fn initialize_governance(
        ctx: Context<InitializeGovernance>,
        proposal_threshold: u64,
        voting_period: i64,
        quorum_percentage: u8,
    ) -> Result<()> {
        // Set compute unit limit for governance initialization
        compute_budget::set_compute_unit_limit(80_000);
        
        let governance = &mut ctx.accounts.governance;
        let clock = Clock::get()?;

        governance.bump = ctx.bumps.governance;
        governance.authority = ctx.accounts.authority.key();
        governance.token_mint = ctx.accounts.token_mint.key();
        governance.proposal_threshold = proposal_threshold;
        governance.voting_period = voting_period;
        governance.quorum_percentage = quorum_percentage;
        governance.total_proposals = 0;
        governance.active_proposals = 0;
        governance.created_at = clock.unix_timestamp;

        require!(proposal_threshold > 0, ErrorCode::InvalidProposalThreshold);
        require!(voting_period > 0, ErrorCode::InvalidVotingPeriod);
        require!(quorum_percentage > 0 && quorum_percentage <= 100, ErrorCode::InvalidQuorumPercentage);

        Ok(())
    }

    /// Create a new governance proposal
    pub fn create_proposal(
        ctx: Context<CreateProposal>,
        title: String,
        description: String,
        proposal_type: ProposalType,
        target_program: Option<Pubkey>,
    ) -> Result<()> {
        // Set compute unit limit for proposal creation
        compute_budget::set_compute_unit_limit(100_000);
        
        let proposal = &mut ctx.accounts.proposal;
        let governance = &mut ctx.accounts.governance;
        let proposer_vault = &ctx.accounts.proposer_vault;
        let clock = Clock::get()?;

        // Check if proposer has enough tokens
        require!(
            proposer_vault.amount >= governance.proposal_threshold,
            ErrorCode::InsufficientTokensForProposal
        );

        proposal.bump = ctx.bumps.proposal;
        proposal.governance = governance.key();
        proposal.proposer = ctx.accounts.proposer.key();
        proposal.title = title;
        proposal.description = description;
        proposal.proposal_type = proposal_type;
        proposal.target_program = target_program;
        proposal.status = ProposalStatus::Active;
        proposal.votes_for = 0;
        proposal.votes_against = 0;
        proposal.total_votes = 0;
        proposal.created_at = clock.unix_timestamp;
        proposal.voting_ends_at = clock.unix_timestamp + governance.voting_period;
        proposal.executed_at = 0;

        // Update governance stats
        governance.total_proposals = governance.total_proposals.checked_add(1).ok_or(ErrorCode::MathOverflow)?;
        governance.active_proposals = governance.active_proposals.checked_add(1).ok_or(ErrorCode::MathOverflow)?;

        // Emit event
        emit!(ProposalCreated {
            proposal: proposal.key(),
            proposer: proposal.proposer,
            title: proposal.title.clone(),
            proposal_type,
            voting_ends_at: proposal.voting_ends_at,
        });

        Ok(())
    }

    /// Vote on a proposal
    pub fn vote(
        ctx: Context<Vote>,
        vote_choice: VoteChoice,
        voting_power: u64,
    ) -> Result<()> {
        // Set compute unit limit for voting
        compute_budget::set_compute_unit_limit(90_000);
        
        let proposal = &mut ctx.accounts.proposal;
        let vote_record = &mut ctx.accounts.vote_record;
        let voter_vault = &ctx.accounts.voter_vault;
        let clock = Clock::get()?;

        // Check if proposal is still active
        require!(proposal.status == ProposalStatus::Active, ErrorCode::ProposalNotActive);
        require!(clock.unix_timestamp <= proposal.voting_ends_at, ErrorCode::VotingPeriodEnded);

        // Check if voter has enough tokens
        require!(voter_vault.amount >= voting_power, ErrorCode::InsufficientVotingPower);

        // Initialize vote record if it doesn't exist
        if vote_record.voting_power == 0 {
            vote_record.bump = ctx.bumps.vote_record;
            vote_record.proposal = proposal.key();
            vote_record.voter = ctx.accounts.voter.key();
            vote_record.voting_power = 0;
            vote_record.vote_choice = VoteChoice::Abstain;
        } else {
            // Remove previous vote from totals
            match vote_record.vote_choice {
                VoteChoice::For => {
                    proposal.votes_for = proposal.votes_for.checked_sub(vote_record.voting_power).ok_or(ErrorCode::MathOverflow)?;
                }
                VoteChoice::Against => {
                    proposal.votes_against = proposal.votes_against.checked_sub(vote_record.voting_power).ok_or(ErrorCode::MathOverflow)?;
                }
                VoteChoice::Abstain => {}
            }
        }

        // Update vote record
        vote_record.voting_power = voting_power;
        vote_record.vote_choice = vote_choice;

        // Update proposal totals
        match vote_choice {
            VoteChoice::For => {
                proposal.votes_for = proposal.votes_for.checked_add(voting_power).ok_or(ErrorCode::MathOverflow)?;
            }
            VoteChoice::Against => {
                proposal.votes_against = proposal.votes_against.checked_add(voting_power).ok_or(ErrorCode::MathOverflow)?;
            }
            VoteChoice::Abstain => {}
        }

        proposal.total_votes = proposal.votes_for.checked_add(proposal.votes_against).ok_or(ErrorCode::MathOverflow)?;

        // Emit event
        emit!(VoteCast {
            proposal: proposal.key(),
            voter: ctx.accounts.voter.key(),
            vote_choice,
            voting_power,
        });

        Ok(())
    }

    /// Execute a successful proposal
    pub fn execute_proposal(ctx: Context<ExecuteProposal>) -> Result<()> {
        // Set compute unit limit for proposal execution
        compute_budget::set_compute_unit_limit(120_000);
        
        let proposal = &mut ctx.accounts.proposal;
        let governance = &mut ctx.accounts.governance;
        let clock = Clock::get()?;

        // Check if proposal is ready for execution
        require!(proposal.status == ProposalStatus::Active, ErrorCode::ProposalNotActive);
        require!(clock.unix_timestamp > proposal.voting_ends_at, ErrorCode::VotingPeriodNotEnded);

        // Check if proposal passed
        let total_votes = proposal.votes_for.checked_add(proposal.votes_against).ok_or(ErrorCode::MathOverflow)?;
        let quorum_threshold = (total_votes * governance.quorum_percentage as u64) / 100;
        
        require!(total_votes >= quorum_threshold, ErrorCode::QuorumNotMet);
        require!(proposal.votes_for > proposal.votes_against, ErrorCode::ProposalNotPassed);

        // Update proposal status
        proposal.status = ProposalStatus::Executed;
        proposal.executed_at = clock.unix_timestamp;

        // Update governance stats
        governance.active_proposals = governance.active_proposals.checked_sub(1).ok_or(ErrorCode::MathOverflow)?;

        // Emit event
        emit!(ProposalExecuted {
            proposal: proposal.key(),
            executed_at: proposal.executed_at,
        });

        Ok(())
    }

    /// Cancel a proposal (only by proposer or governance authority)
    pub fn cancel_proposal(ctx: Context<CancelProposal>, reason: String) -> Result<()> {
        // Set compute unit limit for proposal cancellation
        compute_budget::set_compute_unit_limit(70_000);
        
        let proposal = &mut ctx.accounts.proposal;
        let governance = &mut ctx.accounts.governance;
        let clock = Clock::get()?;

        // Check if proposal can be cancelled
        require!(proposal.status == ProposalStatus::Active, ErrorCode::ProposalNotActive);
        require!(
            ctx.accounts.canceller.key() == proposal.proposer || 
            ctx.accounts.canceller.key() == governance.authority,
            ErrorCode::UnauthorizedCancellation
        );

        // Update proposal status
        proposal.status = ProposalStatus::Cancelled;
        proposal.cancelled_at = clock.unix_timestamp;
        proposal.cancellation_reason = reason;

        // Update governance stats
        governance.active_proposals = governance.active_proposals.checked_sub(1).ok_or(ErrorCode::MathOverflow)?;

        // Emit event
        emit!(ProposalCancelled {
            proposal: proposal.key(),
            cancelled_by: ctx.accounts.canceller.key(),
            reason: proposal.cancellation_reason.clone(),
        });

        Ok(())
    }

    // ===== GENESIS PROTOCOL FAIR LAUNCH FUNCTIONS =====

    /// Create a fair launch campaign
    pub fn create_fair_launch(
        ctx: Context<CreateFairLaunch>,
        launch_config: FairLaunchConfig,
    ) -> Result<()> {
        // Set compute unit limit for fair launch creation
        compute_budget::set_compute_unit_limit(120_000);
        
        let fair_launch = &mut ctx.accounts.fair_launch;
        let clock = Clock::get()?;

        fair_launch.bump = ctx.bumps.fair_launch;
        fair_launch.authority = ctx.accounts.authority.key();
        fair_launch.token_mint = ctx.accounts.token_mint.key();
        fair_launch.treasury = ctx.accounts.treasury.key();
        fair_launch.config = launch_config;
        fair_launch.status = FairLaunchStatus::Active;
        fair_launch.total_participants = 0;
        fair_launch.total_allocated = 0;
        fair_launch.created_at = clock.unix_timestamp;
        fair_launch.start_time = clock.unix_timestamp + launch_config.delay_seconds;
        fair_launch.end_time = clock.unix_timestamp + launch_config.delay_seconds + launch_config.duration_seconds;

        // Validate launch configuration
        require!(launch_config.max_allocation > 0, ErrorCode::InvalidMaxAllocation);
        require!(launch_config.min_allocation > 0, ErrorCode::InvalidMinAllocation);
        require!(launch_config.max_allocation >= launch_config.min_allocation, ErrorCode::InvalidAllocationRange);
        require!(launch_config.duration_seconds > 0, ErrorCode::InvalidDuration);
        require!(launch_config.whitelist_root.len() == 32, ErrorCode::InvalidWhitelistRoot);

        emit!(FairLaunchCreated {
            fair_launch: ctx.accounts.fair_launch.key(),
            authority: ctx.accounts.authority.key(),
            token_mint: ctx.accounts.token_mint.key(),
            start_time: fair_launch.start_time,
            end_time: fair_launch.end_time,
        });

        Ok(())
    }

    /// Participate in fair launch (claim allocation)
    pub fn participate_fair_launch(
        ctx: Context<ParticipateFairLaunch>,
        amount: u64,
        merkle_proof: Vec<[u8; 32]>,
    ) -> Result<()> {
        // Set compute unit limit for participation
        compute_budget::set_compute_unit_limit(150_000);
        
        let fair_launch = &mut ctx.accounts.fair_launch;
        let participant = &mut ctx.accounts.participant;
        let clock = Clock::get()?;

        // Validate launch is active and within time window
        require!(fair_launch.status == FairLaunchStatus::Active, ErrorCode::FairLaunchNotActive);
        require!(clock.unix_timestamp >= fair_launch.start_time, ErrorCode::FairLaunchNotStarted);
        require!(clock.unix_timestamp <= fair_launch.end_time, ErrorCode::FairLaunchEnded);

        // Validate allocation amount
        require!(amount >= fair_launch.config.min_allocation, ErrorCode::AllocationTooSmall);
        require!(amount <= fair_launch.config.max_allocation, ErrorCode::AllocationTooLarge);
        require!(fair_launch.total_allocated + amount <= fair_launch.config.total_supply, ErrorCode::InsufficientSupply);

        // Verify merkle proof for whitelist
        let leaf = hash_participant_data(ctx.accounts.participant_wallet.key(), amount);
        require!(verify_merkle_proof(&fair_launch.config.whitelist_root, &leaf, &merkle_proof), ErrorCode::InvalidMerkleProof);

        // Check if participant already participated
        require!(participant.amount_allocated == 0, ErrorCode::AlreadyParticipated);

        // Update participant data
        participant.bump = ctx.bumps.participant;
        participant.fair_launch = ctx.accounts.fair_launch.key();
        participant.wallet = ctx.accounts.participant_wallet.key();
        participant.amount_allocated = amount;
        participant.participated_at = clock.unix_timestamp;

        // Update fair launch totals
        fair_launch.total_participants = fair_launch.total_participants.saturating_add(1);
        fair_launch.total_allocated = fair_launch.total_allocated.saturating_add(amount);

        emit!(FairLaunchParticipated {
            fair_launch: ctx.accounts.fair_launch.key(),
            participant: ctx.accounts.participant_wallet.key(),
            amount_allocated: amount,
            participated_at: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Finalize fair launch and distribute tokens
    pub fn finalize_fair_launch(
        ctx: Context<FinalizeFairLaunch>,
    ) -> Result<()> {
        // Set compute unit limit for finalization
        compute_budget::set_compute_unit_limit(200_000);
        
        let fair_launch = &mut ctx.accounts.fair_launch;
        let clock = Clock::get()?;

        // Validate launch can be finalized
        require!(fair_launch.status == FairLaunchStatus::Active, ErrorCode::FairLaunchNotActive);
        require!(clock.unix_timestamp > fair_launch.end_time, ErrorCode::FairLaunchNotEnded);

        // Update status
        fair_launch.status = FairLaunchStatus::Finalized;
        fair_launch.finalized_at = clock.unix_timestamp;

        emit!(FairLaunchFinalized {
            fair_launch: ctx.accounts.fair_launch.key(),
            total_participants: fair_launch.total_participants,
            total_allocated: fair_launch.total_allocated,
            finalized_at: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Claim tokens after fair launch finalization
    pub fn claim_tokens(
        ctx: Context<ClaimTokens>,
    ) -> Result<()> {
        // Set compute unit limit for token claiming
        compute_budget::set_compute_unit_limit(100_000);
        
        let fair_launch = &ctx.accounts.fair_launch;
        let participant = &mut ctx.accounts.participant;

        // Validate fair launch is finalized
        require!(fair_launch.status == FairLaunchStatus::Finalized, ErrorCode::FairLaunchNotFinalized);
        require!(participant.amount_allocated > 0, ErrorCode::NoAllocation);
        require!(participant.tokens_claimed == 0, ErrorCode::TokensAlreadyClaimed);

        // Transfer tokens to participant
        let transfer_instruction = anchor_spl::token::Transfer {
            from: ctx.accounts.treasury_token_account.to_account_info(),
            to: ctx.accounts.participant_token_account.to_account_info(),
            authority: ctx.accounts.treasury.to_account_info(),
        };

        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            transfer_instruction,
        );

        anchor_spl::token::transfer(cpi_ctx, participant.amount_allocated)?;

        // Update participant data
        participant.tokens_claimed = participant.amount_allocated;
        participant.claimed_at = Clock::get()?.unix_timestamp;

        emit!(TokensClaimed {
            fair_launch: ctx.accounts.fair_launch.key(),
            participant: ctx.accounts.participant_wallet.key(),
            amount_claimed: participant.amount_allocated,
            claimed_at: participant.claimed_at,
        });

        Ok(())
    }

#[derive(Accounts)]
pub struct InitializeGovernance<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Governance::INIT_SPACE,
        seeds = [b"governance", token_mint.key().as_ref()],
        bump
    )]
    pub governance: Account<'info, Governance>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub token_mint: Account<'info, Mint>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateProposal<'info> {
    #[account(mut)]
    pub governance: Account<'info, Governance>,

    #[account(
        init,
        payer = proposer,
        space = 8 + Proposal::INIT_SPACE,
        seeds = [b"proposal", governance.key().as_ref(), &governance.total_proposals.to_le_bytes()],
        bump
    )]
    pub proposal: Account<'info, Proposal>,

    #[account(mut)]
    pub proposer: Signer<'info>,

    #[account(
        mut,
        constraint = proposer_vault.owner == proposer.key(),
        constraint = proposer_vault.mint == governance.token_mint
    )]
    pub proposer_vault: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Vote<'info> {
    #[account(mut)]
    pub proposal: Account<'info, Proposal>,

    #[account(
        init_if_needed,
        payer = voter,
        space = 8 + VoteRecord::INIT_SPACE,
        seeds = [b"vote", proposal.key().as_ref(), voter.key().as_ref()],
        bump
    )]
    pub vote_record: Account<'info, VoteRecord>,

    #[account(mut)]
    pub voter: Signer<'info>,

    #[account(
        mut,
        constraint = voter_vault.owner == voter.key(),
        constraint = voter_vault.mint == proposal.governance.token_mint
    )]
    pub voter_vault: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ExecuteProposal<'info> {
    #[account(mut)]
    pub governance: Account<'info, Governance>,

    #[account(mut)]
    pub proposal: Account<'info, Proposal>,

    pub executor: Signer<'info>,
}

#[derive(Accounts)]
pub struct CancelProposal<'info> {
    #[account(mut)]
    pub governance: Account<'info, Governance>,

    #[account(mut)]
    pub proposal: Account<'info, Proposal>,

    pub canceller: Signer<'info>,
}

// ===== GENESIS PROTOCOL ACCOUNT STRUCTS =====

#[derive(Accounts)]
pub struct CreateFairLaunch<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + FairLaunch::INIT_SPACE,
        seeds = [b"fair_launch", token_mint.key().as_ref(), &Clock::get()?.unix_timestamp.to_le_bytes()],
        bump
    )]
    pub fair_launch: Account<'info, FairLaunch>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub token_mint: Account<'info, Mint>,

    /// CHECK: Treasury account for token distribution
    #[account(mut)]
    pub treasury: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ParticipateFairLaunch<'info> {
    #[account(mut)]
    pub fair_launch: Account<'info, FairLaunch>,

    #[account(
        init,
        payer = participant_wallet,
        space = 8 + Participant::INIT_SPACE,
        seeds = [b"participant", fair_launch.key().as_ref(), participant_wallet.key().as_ref()],
        bump
    )]
    pub participant: Account<'info, Participant>,

    /// CHECK: Participant wallet
    pub participant_wallet: UncheckedAccount<'info>,

    #[account(mut)]
    pub participant_signer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct FinalizeFairLaunch<'info> {
    #[account(mut)]
    pub fair_launch: Account<'info, FairLaunch>,

    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct ClaimTokens<'info> {
    #[account(mut)]
    pub fair_launch: Account<'info, FairLaunch>,

    #[account(mut)]
    pub participant: Account<'info, Participant>,

    /// CHECK: Participant wallet
    pub participant_wallet: UncheckedAccount<'info>,

    #[account(mut)]
    pub participant_signer: Signer<'info>,

    #[account(
        mut,
        constraint = treasury_token_account.owner == fair_launch.treasury,
        constraint = treasury_token_account.mint == fair_launch.token_mint
    )]
    pub treasury_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = participant_token_account.owner == participant_wallet.key(),
        constraint = participant_token_account.mint == fair_launch.token_mint
    )]
    pub participant_token_account: Account<'info, TokenAccount>,

    /// CHECK: Treasury authority
    pub treasury: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
}

#[account]
#[derive(InitSpace)]
pub struct Governance {
    pub bump: u8,
    pub authority: Pubkey,
    pub token_mint: Pubkey,
    pub proposal_threshold: u64,
    pub voting_period: i64,
    pub quorum_percentage: u8,
    pub total_proposals: u64,
    pub active_proposals: u64,
    pub created_at: i64,
}

#[account]
#[derive(InitSpace)]
pub struct Proposal {
    pub bump: u8,
    pub governance: Pubkey,
    pub proposer: Pubkey,
    pub title: String,
    pub description: String,
    pub proposal_type: ProposalType,
    pub target_program: Option<Pubkey>,
    pub status: ProposalStatus,
    pub votes_for: u64,
    pub votes_against: u64,
    pub total_votes: u64,
    pub created_at: i64,
    pub voting_ends_at: i64,
    pub executed_at: i64,
    pub cancelled_at: i64,
    pub cancellation_reason: String,
}

#[account]
#[derive(InitSpace)]
pub struct VoteRecord {
    pub bump: u8,
    pub proposal: Pubkey,
    pub voter: Pubkey,
    pub voting_power: u64,
    pub vote_choice: VoteChoice,
}

// ===== GENESIS PROTOCOL DATA STRUCTURES =====

#[account]
#[derive(InitSpace)]
pub struct FairLaunch {
    pub bump: u8,
    pub authority: Pubkey,
    pub token_mint: Pubkey,
    pub treasury: Pubkey,
    pub config: FairLaunchConfig,
    pub status: FairLaunchStatus,
    pub total_participants: u64,
    pub total_allocated: u64,
    pub created_at: i64,
    pub start_time: i64,
    pub end_time: i64,
    pub finalized_at: i64,
}

#[account]
#[derive(InitSpace)]
pub struct Participant {
    pub bump: u8,
    pub fair_launch: Pubkey,
    pub wallet: Pubkey,
    pub amount_allocated: u64,
    pub tokens_claimed: u64,
    pub participated_at: i64,
    pub claimed_at: i64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, InitSpace)]
pub struct FairLaunchConfig {
    pub total_supply: u64,
    pub min_allocation: u64,
    pub max_allocation: u64,
    pub delay_seconds: i64,
    pub duration_seconds: i64,
    pub whitelist_root: [u8; 32],
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, InitSpace)]
pub enum FairLaunchStatus {
    Active,
    Finalized,
    Cancelled,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, InitSpace)]
pub enum ProposalType {
    ParameterChange,
    ProgramUpgrade,
    TreasuryWithdrawal,
    GovernanceChange,
    EmergencyAction,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, InitSpace)]
pub enum ProposalStatus {
    Active,
    Executed,
    Cancelled,
    Expired,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, InitSpace)]
pub enum VoteChoice {
    For,
    Against,
    Abstain,
}

#[event]
pub struct ProposalCreated {
    pub proposal: Pubkey,
    pub proposer: Pubkey,
    pub title: String,
    pub proposal_type: ProposalType,
    pub voting_ends_at: i64,
}

#[event]
pub struct VoteCast {
    pub proposal: Pubkey,
    pub voter: Pubkey,
    pub vote_choice: VoteChoice,
    pub voting_power: u64,
}

#[event]
pub struct ProposalExecuted {
    pub proposal: Pubkey,
    pub executed_at: i64,
}

#[event]
pub struct ProposalCancelled {
    pub proposal: Pubkey,
    pub cancelled_by: Pubkey,
    pub reason: String,
}

// ===== GENESIS PROTOCOL EVENTS =====

#[event]
pub struct FairLaunchCreated {
    pub fair_launch: Pubkey,
    pub authority: Pubkey,
    pub token_mint: Pubkey,
    pub start_time: i64,
    pub end_time: i64,
}

#[event]
pub struct FairLaunchParticipated {
    pub fair_launch: Pubkey,
    pub participant: Pubkey,
    pub amount_allocated: u64,
    pub participated_at: i64,
}

#[event]
pub struct FairLaunchFinalized {
    pub fair_launch: Pubkey,
    pub total_participants: u64,
    pub total_allocated: u64,
    pub finalized_at: i64,
}

#[event]
pub struct TokensClaimed {
    pub fair_launch: Pubkey,
    pub participant: Pubkey,
    pub amount_claimed: u64,
    pub claimed_at: i64,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid proposal threshold.")]
    InvalidProposalThreshold,
    #[msg("Invalid voting period.")]
    InvalidVotingPeriod,
    #[msg("Invalid quorum percentage.")]
    InvalidQuorumPercentage,
    #[msg("Insufficient tokens for proposal creation.")]
    InsufficientTokensForProposal,
    #[msg("Insufficient voting power.")]
    InsufficientVotingPower,
    #[msg("Proposal is not active.")]
    ProposalNotActive,
    #[msg("Voting period has ended.")]
    VotingPeriodEnded,
    #[msg("Voting period has not ended.")]
    VotingPeriodNotEnded,
    #[msg("Quorum not met.")]
    QuorumNotMet,
    #[msg("Proposal did not pass.")]
    ProposalNotPassed,
    #[msg("Unauthorized to cancel this proposal.")]
    UnauthorizedCancellation,
    #[msg("Calculation overflow detected.")]
    MathOverflow,

    // ===== GENESIS PROTOCOL ERROR CODES =====
    #[msg("Invalid max allocation amount.")]
    InvalidMaxAllocation,
    #[msg("Invalid min allocation amount.")]
    InvalidMinAllocation,
    #[msg("Invalid allocation range.")]
    InvalidAllocationRange,
    #[msg("Invalid duration.")]
    InvalidDuration,
    #[msg("Invalid whitelist root.")]
    InvalidWhitelistRoot,
    #[msg("Fair launch is not active.")]
    FairLaunchNotActive,
    #[msg("Fair launch has not started yet.")]
    FairLaunchNotStarted,
    #[msg("Fair launch has ended.")]
    FairLaunchEnded,
    #[msg("Fair launch has not ended yet.")]
    FairLaunchNotEnded,
    #[msg("Fair launch is not finalized.")]
    FairLaunchNotFinalized,
    #[msg("Allocation amount is too small.")]
    AllocationTooSmall,
    #[msg("Allocation amount is too large.")]
    AllocationTooLarge,
    #[msg("Insufficient token supply.")]
    InsufficientSupply,
    #[msg("Invalid merkle proof.")]
    InvalidMerkleProof,
    #[msg("Participant has already participated.")]
    AlreadyParticipated,
    #[msg("No allocation found for participant.")]
    NoAllocation,
    #[msg("Tokens have already been claimed.")]
    TokensAlreadyClaimed,
}

// ===== GENESIS PROTOCOL HELPER FUNCTIONS =====

/// Hash participant data for merkle proof verification
fn hash_participant_data(wallet: Pubkey, amount: u64) -> [u8; 32] {
    use solana_program::keccak;
    
    let mut data = Vec::new();
    data.extend_from_slice(wallet.as_ref());
    data.extend_from_slice(&amount.to_le_bytes());
    
    keccak::hash(&data).to_bytes()
}

/// Verify merkle proof
fn verify_merkle_proof(root: &[u8; 32], leaf: &[u8; 32], proof: &[[u8; 32]]) -> bool {
    use solana_program::keccak;
    
    let mut current = *leaf;
    
    for sibling in proof {
        let mut combined = Vec::new();
        if current < *sibling {
            combined.extend_from_slice(&current);
            combined.extend_from_slice(sibling);
        } else {
            combined.extend_from_slice(sibling);
            combined.extend_from_slice(&current);
        }
        current = keccak::hash(&combined).to_bytes();
    }
    
    current == *root
}
