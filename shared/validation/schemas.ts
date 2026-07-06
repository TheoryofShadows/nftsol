/**
 * Validation Schemas
 * Centralized validation using Zod for type-safe validation
 */

import { z } from 'zod';
import { NFT_METADATA } from '../constants';

// ============================================================================
// NFT Schemas
// ============================================================================

export const nftAttributeSchema = z.object({
  trait_type: z.string().min(1).max(50),
  value: z.union([z.string(), z.number()]),
  display_type: z.string().optional(),
});

export const mintRequestSchema = z.object({
  name: z.string().min(1).max(NFT_METADATA.MAX_NAME_LENGTH),
  description: z.string().max(NFT_METADATA.MAX_DESCRIPTION_LENGTH),
  creatorWallet: z.string().min(32).max(44), // Solana address length
  imageUrl: z.url().optional(),
  attributes: z.array(nftAttributeSchema).max(NFT_METADATA.MAX_ATTRIBUTES).optional(),
  collection: z.string().optional(),
  file: z.any().optional(),
}).refine(
  (data) => data.imageUrl || data.file,
  { message: 'Either imageUrl or file must be provided' }
);

export const nftQuerySchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(['newest', 'oldest', 'price_low', 'price_high']).optional(),
});

// ============================================================================
// Wallet Schemas
// ============================================================================

export const walletAddressSchema = z.string()
  .min(32)
  .max(44)
  .regex(/^[1-9A-HJ-NP-Za-km-z]+$/, 'Invalid Solana address format');

export const withdrawalRequestSchema = z.object({
  amount: z.number().positive().max(1000000),
  destinationAddress: walletAddressSchema,
  memo: z.string().max(500).optional(),
});

// ============================================================================
// Echo Schemas
// ============================================================================

export const echoTypeSchema = z.enum(['Text', 'Audio', 'Annotation', 'Video']);

export const echoAddSchema = z.object({
  ledgerId: z.string().min(1),
  echoData: z.string().min(1).max(5000),
  echoType: echoTypeSchema,
  contributorWallet: walletAddressSchema,
  videoUri: z.url().optional(),
}).refine(
  (data) => data.echoType !== 'Video' || data.videoUri,
  { message: 'videoUri is required for Video echo type' }
);

// ============================================================================
// CLOUT Schemas
// ============================================================================

export const cloutRewardSchema = z.object({
  type: z.enum([
    'dailyLogin',
    'nftPurchase',
    'nftSale',
    'creatorRoyalty',
    'referral',
    'communityPost',
    'nftCreation',
    'firstSale',
    'creatorMilestone',
  ]),
  amount: z.number().positive(),
  reason: z.string().optional(),
});

// ============================================================================
// User Schemas
// ============================================================================

export const userPreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'auto']).optional(),
  notifications: z.boolean().optional(),
  displayName: z.string().max(50).optional(),
});

// ============================================================================
// Pagination Schema
// ============================================================================

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// ============================================================================
// Type Exports (inferred from schemas)
// ============================================================================

export type MintRequestInput = z.infer<typeof mintRequestSchema>;
export type NFTQueryInput = z.infer<typeof nftQuerySchema>;
export type WithdrawalRequestInput = z.infer<typeof withdrawalRequestSchema>;
export type EchoAddInput = z.infer<typeof echoAddSchema>;
export type CloutRewardInput = z.infer<typeof cloutRewardSchema>;
export type UserPreferencesInput = z.infer<typeof userPreferencesSchema>;

