#![allow(unexpected_cfgs)]

use anchor_lang::prelude::*;
use anchor_lang::system_program;
use anchor_spl::token::{Mint, Token, TokenAccount};

use loyalty_registry::program::LoyaltyRegistry as LoyaltyRegistryProgram;
use loyalty_registry::{self, LoyaltyProfile, RegistryConfig, PROFILE_SEED, REGISTRY_CONFIG_SEED};
use rewards_vault::program::RewardsVault as RewardsVaultProgram;
use rewards_vault::{self, VaultConfig, VAULT_SIGNER_SEED};

pub const LISTING_SEED: &[u8] = b"listing";
pub const ESCROW_VAULT_SEED: &[u8] = b"escrow";
pub const RECEIPT_SEED: &[u8] = b"receipt";
const BPS_DENOMINATOR: u64 = 10_000;

declare_id!("8um9wXkGXVuxs9jVCpt3DrzkmMAiLDKrKkaHSLyPqPcX");

#[program]
pub mod market_escrow {
    use super::*;

    /// Creates a new listing PDA along with an escrow vault that will hold SOL
    /// until the sale settles.
    #[allow(clippy::too_many_arguments)]
    pub fn create_listing(
        ctx: Context<CreateListing>,
        listing_id: u64,
        price_lamports: u64,
        expiration_ts: Option<i64>,
        royalty_bps: u16,
        treasury_bps: u16,
        marketplace_fee_bps: u16,
    ) -> Result<()> {
        require!(price_lamports > 0, EscrowError::InvalidListingPrice);
        validate_fee_configuration(royalty_bps, treasury_bps, marketplace_fee_bps)?;

        let listing = &mut ctx.accounts.listing;
        listing.bump = ctx.bumps.listing;
        listing.escrow_bump = ctx.bumps.escrow_vault;
        listing.seller = ctx.accounts.seller.key();
        listing.buyer = None;
        listing.mint = ctx.accounts.nft_mint.key();
        listing.listing_id = listing_id;
        listing.price_lamports = price_lamports;
        listing.creation_ts = Clock::get()?.unix_timestamp;
        listing.expiration_ts = expiration_ts;
        listing.sale_ts = None;
        listing.settlement_ts = None;
        listing.status = ListingStatus::Active;
        listing.royalty_bps = royalty_bps;
        listing.royalty_destination = ctx.accounts.royalty_destination.key();
        listing.treasury_bps = treasury_bps;
        listing.marketplace_fee_bps = marketplace_fee_bps;

        let escrow = &mut ctx.accounts.escrow_vault;
        escrow.bump = ctx.bumps.escrow_vault;
        escrow.listing = listing.key();
        escrow.total_deposited = 0;

        Ok(())
    }

    /// Cancels an active listing before any sale is executed.
    pub fn cancel_listing(ctx: Context<CancelListing>) -> Result<()> {
        let listing = &mut ctx.accounts.listing;
        require!(
            listing.status == ListingStatus::Active,
            EscrowError::ListingNotActive
        );
        require!(
            ctx.accounts.escrow_vault.total_deposited == 0,
            EscrowError::OutstandingEscrowBalance
        );

        listing.status = ListingStatus::Cancelled;
        listing.settlement_ts = Some(Clock::get()?.unix_timestamp);
        Ok(())
    }

    /// Buyer transfers SOL into escrow. Once deposited, the listing moves into
    /// a pending settlement state awaiting admin settlement.
    pub fn execute_sale(ctx: Context<ExecuteSale>) -> Result<()> {
        let listing = &mut ctx.accounts.listing;
        require!(
            listing.status == ListingStatus::Active,
            EscrowError::ListingNotActive
        );

        if let Some(expiration) = listing.expiration_ts {
            require!(
                Clock::get()?.unix_timestamp <= expiration,
                EscrowError::ListingExpired
            );
        }

        require!(
            ctx.accounts.escrow_vault.total_deposited == 0,
            EscrowError::EscrowAlreadyFunded
        );
        require_keys_eq!(
            listing.seller,
            ctx.accounts.seller.key(),
            EscrowError::SellerMismatch
        );

        system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.buyer.to_account_info(),
                    to: ctx.accounts.escrow_vault.to_account_info(),
                },
            ),
            listing.price_lamports,
        )?;

        let escrow = &mut ctx.accounts.escrow_vault;
        escrow.total_deposited = escrow
            .total_deposited
            .checked_add(listing.price_lamports)
            .ok_or(EscrowError::MathOverflow)?;

        listing.status = ListingStatus::PendingSettlement;
        listing.buyer = Some(ctx.accounts.buyer.key());
        listing.sale_ts = Some(Clock::get()?.unix_timestamp);
        Ok(())
    }

    /// Settles a sale by distributing escrowed funds, minting reward tokens,
    /// and recording loyalty activity.
    pub fn settle_sale(
        ctx: Context<SettleSale>,
        reward_amount: u64,
        loyalty_bonus_points: u64,
    ) -> Result<()> {
        let listing = &mut ctx.accounts.listing;
        require!(
            listing.status == ListingStatus::PendingSettlement,
            EscrowError::ListingNotPending
        );
        let buyer_key = listing.buyer.ok_or(EscrowError::MissingBuyer)?;
        require_keys_eq!(
            buyer_key,
            ctx.accounts.buyer.key(),
            EscrowError::BuyerMismatch
        );
        require_keys_eq!(
            listing.royalty_destination,
            ctx.accounts.royalty_destination.key(),
            EscrowError::RoyaltyDestinationMismatch
        );
        require!(
            ctx.accounts.escrow_vault.total_deposited >= listing.price_lamports,
            EscrowError::InsufficientEscrowBalance
        );

        let price = listing.price_lamports;
        let royalty_cut = compute_fee(price, listing.royalty_bps)?;
        let treasury_cut = compute_fee(price, listing.treasury_bps)?;
        let marketplace_cut = compute_fee(price, listing.marketplace_fee_bps)?;
        let total_fees = royalty_cut
            .checked_add(treasury_cut)
            .ok_or(EscrowError::MathOverflow)?
            .checked_add(marketplace_cut)
            .ok_or(EscrowError::MathOverflow)?;
        require!(total_fees <= price, EscrowError::InvalidFeeConfiguration);
        let seller_payout = price
            .checked_sub(total_fees)
            .ok_or(EscrowError::MathOverflow)?;

        disburse(
            &ctx.accounts.escrow_vault.to_account_info(),
            &ctx.accounts.seller.to_account_info(),
            seller_payout,
        )?;
        if royalty_cut > 0 {
            disburse(
                &ctx.accounts.escrow_vault.to_account_info(),
                &ctx.accounts.royalty_destination.to_account_info(),
                royalty_cut,
            )?;
        }
        if treasury_cut > 0 {
            disburse(
                &ctx.accounts.escrow_vault.to_account_info(),
                &ctx.accounts.treasury_destination.to_account_info(),
                treasury_cut,
            )?;
        }
        if marketplace_cut > 0 {
            disburse(
                &ctx.accounts.escrow_vault.to_account_info(),
                &ctx.accounts.marketplace_fee_destination.to_account_info(),
                marketplace_cut,
            )?;
        }

        ctx.accounts.escrow_vault.total_deposited = ctx
            .accounts
            .escrow_vault
            .total_deposited
            .checked_sub(price)
            .ok_or(EscrowError::MathOverflow)?;

        let now = Clock::get()?.unix_timestamp;
        listing.status = ListingStatus::Settled;
        listing.settlement_ts = Some(now);

        // Mint buyer rewards if configured.
        if reward_amount > 0 {
            require_keys_eq!(
                ctx.accounts.reward_vault.authority,
                ctx.accounts.reward_authority.key(),
                EscrowError::UnauthorizedRewardAuthority
            );
            require_keys_eq!(
                ctx.accounts.reward_vault.reward_mint,
                ctx.accounts.reward_mint.key(),
                EscrowError::MismatchedRewardMint
            );
            let reward_ctx = CpiContext::new(
                ctx.accounts.rewards_vault_program.to_account_info(),
                rewards_vault::cpi::accounts::MintRewards {
                    vault_config: ctx.accounts.reward_vault.to_account_info(),
                    vault_signer: ctx.accounts.vault_signer.to_account_info(),
                    reward_mint: ctx.accounts.reward_mint.to_account_info(),
                    recipient: ctx.accounts.buyer_reward_account.to_account_info(),
                    authority: ctx.accounts.reward_authority.to_account_info(),
                    token_program: ctx.accounts.token_program.to_account_info(),
                },
            );
            rewards_vault::cpi::mint_rewards(reward_ctx, reward_amount)?;
        }

        // Update loyalty registry.
        let loyalty_ctx = CpiContext::new(
            ctx.accounts.loyalty_program.to_account_info(),
            loyalty_registry::cpi::accounts::RecordActivity {
                actor: ctx.accounts.buyer.to_account_info(),
                profile: ctx.accounts.loyalty_profile.to_account_info(),
                registry_config: ctx.accounts.loyalty_registry_config.to_account_info(),
                authority: ctx.accounts.loyalty_authority.to_account_info(),
            },
        );
        loyalty_registry::cpi::record_activity(loyalty_ctx, price, loyalty_bonus_points)?;

        // Persist receipt for analytics / auditing.
        let receipt = &mut ctx.accounts.receipt;
        receipt.bump = ctx.bumps.receipt;
        receipt.listing = listing.key();
        receipt.buyer = buyer_key;
        receipt.seller = ctx.accounts.seller.key();
        receipt.amount_paid = price;
        receipt.seller_proceeds = seller_payout;
        receipt.royalty_paid = royalty_cut;
        receipt.treasury_paid = treasury_cut;
        receipt.marketplace_fee_paid = marketplace_cut;
        receipt.rewards_minted = reward_amount;
        receipt.loyalty_points_awarded = loyalty_bonus_points;
        receipt.timestamp = now;

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(listing_id: u64)]
pub struct CreateListing<'info> {
    #[account(
        init,
        payer = seller,
        space = Listing::LEN,
        seeds = [LISTING_SEED, seller.key().as_ref(), nft_mint.key().as_ref(), &listing_id.to_le_bytes()],
        bump
    )]
    pub listing: Account<'info, Listing>,
    #[account(
        init,
        payer = seller,
        space = EscrowVault::LEN,
        seeds = [ESCROW_VAULT_SEED, listing.key().as_ref()],
        bump
    )]
    pub escrow_vault: Account<'info, EscrowVault>,
    #[account(mut)]
    pub seller: Signer<'info>,
    pub nft_mint: Account<'info, Mint>,
    /// CHECK: stored and verified during settlement
    pub royalty_destination: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CancelListing<'info> {
    #[account(mut, has_one = seller)]
    pub listing: Account<'info, Listing>,
    #[account(
        mut,
        seeds = [ESCROW_VAULT_SEED, listing.key().as_ref()],
        bump = listing.escrow_bump
    )]
    pub escrow_vault: Account<'info, EscrowVault>,
    pub seller: Signer<'info>,
}

#[derive(Accounts)]
pub struct ExecuteSale<'info> {
    #[account(mut, has_one = seller)]
    pub listing: Account<'info, Listing>,
    #[account(
        mut,
        seeds = [ESCROW_VAULT_SEED, listing.key().as_ref()],
        bump = listing.escrow_bump
    )]
    pub escrow_vault: Account<'info, EscrowVault>,
    #[account(mut)]
    pub buyer: Signer<'info>,
    /// CHECK: Seller receives payouts during settlement.
    pub seller: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SettleSale<'info> {
    #[account(mut, has_one = seller)]
    pub listing: Account<'info, Listing>,
    #[account(
        mut,
        seeds = [ESCROW_VAULT_SEED, listing.key().as_ref()],
        bump = listing.escrow_bump
    )]
    pub escrow_vault: Account<'info, EscrowVault>,
    #[account(mut)]
    pub seller: Signer<'info>,
    /// CHECK: buyer validated against listing.buyer
    pub buyer: UncheckedAccount<'info>,
    #[account(mut)]
    pub treasury_destination: SystemAccount<'info>,
    #[account(mut)]
    pub marketplace_fee_destination: SystemAccount<'info>,
    #[account(mut)]
    pub royalty_destination: SystemAccount<'info>,
    #[account(
        init,
        payer = seller,
        space = SaleReceipt::LEN,
        seeds = [RECEIPT_SEED, listing.key().as_ref(), buyer.key().as_ref()],
        bump
    )]
    pub receipt: Account<'info, SaleReceipt>,
    #[account(
        mut,
        has_one = reward_mint @ EscrowError::MismatchedRewardMint
    )]
    pub reward_vault: Account<'info, VaultConfig>,
    /// CHECK: PDA signer validated via seeds.
    #[account(
        seeds = [VAULT_SIGNER_SEED, reward_mint.key().as_ref()],
        bump = reward_vault.signer_bump
    )]
    pub vault_signer: UncheckedAccount<'info>,
    #[account(mut)]
    pub reward_mint: Account<'info, Mint>,
    #[account(
        mut,
        constraint = buyer_reward_account.mint == reward_mint.key(),
        constraint = buyer_reward_account.owner == buyer.key()
    )]
    pub buyer_reward_account: Account<'info, TokenAccount>,
    pub reward_authority: Signer<'info>,
    #[account(
        mut,
        seeds = [PROFILE_SEED, buyer.key().as_ref()],
        bump = loyalty_profile.bump
    )]
    pub loyalty_profile: Account<'info, LoyaltyProfile>,
    #[account(
        mut,
        seeds = [REGISTRY_CONFIG_SEED],
        bump = loyalty_registry_config.bump,
        constraint = loyalty_registry_config.authority == loyalty_authority.key() @ EscrowError::UnauthorizedLoyaltyAuthority
    )]
    pub loyalty_registry_config: Account<'info, RegistryConfig>,
    pub loyalty_authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub rewards_vault_program: Program<'info, RewardsVaultProgram>,
    pub loyalty_program: Program<'info, LoyaltyRegistryProgram>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct Listing {
    pub bump: u8,
    pub escrow_bump: u8,
    pub seller: Pubkey,
    pub buyer: Option<Pubkey>,
    pub mint: Pubkey,
    pub listing_id: u64,
    pub price_lamports: u64,
    pub creation_ts: i64,
    pub expiration_ts: Option<i64>,
    pub sale_ts: Option<i64>,
    pub settlement_ts: Option<i64>,
    pub status: ListingStatus,
    pub royalty_bps: u16,
    pub royalty_destination: Pubkey,
    pub treasury_bps: u16,
    pub marketplace_fee_bps: u16,
}

impl Listing {
    pub const LEN: usize = 8 // discriminator
        + 1 // bump
        + 1 // escrow bump
        + 32 // seller
        + 1 + 32 // buyer option
        + 32 // mint
        + 8 // listing id
        + 8 // price
        + 8 // creation ts
        + 1 + 8 // expiration option
        + 1 + 8 // sale ts option
        + 1 + 8 // settlement ts option
        + 1 // status enum
        + 2 // royalty bps
        + 32 // royalty destination
        + 2 // treasury bps
        + 2; // marketplace fee bps
}

#[account]
pub struct EscrowVault {
    pub bump: u8,
    pub listing: Pubkey,
    pub total_deposited: u64,
}

impl EscrowVault {
    pub const LEN: usize = 8 // discriminator
        + 1 // bump
        + 32 // listing pubkey
        + 8; // lamports deposited
}

#[account]
pub struct SaleReceipt {
    pub bump: u8,
    pub listing: Pubkey,
    pub buyer: Pubkey,
    pub seller: Pubkey,
    pub amount_paid: u64,
    pub seller_proceeds: u64,
    pub royalty_paid: u64,
    pub treasury_paid: u64,
    pub marketplace_fee_paid: u64,
    pub rewards_minted: u64,
    pub loyalty_points_awarded: u64,
    pub timestamp: i64,
}

impl SaleReceipt {
    pub const LEN: usize = 8 // discriminator
        + 1 // bump
        + 32 // listing
        + 32 // buyer
        + 32 // seller
        + 8 // amount paid
        + 8 // seller proceeds
        + 8 // royalty paid
        + 8 // treasury paid
        + 8 // marketplace fee
        + 8 // rewards minted
        + 8 // loyalty points
        + 8; // timestamp
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum ListingStatus {
    Active,
    PendingSettlement,
    Settled,
    Cancelled,
}

fn validate_fee_configuration(
    royalty_bps: u16,
    treasury_bps: u16,
    marketplace_fee_bps: u16,
) -> Result<()> {
    let total = royalty_bps as u64 + treasury_bps as u64 + marketplace_fee_bps as u64;
    require!(
        total <= BPS_DENOMINATOR,
        EscrowError::InvalidFeeConfiguration
    );
    Ok(())
}

fn compute_fee(amount: u64, bps: u16) -> Result<u64> {
    let fee = amount
        .checked_mul(bps as u64)
        .ok_or_else(|| error!(EscrowError::MathOverflow))?
        .checked_div(BPS_DENOMINATOR)
        .ok_or_else(|| error!(EscrowError::MathOverflow))?;
    Ok(fee)
}

fn disburse(from: &AccountInfo, to: &AccountInfo, amount: u64) -> Result<()> {
    if amount == 0 {
        return Ok(());
    }
    require_keys_eq!(*from.owner, crate::ID, EscrowError::InvalidPayoutAccount);
    require_keys_eq!(
        *to.owner,
        system_program::ID,
        EscrowError::InvalidPayoutAccount
    );
    **from.try_borrow_mut_lamports()? = from
        .lamports()
        .checked_sub(amount)
        .ok_or(EscrowError::MathOverflow)?;
    **to.try_borrow_mut_lamports()? = to
        .lamports()
        .checked_add(amount)
        .ok_or(EscrowError::MathOverflow)?;
    Ok(())
}

#[error_code]
pub enum EscrowError {
    #[msg("Listing is not active.")]
    ListingNotActive,
    #[msg("Listing must be pending settlement for this operation.")]
    ListingNotPending,
    #[msg("Listing price must be greater than zero.")]
    InvalidListingPrice,
    #[msg("Total fee configuration exceeds 100%.")]
    InvalidFeeConfiguration,
    #[msg("Arithmetic overflow encountered.")]
    MathOverflow,
    #[msg("No buyer recorded for this listing.")]
    MissingBuyer,
    #[msg("Provided buyer account does not match listing state.")]
    BuyerMismatch,
    #[msg("Provided seller account does not match listing state.")]
    SellerMismatch,
    #[msg("Royalty destination does not match listing configuration.")]
    RoyaltyDestinationMismatch,
    #[msg("Escrow vault balance is insufficient.")]
    InsufficientEscrowBalance,
    #[msg("Escrow vault still holds funds; cancel not allowed.")]
    OutstandingEscrowBalance,
    #[msg("Escrow vault already funded for this listing.")]
    EscrowAlreadyFunded,
    #[msg("Loyalty authority does not match registry configuration.")]
    UnauthorizedLoyaltyAuthority,
    #[msg("Reward authority does not match vault configuration.")]
    UnauthorizedRewardAuthority,
    #[msg("Destination account must be a system account.")]
    InvalidPayoutAccount,
    #[msg("The listing has expired.")]
    ListingExpired,
    #[msg("Reward mint does not match vault configuration.")]
    MismatchedRewardMint,
}
