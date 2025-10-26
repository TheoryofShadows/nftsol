"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userNftStats = exports.nftTransactions = exports.nfts = exports.users = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_1 = require("drizzle-orm");
exports.users = (0, pg_core_1.pgTable)("users", {
    id: (0, pg_core_1.text)("id").primaryKey().default((0, drizzle_orm_1.sql) `gen_random_uuid()`),
    username: (0, pg_core_1.text)("username").notNull().unique(),
    password: (0, pg_core_1.text)("password").notNull(),
    role: (0, pg_core_1.text)("role").notNull().default("user"), // user, admin
});
exports.nfts = (0, pg_core_1.pgTable)("nfts", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey(),
    mintAddress: (0, pg_core_1.text)("mint_address").notNull().unique(),
    name: (0, pg_core_1.text)("name").notNull(),
    description: (0, pg_core_1.text)("description"),
    image: (0, pg_core_1.text)("image").notNull(),
    metadataUri: (0, pg_core_1.text)("metadata_uri").notNull(),
    creator: (0, pg_core_1.text)("creator").notNull(), // Wallet address
    owner: (0, pg_core_1.text)("owner").notNull(), // Current owner wallet address
    price: (0, pg_core_1.decimal)("price", { precision: 18, scale: 9 }), // SOL price (null if not for sale)
    royalty: (0, pg_core_1.decimal)("royalty", { precision: 5, scale: 2 }).default("2.50"), // Royalty percentage
    collection: (0, pg_core_1.text)("collection"),
    attributes: (0, pg_core_1.jsonb)("attributes").$type(),
    status: (0, pg_core_1.text)("status").notNull().default("minted"), // minted, listed, sold, unlisted
    listedAt: (0, pg_core_1.timestamp)("listed_at"),
    soldAt: (0, pg_core_1.timestamp)("sold_at"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow().notNull(),
}, (table) => {
    return {
        mintAddressIdx: (0, pg_core_1.index)("mint_address_idx").on(table.mintAddress),
        creatorIdx: (0, pg_core_1.index)("creator_idx").on(table.creator),
        ownerIdx: (0, pg_core_1.index)("owner_idx").on(table.owner),
        statusIdx: (0, pg_core_1.index)("status_idx").on(table.status),
        collectionIdx: (0, pg_core_1.index)("collection_idx").on(table.collection),
    };
});
exports.nftTransactions = (0, pg_core_1.pgTable)("nft_transactions", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey(),
    nftId: (0, pg_core_1.uuid)("nft_id").references(() => exports.nfts.id).notNull(),
    mintAddress: (0, pg_core_1.text)("mint_address").notNull(),
    fromWallet: (0, pg_core_1.text)("from_wallet"), // null for minting
    toWallet: (0, pg_core_1.text)("to_wallet").notNull(),
    transactionType: (0, pg_core_1.text)("transaction_type").notNull(), // mint, sale, transfer
    price: (0, pg_core_1.decimal)("price", { precision: 18, scale: 9 }), // null for transfers
    platformFee: (0, pg_core_1.decimal)("platform_fee", { precision: 18, scale: 9 }), // Platform commission
    creatorRoyalty: (0, pg_core_1.decimal)("creator_royalty", { precision: 18, scale: 9 }), // Creator royalty
    signature: (0, pg_core_1.text)("signature"), // Solana transaction signature
    blockTime: (0, pg_core_1.timestamp)("block_time"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
}, (table) => {
    return {
        nftIdIdx: (0, pg_core_1.index)("nft_id_idx").on(table.nftId),
        mintAddressIdx: (0, pg_core_1.index)("tx_mint_address_idx").on(table.mintAddress),
        fromWalletIdx: (0, pg_core_1.index)("from_wallet_idx").on(table.fromWallet),
        toWalletIdx: (0, pg_core_1.index)("to_wallet_idx").on(table.toWallet),
        transactionTypeIdx: (0, pg_core_1.index)("transaction_type_idx").on(table.transactionType),
        signatureIdx: (0, pg_core_1.index)("signature_idx").on(table.signature),
    };
});
exports.userNftStats = (0, pg_core_1.pgTable)("user_nft_stats", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey(),
    walletAddress: (0, pg_core_1.text)("wallet_address").notNull().unique(),
    nftsOwned: (0, pg_core_1.decimal)("nfts_owned", { precision: 10, scale: 0 }).default("0"),
    nftsCreated: (0, pg_core_1.decimal)("nfts_created", { precision: 10, scale: 0 }).default("0"),
    totalSales: (0, pg_core_1.decimal)("total_sales", { precision: 18, scale: 9 }).default("0"),
    totalPurchases: (0, pg_core_1.decimal)("total_purchases", { precision: 18, scale: 9 }).default("0"),
    totalRoyaltiesEarned: (0, pg_core_1.decimal)("total_royalties_earned", { precision: 18, scale: 9 }).default("0"),
    firstNftCreated: (0, pg_core_1.timestamp)("first_nft_created"),
    lastActivity: (0, pg_core_1.timestamp)("last_activity").defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow().notNull(),
}, (table) => {
    return {
        walletAddressIdx: (0, pg_core_1.index)("wallet_address_idx").on(table.walletAddress),
    };
});
