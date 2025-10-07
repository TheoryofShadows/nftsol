use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, MintTo, Token, TokenAccount};

pub const VAULT_CONFIG_SEED: &[u8] = b"vault-config";
pub const VAULT_SIGNER_SEED: &[u8] = b"vault-signer";

declare_id!("rewardsVault11111111111111111111111111111111");

#[program]
pub mod rewards_vault {
    use super::*;

    /// Initialize a vault configuration that will control emission schedules
    /// and reward distribution.
    pub fn initialize_vault(
        ctx: Context<InitializeVault>,
        config_bump: u8,
        signer_bump: u8,
    ) -> Result<()> {
        let config = &mut ctx.accounts.vault_config;
        config.config_bump = config_bump;
        config.signer_bump = signer_bump;
        config.authority = ctx.accounts.authority.key();
        config.reward_mint = ctx.accounts.reward_mint.key();
        config.emission_rate = 0;
        Ok(())
    }

    /// Set the number of tokens emitted per slot. Eventually we will add
    /// advanced schedules, but this lets us test program wiring on-chain.
    pub fn set_emission_rate(ctx: Context<UpdateVaultConfig>, emission_rate: u64) -> Result<()> {
        let config = &mut ctx.accounts.vault_config;
        require_keys_eq!(
            config.authority,
            ctx.accounts.authority.key(),
            VaultError::Unauthorized,
        );
        config.emission_rate = emission_rate;
        Ok(())
    }

    /// Mint rewards directly to a recipient. In production this will be called
    /// internally by staking/escrow CPI flows.
    pub fn mint_rewards(ctx: Context<MintRewards>, amount: u64) -> Result<()> {
        let config = &ctx.accounts.vault_config;
        require_keys_eq!(
            config.authority,
            ctx.accounts.authority.key(),
            VaultError::Unauthorized,
        );

        let seeds = [
            VAULT_SIGNER_SEED,
            config.reward_mint.as_ref(),
            &[config.signer_bump],
        ];
        let signer = &[&seeds[..]];

        token::mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                MintTo {
                    mint: ctx.accounts.reward_mint.to_account_info(),
                    to: ctx.accounts.recipient.to_account_info(),
                    authority: ctx.accounts.vault_signer.to_account_info(),
                },
                signer,
            ),
            amount,
        )
    }
}

#[derive(Accounts)]
#[instruction(config_bump: u8, signer_bump: u8)]
pub struct InitializeVault<'info> {
    #[account(
        init,
        payer = authority,
        space = VaultConfig::LEN,
        seeds = [VAULT_CONFIG_SEED, reward_mint.key().as_ref()],
        bump = config_bump
    )]
    pub vault_config: Account<'info, VaultConfig>,
    /// CHECK: PDA derived in instruction, acts as mint authority.
    #[account(
        seeds = [VAULT_SIGNER_SEED, reward_mint.key().as_ref()],
        bump = signer_bump
    )]
    pub vault_signer: UncheckedAccount<'info>,
    #[account(mut)]
    pub reward_mint: Account<'info, Mint>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateVaultConfig<'info> {
    #[account(mut, has_one = authority @ VaultError::Unauthorized)]
    pub vault_config: Account<'info, VaultConfig>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct MintRewards<'info> {
    #[account(mut, has_one = authority @ VaultError::Unauthorized, has_one = reward_mint)]
    pub vault_config: Account<'info, VaultConfig>,
    /// CHECK: PDA signer derived from config, verified at runtime.
    #[account(
        seeds = [VAULT_SIGNER_SEED, reward_mint.key().as_ref()],
        bump = vault_config.signer_bump
    )]
    pub vault_signer: UncheckedAccount<'info>,
    #[account(mut)]
    pub reward_mint: Account<'info, Mint>,
    #[account(mut)]
    pub recipient: Account<'info, TokenAccount>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[account]
pub struct VaultConfig {
    pub config_bump: u8,
    pub signer_bump: u8,
    pub authority: Pubkey,
    pub reward_mint: Pubkey,
    pub emission_rate: u64,
}

impl VaultConfig {
    pub const LEN: usize = 8  // discriminator
        + 1  // config bump
        + 1  // signer bump
        + 32 // authority
        + 32 // reward mint
        + 8; // emission rate
}

#[error_code]
pub enum VaultError {
    #[msg("Only the configured authority may perform this action.")]
    Unauthorized,
}
