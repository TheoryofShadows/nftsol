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
}
