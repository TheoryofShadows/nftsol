import { pgTable, varchar, integer, timestamp, text, decimal, boolean, jsonb } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User preferences for recommendations
export const userPreferences = pgTable("user_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  categories: jsonb("categories").$type<string[]>().default([]),
  priceRangeMin: decimal("price_range_min", { precision: 10, scale: 4 }).default("0"),
  priceRangeMax: decimal("price_range_max", { precision: 10, scale: 4 }).default("100"),
  preferredArtists: jsonb("preferred_artists").$type<string[]>().default([]),
  collectionTypes: jsonb("collection_types").$type<string[]>().default([]),
  rarity: varchar("rarity", { enum: ["common", "uncommon", "rare", "epic", "legendary"] }),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User interaction tracking for ML recommendations
export const userInteractions = pgTable("user_interactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  nftId: varchar("nft_id").notNull(),
  interactionType: varchar("interaction_type", { 
    enum: ["view", "like", "purchase", "share", "save"] 
  }).notNull(),
  duration: integer("duration"), // seconds spent viewing
  timestamp: timestamp("timestamp").defaultNow(),
});

// NFT recommendation scores
export const nftRecommendations = pgTable("nft_recommendations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  nftId: varchar("nft_id").notNull(),
  score: decimal("score", { precision: 5, scale: 4 }).notNull(), // 0-1 recommendation score
  reason: text("reason"), // Why this was recommended
  algorithmType: varchar("algorithm_type", {
    enum: ["collaborative", "content_based", "trending", "price_match", "artist_match"]
  }).notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Trending NFT tracking
export const trendingNfts = pgTable("trending_nfts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nftId: varchar("nft_id").notNull(),
  category: varchar("category").notNull(),
  viewCount: integer("view_count").default(0),
  likeCount: integer("like_count").default(0),
  shareCount: integer("share_count").default(0),
  purchaseCount: integer("purchase_count").default(0),
  trendingScore: decimal("trending_score", { precision: 8, scale: 4 }).default("0"),
  timeframe: varchar("timeframe", { enum: ["hourly", "daily", "weekly", "monthly"] }).notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Schemas
export const insertUserPreferencesSchema = createInsertSchema(userPreferences);
export const insertUserInteractionSchema = createInsertSchema(userInteractions);
export const insertNftRecommendationSchema = createInsertSchema(nftRecommendations);
export const insertTrendingNftSchema = createInsertSchema(trendingNfts);

// Types
export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
export type UserInteraction = typeof userInteractions.$inferSelect;
export type InsertUserInteraction = z.infer<typeof insertUserInteractionSchema>;
export type NftRecommendation = typeof nftRecommendations.$inferSelect;
export type InsertNftRecommendation = z.infer<typeof insertNftRecommendationSchema>;
export type TrendingNft = typeof trendingNfts.$inferSelect;
export type InsertTrendingNft = z.infer<typeof insertTrendingNftSchema>;