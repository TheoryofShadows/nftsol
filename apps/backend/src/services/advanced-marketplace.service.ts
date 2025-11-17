import { createLogger } from '../lib/logger';

const logger = createLogger('advanced-marketplace-service');

export enum ListingType {
  FIXED_PRICE = 'fixed_price',
  AUCTION = 'auction',
  OFFER = 'offer',
  BUNDLE = 'bundle',
}

export enum AuctionStatus {
  ACTIVE = 'active',
  ENDED = 'ended',
  CANCELLED = 'cancelled',
}

export interface Listing {
  id: string;
  type: ListingType;
  seller: string;
  sellerName: string;
  price: number;
  currency: 'SOL' | 'USDC' | 'CLOUT';
  createdAt: number;
  expiresAt?: number;
  royaltyPercentage: number;
  creatorRoyalty: string;
}

export interface FixedPriceListing extends Listing {
  type: ListingType.FIXED_PRICE;
  nftMint: string;
  rarity?: number;
  attributes?: Record<string, string>;
}

export interface AuctionListing extends Listing {
  type: ListingType.AUCTION;
  nftMint: string;
  startPrice: number;
  currentPrice: number;
  highestBidder?: string;
  bids: Bid[];
  status: AuctionStatus;
  startTime: number;
  endTime: number;
  minIncrementPercentage: number;
}

export interface Bid {
  bidder: string;
  amount: number;
  timestamp: number;
  txSignature?: string;
}

export interface OfferListing extends Listing {
  type: ListingType.OFFER;
  nftMint: string;
  buyer: string;
  offerStatus: 'pending' | 'accepted' | 'rejected' | 'expired';
  expiresAt: number;
}

export interface BundleListing extends Listing {
  type: ListingType.BUNDLE;
  nfts: Array<{
    mint: string;
    name: string;
    rarity?: number;
  }>;
  bundleDiscount: number; // percentage discount on total
}

export interface CounterOffer {
  id: string;
  originalOfferId: string;
  offerer: string;
  price: number;
  expiresAt: number;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: number;
}

export class AdvancedMarketplaceService {
  private listings: Map<string, Listing> = new Map();
  private auctions: Map<string, AuctionListing> = new Map();
  private offers: Map<string, OfferListing> = new Map();
  private bundles: Map<string, BundleListing> = new Map();
  private counterOffers: Map<string, CounterOffer[]> = new Map();

  /**
   * Create fixed price listing
   */
  public createFixedPriceListing(
    seller: string,
    sellerName: string,
    nftMint: string,
    price: number,
    currency: 'SOL' | 'USDC' | 'CLOUT' = 'SOL',
    royaltyPercentage: number = 5,
    creatorRoyalty: string = seller
  ): FixedPriceListing {
    const listing: FixedPriceListing = {
      id: `fp_${nftMint}_${Date.now()}`,
      type: ListingType.FIXED_PRICE,
      seller,
      sellerName,
      nftMint,
      price,
      currency,
      createdAt: Date.now(),
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
      royaltyPercentage,
      creatorRoyalty,
    };

    this.listings.set(listing.id, listing);
    logger.info(`Created fixed price listing: ${listing.id} for ${nftMint} at ${price} ${currency}`);
    return listing;
  }

  /**
   * Create auction listing
   */
  public createAuctionListing(
    seller: string,
    sellerName: string,
    nftMint: string,
    startPrice: number,
    durationHours: number = 48,
    minIncrementPercentage: number = 5,
    royaltyPercentage: number = 5,
    creatorRoyalty: string = seller
  ): AuctionListing {
    const now = Date.now();
    const endTime = now + durationHours * 60 * 60 * 1000;

    const listing: AuctionListing = {
      id: `auction_${nftMint}_${Date.now()}`,
      type: ListingType.AUCTION,
      seller,
      sellerName,
      nftMint,
      startPrice,
      currentPrice: startPrice,
      status: AuctionStatus.ACTIVE,
      startTime: now,
      endTime,
      minIncrementPercentage,
      bids: [],
      price: startPrice,
      currency: 'SOL',
      createdAt: now,
      expiresAt: endTime,
      royaltyPercentage,
      creatorRoyalty,
    };

    this.auctions.set(listing.id, listing);
    logger.info(`Created auction: ${listing.id} for ${nftMint}, starting at ${startPrice} SOL`);
    return listing;
  }

  /**
   * Place bid on auction
   */
  public placeBid(auctionId: string, bidder: string, amount: number): boolean {
    const auction = this.auctions.get(auctionId);
    if (!auction || auction.status !== AuctionStatus.ACTIVE) {
      return false;
    }

    // Check if auction expired
    if (Date.now() > auction.endTime) {
      auction.status = AuctionStatus.ENDED;
      return false;
    }

    // Check minimum bid increase
    const minBid = auction.currentPrice * (1 + auction.minIncrementPercentage / 100);
    if (amount < minBid) {
      logger.warn(`Bid ${amount} below minimum ${minBid}`);
      return false;
    }

    const bid: Bid = {
      bidder,
      amount,
      timestamp: Date.now(),
    };

    auction.bids.push(bid);
    auction.currentPrice = amount;
    auction.highestBidder = bidder;

    logger.info(`New bid on auction ${auctionId}: ${amount} SOL from ${bidder}`);
    return true;
  }

  /**
   * End auction
   */
  public endAuction(auctionId: string): AuctionListing | null {
    const auction = this.auctions.get(auctionId);
    if (!auction) return null;

    auction.status = AuctionStatus.ENDED;
    logger.info(`Auction ${auctionId} ended. Winner: ${auction.highestBidder} with ${auction.currentPrice} SOL`);
    return auction;
  }

  /**
   * Create offer (buy now price)
   */
  public createOffer(
    buyer: string,
    nftMint: string,
    price: number,
    currency: 'SOL' | 'USDC' | 'CLOUT' = 'SOL',
    durationHours: number = 24
  ): OfferListing {
    const listing: OfferListing = {
      id: `offer_${nftMint}_${buyer}_${Date.now()}`,
      type: ListingType.OFFER,
      seller: nftMint, // placeholder
      sellerName: 'unknown',
      nftMint,
      price,
      buyer,
      currency,
      offerStatus: 'pending',
      createdAt: Date.now(),
      expiresAt: Date.now() + durationHours * 60 * 60 * 1000,
      royaltyPercentage: 5,
      creatorRoyalty: buyer,
    };

    this.offers.set(listing.id, listing);
    logger.info(`Created offer from ${buyer} for ${nftMint}: ${price} ${currency}`);
    return listing;
  }

  /**
   * Create counter-offer
   */
  public createCounterOffer(
    offerId: string,
    offerer: string,
    price: number,
    durationHours: number = 24
  ): CounterOffer | null {
    const originalOffer = this.offers.get(offerId);
    if (!originalOffer) return null;

    const counterOffer: CounterOffer = {
      id: `counter_${offerId}_${Date.now()}`,
      originalOfferId: offerId,
      offerer,
      price,
      expiresAt: Date.now() + durationHours * 60 * 60 * 1000,
      status: 'pending',
      createdAt: Date.now(),
    };

    if (!this.counterOffers.has(offerId)) {
      this.counterOffers.set(offerId, []);
    }
    this.counterOffers.get(offerId)!.push(counterOffer);

    logger.info(`Counter-offer created: ${counterOffer.id} for ${price} SOL`);
    return counterOffer;
  }

  /**
   * Create bundle listing
   */
  public createBundleListing(
    seller: string,
    sellerName: string,
    nfts: Array<{ mint: string; name: string; rarity?: number }>,
    price: number,
    bundleDiscount: number = 10,
    royaltyPercentage: number = 5,
    creatorRoyalty: string = seller
  ): BundleListing {
    const listing: BundleListing = {
      id: `bundle_${Date.now()}`,
      type: ListingType.BUNDLE,
      seller,
      sellerName,
      nfts,
      price,
      bundleDiscount,
      currency: 'SOL',
      createdAt: Date.now(),
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
      royaltyPercentage,
      creatorRoyalty,
    };

    this.bundles.set(listing.id, listing);
    logger.info(`Created bundle: ${listing.id} with ${nfts.length} NFTs at ${price} SOL`);
    return listing;
  }

  /**
   * Accept offer
   */
  public acceptOffer(offerId: string): boolean {
    const offer = this.offers.get(offerId);
    if (!offer || offer.offerStatus !== 'pending') {
      return false;
    }

    offer.offerStatus = 'accepted';
    logger.info(`Offer ${offerId} accepted`);
    return true;
  }

  /**
   * Reject offer
   */
  public rejectOffer(offerId: string): boolean {
    const offer = this.offers.get(offerId);
    if (!offer || offer.offerStatus !== 'pending') {
      return false;
    }

    offer.offerStatus = 'rejected';
    logger.info(`Offer ${offerId} rejected`);
    return true;
  }

  /**
   * Get listings by seller
   */
  public getListingsBySeller(seller: string): Listing[] {
    return Array.from(this.listings.values()).filter(l => l.seller === seller);
  }

  /**
   * Get active auctions
   */
  public getActiveAuctions(): AuctionListing[] {
    return Array.from(this.auctions.values()).filter(a => a.status === AuctionStatus.ACTIVE);
  }

  /**
   * Get pending offers
   */
  public getPendingOffers(nftMint?: string): OfferListing[] {
    return Array.from(this.offers.values()).filter(
      o => o.offerStatus === 'pending' && (!nftMint || o.nftMint === nftMint)
    );
  }

  /**
   * Get counter-offers for an offer
   */
  public getCounterOffers(offerId: string): CounterOffer[] {
    return this.counterOffers.get(offerId) || [];
  }

  /**
   * Calculate floor price (avg of recent sales)
   */
  public calculateFloorPrice(nftMint: string): number {
    const recentListings = Array.from(this.listings.values())
      .filter(l => l.type === ListingType.FIXED_PRICE && 'nftMint' in l && l.nftMint === nftMint)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 10);

    if (recentListings.length === 0) return 0;

    const total = recentListings.reduce((sum, l) => sum + l.price, 0);
    return total / recentListings.length;
  }

  /**
   * Get trending collections based on offers and sales
   */
  public getTrendingCollections(limit: number = 10): Array<{ collection: string; volume: number; count: number }> {
    const collectionStats = new Map<string, { volume: number; count: number }>();

    // Combine all listing types
    [...this.listings.values(), ...this.auctions.values(), ...this.offers.values()].forEach(listing => {
      const collection = 'collection' in listing ? listing.collection : 'unknown';
      if (!collectionStats.has(collection)) {
        collectionStats.set(collection, { volume: 0, count: 0 });
      }
      const stats = collectionStats.get(collection)!;
      stats.volume += listing.price;
      stats.count += 1;
    });

    return Array.from(collectionStats.entries())
      .map(([collection, stats]) => ({ collection, ...stats }))
      .sort((a, b) => b.volume - a.volume)
      .slice(0, limit);
  }

  /**
   * Get listing stats
   */
  public getMarketplaceStats() {
    const totalListings = this.listings.size;
    const totalAuctions = this.auctions.size;
    const totalOffers = this.offers.size;
    const totalBundles = this.bundles.size;
    const activeAuctions = this.getActiveAuctions().length;
    const pendingOffers = this.getPendingOffers().length;

    const totalVolume = Array.from(this.listings.values()).reduce((sum, l) => sum + l.price, 0);
    const avgPrice = totalListings > 0 ? totalVolume / totalListings : 0;

    return {
      totalListings,
      totalAuctions,
      activeAuctions,
      totalOffers,
      pendingOffers,
      totalBundles,
      totalVolume,
      avgPrice,
    };
  }
}

let advancedMarketplaceService: AdvancedMarketplaceService;

export function getAdvancedMarketplaceService(): AdvancedMarketplaceService {
  if (!advancedMarketplaceService) {
    advancedMarketplaceService = new AdvancedMarketplaceService();
  }
  return advancedMarketplaceService;
}

export function initializeAdvancedMarketplaceService(): AdvancedMarketplaceService {
  if (!advancedMarketplaceService) {
    advancedMarketplaceService = new AdvancedMarketplaceService();
  }
  return advancedMarketplaceService;
}
