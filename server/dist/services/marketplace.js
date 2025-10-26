"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketplaceService = void 0;
const web3_js_1 = require("@solana/web3.js");
const db_1 = require("../db");
const schema_1 = require("../schema");
const drizzle_orm_1 = require("drizzle-orm");
class MarketplaceService {
    constructor() {
        this.connection = new web3_js_1.Connection(process.env.HELIUS_RPC_URL || 'https://api.devnet.solana.com');
    }
    async listNFT(mintAddress, price, sellerWallet) {
        try {
            // Verify ownership
            const [nft] = await db_1.db
                .select()
                .from(schema_1.nfts)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.nfts.mintAddress, mintAddress), (0, drizzle_orm_1.eq)(schema_1.nfts.owner, sellerWallet)));
            if (!nft) {
                throw new Error('NFT not found or not owned by seller');
            }
            // Update NFT status
            const [updatedNFT] = await db_1.db
                .update(schema_1.nfts)
                .set({
                price: price.toString(),
                status: 'listed',
                listedAt: new Date(),
                updatedAt: new Date()
            })
                .where((0, drizzle_orm_1.eq)(schema_1.nfts.mintAddress, mintAddress))
                .returning();
            return {
                success: true,
                nft: updatedNFT
            };
        }
        catch (error) {
            console.error('Failed to list NFT:', error);
            throw error;
        }
    }
    async buyNFT(mintAddress, buyerWallet, price) {
        try {
            // Get NFT details
            const [nft] = await db_1.db
                .select()
                .from(schema_1.nfts)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.nfts.mintAddress, mintAddress), (0, drizzle_orm_1.eq)(schema_1.nfts.status, 'listed')));
            if (!nft) {
                throw new Error('NFT not found or not for sale');
            }
            // Simulate the purchase (you'll implement real Solana transaction here)
            const transactionSignature = `tx_${Date.now()}`;
            // Update NFT ownership
            const [updatedNFT] = await db_1.db
                .update(schema_1.nfts)
                .set({
                owner: buyerWallet,
                status: 'sold',
                soldAt: new Date(),
                updatedAt: new Date()
            })
                .where((0, drizzle_orm_1.eq)(schema_1.nfts.mintAddress, mintAddress))
                .returning();
            // Record transaction
            await db_1.db.insert(schema_1.nftTransactions).values({
                nftId: nft.id,
                mintAddress,
                fromWallet: nft.owner,
                toWallet: buyerWallet,
                transactionType: 'sale',
                price: price.toString(),
                platformFee: (price * 0.025).toString(), // 2.5% platform fee
                creatorRoyalty: (price * 0.025).toString(), // 2.5% creator royalty
                signature: transactionSignature,
                blockTime: new Date()
            });
            return {
                success: true,
                nft: updatedNFT,
                signature: transactionSignature
            };
        }
        catch (error) {
            console.error('Failed to buy NFT:', error);
            throw error;
        }
    }
    async getNFTs(filters = {}) {
        try {
            const conditions = [];
            if (filters.owner) {
                conditions.push((0, drizzle_orm_1.eq)(schema_1.nfts.owner, filters.owner));
            }
            if (filters.status) {
                conditions.push((0, drizzle_orm_1.eq)(schema_1.nfts.status, filters.status));
            }
            if (filters.collection) {
                conditions.push((0, drizzle_orm_1.eq)(schema_1.nfts.collection, filters.collection));
            }
            const whereClause = conditions.length > 0 ? (0, drizzle_orm_1.and)(...conditions) : undefined;
            // Get total count for pagination
            const [{ count }] = await db_1.db
                .select({ count: (0, drizzle_orm_1.sql) `count(*)::int` })
                .from(schema_1.nfts)
                .where(whereClause);
            // Get paginated results
            const results = await db_1.db
                .select()
                .from(schema_1.nfts)
                .where(whereClause)
                .limit(filters.limit || 50)
                .offset(filters.offset || 0);
            return {
                data: results,
                pagination: {
                    total: count,
                    limit: filters.limit || 50,
                    offset: filters.offset || 0,
                    totalPages: Math.ceil(count / (filters.limit || 50))
                }
            };
        }
        catch (error) {
            console.error('Failed to get NFTs:', error);
            throw error;
        }
    }
}
exports.MarketplaceService = MarketplaceService;
