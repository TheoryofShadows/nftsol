use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount};

declare_id!("cloutStaking1111111111111111111111111111111");

#[program]
pub mod clout_staking {
    use super::*;

    pub fn create_pool(ctx: Context<CreatePool>, reward_rate: u64) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        pool.bump = ctx.bumps.pool;
        pool.authority = ctx.accounts.authority.key();
        pool.reward_vault = ctx.accounts.reward_vault.key();
        pool.clout_mint = ctx.accounts.clout_mint.key();
        pool.reward_rate = reward_rate;
        Ok(())
    }

    pub fn stake(ctx: Context<Stake>, amount: u64) -> Result<()> {
        require!(amount > 0, StakingError::InvalidAmount);
        let position = &mut ctx.accounts.position;
        if position.amount == 0 {
            position.owner = ctx.accounts.staker.key();
            position.pool = ctx.accounts.pool.key();
        }
        position.amount = position
            .amount
            .checked_add(amount)
            .ok_or(StakingError::MathOverflow)?;
        position.last_stake_ts = Clock::get()?.unix_timestamp;

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
}

#[account]
pub struct StakingPool {
    pub bump: u8,
    pub authority: Pubkey,
    pub reward_vault: Pubkey,
    pub clout_mint: Pubkey,
    pub reward_rate: u64,
}

#[derive(Accounts)]
pub struct CreatePool<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 1 + 32 + 32 + 32 + 8,
        seeds = [b"pool", clout_mint.key().as_ref()],
        bump
    )]
    pub pool: Account<'info, StakingPool>,
    #[account(mut)]
    pub authority: Signer<'info>,
    /// CHECK: stored for CPI with rewards vault
    pub reward_vault: UncheckedAccount<'info>,
    /// CHECK: mint associated with staking
    pub clout_mint: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct StakePosition {
    pub owner: Pubkey,
    pub pool: Pubkey,
    pub amount: u64,
    pub last_stake_ts: i64,
}

#[derive(Accounts)]
pub struct Stake<'info> {
    #[account(mut)]
    pub pool: Account<'info, StakingPool>,
    #[account(
        init_if_needed,
        payer = staker,
        space = 8 + 32 + 32 + 8 + 8,
        seeds = [b"position", pool.key().as_ref(), staker.key().as_ref()],
        bump
    )]
    pub position: Account<'info, StakePosition>,
    #[account(mut)]
    pub staker: Signer<'info>,
    #[account(mut)]
    pub staker_token: Account<'info, TokenAccount>,
    #[account(mut)]
    pub pool_vault: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[error_code]
pub enum StakingError {
    #[msg("Stake amount must be greater than zero")]
    InvalidAmount,
    #[msg("Calculation overflow")]
    MathOverflow,
}
