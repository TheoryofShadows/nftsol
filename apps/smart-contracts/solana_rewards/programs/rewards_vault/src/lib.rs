use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Mint, Transfer};

declare_id!("YBSSnuhAgYq6SN1yofjNt8XyLW7B3mQQQFUBF8gwH6J");

#[program]
pub mod rewards_vault {
    use super::*;

    /// Initialize the rewards vault system
    pub fn initialize_vault(
        ctx: Context<InitializeVault>,
        emission_rate: u64,
        max_supply: u64,
    ) -> Result<()> {
        let vault_config = &mut ctx.accounts.vault_config;
        let clock = Clock::get()?;

        vault_config.config_bump = ctx.bumps.vault_config;
        vault_config.signer_bump = ctx.bumps.vault_signer;
        vault_config.authority = ctx.accounts.authority.key();
        vault_config.reward_mint = ctx.accounts.reward_mint.key();
        vault_config.emission_rate = emission_rate;
        vault_config.max_supply = max_supply;
        vault_config.total_emitted = 0;
        vault_config.last_emission = clock.unix_timestamp;
        vault_config.is_active = true;

        Ok(())
    }

    /// Distribute CLOUT rewards to users
    pub fn distribute_rewards(
        ctx: Context<DistributeRewards>,
        recipient: Pubkey,
        amount: u64,
        reward_type: RewardType,
    ) -> Result<()> {
        let vault_config = &mut ctx.accounts.vault_config;
        let clock = Clock::get()?;

        require!(vault_config.is_active, ErrorCode::VaultInactive);
        require!(amount > 0, ErrorCode::InvalidAmount);

        // Check if we have enough tokens in the vault
        let vault_balance = ctx.accounts.reward_vault.amount;
        require!(vault_balance >= amount, ErrorCode::InsufficientVaultBalance);

        // Check emission limits
        let time_elapsed = clock.unix_timestamp.checked_sub(vault_config.last_emission).ok_or(ErrorCode::MathOverflow)?;
        let max_emission = vault_config.emission_rate
            .checked_mul(time_elapsed as u64)
            .ok_or(ErrorCode::MathOverflow)?;

        require!(vault_config.total_emitted.checked_add(amount).ok_or(ErrorCode::MathOverflow)? <= max_emission, 
                 ErrorCode::EmissionLimitExceeded);

        // Transfer rewards to recipient
        let seeds = &[
            b"vault-signer",
            vault_config.reward_mint.as_ref(),
            &[vault_config.signer_bump],
        ];
        let signer = &[&seeds[..]];

        let transfer_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.reward_vault.to_account_info(),
                to: ctx.accounts.recipient_token.to_account_info(),
                authority: ctx.accounts.vault_signer.to_account_info(),
            },
            signer,
        );
        token::transfer(transfer_ctx, amount)?;

        // Update vault state
        vault_config.total_emitted = vault_config.total_emitted.checked_add(amount).ok_or(ErrorCode::MathOverflow)?;
        vault_config.last_emission = clock.unix_timestamp;

        // Record reward distribution
        let reward_record = RewardRecord {
            recipient,
            amount,
            reward_type,
            timestamp: clock.unix_timestamp,
            vault_authority: vault_config.authority,
        };

        // Emit event
        emit!(RewardDistributed {
            recipient,
            amount,
            reward_type,
            timestamp: clock.unix_timestamp,
            total_emitted: vault_config.total_emitted,
        });

        Ok(())
    }

    /// Batch distribute rewards to multiple users
    pub fn batch_distribute_rewards(
        ctx: Context<BatchDistributeRewards>,
        recipients: Vec<Pubkey>,
        amounts: Vec<u64>,
        reward_type: RewardType,
    ) -> Result<()> {
        require!(recipients.len() == amounts.len(), ErrorCode::MismatchedArrays);
        require!(recipients.len() <= 50, ErrorCode::TooManyRecipients); // Limit batch size

        let vault_config = &mut ctx.accounts.vault_config;
        let clock = Clock::get()?;

        require!(vault_config.is_active, ErrorCode::VaultInactive);

        let total_amount: u64 = amounts.iter().sum();
        require!(total_amount > 0, ErrorCode::InvalidAmount);

        // Check vault balance
        let vault_balance = ctx.accounts.reward_vault.amount;
        require!(vault_balance >= total_amount, ErrorCode::InsufficientVaultBalance);

        // Check emission limits
        let time_elapsed = clock.unix_timestamp.checked_sub(vault_config.last_emission).ok_or(ErrorCode::MathOverflow)?;
        let max_emission = vault_config.emission_rate
            .checked_mul(time_elapsed as u64)
            .ok_or(ErrorCode::MathOverflow)?;

        require!(vault_config.total_emitted.checked_add(total_amount).ok_or(ErrorCode::MathOverflow)? <= max_emission, 
                 ErrorCode::EmissionLimitExceeded);

        // Process each recipient
        for (i, (recipient, amount)) in recipients.iter().zip(amounts.iter()).enumerate() {
            if *amount > 0 {
                // Create recipient token account PDA
                let recipient_token_seeds = &[
                    b"recipient-token",
                    recipient.as_ref(),
                    &[i as u8],
                ];
                let recipient_token_pda = Pubkey::find_program_address(recipient_token_seeds, ctx.program_id);

                // Transfer to recipient (simplified - in practice you'd need proper token account handling)
                // This is a conceptual implementation
            }
        }

        // Update vault state
        vault_config.total_emitted = vault_config.total_emitted.checked_add(total_amount).ok_or(ErrorCode::MathOverflow)?;
        vault_config.last_emission = clock.unix_timestamp;

        // Emit batch event
        emit!(BatchRewardDistributed {
            recipient_count: recipients.len() as u8,
            total_amount,
            reward_type,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Update emission rate (authority only)
    pub fn update_emission_rate(
        ctx: Context<UpdateEmissionRate>,
        new_rate: u64,
    ) -> Result<()> {
        let vault_config = &mut ctx.accounts.vault_config;

        require!(new_rate > 0, ErrorCode::InvalidEmissionRate);
        require!(new_rate <= vault_config.max_supply, ErrorCode::EmissionRateTooHigh);

        vault_config.emission_rate = new_rate;

        emit!(EmissionRateUpdated {
            old_rate: vault_config.emission_rate,
            new_rate,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Pause/unpause vault operations
    pub fn set_vault_status(
        ctx: Context<SetVaultStatus>,
        is_active: bool,
    ) -> Result<()> {
        let vault_config = &mut ctx.accounts.vault_config;

        vault_config.is_active = is_active;

        emit!(VaultStatusChanged {
            is_active,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Emergency withdraw (authority only)
    pub fn emergency_withdraw(
        ctx: Context<EmergencyWithdraw>,
        amount: u64,
    ) -> Result<()> {
        let vault_config = &mut ctx.accounts.vault_config;

        require!(amount > 0, ErrorCode::InvalidAmount);

        // Transfer tokens to authority
        let seeds = &[
            b"vault-signer",
            vault_config.reward_mint.as_ref(),
            &[vault_config.signer_bump],
        ];
        let signer = &[&seeds[..]];

        let transfer_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.reward_vault.to_account_info(),
                to: ctx.accounts.authority_token.to_account_info(),
                authority: ctx.accounts.vault_signer.to_account_info(),
            },
            signer,
        );
        token::transfer(transfer_ctx, amount)?;

        emit!(EmergencyWithdrawExecuted {
            amount,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeVault<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + VaultConfig::INIT_SPACE,
        seeds = [b"vault-config", reward_mint.key().as_ref()],
        bump
    )]
    pub vault_config: Account<'info, VaultConfig>,

    /// CHECK: This is a PDA
    #[account(
        seeds = [b"vault-signer", reward_mint.key().as_ref()],
        bump
    )]
    pub vault_signer: AccountInfo<'info>,

    #[account(mut)]
    pub reward_mint: Account<'info, Mint>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DistributeRewards<'info> {
    #[account(mut)]
    pub vault_config: Account<'info, VaultConfig>,

    #[account(mut)]
    pub reward_vault: Account<'info, TokenAccount>,

    /// CHECK: This is a PDA
    #[account(
        seeds = [b"vault-signer", vault_config.reward_mint.as_ref()],
        bump = vault_config.signer_bump
    )]
    pub vault_signer: AccountInfo<'info>,

    #[account(mut)]
    pub recipient_token: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct BatchDistributeRewards<'info> {
    #[account(mut)]
    pub vault_config: Account<'info, VaultConfig>,

    #[account(mut)]
    pub reward_vault: Account<'info, TokenAccount>,

    /// CHECK: This is a PDA
    #[account(
        seeds = [b"vault-signer", vault_config.reward_mint.as_ref()],
        bump = vault_config.signer_bump
    )]
    pub vault_signer: AccountInfo<'info>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct UpdateEmissionRate<'info> {
    #[account(mut, has_one = authority)]
    pub vault_config: Account<'info, VaultConfig>,

    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct SetVaultStatus<'info> {
    #[account(mut, has_one = authority)]
    pub vault_config: Account<'info, VaultConfig>,

    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct EmergencyWithdraw<'info> {
    #[account(mut, has_one = authority)]
    pub vault_config: Account<'info, VaultConfig>,

    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(mut)]
    pub reward_vault: Account<'info, TokenAccount>,

    /// CHECK: This is a PDA
    #[account(
        seeds = [b"vault-signer", vault_config.reward_mint.as_ref()],
        bump = vault_config.signer_bump
    )]
    pub vault_signer: AccountInfo<'info>,

    #[account(mut)]
    pub authority_token: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[account]
#[derive(InitSpace)]
pub struct VaultConfig {
    pub config_bump: u8,
    pub signer_bump: u8,
    pub authority: Pubkey,
    pub reward_mint: Pubkey,
    pub emission_rate: u64,
    pub max_supply: u64,
    pub total_emitted: u64,
    pub last_emission: i64,
    pub is_active: bool,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum RewardType {
    NftCreation,
    NftPurchase,
    Staking,
    Governance,
    SocialActivity,
    LoyaltyBonus,
    Referral,
}

#[derive(Clone)]
pub struct RewardRecord {
    pub recipient: Pubkey,
    pub amount: u64,
    pub reward_type: RewardType,
    pub timestamp: i64,
    pub vault_authority: Pubkey,
}

// Events
#[event]
pub struct RewardDistributed {
    pub recipient: Pubkey,
    pub amount: u64,
    pub reward_type: RewardType,
    pub timestamp: i64,
    pub total_emitted: u64,
}

#[event]
pub struct BatchRewardDistributed {
    pub recipient_count: u8,
    pub total_amount: u64,
    pub reward_type: RewardType,
    pub timestamp: i64,
}

#[event]
pub struct EmissionRateUpdated {
    pub old_rate: u64,
    pub new_rate: u64,
    pub timestamp: i64,
}

#[event]
pub struct VaultStatusChanged {
    pub is_active: bool,
    pub timestamp: i64,
}

#[event]
pub struct EmergencyWithdrawExecuted {
    pub amount: u64,
    pub timestamp: i64,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Amount must be greater than zero.")]
    InvalidAmount,
    #[msg("Vault is currently inactive.")]
    VaultInactive,
    #[msg("Insufficient vault balance.")]
    InsufficientVaultBalance,
    #[msg("Emission limit exceeded.")]
    EmissionLimitExceeded,
    #[msg("Invalid emission rate.")]
    InvalidEmissionRate,
    #[msg("Emission rate too high.")]
    EmissionRateTooHigh,
    #[msg("Mismatched array lengths.")]
    MismatchedArrays,
    #[msg("Too many recipients in batch.")]
    TooManyRecipients,
    #[msg("Calculation overflow detected.")]
    MathOverflow,
    #[msg("Unauthorized access.")]
    Unauthorized,
}

