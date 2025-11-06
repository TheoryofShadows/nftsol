/**
 * Example: Validated Route
 * Demonstrates how to use validation middleware with shared schemas
 */

import { Router, Request, Response } from 'express';
import { validateBody, validateQuery, validateParams } from '../middleware/validation';
import { mintRequestSchema, nftQuerySchema, walletAddressSchema } from '@shared/validation/schemas';
import { z } from 'zod';

const router = Router();

// Example: Validate query parameters
router.get(
  '/nfts',
  validateQuery(nftQuerySchema),
  async (req: Request, res: Response) => {
    try {
      // req.query is now validated and typed
      const { category, search, page, limit } = req.query;
      
      // Your business logic here
      // ...
      
      res.json({
        success: true,
        data: [],
        message: 'NFTs fetched successfully',
      });
    } catch (error) {
      // Error handling middleware will catch this
      throw error;
    }
  }
);

// Example: Validate request body
router.post(
  '/mint',
  validateBody(mintRequestSchema),
  async (req: Request, res: Response) => {
    try {
      // req.body is now validated and typed
      const mintRequest = req.body;
      
      // Your minting logic here
      // ...
      
      res.json({
        success: true,
        data: {
          mintAddress: 'example',
          signature: 'example',
          nft: {} as any,
        },
        message: 'NFT minted successfully',
      });
    } catch (error) {
      throw error;
    }
  }
);

// Example: Validate route parameters
const addressParamSchema = z.object({
  address: walletAddressSchema,
});

router.get(
  '/wallet/:address',
  validateParams(addressParamSchema),
  async (req: Request, res: Response) => {
    try {
      const { address } = req.params; // Validated Solana address
      
      // Your logic here
      // ...
      
      res.json({
        success: true,
        data: {},
      });
    } catch (error) {
      throw error;
    }
  }
);

export default router;

