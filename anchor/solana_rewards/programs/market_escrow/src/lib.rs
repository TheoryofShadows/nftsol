use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("marketEscrow11111111111111111111111111111");

#[program]
pub mod market_escrow {
    use super::*;

    /// Create a new listing escrow PDA. Funds and NFTs remain in user custody
    /// until a buyer executes the sale.
    pub fn create_listing(ctx: Context<CreateListing>, price_lamports: u64) -> Result<()> {
        let listing = &mut ctx.accounts.listing;
        listing.bump = ctx.bumps.listing;
        listing.seller = ctx.accounts.seller.key();
        listing.price_lamports = price_lamports;
        listing.mint = ctx.accounts.nft_mint;
        listing.creation_ts = Clock::get()?.unix_timestamp;
        listing.status = ListingStatus::Active;
        Ok(())
    }

    /// Buyer executes the sale by transferring SOL to escrow. In a full
    /// implementation this would also transfer the NFT and distribute fees.
    pub fn execute_sale(ctx: Context<ExecuteSale>) -> Result<()> {
        let listing = &mut ctx.accounts.listing;
        require!(listing.status == ListingStatus::Active, EscrowError::InactiveListing);

        **ctx.accounts.buyer.to_account_info().try_borrow_mut_lamports()? -= listing.price_lamports;
        **ctx.accounts.escrow_vault.to_account_info().try_borrow_mut_lamports()? += listing.price_lamports;

        listing.status = ListingStatus::PendingSettlement;
        listing.buyer = Some(ctx.accounts.buyer.key());
        listing.sale_ts = Some(Clock::get()?.unix_timestamp);
        Ok(())
    }
}

#[account]
pub struct Listing {
    pub bump: u8,
    pub seller: Pubkey,
    pub buyer: Option<Pubkey>,
    pub mint: Pubkey,
    pub price_lamports: u64,
    pub creation_ts: i64,
    pub sale_ts: Option<i64>,
    pub status: ListingStatus,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum ListingStatus {
    Active,
    PendingSettlement,
    Settled,
    Cancelled,
}

#[derive(Accounts)]
pub struct CreateListing<'info> {
    #[account(
        init,
        payer = seller,
        space = 8 + Listing::MAX_SIZE,
        seeds = [b"listing", seller.key().as_ref(), nft_mint.key().as_ref()],
        bump
    )]
    pub listing: Account<'info, Listing>,
    /// CHECK: escrow PDA, holds payment until settlement.
    #[account(
        seeds = [b"escrow", listing.key().as_ref()],
        bump
    )]
    pub escrow_vault: UncheckedAccount<'info>,
    #[account(mut)]
    pub seller: Signer<'info>,
    pub nft_mint: Pubkey,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ExecuteSale<'info> {
    #[account(mut)]
    pub listing: Account<'info, Listing>,
    /// CHECK: SOL holding account
    #[account(
        mut,
        seeds = [b"escrow", listing.key().as_ref()],
        bump = listing.bump
    )]
    pub escrow_vault: UncheckedAccount<'info>,
    #[account(mut)]
    pub buyer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

impl Listing {
    pub const MAX_SIZE: usize = 1 // bump
        + 32 // seller
        + 1 + 32 // buyer option
        + 32 // mint
        + 8 // price
        + 8 // creation ts
        + 1 + 8 // sale_ts option
        + 1; // status enum
}

#[error_code]
pub enum EscrowError {
    #[msg("Listing is not active.")]
    InactiveListing,
}
