use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Mint, Transfer};

declare_id!("9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM");

#[program]
pub mod market_escrow {
    use super::*;

    /// Create an escrow for NFT purchase with trust-based payment terms
    pub fn create_escrow(
        ctx: Context<CreateEscrow>,
        price: u64,
        trust_level: u8,
        escrow_duration: i64,
    ) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        let clock = Clock::get()?;

        escrow.bump = ctx.bumps.escrow;
        escrow.buyer = ctx.accounts.buyer.key();
        escrow.seller = ctx.accounts.seller.key();
        escrow.nft_mint = ctx.accounts.nft_mint.key();
        escrow.price = price;
        escrow.trust_level = trust_level;
        escrow.status = EscrowStatus::Active;
        escrow.created_at = clock.unix_timestamp;
        escrow.expires_at = clock.unix_timestamp + escrow_duration;
        escrow.dispute_count = 0;

        // Calculate trust-based payment terms
        let payment_terms = calculate_payment_terms(trust_level, price)?;
        escrow.initial_payment = payment_terms.initial_payment;
        escrow.escrow_amount = payment_terms.escrow_amount;
        escrow.release_delay = payment_terms.release_delay;

        Ok(())
    }

    /// Make initial payment based on trust level
    pub fn make_initial_payment(ctx: Context<MakePayment>) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        let clock = Clock::get()?;

        require!(escrow.status == EscrowStatus::Active, ErrorCode::EscrowNotActive);
        require!(clock.unix_timestamp <= escrow.expires_at, ErrorCode::EscrowExpired);

        // Transfer initial payment to seller
        let transfer_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.buyer_token.to_account_info(),
                to: ctx.accounts.seller_token.to_account_info(),
                authority: ctx.accounts.buyer.to_account_info(),
            },
        );
        token::transfer(transfer_ctx, escrow.initial_payment)?;

        // Transfer escrow amount to escrow vault
        let transfer_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.buyer_token.to_account_info(),
                to: ctx.accounts.escrow_vault.to_account_info(),
                authority: ctx.accounts.buyer.to_account_info(),
            },
        );
        token::transfer(transfer_ctx, escrow.escrow_amount)?;

        escrow.status = EscrowStatus::PaymentMade;
        escrow.payment_made_at = clock.unix_timestamp;

        Ok(())
    }

    /// Release escrow funds to seller (after dispute period)
    pub fn release_escrow(ctx: Context<ReleaseEscrow>) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        let clock = Clock::get()?;

        require!(escrow.status == EscrowStatus::PaymentMade, ErrorCode::InvalidEscrowStatus);
        require!(
            clock.unix_timestamp >= escrow.payment_made_at + escrow.release_delay,
            ErrorCode::ReleaseDelayNotMet
        );

        // Transfer escrow funds to seller
        let seeds = &[
            b"escrow",
            escrow.buyer.as_ref(),
            escrow.seller.as_ref(),
            &[escrow.bump],
        ];
        let signer = &[&seeds[..]];

        let transfer_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.escrow_vault.to_account_info(),
                to: ctx.accounts.seller_token.to_account_info(),
                authority: ctx.accounts.escrow.to_account_info(),
            },
            signer,
        );
        token::transfer(transfer_ctx, escrow.escrow_amount)?;

        escrow.status = EscrowStatus::Completed;
        escrow.completed_at = clock.unix_timestamp;

        Ok(())
    }

    /// Initiate dispute for escrow
    pub fn initiate_dispute(ctx: Context<InitiateDispute>, reason: String) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        let clock = Clock::get()?;

        require!(escrow.status == EscrowStatus::PaymentMade, ErrorCode::InvalidEscrowStatus);
        require!(escrow.dispute_count < 3, ErrorCode::MaxDisputesReached);

        escrow.status = EscrowStatus::Disputed;
        escrow.dispute_count += 1;
        escrow.dispute_initiated_at = clock.unix_timestamp;
        escrow.dispute_reason = reason;

        Ok(())
    }

    /// Resolve dispute (arbitrator only)
    pub fn resolve_dispute(
        ctx: Context<ResolveDispute>,
        resolution: DisputeResolution,
        refund_amount: u64,
    ) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;

        require!(escrow.status == EscrowStatus::Disputed, ErrorCode::NoActiveDispute);

        match resolution {
            DisputeResolution::FavorBuyer => {
                // Refund to buyer
                let seeds = &[
                    b"escrow",
                    escrow.buyer.as_ref(),
                    escrow.seller.as_ref(),
                    &[escrow.bump],
                ];
                let signer = &[&seeds[..]];

                let transfer_ctx = CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.escrow_vault.to_account_info(),
                        to: ctx.accounts.buyer_token.to_account_info(),
                        authority: ctx.accounts.escrow.to_account_info(),
                    },
                    signer,
                );
                token::transfer(transfer_ctx, refund_amount)?;
            }
            DisputeResolution::FavorSeller => {
                // Release to seller
                let seeds = &[
                    b"escrow",
                    escrow.buyer.as_ref(),
                    escrow.seller.as_ref(),
                    &[escrow.bump],
                ];
                let signer = &[&seeds[..]];

                let transfer_ctx = CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.escrow_vault.to_account_info(),
                        to: ctx.accounts.seller_token.to_account_info(),
                        authority: ctx.accounts.escrow.to_account_info(),
                    },
                    signer,
                );
                token::transfer(transfer_ctx, escrow.escrow_amount)?;
            }
            DisputeResolution::Split => {
                // Split between buyer and seller
                let buyer_amount = refund_amount;
                let seller_amount = escrow.escrow_amount.checked_sub(refund_amount)
                    .ok_or(ErrorCode::MathOverflow)?;

                let seeds = &[
                    b"escrow",
                    escrow.buyer.as_ref(),
                    escrow.seller.as_ref(),
                    &[escrow.bump],
                ];
                let signer = &[&seeds[..]];

                // Refund to buyer
                let transfer_ctx = CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.escrow_vault.to_account_info(),
                        to: ctx.accounts.buyer_token.to_account_info(),
                        authority: ctx.accounts.escrow.to_account_info(),
                    },
                    signer,
                );
                token::transfer(transfer_ctx, buyer_amount)?;

                // Pay seller
                let transfer_ctx = CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.escrow_vault.to_account_info(),
                        to: ctx.accounts.seller_token.to_account_info(),
                        authority: ctx.accounts.escrow.to_account_info(),
                    },
                    signer,
                );
                token::transfer(transfer_ctx, seller_amount)?;
            }
        }

        escrow.status = EscrowStatus::Resolved;
        escrow.resolved_at = Clock::get()?.unix_timestamp;

        Ok(())
    }

    /// Cancel escrow (before payment)
    pub fn cancel_escrow(ctx: Context<CancelEscrow>) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;

        require!(escrow.status == EscrowStatus::Active, ErrorCode::InvalidEscrowStatus);

        escrow.status = EscrowStatus::Cancelled;
        escrow.cancelled_at = Clock::get()?.unix_timestamp;

        Ok(())
    }

    // Helper function to calculate payment terms based on trust level
    fn calculate_payment_terms(trust_level: u8, price: u64) -> Result<PaymentTerms> {
        let terms = match trust_level {
            0..=20 => PaymentTerms {
                initial_payment: price, // 100% upfront for low trust
                escrow_amount: 0,
                release_delay: 0,
            },
            21..=40 => PaymentTerms {
                initial_payment: price.checked_mul(80).ok_or(ErrorCode::MathOverflow)? / 100, // 80% upfront
                escrow_amount: price.checked_mul(20).ok_or(ErrorCode::MathOverflow)? / 100, // 20% escrow
                release_delay: 7 * 24 * 60 * 60, // 7 days
            },
            41..=60 => PaymentTerms {
                initial_payment: price.checked_mul(60).ok_or(ErrorCode::MathOverflow)? / 100, // 60% upfront
                escrow_amount: price.checked_mul(40).ok_or(ErrorCode::MathOverflow)? / 100, // 40% escrow
                release_delay: 3 * 24 * 60 * 60, // 3 days
            },
            61..=80 => PaymentTerms {
                initial_payment: price.checked_mul(40).ok_or(ErrorCode::MathOverflow)? / 100, // 40% upfront
                escrow_amount: price.checked_mul(60).ok_or(ErrorCode::MathOverflow)? / 100, // 60% escrow
                release_delay: 1 * 24 * 60 * 60, // 1 day
            },
            81..=100 => PaymentTerms {
                initial_payment: price.checked_mul(20).ok_or(ErrorCode::MathOverflow)? / 100, // 20% upfront
                escrow_amount: price.checked_mul(80).ok_or(ErrorCode::MathOverflow)? / 100, // 80% escrow
                release_delay: 0, // No delay for high trust
            },
            _ => return Err(ErrorCode::InvalidTrustLevel.into()),
        };

        Ok(terms)
    }
}

#[derive(Accounts)]
pub struct CreateEscrow<'info> {
    #[account(
        init,
        payer = buyer,
        space = 8 + Escrow::INIT_SPACE,
        seeds = [b"escrow", buyer.key().as_ref(), seller.key().as_ref()],
        bump
    )]
    pub escrow: Account<'info, Escrow>,

    #[account(mut)]
    pub buyer: Signer<'info>,

    /// CHECK: Seller account
    pub seller: AccountInfo<'info>,

    /// CHECK: NFT mint account
    pub nft_mint: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct MakePayment<'info> {
    #[account(mut)]
    pub escrow: Account<'info, Escrow>,

    #[account(mut)]
    pub buyer: Signer<'info>,

    #[account(mut)]
    pub buyer_token: Account<'info, TokenAccount>,

    #[account(mut)]
    pub seller_token: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [b"escrow", escrow.buyer.as_ref(), escrow.seller.as_ref()],
        bump = escrow.bump
    )]
    pub escrow_vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct ReleaseEscrow<'info> {
    #[account(mut)]
    pub escrow: Account<'info, Escrow>,

    #[account(mut)]
    pub seller_token: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [b"escrow", escrow.buyer.as_ref(), escrow.seller.as_ref()],
        bump = escrow.bump
    )]
    pub escrow_vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct InitiateDispute<'info> {
    #[account(mut)]
    pub escrow: Account<'info, Escrow>,

    #[account(mut)]
    pub initiator: Signer<'info>,
}

#[derive(Accounts)]
pub struct ResolveDispute<'info> {
    #[account(mut)]
    pub escrow: Account<'info, Escrow>,

    #[account(mut)]
    pub arbitrator: Signer<'info>,

    #[account(mut)]
    pub buyer_token: Account<'info, TokenAccount>,

    #[account(mut)]
    pub seller_token: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [b"escrow", escrow.buyer.as_ref(), escrow.seller.as_ref()],
        bump = escrow.bump
    )]
    pub escrow_vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct CancelEscrow<'info> {
    #[account(mut)]
    pub escrow: Account<'info, Escrow>,

    #[account(mut)]
    pub buyer: Signer<'info>,
}

#[account]
#[derive(InitSpace)]
pub struct Escrow {
    pub bump: u8,
    pub buyer: Pubkey,
    pub seller: Pubkey,
    pub nft_mint: Pubkey,
    pub price: u64,
    pub trust_level: u8,
    pub status: EscrowStatus,
    pub initial_payment: u64,
    pub escrow_amount: u64,
    pub release_delay: i64,
    pub created_at: i64,
    pub expires_at: i64,
    pub payment_made_at: i64,
    pub completed_at: i64,
    pub cancelled_at: i64,
    pub dispute_count: u8,
    pub dispute_initiated_at: i64,
    pub dispute_reason: String,
    pub resolved_at: i64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, InitSpace)]
pub enum EscrowStatus {
    Active,
    PaymentMade,
    Completed,
    Disputed,
    Resolved,
    Cancelled,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum DisputeResolution {
    FavorBuyer,
    FavorSeller,
    Split,
}

#[derive(Clone)]
pub struct PaymentTerms {
    pub initial_payment: u64,
    pub escrow_amount: u64,
    pub release_delay: i64,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Escrow is not in active status.")]
    EscrowNotActive,
    #[msg("Escrow has expired.")]
    EscrowExpired,
    #[msg("Invalid escrow status for this operation.")]
    InvalidEscrowStatus,
    #[msg("Release delay has not been met.")]
    ReleaseDelayNotMet,
    #[msg("No active dispute to resolve.")]
    NoActiveDispute,
    #[msg("Maximum disputes reached.")]
    MaxDisputesReached,
    #[msg("Invalid trust level.")]
    InvalidTrustLevel,
    #[msg("Calculation overflow detected.")]
    MathOverflow,
}

