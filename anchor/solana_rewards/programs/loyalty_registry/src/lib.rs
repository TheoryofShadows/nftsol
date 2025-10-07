#![allow(unexpected_cfgs)]

use anchor_lang::prelude::*;

pub const PROFILE_SEED: &[u8] = b"profile";
pub const REGISTRY_CONFIG_SEED: &[u8] = b"registry-config";
const LAMPORTS_PER_SOL: u64 = 1_000_000_000;

declare_id!("GgfPQkNHuNbSw6cyDpzHeTLbTxSA2ZPUa2F1ZascnJur");

#[program]
pub mod loyalty_registry {
    use super::*;

    /// Initialize the registry configuration with a controlling authority and
    /// default point multiplier (points granted per SOL of activity).
    pub fn initialize_registry(
        ctx: Context<InitializeRegistry>,
        authority: Pubkey,
        points_per_sol: u64,
    ) -> Result<()> {
        let config = &mut ctx.accounts.registry_config;
        config.bump = ctx.bumps.registry_config;
        config.authority = authority;
        config.points_per_sol = points_per_sol;
        config.total_profiles = 0;
        config.last_updated_ts = Clock::get()?.unix_timestamp;
        Ok(())
    }

    /// Allows the current authority to rotate control of the registry.
    pub fn set_registry_authority(
        ctx: Context<SetRegistryAuthority>,
        new_authority: Pubkey,
    ) -> Result<()> {
        let config = &mut ctx.accounts.registry_config;
        require_keys_eq!(
            config.authority,
            ctx.accounts.authority.key(),
            LoyaltyError::Unauthorized
        );
        config.authority = new_authority;
        config.last_updated_ts = Clock::get()?.unix_timestamp;
        Ok(())
    }

    /// Creates a loyalty profile PDA for a user. This should be invoked on the
    /// user's first interaction with the marketplace.
    pub fn register_profile(ctx: Context<RegisterProfile>) -> Result<()> {
        let profile = &mut ctx.accounts.profile;
        require!(
            profile.is_uninitialized(),
            LoyaltyError::ProfileAlreadyInitialized
        );

        profile.bump = ctx.bumps.profile;
        profile.owner = ctx.accounts.user.key();
        profile.total_volume = 0;
        profile.points = 0;
        profile.tier = LoyaltyTier::Bronze;
        profile.last_activity_ts = Clock::get()?.unix_timestamp;
        profile.delegate = None;

        let registry_config = &mut ctx.accounts.registry_config;
        registry_config.total_profiles = registry_config
            .total_profiles
            .checked_add(1)
            .ok_or(LoyaltyError::MathOverflow)?;
        registry_config.last_updated_ts = profile.last_activity_ts;
        Ok(())
    }

    /// Records marketplace activity for a user. The authority signs to confirm
    /// the action originated from a trusted pipeline (e.g. market_escrow).
    pub fn record_activity(
        ctx: Context<RecordActivity>,
        volume_lamports: u64,
        bonus_points: u64,
    ) -> Result<()> {
        let profile = &mut ctx.accounts.profile;
        require_keys_eq!(
            profile.owner,
            ctx.accounts.actor.key(),
            LoyaltyError::ActorMismatch
        );

        let config = &ctx.accounts.registry_config;
        require_keys_eq!(
            config.authority,
            ctx.accounts.authority.key(),
            LoyaltyError::Unauthorized
        );

        let computed_points = volume_lamports
            .checked_mul(config.points_per_sol)
            .ok_or(LoyaltyError::MathOverflow)?
            .checked_div(LAMPORTS_PER_SOL)
            .ok_or(LoyaltyError::MathOverflow)?;
        let total_points = computed_points
            .checked_add(bonus_points)
            .ok_or(LoyaltyError::MathOverflow)?;

        profile.total_volume = profile
            .total_volume
            .checked_add(volume_lamports)
            .ok_or(LoyaltyError::MathOverflow)?;
        profile.points = profile
            .points
            .checked_add(total_points)
            .ok_or(LoyaltyError::MathOverflow)?;
        profile.bump_tier();
        profile.last_activity_ts = Clock::get()?.unix_timestamp;
        Ok(())
    }

    /// Grants additional loyalty points outside of direct marketplace volume.
    pub fn grant_bonus(ctx: Context<GrantBonus>, points: u64) -> Result<()> {
        let profile = &mut ctx.accounts.profile;
        let config = &ctx.accounts.registry_config;
        require_keys_eq!(
            config.authority,
            ctx.accounts.authority.key(),
            LoyaltyError::Unauthorized
        );

        profile.points = profile
            .points
            .checked_add(points)
            .ok_or(LoyaltyError::MathOverflow)?;
        profile.bump_tier();
        profile.last_activity_ts = Clock::get()?.unix_timestamp;
        Ok(())
    }

    /// Allows a user (or their delegate) to recalculate tier status manually.
    pub fn upgrade_tier(ctx: Context<UpgradeTier>) -> Result<()> {
        let profile = &mut ctx.accounts.profile;
        let caller = ctx.accounts.caller.key();
        let delegate_allowed = profile
            .delegate
            .map(|delegate| delegate == caller)
            .unwrap_or(false);
        require!(
            profile.owner == caller || delegate_allowed,
            LoyaltyError::Unauthorized
        );
        profile.bump_tier();
        profile.last_activity_ts = Clock::get()?.unix_timestamp;
        Ok(())
    }

    /// Assigns a delegate who can perform tier maintenance on behalf of the user.
    pub fn set_delegate(ctx: Context<SetDelegate>, delegate: Option<Pubkey>) -> Result<()> {
        let profile = &mut ctx.accounts.profile;
        require_keys_eq!(
            profile.owner,
            ctx.accounts.owner.key(),
            LoyaltyError::Unauthorized
        );
        profile.delegate = delegate;
        profile.last_activity_ts = Clock::get()?.unix_timestamp;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeRegistry<'info> {
    #[account(
        init,
        payer = payer,
        space = RegistryConfig::LEN,
        seeds = [REGISTRY_CONFIG_SEED],
        bump
    )]
    pub registry_config: Account<'info, RegistryConfig>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SetRegistryAuthority<'info> {
    #[account(
        mut,
        seeds = [REGISTRY_CONFIG_SEED],
        bump = registry_config.bump,
        has_one = authority @ LoyaltyError::Unauthorized
    )]
    pub registry_config: Account<'info, RegistryConfig>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct RegisterProfile<'info> {
    #[account(
        mut,
        seeds = [REGISTRY_CONFIG_SEED],
        bump = registry_config.bump
    )]
    pub registry_config: Account<'info, RegistryConfig>,
    #[account(
        init,
        payer = user,
        space = LoyaltyProfile::LEN,
        seeds = [PROFILE_SEED, user.key().as_ref()],
        bump
    )]
    pub profile: Account<'info, LoyaltyProfile>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RecordActivity<'info> {
    #[account(
        mut,
        seeds = [PROFILE_SEED, profile.owner.as_ref()],
        bump = profile.bump
    )]
    pub profile: Account<'info, LoyaltyProfile>,
    #[account(
        seeds = [REGISTRY_CONFIG_SEED],
        bump = registry_config.bump,
        has_one = authority @ LoyaltyError::Unauthorized
    )]
    pub registry_config: Account<'info, RegistryConfig>,
    pub authority: Signer<'info>,
    /// CHECK: validated against the profile owner field.
    pub actor: UncheckedAccount<'info>,
}

#[derive(Accounts)]
pub struct GrantBonus<'info> {
    #[account(
        mut,
        seeds = [PROFILE_SEED, profile.owner.as_ref()],
        bump = profile.bump
    )]
    pub profile: Account<'info, LoyaltyProfile>,
    #[account(
        seeds = [REGISTRY_CONFIG_SEED],
        bump = registry_config.bump,
        has_one = authority @ LoyaltyError::Unauthorized
    )]
    pub registry_config: Account<'info, RegistryConfig>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct UpgradeTier<'info> {
    #[account(
        mut,
        seeds = [PROFILE_SEED, profile.owner.as_ref()],
        bump = profile.bump
    )]
    pub profile: Account<'info, LoyaltyProfile>,
    pub caller: Signer<'info>,
}

#[derive(Accounts)]
pub struct SetDelegate<'info> {
    #[account(
        mut,
        seeds = [PROFILE_SEED, owner.key().as_ref()],
        bump = profile.bump
    )]
    pub profile: Account<'info, LoyaltyProfile>,
    pub owner: Signer<'info>,
}

#[account]
pub struct RegistryConfig {
    pub bump: u8,
    pub authority: Pubkey,
    pub points_per_sol: u64,
    pub total_profiles: u32,
    pub last_updated_ts: i64,
}

impl RegistryConfig {
    pub const LEN: usize = 8 // discriminator
        + 1 // bump
        + 32 // authority
        + 8 // points per sol
        + 4 // total profiles
        + 8; // last updated timestamp
}

#[account]
pub struct LoyaltyProfile {
    pub bump: u8,
    pub owner: Pubkey,
    pub total_volume: u64,
    pub points: u64,
    pub tier: LoyaltyTier,
    pub last_activity_ts: i64,
    pub delegate: Option<Pubkey>,
}

impl LoyaltyProfile {
    pub const LEN: usize = 8 // discriminator
        + 1 // bump
        + 32 // owner
        + 8 // total volume
        + 8 // points
        + 1 // tier enum
        + 8 // last activity timestamp
        + 1 + 32; // delegate option

    pub fn is_uninitialized(&self) -> bool {
        self.owner == Pubkey::default()
    }

    pub fn bump_tier(&mut self) {
        self.tier = if self.points >= 50_000 {
            LoyaltyTier::Diamond
        } else if self.points >= 20_000 {
            LoyaltyTier::Platinum
        } else if self.points >= 5_000 {
            LoyaltyTier::Gold
        } else if self.points >= 1_000 {
            LoyaltyTier::Silver
        } else {
            LoyaltyTier::Bronze
        };
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq, Eq)]
pub enum LoyaltyTier {
    Bronze,
    Silver,
    Gold,
    Platinum,
    Diamond,
}

#[error_code]
pub enum LoyaltyError {
    #[msg("Math overflow detected.")]
    MathOverflow,
    #[msg("Caller is not authorized to perform this action.")]
    Unauthorized,
    #[msg("Loyalty profile already initialized.")]
    ProfileAlreadyInitialized,
    #[msg("Provided actor does not match the profile owner.")]
    ActorMismatch,
}
