import { Router } from 'express';
import { getAdvancedMarketplaceService } from '../services/advanced-marketplace.service';
import logger from '../utils/logger';
import { authenticate as verifyAuth } from '../middlewares/auth';

const router = Router();

/**
 * POST /api/v1/marketplace/listings/fixed-price
 * Create fixed price listing
 */
router.post('/listings/fixed-price', verifyAuth, (req, res) => {
  try {
    const userId = req.user?.id;
    const { nftMint, price, currency = 'SOL', royaltyPercentage = 5 } = req.body;

    if (!nftMint || !price) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const service = getAdvancedMarketplaceService();
    const listing = service.createFixedPriceListing(
      userId,
      req.user?.username || userId,
      nftMint,
      price,
      currency,
      royaltyPercentage,
      userId
    );

    res.json({ listing });
  } catch (error) {
    logger.error('Error creating fixed price listing:', error);
    res.status(500).json({ error: 'Failed to create listing' });
  }
});

/**
 * POST /api/v1/marketplace/listings/auction
 * Create auction listing
 */
router.post('/listings/auction', verifyAuth, (req, res) => {
  try {
    const userId = req.user?.id;
    const { nftMint, startPrice, durationHours = 48, minIncrementPercentage = 5 } = req.body;

    if (!nftMint || !startPrice) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const service = getAdvancedMarketplaceService();
    const listing = service.createAuctionListing(
      userId,
      req.user?.username || userId,
      nftMint,
      startPrice,
      durationHours,
      minIncrementPercentage,
      5,
      userId
    );

    res.json({ listing });
  } catch (error) {
    logger.error('Error creating auction:', error);
    res.status(500).json({ error: 'Failed to create auction' });
  }
});

/**
 * POST /api/v1/marketplace/auctions/:auctionId/bid
 * Place bid on auction
 */
router.post('/auctions/:auctionId/bid', verifyAuth, (req, res) => {
  try {
    const userId = req.user?.id;
    const { auctionId } = req.params;
    const { amount } = req.body;

    if (!amount) {
      return res.status(400).json({ error: 'Bid amount required' });
    }

    const service = getAdvancedMarketplaceService();
    const success = service.placeBid(auctionId, userId, amount);

    if (!success) {
      return res.status(400).json({ error: 'Failed to place bid' });
    }

    res.json({ success: true, message: `Bid of ${amount} SOL placed` });
  } catch (error) {
    logger.error('Error placing bid:', error);
    res.status(500).json({ error: 'Failed to place bid' });
  }
});

/**
 * POST /api/v1/marketplace/auctions/:auctionId/end
 * End auction
 */
router.post('/auctions/:auctionId/end', verifyAuth, (req, res) => {
  try {
    const { auctionId } = req.params;
    const service = getAdvancedMarketplaceService();
    const auction = service.endAuction(auctionId);

    if (!auction) {
      return res.status(404).json({ error: 'Auction not found' });
    }

    res.json({ auction });
  } catch (error) {
    logger.error('Error ending auction:', error);
    res.status(500).json({ error: 'Failed to end auction' });
  }
});

/**
 * GET /api/v1/marketplace/auctions
 * Get all active auctions
 */
router.get('/auctions', (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    const service = getAdvancedMarketplaceService();
    const auctions = service.getActiveAuctions();

    const paginated = auctions.slice(
      parseInt(offset as string),
      parseInt(offset as string) + parseInt(limit as string)
    );

    res.json({ data: paginated, total: auctions.length });
  } catch (error) {
    logger.error('Error fetching auctions:', error);
    res.status(500).json({ error: 'Failed to fetch auctions' });
  }
});

/**
 * POST /api/v1/marketplace/offers
 * Create offer
 */
router.post('/offers', verifyAuth, (req, res) => {
  try {
    const userId = req.user?.id;
    const { nftMint, price, currency = 'SOL', durationHours = 24 } = req.body;

    if (!nftMint || !price) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const service = getAdvancedMarketplaceService();
    const offer = service.createOffer(userId, nftMint, price, currency, durationHours);

    res.json({ offer });
  } catch (error) {
    logger.error('Error creating offer:', error);
    res.status(500).json({ error: 'Failed to create offer' });
  }
});

/**
 * POST /api/v1/marketplace/offers/:offerId/counter
 * Create counter-offer
 */
router.post('/offers/:offerId/counter', verifyAuth, (req, res) => {
  try {
    const userId = req.user?.id;
    const { offerId } = req.params;
    const { price, durationHours = 24 } = req.body;

    if (!price) {
      return res.status(400).json({ error: 'Price required' });
    }

    const service = getAdvancedMarketplaceService();
    const counterOffer = service.createCounterOffer(offerId, userId, price, durationHours);

    if (!counterOffer) {
      return res.status(404).json({ error: 'Offer not found' });
    }

    res.json({ counterOffer });
  } catch (error) {
    logger.error('Error creating counter-offer:', error);
    res.status(500).json({ error: 'Failed to create counter-offer' });
  }
});

/**
 * GET /api/v1/marketplace/offers
 * Get pending offers
 */
router.get('/offers', (req, res) => {
  try {
    const { nftMint, limit = 20, offset = 0 } = req.query;
    const service = getAdvancedMarketplaceService();
    const offers = service.getPendingOffers(nftMint as string);

    const paginated = offers.slice(
      parseInt(offset as string),
      parseInt(offset as string) + parseInt(limit as string)
    );

    res.json({ data: paginated, total: offers.length });
  } catch (error) {
    logger.error('Error fetching offers:', error);
    res.status(500).json({ error: 'Failed to fetch offers' });
  }
});

/**
 * POST /api/v1/marketplace/offers/:offerId/accept
 * Accept offer
 */
router.post('/offers/:offerId/accept', verifyAuth, (req, res) => {
  try {
    const { offerId } = req.params;
    const service = getAdvancedMarketplaceService();
    const success = service.acceptOffer(offerId);

    if (!success) {
      return res.status(400).json({ error: 'Cannot accept offer' });
    }

    res.json({ success: true, message: 'Offer accepted' });
  } catch (error) {
    logger.error('Error accepting offer:', error);
    res.status(500).json({ error: 'Failed to accept offer' });
  }
});

/**
 * POST /api/v1/marketplace/bundles
 * Create bundle listing
 */
router.post('/bundles', verifyAuth, (req, res) => {
  try {
    const userId = req.user?.id;
    const { nfts, price, bundleDiscount = 10 } = req.body;

    if (!nfts || !Array.isArray(nfts) || nfts.length === 0 || !price) {
      return res.status(400).json({ error: 'Invalid bundle data' });
    }

    const service = getAdvancedMarketplaceService();
    const bundle = service.createBundleListing(
      userId,
      req.user?.username || userId,
      nfts,
      price,
      bundleDiscount,
      5,
      userId
    );

    res.json({ bundle });
  } catch (error) {
    logger.error('Error creating bundle:', error);
    res.status(500).json({ error: 'Failed to create bundle' });
  }
});

/**
 * GET /api/v1/marketplace/floor-price/:nftMint
 * Get floor price for NFT
 */
router.get('/floor-price/:nftMint', (req, res) => {
  try {
    const { nftMint } = req.params;
    const service = getAdvancedMarketplaceService();
    const floorPrice = service.calculateFloorPrice(nftMint);

    res.json({ nftMint, floorPrice });
  } catch (error) {
    logger.error('Error calculating floor price:', error);
    res.status(500).json({ error: 'Failed to calculate floor price' });
  }
});

/**
 * GET /api/v1/marketplace/trending-collections
 * Get trending collections
 */
router.get('/trending-collections', (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const service = getAdvancedMarketplaceService();
    const trending = service.getTrendingCollections(parseInt(limit as string));

    res.json({ data: trending });
  } catch (error) {
    logger.error('Error fetching trending collections:', error);
    res.status(500).json({ error: 'Failed to fetch trending collections' });
  }
});

/**
 * GET /api/v1/marketplace/stats
 * Get marketplace statistics
 */
router.get('/stats', (req, res) => {
  try {
    const service = getAdvancedMarketplaceService();
    const stats = service.getMarketplaceStats();

    res.json(stats);
  } catch (error) {
    logger.error('Error fetching marketplace stats:', error);
    res.status(500).json({ error: 'Failed to fetch marketplace stats' });
  }
});

export default router;
