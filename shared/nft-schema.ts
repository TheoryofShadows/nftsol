import { pgTable, text, decimal, timestamp, uuid, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const nfts = pgTable(
  "nfts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    mintAddress: text("mint_address").notNull().unique(),
    name: text("name").notNull(),
    description: text("description"),
    image: text("image").notNull(),
    metadataUri: text("metadata_uri").notNull(),
    creator: text("creator").notNull(), // Wallet address
    owner: text("owner").notNull(), // Current owner wallet address
    price: decimal("price", { precision: 18, scale: 9 }), // SOL price (null if not for sale)
    royalty: decimal("royalty", { precision: 5, scale: 2 }).default("2.50"), // Royalty percentage
    collection: text("collection"),
    attributes: jsonb("attributes").$type<Array<{ trait_type: string; value: string | number }>>(),
    status: text("status").notNull().default("minted"), // minted, listed, sold, unlisted
    listedAt: timestamp("listed_at"),
    soldAt: timestamp("sold_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => {
    return {
      mintAddressIdx: index("mint_address_idx").on(table.mintAddress),
      creatorIdx: index("creator_idx").on(table.creator),
      ownerIdx: index("owner_idx").on(table.owner),
      statusIdx: index("status_idx").on(table.status),
      collectionIdx: index("collection_idx").on(table.collection),
    };
  }
);

export const nftTransactions = pgTable(
  "nft_transactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    nftId: uuid("nft_id").references(() => nfts.id).notNull(),
    mintAddress: text("mint_address").notNull(),
    fromWallet: text("from_wallet"), // null for minting
    toWallet: text("to_wallet").notNull(),
    transactionType: text("transaction_type").notNull(), // mint, sale, transfer
    price: decimal("price", { precision: 18, scale: 9 }), // null for transfers
    platformFee: decimal("platform_fee", { precision: 18, scale: 9 }), // Platform commission
    creatorRoyalty: decimal("creator_royalty", { precision: 18, scale: 9 }), // Creator royalty
    signature: text("signature"), // Solana transaction signature
    blockTime: timestamp("block_time"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => {
    return {
      nftIdIdx: index("nft_id_idx").on(table.nftId),
      mintAddressIdx: index("tx_mint_address_idx").on(table.mintAddress),
      fromWalletIdx: index("from_wallet_idx").on(table.fromWallet),
      toWalletIdx: index("to_wallet_idx").on(table.toWallet),
      transactionTypeIdx: index("transaction_type_idx").on(table.transactionType),
      signatureIdx: index("signature_idx").on(table.signature),
    };
  }
);

export const userNftStats = pgTable(
  "user_nft_stats",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    walletAddress: text("wallet_address").notNull().unique(),
    nftsOwned: decimal("nfts_owned", { precision: 10, scale: 0 }).default("0"),
    nftsCreated: decimal("nfts_created", { precision: 10, scale: 0 }).default("0"),
    totalSales: decimal("total_sales", { precision: 18, scale: 9 }).default("0"),
    totalPurchases: decimal("total_purchases", { precision: 18, scale: 9 }).default("0"),
    totalRoyaltiesEarned: decimal("total_royalties_earned", { precision: 18, scale: 9 }).default("0"),
    firstNftCreated: timestamp("first_nft_created"),
    lastActivity: timestamp("last_activity").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => {
    return {
      walletAddressIdx: index("wallet_address_idx").on(table.walletAddress),
    };
  }
);

// Zod schemas for validation
export const insertNFTSchema = createInsertSchema(nfts, {
  price: z.coerce.number().min(0).optional(),
  royalty: z.coerce.number().min(0).max(10).optional(),
  attributes: z.array(z.object({
    trait_type: z.string(),
    value: z.union([z.string(), z.number()])
  })).optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateNFTSchema = insertNFTSchema.partial();

export const insertNFTTransactionSchema = createInsertSchema(nftTransactions, {
  price: z.coerce.number().min(0).optional(),
  platformFee: z.coerce.number().min(0).optional(),
  creatorRoyalty: z.coerce.number().min(0).optional(),
}).omit({
  id: true,
  createdAt: true,
});

export const insertUserNftStatsSchema = createInsertSchema(userNftStats).omit({
  id: true,
  updatedAt: true,
});

// TypeScript types
export type NFT = typeof nfts.$inferSelect;
export type InsertNFT = z.infer<typeof insertNFTSchema>;
export type UpdateNFT = z.infer<typeof updateNFTSchema>;

export type NFTTransaction = typeof nftTransactions.$inferSelect;
export type InsertNFTTransaction = z.infer<typeof insertNFTTransactionSchema>;

export type UserNftStats = typeof userNftStats.$inferSelect;
export type InsertUserNftStats = z.infer<typeof insertUserNftStatsSchema>;