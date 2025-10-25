use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Mint, Transfer};

declare_id!("4mUWjVdfVWP9TT5wT9x2P2Uhd8NQgzWXXMGKM8xxmM9E");

#[program]
pub mod clout_staking {
    use super::*;

    /// Creates a new CLOUT staking pool
    pub fn create_pool(
        ctx: Context<CreatePool>,
        reward_rate: u64,
    ) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        let clock = Clock::get()?;

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
        pool.last_update_ts = clock.unix_timestamp;

        require!(reward_rate > 0, ErrorCode::InvalidRewardRate);

        Ok(())
    }

    /// Stake CLOUT tokens to earn rewards
    pub fn stake(ctx: Context<Stake>, amount: u64) -> Result<()> {
        require!(amount > 0, ErrorCode::InvalidAmount);

        let pool = &mut ctx.accounts.pool;
        let position = &mut ctx.accounts.position;
        let clock = Clock::get()?;

        // Update pool rewards before staking
        update_rewards(pool, clock.unix_timestamp)?;

        // Initialize position if it doesn't exist
        if position.amount == 0 {
            position.bump = ctx.bumps.position;
            position.owner = ctx.accounts.staker.key();
            position.pool = pool.key();
            position.amount = 0;
            position.reward_per_token_paid = pool.reward_per_token_stored;
            position.pending_rewards = 0;
            position.last_stake_ts = clock.unix_timestamp;
        } else {
            // Harvest existing rewards before adding more stake
            harvest_rewards_internal(ctx.accounts, pool, position)?;
        }

        // Transfer tokens to pool vault
        let transfer_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.staker_token.to_account_info(),
                to: ctx.accounts.pool_vault.to_account_info(),
                authority: ctx.accounts.staker.to_account_info(),
            },
        );
        token::transfer(transfer_ctx, amount)?;

        // Update position
        position.amount = position.amount.checked_add(amount).ok_or(ErrorCode::MathOverflow)?;
        position.last_stake_ts = clock.unix_timestamp;

        // Update pool
        pool.total_staked = pool.total_staked.checked_add(amount).ok_or(ErrorCode::MathOverflow)?;

        Ok(())
    }

    /// Unstake CLOUT tokens
    pub fn unstake(ctx: Context<Unstake>, amount: u64) -> Result<()> {
        require!(amount > 0, ErrorCode::InvalidAmount);

        let pool = &mut ctx.accounts.pool;
        let position = &mut ctx.accounts.position;
        let clock = Clock::get()?;

        // Update pool rewards before unstaking
        update_rewards(pool, clock.unix_timestamp)?;

        // Harvest rewards first
        harvest_rewards_internal(ctx.accounts, pool, position)?;

        require!(position.amount >= amount, ErrorCode::InsufficientStakedBalance);

        // Transfer tokens back to staker
        let seeds = &[
            b"pool-signer",
            pool.clout_mint.as_ref(),
            &[pool.signer_bump],
        ];
        let signer = &[&seeds[..]];

        let transfer_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.pool_vault.to_account_info(),
                to: ctx.accounts.destination_token.to_account_info(),
                authority: ctx.accounts.pool_signer.to_account_info(),
            },
            signer,
        );
        token::transfer(transfer_ctx, amount)?;

        // Update position
        position.amount = position.amount.checked_sub(amount).ok_or(ErrorCode::MathOverflow)?;

        // Update pool
        pool.total_staked = pool.total_staked.checked_sub(amount).ok_or(ErrorCode::MathOverflow)?;

        Ok(())
    }

    /// Harvest accumulated rewards
    pub fn harvest(ctx: Context<Harvest>) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        let position = &mut ctx.accounts.position;
        let clock = Clock::get()?;

        // Update pool rewards
        update_rewards(pool, clock.unix_timestamp)?;

        // Harvest rewards
        harvest_rewards_internal(ctx.accounts, pool, position)?;

        Ok(())
    }

    /// Update reward rate (authority only)
    pub fn update_reward_rate(ctx: Context<UpdateRewardRate>, new_rate: u64) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        let clock = Clock::get()?;

        // Update rewards before changing rate
        update_rewards(pool, clock.unix_timestamp)?;

        pool.reward_rate = new_rate;
        pool.last_update_ts = clock.unix_timestamp;

        Ok(())
    }

    // Helper function to update pool rewards
    fn update_rewards(pool: &mut Account<StakingPool>, current_time: i64) -> Result<()> {
        if pool.total_staked > 0 {
            let time_elapsed = current_time.checked_sub(pool.last_update_ts).ok_or(ErrorCode::MathOverflow)?;
            let rewards = pool.reward_rate
                .checked_mul(time_elapsed as u64)
                .ok_or(ErrorCode::MathOverflow)?;
            
            let reward_per_token = rewards
                .checked_mul(1_000_000_000) // 1e9 for precision
                .ok_or(ErrorCode::MathOverflow)?
                .checked_div(pool.total_staked)
                .ok_or(ErrorCode::MathOverflow)?;

            pool.reward_per_token_stored = pool.reward_per_token_stored
                .checked_add(reward_per_token as u128)
                .ok_or(ErrorCode::MathOverflow)?;
        }

        pool.last_update_ts = current_time;
        Ok(())
    }

    // Helper function to harvest rewards
    fn harvest_rewards_internal(
        accounts: &HarvestAccounts,
        pool: &Account<StakingPool>,
        position: &mut Account<StakePosition>,
    ) -> Result<()> {
        if position.amount > 0 {
            let earned = position.amount
                .checked_mul(pool.reward_per_token_stored as u64)
                .ok_or(ErrorCode::MathOverflow)?
                .checked_div(1_000_000_000)
                .ok_or(ErrorCode::MathOverflow)?
                .checked_sub(position.reward_per_token_paid as u64)
                .ok_or(ErrorCode::MathOverflow)?;

            position.pending_rewards = position.pending_rewards
                .checked_add(earned)
                .ok_or(ErrorCode::MathOverflow)?;
        }

        position.reward_per_token_paid = pool.reward_per_token_stored;

        if position.pending_rewards > 0 {
            require!(position.pending_rewards > 0, ErrorCode::NoRewardsAvailable);

            // Transfer rewards to staker
            let seeds = &[
                b"vault-signer",
                pool.reward_mint.as_ref(),
                &[accounts.vault_signer.bump],
            ];
            let signer = &[&seeds[..]];

            let transfer_ctx = CpiContext::new_with_signer(
                accounts.token_program.to_account_info(),
                Transfer {
                    from: accounts.reward_vault.to_account_info(),
                    to: accounts.recipient_token.to_account_info(),
                    authority: accounts.vault_signer.to_account_info(),
                },
                signer,
            );
            token::transfer(transfer_ctx, position.pending_rewards)?;

            position.pending_rewards = 0;
        }

        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreatePool<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + StakingPool::INIT_SPACE,
        seeds = [b"pool", clout_mint.key().as_ref()],
        bump
    )]
    pub pool: Account<'info, StakingPool>,

    /// CHECK: This account is validated in the instruction
    #[account(mut)]
    pub reward_vault: AccountInfo<'info>,

    #[account(
        init,
        payer = authority,
        token::mint = clout_mint,
        token::authority = pool_signer,
        seeds = [b"pool-vault", clout_mint.key().as_ref()],
        bump
    )]
    pub pool_vault: Account<'info, TokenAccount>,

    /// CHECK: This is a PDA
    #[account(
        seeds = [b"pool-signer", clout_mint.key().as_ref()],
        bump
    )]
    pub pool_signer: AccountInfo<'info>,

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
pub struct Stake<'info> {
    #[account(mut)]
    pub pool: Account<'info, StakingPool>,

    #[account(
        mut,
        seeds = [b"pool-vault", pool.clout_mint.key().as_ref()],
        bump = pool.vault_bump
    )]
    pub pool_vault: Account<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = staker,
        space = 8 + StakePosition::INIT_SPACE,
        seeds = [b"position", pool.key().as_ref(), staker.key().as_ref()],
        bump
    )]
    pub position: Account<'info, StakePosition>,

    #[account(mut)]
    pub staker: Signer<'info>,

    #[account(mut)]
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
        seeds = [b"pool-vault", pool.clout_mint.key().as_ref()],
        bump = pool.vault_bump
    )]
    pub pool_vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [b"position", pool.key().as_ref(), staker.key().as_ref()],
        bump,
        constraint = position.owner == staker.key(),
        constraint = position.pool == pool.key()
    )]
    pub position: Account<'info, StakePosition>,

    #[account(mut)]
    pub staker: Signer<'info>,

    #[account(mut)]
    pub destination_token: Account<'info, TokenAccount>,

    /// CHECK: This is a PDA
    #[account(
        seeds = [b"pool-signer", pool.clout_mint.key().as_ref()],
        bump = pool.signer_bump
    )]
    pub pool_signer: AccountInfo<'info>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Harvest<'info> {
    #[account(mut)]
    pub pool: Account<'info, StakingPool>,

    #[account(
        mut,
        seeds = [b"position", pool.key().as_ref(), staker.key().as_ref()],
        bump,
        constraint = position.owner == staker.key(),
        constraint = position.pool == pool.key()
    )]
    pub position: Account<'info, StakePosition>,

    pub staker: Signer<'info>,

    #[account(mut)]
    pub reward_vault: Account<'info, TokenAccount>,

    /// CHECK: This is a PDA
    #[account(
        seeds = [b"vault-signer", pool.reward_mint.key().as_ref()],
        bump
    )]
    pub vault_signer: AccountInfo<'info>,

    #[account(mut)]
    pub reward_mint: Account<'info, Mint>,

    #[account(mut)]
    pub recipient_token: Account<'info, TokenAccount>,

    #[account(mut)]
    pub pool_authority: Signer<'info>,

    /// CHECK: This is a PDA
    #[account(
        seeds = [b"pool-signer", pool.clout_mint.key().as_ref()],
        bump = pool.signer_bump
    )]
    pub pool_signer: AccountInfo<'info>,

    pub token_program: Program<'info, Token>,
    pub rewards_vault_program: Program<'info, RewardsVault>,
}

#[derive(Accounts)]
pub struct UpdateRewardRate<'info> {
    #[account(mut, has_one = authority)]
    pub pool: Account<'info, StakingPool>,

    pub authority: Signer<'info>,
}

#[account]
#[derive(InitSpace)]
pub struct StakePosition {
    pub bump: u8,
    pub owner: Pubkey,
    pub pool: Pubkey,
    pub amount: u64,
    pub reward_per_token_paid: u128,
    pub pending_rewards: u64,
    pub last_stake_ts: i64,
}

#[account]
#[derive(InitSpace)]
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

#[account]
#[derive(InitSpace)]
pub struct VaultConfig {
    pub config_bump: u8,
    pub signer_bump: u8,
    pub authority: Pubkey,
    pub reward_mint: Pubkey,
    pub emission_rate: u64,
}

#[error_code]
pub enum ErrorCode {
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

