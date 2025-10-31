/**
 * Eternal Echoes Type Definitions
 * Shared types for Echo NFT functionality
 */

import { PublicKey } from '@solana/web3.js';

export interface EchoLedger {
  bump: number;
  iaId: string;
  truthHash: number[];
  initialTruthScore: number;
  currentTruthScore: number;
  owner: PublicKey;
  echoCount: number;
  maxEchoes: number;
  echoes: Echo[];
  createdAt: number;
  lastUpdated: number;
}

export interface Echo {
  id: number;
  dataHash: number[];
  echoType: EchoType;
  contributor: PublicKey;
  timestamp: number;
  grokVerified: boolean;
}

export enum EchoType {
  Text = 'Text',
  Audio = 'Audio',
  Annotation = 'Annotation',
}

// API Request/Response Types

export interface IASearchResult {
  identifier: string;
  title: string;
  description?: string;
  mediatype: string;
  year?: string;
  creator?: string;
  thumbnail?: string;
  downloads?: number;
  item_size?: number;
}

export interface IASearchResponse {
  results: IASearchResult[];
  total: number;
}

export interface MintEchoRequest {
  iaId: string;
  walletAddress: string;
}

export interface MintEchoResponse {
  iaId: string;
  title: string;
  description?: string;
  videoUri: string;
  thumbnailUri?: string;
  grokTruthHash: number[];
  truthScore: number;
  teaser: string;
  ledgerPda: string;
}

export interface AddEchoRequest {
  ledgerId: string;
  echoData: string;
  echoType: EchoType;
  contributorWallet: string;
}

export interface AddEchoResponse {
  success: boolean;
  echoId: number;
  verified: boolean;
  message: string;
}

export interface GrokVerificationResult {
  summary: string;
  score: number;
  verified: boolean;
  confidence: number;
}
