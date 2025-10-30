/**
 * 🎬 Eternal Echoes Service
 * Core business logic for Echo NFT management and marketplace integration
 */

import { PublicKey } from '@solana/web3.js';
import { BubblegumService, CompressedNFTMetadata } from './bubblegumService';
import { CloutTokenService } from './cloutToken';
import { db } from '../db';
import { echoTable, nfts } from '../schema';
import { eq } from 'drizzle-orm';

export class EternalEchoesService {
  private bubblegumService: BubblegumService;
  private cloutService: CloutTokenService;

  constructor(bubblegumService: BubblegumService) {
    this.bubblegumService = bubblegumService;
    this.cloutService = new CloutTokenService();
  }

  /**
   * Mint Echo cNFT using Bubblegum service
   */
  async mintEchoCNFT(
    iaId: string,
    metadata: CompressedNFTMetadata,
    ownerWallet: string,
    treeAddress: string,
    truthScore: number
  ): Promise<{ success: boolean; assetId?: string; signature?: string; error?: string }> {
    try {
      // Mint via Bubblegum
      const result = await this.bubblegumService.mintCompressedNFT({
        treeAddress: new PublicKey(treeAddress),
        metadata,
        owner: new PublicKey(ownerWallet),
      });

      if (!result.success) {
        throw new Error(result.error || 'Mint failed');
      }

      // Award CLOUT for minting verified content
      if (truthScore >= 80) {
        try {
          await this.cloutService.awardCloutForAction(
            ownerWallet,
            'echo_verified_mint',
            truthScore >= 90 ? 100 : 50 // Higher reward for gold truth
          );
        } catch (cloutError) {
          console.warn('CLOUT award failed (non-critical):', cloutError);
        }
      }

      // Store in database
      try {
        await db.insert(nfts).values({
          mintAddress: result.assetId || '',
          name: metadata.name,
          description: metadata.description,
          image: metadata.image,
          metadataUri: '', // cNFT doesn't have traditional metadata URI
          creator: ownerWallet,
          owner: ownerWallet,
          status: 'minted',
          collection: 'eternal-echoes',
          attributes: metadata.attributes as any,
        });
      } catch (dbError) {
        console.warn('DB insert failed (non-critical):', dbError);
      }

      return {
        success: true,
        assetId: result.assetId,
        signature: result.signature,
      };

    } catch (error: any) {
      console.error('Mint Echo cNFT error:', error);
      return {
        success: false,
        error: error.message || 'Mint failed',
      };
    }
  }

  /**
   * Award CLOUT for adding verified echo
   */
  async awardEchoClout(
    contributorWallet: string,
    verified: boolean,
    verificationScore: number
  ): Promise<void> {
    if (!verified) return;

    try {
      // Base reward
      let cloutAmount = 20;

      // Bonus for high scores
      if (verificationScore >= 95) cloutAmount = 50; // Platinum
      else if (verificationScore >= 90) cloutAmount = 40; // Gold
      else if (verificationScore >= 85) cloutAmount = 30; // Silver

      await this.cloutService.awardCloutForAction(
        contributorWallet,
        'echo_verified_contribution',
        cloutAmount
      );

      console.log(`✨ Awarded ${cloutAmount} CLOUT to ${contributorWallet.slice(0, 8)}...`);
    } catch (error) {
      console.warn('CLOUT award error (non-critical):', error);
    }
  }

  /**
   * Get Echo NFT statistics for user dashboard
   */
  async getUserEchoStats(walletAddress: string): Promise<{
    totalEchosMinted: number;
    totalEchosContributed: number;
    avgTruthScore: number;
    totalCloutEarned: number;
    topEcho?: any;
  }> {
    try {
      // Get minted echoes
      const mintedEchoes = await db
        .select()
        .from(nfts)
        .where(eq(nfts.creator, walletAddress))
        .where(eq(nfts.collection, 'eternal-echoes'));

      // Get contributed echoes
      const contributedEchoes = await db
        .select()
        .from(echoTable)
        .where(eq(echoTable.contributor, walletAddress));

      // Calculate stats
      const avgScore = contributedEchoes.length > 0
        ? contributedEchoes.reduce((sum, e) => sum + (e.verificationScore || 0), 0) / contributedEchoes.length
        : 0;

      const cloutEarned = contributedEchoes.filter(e => e.grokVerified).length * 30;

      return {
        totalEchosMinted: mintedEchoes.length,
        totalEchosContributed: contributedEchoes.length,
        avgTruthScore: Math.round(avgScore),
        totalCloutEarned: cloutEarned,
        topEcho: contributedEchoes[0],
      };
    } catch (error) {
      console.error('Get user echo stats error:', error);
      return {
        totalEchosMinted: 0,
        totalEchosContributed: 0,
        avgTruthScore: 0,
        totalCloutEarned: 0,
      };
    }
  }

  /**
   * Get trending Echo NFTs for marketplace
   */
  async getTrendingEchoes(limit: number = 10): Promise<any[]> {
    try {
      // Get Echo NFTs with most contributions
      const echoes = await db
        .select()
        .from(nfts)
        .where(eq(nfts.collection, 'eternal-echoes'))
        .limit(limit);

      // Enrich with echo count
      const enriched = await Promise.all(
        echoes.map(async (echo) => {
          const echoCount = await db
            .select()
            .from(echoTable)
            .where(eq(echoTable.ledgerId, echo.mintAddress));

          return {
            ...echo,
            echoCount: echoCount.length,
            isEchoNFT: true,
          };
        })
      );

      return enriched.sort((a, b) => b.echoCount - a.echoCount);
    } catch (error) {
      console.error('Get trending echoes error:', error);
      return [];
    }
  }
}
