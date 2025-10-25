use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Mint};

declare_id!("7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU");

#[program]
pub mod loyalty_registry {
    use super::*;

    /// Initialize user loyalty profile
    pub fn initialize_profile(
        ctx: Context<InitializeProfile>,
        initial_reputation: u8,
    ) -> Result<()> {
        let profile = &mut ctx.accounts.profile;
        let clock = Clock::get()?;

        profile.bump = ctx.bumps.profile;
        profile.user = ctx.accounts.user.key();
        profile.reputation_score = initial_reputation;
        profile.total_transactions = 0;
        profile.successful_transactions = 0;
        profile.dispute_count = 0;
        profile.created_at = clock.unix_timestamp;
        profile.last_activity = clock.unix_timestamp;
        profile.trust_level = calculate_trust_level(initial_reputation);
        profile.clout_multiplier = calculate_clout_multiplier(initial_reputation);

        Ok(())
    }

    /// Record a successful transaction
    pub fn record_successful_transaction(
        ctx: Context<RecordTransaction>,
        transaction_value: u64,
        transaction_type: TransactionType,
    ) -> Result<()> {
        let profile = &mut ctx.accounts.profile;
        let clock = Clock::get()?;

        // Update transaction counts
        profile.total_transactions = profile.total_transactions.checked_add(1).ok_or(ErrorCode::MathOverflow)?;
        profile.successful_transactions = profile.successful_transactions.checked_add(1).ok_or(ErrorCode::MathOverflow)?;
        profile.last_activity = clock.unix_timestamp;

        // Calculate reputation boost based on transaction value and type
        let reputation_boost = calculate_reputation_boost(transaction_value, transaction_type, profile.trust_level)?;
        profile.reputation_score = profile.reputation_score
            .checked_add(reputation_boost)
            .ok_or(ErrorCode::MathOverflow)?
            .min(100); // Cap at 100

        // Update derived values
        profile.trust_level = calculate_trust_level(profile.reputation_score);
        profile.clout_multiplier = calculate_clout_multiplier(profile.reputation_score);

        // Record transaction history
        let transaction_record = TransactionRecord {
            user: profile.user,
            transaction_type,
            value: transaction_value,
            success: true,
            timestamp: clock.unix_timestamp,
            reputation_change: reputation_boost,
        };

        // Emit event
        emit!(TransactionRecorded {
            user: profile.user,
            transaction_type,
            value: transaction_value,
            success: true,
            new_reputation: profile.reputation_score,
            reputation_change: reputation_boost,
        });

        Ok(())
    }

    /// Record a failed transaction or dispute
    pub fn record_failed_transaction(
        ctx: Context<RecordTransaction>,
        transaction_value: u64,
        transaction_type: TransactionType,
        failure_reason: FailureReason,
    ) -> Result<()> {
        let profile = &mut ctx.accounts.profile;
        let clock = Clock::get()?;

        // Update transaction counts
        profile.total_transactions = profile.total_transactions.checked_add(1).ok_or(ErrorCode::MathOverflow)?;
        profile.last_activity = clock.unix_timestamp;

        // Calculate reputation penalty based on failure reason
        let reputation_penalty = calculate_reputation_penalty(failure_reason, profile.trust_level)?;
        profile.reputation_score = profile.reputation_score
            .checked_sub(reputation_penalty)
            .ok_or(ErrorCode::MathOverflow)?
            .max(0); // Floor at 0

        // Update dispute count if applicable
        if matches!(failure_reason, FailureReason::Dispute) {
            profile.dispute_count = profile.dispute_count.checked_add(1).ok_or(ErrorCode::MathOverflow)?;
        }

        // Update derived values
        profile.trust_level = calculate_trust_level(profile.reputation_score);
        profile.clout_multiplier = calculate_clout_multiplier(profile.reputation_score);

        // Emit event
        emit!(TransactionRecorded {
            user: profile.user,
            transaction_type,
            value: transaction_value,
            success: false,
            new_reputation: profile.reputation_score,
            reputation_change: reputation_penalty as i8,
        });

        Ok(())
    }

    /// Award CLOUT bonus based on loyalty
    pub fn award_clout_bonus(
        ctx: Context<AwardBonus>,
        base_amount: u64,
        bonus_reason: BonusReason,
    ) -> Result<()> {
        let profile = &mut ctx.accounts.profile;
        let clock = Clock::get()?;

        // Calculate bonus multiplier based on loyalty profile
        let bonus_multiplier = calculate_bonus_multiplier(profile, bonus_reason)?;
        let bonus_amount = base_amount
            .checked_mul(bonus_multiplier as u64)
            .ok_or(ErrorCode::MathOverflow)?
            .checked_div(100)
            .ok_or(ErrorCode::MathOverflow)?;

        // Update profile with bonus
        profile.total_clout_earned = profile.total_clout_earned
            .checked_add(bonus_amount)
            .ok_or(ErrorCode::MathOverflow)?;
        profile.last_bonus_at = clock.unix_timestamp;

        // Emit event
        emit!(CloutBonusAwarded {
            user: profile.user,
            base_amount,
            bonus_amount,
            bonus_multiplier,
            bonus_reason,
        });

        Ok(())
    }

    /// Update user's social verification status
    pub fn update_social_verification(
        ctx: Context<UpdateSocialVerification>,
        platform: SocialPlatform,
        verified: bool,
    ) -> Result<()> {
        let profile = &mut ctx.accounts.profile;

        match platform {
            SocialPlatform::Twitter => profile.twitter_verified = verified,
            SocialPlatform::Discord => profile.discord_verified = verified,
            SocialPlatform::Telegram => profile.telegram_verified = verified,
            SocialPlatform::GitHub => profile.github_verified = verified,
        }

        // Recalculate reputation with social verification bonus
        let social_bonus = if verified { 5 } else { 0 };
        profile.reputation_score = profile.reputation_score
            .checked_add(social_bonus)
            .ok_or(ErrorCode::MathOverflow)?
            .min(100);

        profile.trust_level = calculate_trust_level(profile.reputation_score);
        profile.clout_multiplier = calculate_clout_multiplier(profile.reputation_score);

        Ok(())
    }

    // Helper functions
    fn calculate_trust_level(reputation: u8) -> u8 {
        match reputation {
            0..=20 => 1,   // Very Low
            21..=40 => 2,   // Low
            41..=60 => 3,   // Medium
            61..=80 => 4,   // High
            81..=100 => 5,  // Very High
            _ => 1,
        }
    }

    fn calculate_clout_multiplier(reputation: u8) -> u8 {
        match reputation {
            0..=20 => 100,  // 1x (no bonus)
            21..=40 => 110,  // 1.1x
            41..=60 => 125,  // 1.25x
            61..=80 => 150,  // 1.5x
            81..=100 => 200, // 2x
            _ => 100,
        }
    }

    fn calculate_reputation_boost(
        value: u64,
        transaction_type: TransactionType,
        current_trust: u8,
    ) -> Result<u8> {
        let base_boost = match transaction_type {
            TransactionType::NftPurchase => 2,
            TransactionType::NftSale => 3,
            TransactionType::Staking => 1,
            TransactionType::Governance => 5,
            TransactionType::SocialActivity => 1,
        };

        // Higher trust users get smaller boosts (diminishing returns)
        let trust_modifier = match current_trust {
            1..=2 => 100, // Full boost for low trust
            3 => 80,      // 80% boost for medium trust
            4 => 60,      // 60% boost for high trust
            5 => 40,      // 40% boost for very high trust
            _ => 100,
        };

        let value_modifier = if value > 1_000_000_000 { 150 } else { 100 }; // 1 SOL threshold

        let final_boost = base_boost
            .checked_mul(trust_modifier)
            .ok_or(ErrorCode::MathOverflow)?
            .checked_mul(value_modifier)
            .ok_or(ErrorCode::MathOverflow)?
            .checked_div(10000)
            .ok_or(ErrorCode::MathOverflow)?;

        Ok(final_boost as u8)
    }

    fn calculate_reputation_penalty(failure_reason: FailureReason, current_trust: u8) -> Result<u8> {
        let base_penalty = match failure_reason {
            FailureReason::PaymentFailure => 5,
            FailureReason::Dispute => 10,
            FailureReason::Fraud => 25,
            FailureReason::Spam => 15,
        };

        // Higher trust users lose more reputation (more to lose)
        let trust_modifier = match current_trust {
            1..=2 => 50,  // 50% penalty for low trust
            3 => 75,      // 75% penalty for medium trust
            4 => 100,     // Full penalty for high trust
            5 => 125,     // 125% penalty for very high trust
            _ => 100,
        };

        let final_penalty = base_penalty
            .checked_mul(trust_modifier)
            .ok_or(ErrorCode::MathOverflow)?
            .checked_div(100)
            .ok_or(ErrorCode::MathOverflow)?;

        Ok(final_penalty as u8)
    }

    fn calculate_bonus_multiplier(profile: &Account<LoyaltyProfile>, reason: BonusReason) -> Result<u8> {
        let base_multiplier = match reason {
            BonusReason::FirstTransaction => 150,
            BonusReason::LoyaltyStreak => 120,
            BonusReason::HighValueTransaction => 130,
            BonusReason::SocialVerification => 110,
            BonusReason::GovernanceParticipation => 140,
        };

        // Apply CLOUT multiplier from profile
        let final_multiplier = base_multiplier
            .checked_mul(profile.clout_multiplier as u16)
            .ok_or(ErrorCode::MathOverflow)?
            .checked_div(100)
            .ok_or(ErrorCode::MathOverflow)?;

        Ok(final_multiplier as u8)
    }
}

#[derive(Accounts)]
pub struct InitializeProfile<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + LoyaltyProfile::INIT_SPACE,
        seeds = [b"loyalty", user.key().as_ref()],
        bump
    )]
    pub profile: Account<'info, LoyaltyProfile>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RecordTransaction<'info> {
    #[account(mut)]
    pub profile: Account<'info, LoyaltyProfile>,

    /// CHECK: User account
    pub user: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct AwardBonus<'info> {
    #[account(mut)]
    pub profile: Account<'info, LoyaltyProfile>,

    /// CHECK: User account
    pub user: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct UpdateSocialVerification<'info> {
    #[account(mut)]
    pub profile: Account<'info, LoyaltyProfile>,

    #[account(mut)]
    pub user: Signer<'info>,
}

#[account]
#[derive(InitSpace)]
pub struct LoyaltyProfile {
    pub bump: u8,
    pub user: Pubkey,
    pub reputation_score: u8,
    pub trust_level: u8,
    pub clout_multiplier: u8,
    pub total_transactions: u64,
    pub successful_transactions: u64,
    pub dispute_count: u64,
    pub total_clout_earned: u64,
    pub created_at: i64,
    pub last_activity: i64,
    pub last_bonus_at: i64,
    pub twitter_verified: bool,
    pub discord_verified: bool,
    pub telegram_verified: bool,
    pub github_verified: bool,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, InitSpace)]
pub enum TransactionType {
    NftPurchase,
    NftSale,
    Staking,
    Governance,
    SocialActivity,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum FailureReason {
    PaymentFailure,
    Dispute,
    Fraud,
    Spam,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum BonusReason {
    FirstTransaction,
    LoyaltyStreak,
    HighValueTransaction,
    SocialVerification,
    GovernanceParticipation,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum SocialPlatform {
    Twitter,
    Discord,
    Telegram,
    GitHub,
}

#[derive(Clone)]
pub struct TransactionRecord {
    pub user: Pubkey,
    pub transaction_type: TransactionType,
    pub value: u64,
    pub success: bool,
    pub timestamp: i64,
    pub reputation_change: u8,
}

// Events
#[event]
pub struct TransactionRecorded {
    pub user: Pubkey,
    pub transaction_type: TransactionType,
    pub value: u64,
    pub success: bool,
    pub new_reputation: u8,
    pub reputation_change: i8,
}

#[event]
pub struct CloutBonusAwarded {
    pub user: Pubkey,
    pub base_amount: u64,
    pub bonus_amount: u64,
    pub bonus_multiplier: u8,
    pub bonus_reason: BonusReason,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Calculation overflow detected.")]
    MathOverflow,
    #[msg("Invalid reputation score.")]
    InvalidReputationScore,
    #[msg("User profile not found.")]
    ProfileNotFound,
    #[msg("Insufficient permissions.")]
    InsufficientPermissions,
}

