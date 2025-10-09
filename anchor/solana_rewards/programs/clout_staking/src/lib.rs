#![allow(unexpected_cfgs)]

use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount};

use rewards_vault::program::RewardsVault as RewardsVaultProgram;
use rewards_vault::{self, VaultConfig, VAULT_SIGNER_SEED};

pub const POOL_SEED: &[u8] = b"pool";
pub const POOL_VAULT_SEED: &[u8] = b"pool-vault";
pub const POOL_SIGNER_SEED: &[u8] = b"pool-signer";
pub const POSITION_SEED: &[u8] = b"position";

const REWARD_SCALE: u128 = 1_000_000_000;

declare_id!("4mUWjVdfVWP9TT5wT9x2P2Uhd8NQgzWXXMGKM8xxmM9E");

#[program]
pub mod clout_staking {
    use super::*;

    pub fn create_pool(ctx: Context<CreatePool>, reward_rate: u64) -> Result<()> {
        require!(reward_rate > 0, StakingError::InvalidRewardRate);
        require_keys_eq!(
            ctx.accounts.reward_vault.reward_mint,
            ctx.accounts.reward_mint.key(),
            StakingError::MismatchedRewardMint
        );
        require_keys_eq!(
            ctx.accounts.reward_vault.authority,
            ctx.accounts.authority.key(),
            StakingError::Unauthorized
        );

        let pool = &mut ctx.accounts.pool;
        pool.bump = ctx.bumps.pool;
        pool.vault_bump = ctx.bumps.pool_vault;
        pool.signer_bump = ctx.bumps.pool_signer;
        pool.authority = ctx.accounts.authority.key();
        pool.reward_vault = ctx.accounts.reward_vault.key();
        pool.reward_mint = ctx.accounts.reward_mint.key();
        pool.clout_mint = ctx.accounts.clout_mint.key();
        pool.reward_rate = reward_rate;
        pool.total_staked = 0;
        pool.reward_per_token_stored = 0;
        pool.last_update_ts = Clock::get()?.unix_timestamp;

        let expected_vault = derive_pool_vault_address(&pool.clout_mint, pool.vault_bump)?;
        require_keys_eq!(
            expected_vault,
            ctx.accounts.pool_vault.key(),
            StakingError::InvalidPoolVaultAuthority
        );

        let expected_signer = derive_pool_signer(&pool.clout_mint, pool.signer_bump)?;
        require_keys_eq!(
            expected_signer,
            ctx.accounts.pool_signer.key(),
            StakingError::InvalidPoolSigner
        );

        Ok(())
    }

    pub fn update_reward_rate(ctx: Context<UpdateRewardRate>, reward_rate: u64) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        require_keys_eq!(
            pool.authority,
            ctx.accounts.authority.key(),
            StakingError::Unauthorized
        );

        accrue_pool(pool)?;
        pool.reward_rate = reward_rate;
        Ok(())
    }

    pub fn stake(ctx: Context<Stake>, amount: u64) -> Result<()> {
        require!(amount > 0, StakingError::InvalidAmount);

        let pool = &mut ctx.accounts.pool;
        let position = &mut ctx.accounts.position;

        let expected_vault = derive_pool_vault_address(&pool.clout_mint, pool.vault_bump)?;
        require_keys_eq!(
            expected_vault,
            ctx.accounts.pool_vault.key(),
            StakingError::InvalidPoolVaultAuthority
        );
        require_keys_eq!(
            ctx.accounts.pool_vault.owner,
            derive_pool_signer(&pool.clout_mint, pool.signer_bump)?,
            StakingError::MismatchedPoolVaultOwner
        );
        require_keys_eq!(
            ctx.accounts.pool_vault.mint,
            pool.clout_mint,
            StakingError::MismatchedPoolVaultMint
        );
        require_keys_eq!(
            ctx.accounts.staker_token.mint,
            pool.clout_mint,
            StakingError::MismatchedStakeMint
        );

        accrue_pool(pool)?;
        accrue_position(pool, position)?;

        let staker_key = ctx.accounts.staker.key();
        if position.is_uninitialized() {
            position.bump = ctx.bumps.position;
            position.owner = staker_key;
            position.pool = pool.key();
            position.pending_rewards = 0;
        } else {
            require_keys_eq!(position.owner, staker_key, StakingError::Unauthorized);
            require_keys_eq!(
                position.pool,
                pool.key(),
                StakingError::InvalidPoolForPosition
            );
        }

        pool.total_staked = pool
            .total_staked
            .checked_add(amount)
            .ok_or(StakingError::MathOverflow)?;
        position.amount = position
            .amount
            .checked_add(amount)
            .ok_or(StakingError::MathOverflow)?;
        position.last_stake_ts = Clock::get()?.unix_timestamp;
        position.reward_per_token_paid = pool.reward_per_token_stored;

        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token::Transfer {
                    from: ctx.accounts.staker_token.to_account_info(),
                    to: ctx.accounts.pool_vault.to_account_info(),
                    authority: ctx.accounts.staker.to_account_info(),
                },
            ),
            amount,
        )
    }

    pub fn unstake(ctx: Context<Unstake>, amount: u64) -> Result<()> {
        require!(amount > 0, StakingError::InvalidAmount);

        let pool = &mut ctx.accounts.pool;
        let position = &mut ctx.accounts.position;
        require_keys_eq!(
            position.owner,
            ctx.accounts.staker.key(),
            StakingError::Unauthorized
        );
        require!(
            position.amount >= amount,
            StakingError::InsufficientStakedBalance
        );

        accrue_pool(pool)?;
        accrue_position(pool, position)?;

        pool.total_staked = pool
            .total_staked
            .checked_sub(amount)
            .ok_or(StakingError::MathOverflow)?;
        position.amount = position
            .amount
            .checked_sub(amount)
            .ok_or(StakingError::MathOverflow)?;
        position.reward_per_token_paid = pool.reward_per_token_stored;
        position.last_stake_ts = Clock::get()?.unix_timestamp;

        let signer_seeds: &[&[u8]] = &[
            POOL_SIGNER_SEED,
            pool.clout_mint.as_ref(),
            &[pool.signer_bump],
        ];

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                token::Transfer {
                    from: ctx.accounts.pool_vault.to_account_info(),
                    to: ctx.accounts.destination_token.to_account_info(),
                    authority: ctx.accounts.pool_signer.to_account_info(),
                },
                &[signer_seeds],
            ),
            amount,
        )
    }

    pub fn harvest(ctx: Context<Harvest>) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        let position = &mut ctx.accounts.position;

        require_keys_eq!(
            position.owner,
            ctx.accounts.staker.key(),
            StakingError::Unauthorized
        );

        accrue_pool(pool)?;
        accrue_position(pool, position)?;

        let amount = position.pending_rewards;
        require!(amount > 0, StakingError::NoRewardsAvailable);

        position.pending_rewards = 0;
        position.reward_per_token_paid = pool.reward_per_token_stored;

        require_keys_eq!(
            pool.authority,
            ctx.accounts.pool_authority.key(),
            StakingError::Unauthorized
        );
        require_keys_eq!(
            pool.reward_vault,
            ctx.accounts.reward_vault.key(),
            StakingError::MismatchedRewardVault
        );
        require_keys_eq!(
            pool.reward_mint,
            ctx.accounts.reward_mint.key(),
            StakingError::MismatchedRewardMint
        );
        require_keys_eq!(
            derive_pool_signer(&pool.clout_mint, pool.signer_bump)?,
            ctx.accounts.pool_signer.key(),
            StakingError::InvalidPoolSigner
        );

        let cpi_accounts = rewards_vault::cpi::accounts::MintRewards {
            vault_config: ctx.accounts.reward_vault.to_account_info(),
            vault_signer: ctx.accounts.vault_signer.to_account_info(),
            reward_mint: ctx.accounts.reward_mint.to_account_info(),
            recipient: ctx.accounts.recipient_token.to_account_info(),
            authority: ctx.accounts.pool_authority.to_account_info(),
            token_program: ctx.accounts.token_program.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(
            ctx.accounts.rewards_vault_program.to_account_info(),
            cpi_accounts,
        );

        rewards_vault::cpi::mint_rewards(cpi_ctx, amount)?;

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(reward_rate: u64)]
pub struct CreatePool<'info> {
    #[account(
        init,
        payer = authority,
        space = StakingPool::LEN,
        seeds = [POOL_SEED, clout_mint.key().as_ref()],
        bump
    )]
    pub pool: Account<'info, StakingPool>,
    #[account(
        mut,
        has_one = reward_mint @ StakingError::MismatchedRewardMint
    )]
    pub reward_vault: Account<'info, VaultConfig>,
    #[account(
        init,
        payer = authority,
        seeds = [POOL_VAULT_SEED, clout_mint.key().as_ref()],
        bump,
        token::mint = clout_mint,
        token::authority = pool_signer
    )]
    pub pool_vault: Account<'info, TokenAccount>,
    /// CHECK: PDA authority for the pool vault
    #[account(
        seeds = [POOL_SIGNER_SEED, clout_mint.key().as_ref()],
        bump
    )]
    pub pool_signer: UncheckedAccount<'info>,
    #[account(mut)]
    pub clout_mint: Account<'info, Mint>,
    #[account(mut)]
    pub reward_mint: Account<'info, Mint>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct UpdateRewardRate<'info> {
    #[account(mut)]
    pub pool: Account<'info, StakingPool>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct Stake<'info> {
    #[account(mut)]
    pub pool: Account<'info, StakingPool>,
    #[account(
        mut,
        seeds = [POOL_VAULT_SEED, pool.clout_mint.as_ref()],
        bump = pool.vault_bump,
        constraint = pool_vault.mint == pool.clout_mint @ StakingError::MismatchedPoolVaultMint
    )]
    pub pool_vault: Account<'info, TokenAccount>,
    #[account(
        init_if_needed,
        payer = staker,
        space = StakePosition::LEN,
        seeds = [POSITION_SEED, pool.key().as_ref(), staker.key().as_ref()],
        bump
    )]
    pub position: Account<'info, StakePosition>,
    #[account(mut)]
    pub staker: Signer<'info>,
    #[account(
        mut,
        constraint = staker_token.owner == staker.key(),
        constraint = staker_token.mint == pool.clout_mint @ StakingError::MismatchedStakeMint
    )]
    pub staker_token: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct Unstake<'info> {
    #[account(mut)]
    pub pool: Account<'info, StakingPool>,
    #[account(
        mut,
        seeds = [POOL_VAULT_SEED, pool.clout_mint.as_ref()],
        bump = pool.vault_bump,
        constraint = pool_vault.mint == pool.clout_mint @ StakingError::MismatchedPoolVaultMint
    )]
    pub pool_vault: Account<'info, TokenAccount>,
    #[account(
        mut,
        seeds = [POSITION_SEED, pool.key().as_ref(), staker.key().as_ref()],
        bump = position.bump
    )]
    pub position: Account<'info, StakePosition>,
    #[account(mut)]
    pub staker: Signer<'info>,
    #[account(
        mut,
        constraint = destination_token.owner == staker.key(),
        constraint = destination_token.mint == pool.clout_mint @ StakingError::MismatchedStakeMint
    )]
    pub destination_token: Account<'info, TokenAccount>,
    /// CHECK: PDA authority for the pool vault
    #[account(
        seeds = [POOL_SIGNER_SEED, pool.clout_mint.as_ref()],
        bump = pool.signer_bump
    )]
    pub pool_signer: UncheckedAccount<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Harvest<'info> {
    #[account(mut)]
    pub pool: Account<'info, StakingPool>,
    #[account(
        mut,
        seeds = [POSITION_SEED, pool.key().as_ref(), staker.key().as_ref()],
        bump = position.bump
    )]
    pub position: Account<'info, StakePosition>,
    pub staker: Signer<'info>,
    #[account(mut)]
    pub reward_vault: Account<'info, VaultConfig>,
    /// CHECK: Rewards vault signer, validated by seeds in downstream CPI.
    #[account(
        seeds = [VAULT_SIGNER_SEED, reward_mint.key().as_ref()],
        bump = reward_vault.signer_bump
    )]
    pub vault_signer: UncheckedAccount<'info>,
    #[account(mut)]
    pub reward_mint: Account<'info, Mint>,
    #[account(
        mut,
        constraint = recipient_token.owner == staker.key(),
        constraint = recipient_token.mint == pool.reward_mint @ StakingError::MismatchedRewardMint
    )]
    pub recipient_token: Account<'info, TokenAccount>,
    #[account(mut)]
    pub pool_authority: Signer<'info>,
    /// CHECK: PDA authority for the pool vault
    #[account(
        seeds = [POOL_SIGNER_SEED, pool.clout_mint.as_ref()],
        bump = pool.signer_bump
    )]
    pub pool_signer: UncheckedAccount<'info>,
    pub token_program: Program<'info, Token>,
    pub rewards_vault_program: Program<'info, RewardsVaultProgram>,
}

#[account]
pub struct StakingPool {
    pub bump: u8,
    pub vault_bump: u8,
    pub signer_bump: u8,
    pub authority: Pubkey,
    pub reward_vault: Pubkey,
    pub reward_mint: Pubkey,
    pub clout_mint: Pubkey,
    pub reward_rate: u64,
    pub total_staked: u64,
    pub reward_per_token_stored: u128,
    pub last_update_ts: i64,
}

impl StakingPool {
    pub const LEN: usize = 8 // discriminator
        + 1 // bump
        + 1 // vault bump
        + 1 // signer bump
        + 32 // authority
        + 32 // reward vault
        + 32 // reward mint
        + 32 // clout mint
        + 8 // reward rate
        + 8 // total staked
        + 16 // reward per token stored
        + 8; // last update ts
}

#[account]
pub struct StakePosition {
    pub bump: u8,
    pub owner: Pubkey,
    pub pool: Pubkey,
    pub amount: u64,
    pub reward_per_token_paid: u128,
    pub pending_rewards: u64,
    pub last_stake_ts: i64,
}

impl StakePosition {
    pub const LEN: usize = 8 // discriminator
        + 1 // bump
        + 32 // owner
        + 32 // pool
        + 8 // amount
        + 16 // reward per token paid
        + 8 // pending rewards
        + 8; // last stake ts

    pub fn is_uninitialized(&self) -> bool {
        self.owner == Pubkey::default() && self.pool == Pubkey::default()
    }
}

fn derive_pool_signer(mint: &Pubkey, bump: u8) -> Result<Pubkey> {
    Pubkey::create_program_address(&[POOL_SIGNER_SEED, mint.as_ref(), &[bump]], &crate::ID)
        .map_err(|_| StakingError::InvalidPoolSigner.into())
}

fn derive_pool_vault_address(mint: &Pubkey, bump: u8) -> Result<Pubkey> {
    Pubkey::create_program_address(&[POOL_VAULT_SEED, mint.as_ref(), &[bump]], &crate::ID)
        .map_err(|_| StakingError::InvalidPoolVaultAuthority.into())
}

fn accrue_pool(pool: &mut Account<StakingPool>) -> Result<()> {
    let now = Clock::get()?.unix_timestamp;
    if now <= pool.last_update_ts {
        return Ok(());
    }

    if pool.total_staked == 0 || pool.reward_rate == 0 {
        pool.last_update_ts = now;
        return Ok(());
    }

    let elapsed = now
        .checked_sub(pool.last_update_ts)
        .ok_or(StakingError::MathOverflow)? as u128;
    let accrued = elapsed
        .checked_mul(pool.reward_rate as u128)
        .ok_or(StakingError::MathOverflow)?;
    let per_token_increment = accrued
        .checked_mul(REWARD_SCALE)
        .ok_or(StakingError::MathOverflow)?
        .checked_div(pool.total_staked as u128)
        .ok_or(StakingError::MathOverflow)?;
    pool.reward_per_token_stored = pool
        .reward_per_token_stored
        .checked_add(per_token_increment)
        .ok_or(StakingError::MathOverflow)?;
    pool.last_update_ts = now;
    Ok(())
}

fn accrue_position(
    pool: &Account<StakingPool>,
    position: &mut Account<StakePosition>,
) -> Result<()> {
    if position.amount == 0 {
        position.reward_per_token_paid = pool.reward_per_token_stored;
        return Ok(());
    }
    if pool.reward_per_token_stored < position.reward_per_token_paid {
        position.reward_per_token_paid = pool.reward_per_token_stored;
        return Ok(());
    }

    let delta = pool
        .reward_per_token_stored
        .checked_sub(position.reward_per_token_paid)
        .ok_or(StakingError::MathOverflow)?;
    if delta == 0 {
        return Ok(());
    }

    let accrued = (position.amount as u128)
        .checked_mul(delta)
        .ok_or(StakingError::MathOverflow)?
        .checked_div(REWARD_SCALE)
        .ok_or(StakingError::MathOverflow)?;
    if accrued > 0 {
        let pending = (position.pending_rewards as u128)
            .checked_add(accrued)
            .ok_or(StakingError::MathOverflow)?;
        require!(pending <= u64::MAX as u128, StakingError::MathOverflow);
        position.pending_rewards = pending as u64;
    }
    position.reward_per_token_paid = pool.reward_per_token_stored;
    Ok(())
}

#[error_code]
pub enum StakingError {
    #[msg("Amount must be greater than zero.")]
    InvalidAmount,
    #[msg("Calculation overflow detected.")]
    MathOverflow,
    #[msg("Reward rate must be non-zero.")]
    InvalidRewardRate,
    #[msg("Caller is not authorized to perform this action.")]
    Unauthorized,
    #[msg("Insufficient staked balance.")]
    InsufficientStakedBalance,
    #[msg("No rewards available to harvest.")]
    NoRewardsAvailable,
    #[msg("Stake position is bound to a different pool.")]
    InvalidPoolForPosition,
    #[msg("Reward vault account does not match pool configuration.")]
    MismatchedRewardVault,
    #[msg("Reward mint does not match pool configuration.")]
    MismatchedRewardMint,
    #[msg("Failed to derive pool signer PDA.")]
    InvalidPoolSigner,
    #[msg("Pool vault authority derivation failed.")]
    InvalidPoolVaultAuthority,
    #[msg("Pool vault owner does not match expected signer.")]
    MismatchedPoolVaultOwner,
    #[msg("Pool vault mint does not match staking mint.")]
    MismatchedPoolVaultMint,
    #[msg("Provided staking token mint does not match pool configuration.")]
    MismatchedStakeMint,
}
