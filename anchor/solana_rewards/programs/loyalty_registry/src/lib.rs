use anchor_lang::prelude::*;

declare_id!("loyaltyReg111111111111111111111111111111");

#[program]
pub mod loyalty_registry {
    use super::*;

    pub fn register_profile(ctx: Context<RegisterProfile>) -> Result<()> {
        let profile = &mut ctx.accounts.profile;
        profile.owner = ctx.accounts.user.key();
        profile.total_volume = 0;
        profile.points = 0;
        profile.tier = LoyaltyTier::Bronze;
        Ok(())
    }

    pub fn record_activity(ctx: Context<RecordActivity>, volume: u64, points: u64) -> Result<()> {
        let profile = &mut ctx.accounts.profile;
        profile.total_volume = profile
            .total_volume
            .checked_add(volume)
            .ok_or(LoyaltyError::MathOverflow)?;
        profile.points = profile.points.checked_add(points).ok_or(LoyaltyError::MathOverflow)?;
        profile.bump_tier();
        Ok(())
    }
}

#[derive(Accounts)]
pub struct RegisterProfile<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + LoyaltyProfile::SIZE,
        seeds = [b"profile", user.key().as_ref()],
        bump
    )]
    pub profile: Account<'info, LoyaltyProfile>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RecordActivity<'info> {
    #[account(mut, seeds = [b"profile", user.key().as_ref()], bump = profile.bump)]
    pub profile: Account<'info, LoyaltyProfile>,
    pub user: Signer<'info>,
}

#[account]
pub struct LoyaltyProfile {
    pub bump: u8,
    pub owner: Pubkey,
    pub total_volume: u64,
    pub points: u64,
    pub tier: LoyaltyTier,
}

impl LoyaltyProfile {
    pub const SIZE: usize = 1 + 32 + 8 + 8 + 1;

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

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy)]
pub enum LoyaltyTier {
    Bronze,
    Silver,
    Gold,
    Platinum,
    Diamond,
}

#[error_code]
pub enum LoyaltyError {
    #[msg("Calculation overflow")]
    MathOverflow,
}
