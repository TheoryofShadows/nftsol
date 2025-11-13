// @ts-nocheck
import type { Express } from "express";
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { db } from "./db";
import { nfts, nftTransactions, userNftStats, insertNFTSchema, insertNFTTransactionSchema } from "@shared/nft-schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { fromZodError } from "zod-validation-error";
import {
  nftMintLimiter,
  uploadLimiter,
  validateNFTData,
  validateTransactionData,
  validateFileUpload,
  validateBlockchainTransaction
} from "./security-middleware";

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for local file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    cb(null, `nft-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  }
});

// Helper function to generate a valid Solana-like mint address
function generateSolanaMintAddress(): string {
  const chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let result = "";
  for (let i = 0; i < 44; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function setupNFTRoutes(app: Express) {
  // Serve static uploaded files
  app.use("/uploads", express.static(uploadsDir, { fallthrough: true }));

  // Upload NFT image or metadata
  app.post(
    "/api/nfts/upload",
    uploadLimiter,
    upload.single("file"),
    validateFileUpload,
    async (req: any, res: any) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: "No file uploaded" });
        }

        const filename = req.file.filename;
        const url = `/uploads/${filename}`;

        res.json({
          success: true,
          filename,
          url,
          message: "File uploaded successfully"
        });
      } catch (error) {
        console.error("File upload error:", error);
        res.status(500).json({ error: "File upload failed" });
      }
    }
  );

  // Get all marketplace NFTs
  app.get("/api/nfts/marketplace", async (req: any, res: any) => {
    try {
      const { page = "1", limit = "20", category } = req.query;
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;

      let query = db
        .select()
        .from(nfts)
        .where(eq(nfts.status, "listed"))
        .orderBy(desc(nfts.listedAt));

      if (category) {
        query = query.where(eq(nfts.category, category as string));
      }
      if (pageNum > 1) {
        query = query.offset(offset);
      }

      const marketplaceNFTs = await query.limit(limitNum);
      const totalCount = await db
        .select({ count: sql`COUNT(*)` })
        .from(nfts)
        .where(eq(nfts.status, "listed"));

      res.json({
        nfts: marketplaceNFTs,
        page: pageNum,
        limit: limitNum,
        total: totalCount[0]?.count || 0,
        hasMore: marketplaceNFTs.length === limitNum
      });
    } catch (error) {
      console.error("Failed to fetch marketplace NFTs:", error);
      res.status(500).json({ error: "Failed to fetch marketplace NFTs" });
    }
  });

  // Get user's NFTs
  app.get("/api/nfts/user/:walletAddress", async (req: any, res: any) => {
    try {
      const { walletAddress } = req.params;
      const userNFTs = await db
        .select()
        .from(nfts)
        .where(eq(nfts.owner, walletAddress))
        .orderBy(desc(nfts.createdAt));
      res.json(userNFTs);
    } catch (error) {
      console.error("Failed to fetch user NFTs:", error);
      res.status(500).json({ error: "Failed to fetch user NFTs" });
    }
  });

  // Unlist NFT
  app.post("/api/nfts/unlist", async (req: any, res: any) => {
    try {
      const { mintAddress, ownerWallet } = req.body;
      if (!mintAddress || !ownerWallet) {
        return res.status(400).json({ error: "Missing required fields: mintAddress, ownerWallet" });
      }
      const [nft] = await db
        .select()
        .from(nfts)
        .where(and(eq(nfts.mintAddress, mintAddress), eq(nfts.owner, ownerWallet)));
      if (!nft) {
        return res.status(404).json({ error: "NFT not found or not owned by user" });
      }
      const [updatedNFT] = await db
        .update(nfts)
        .set({ status: "unlisted", price: null, listedAt: null, updatedAt: new Date() })
        .where(eq(nfts.mintAddress, mintAddress))
        .returning();
      res.json(updatedNFT);
    } catch (error) {
      console.error("Failed to unlist NFT:", error);
      res.status(500).json({ error: "Failed to unlist NFT" });
    }
  });

  // Get NFT by mint address
  app.get("/api/nfts/:mintAddress", async (req: any, res: any) => {
    try {
      const { mintAddress } = req.params;
      const [nft] = await db
        .select()
        .from(nfts)
        .where(eq(nfts.mintAddress, mintAddress));
      if (!nft) {
        return res.status(404).json({ error: "NFT not found" });
      }
      res.json(nft);
    } catch (error) {
      console.error("Failed to fetch NFT:", error);
      res.status(500).json({ error: "Failed to fetch NFT" });
    }
  });

  // Mint new NFT with image upload
  app.post(
    "/api/nfts/mint",
    nftMintLimiter,
    upload.single("image"),
    validateFileUpload,
    validateNFTData,
    async (req: any, res: any) => {
      try {
        const { name, description, price, royalty, creatorWallet, category } = req.body;
        if (!name || !name.trim()) return res.status(400).json({ error: "NFT name is required" });
        if (!description || !description.trim()) return res.status(400).json({ error: "NFT description is required" });
        if (!price || parseFloat(price) <= 0) return res.status(400).json({ error: "Valid price is required" });
        if (!creatorWallet) return res.status(400).json({ error: "Creator wallet is required" });

        const mintAddress = generateSolanaMintAddress();
        const metadataUri = `https://gateway.pinata.cloud/ipfs/Qm${Math.random().toString(36).substring(7)}`;
        const imageUrl = req.file ? `/uploads/${req.file.filename}` : `data:image/svg+xml;base64,${Buffer.from(`
          <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
            <rect width="400" height="400" fill="#DA2DFF"/>
            <text x="200" y="180" text-anchor="middle" font-size="24" fill="white">${name.substring(0, 20)}</text>
            <text x="200" y="220" text-anchor="middle" font-size="14" fill="white">NFT Artwork</text>
            <text x="200" y="240" text-anchor="middle" font-size="12" fill="white">Price: ${price} SOL</text>
          </svg>
        `).toString("base64")}`;

        const nftData = {
          mintAddress,
          name,
          description,
          image: imageUrl,
          price: price.toString(),
          creator: creatorWallet,
          owner: creatorWallet,
          royalty: royalty ? royalty.toString() : "0",
          collection: "NFTSol Collection",
          category: category || "art",
          attributes: [],
          status: "listed" as const,
          metadataUri,
          listedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const [nft] = await db.insert(nfts).values(nftData).returning();
        await updateUserStats(creatorWallet, "create");

        res.status(201).json({
          success: true,
          mintAddress,
          metadataUri,
          signature: `demo_signature_${Date.now()}`,
          nft
        });
      } catch (error) {
        console.error("Failed to mint NFT:", error);
        res.status(500).json({ error: "Failed to mint NFT" });
      }
    }
  );

  // Create new NFT (after minting)
  app.post("/api/nfts", async (req: any, res: any) => {
    try {
      const validatedData = insertNFTSchema.parse(req.body);
      const nftData = {
        ...validatedData,
        price: validatedData.price ? validatedData.price.toString() : null,
        royalty: validatedData.royalty ? validatedData.royalty.toString() : null
      };
      const [nft] = await db.insert(nfts).values([nftData]).returning();
      await updateUserStats(validatedData.creator, "create");
      res.status(201).json(nft);
    } catch (error: any) {
      if (error.name === "ZodError") {
        const validationError = fromZodError(error);
        return res.status(400).json({ error: "Validation failed", details: validationError.message });
      }
      console.error("Failed to create NFT:", error);
      res.status(500).json({ error: "Failed to create NFT" });
    }
  });

  // List NFT for sale
  app.post("/api/nfts/list", async (req: any, res: any) => {
    try {
      const { mintAddress, price, ownerWallet } = req.body;
      if (!mintAddress || !price || !ownerWallet) {
        return res.status(400).json({ error: "Missing required fields: mintAddress, price, ownerWallet" });
      }
      const [nft] = await db
        .select()
        .from(nfts)
        .where(and(eq(nfts.mintAddress, mintAddress), eq(nfts.owner, ownerWallet)));
      if (!nft) {
        return res.status(404).json({ error: "NFT not found or not owned by user" });
      }
      const [updatedNFT] = await db
        .update(nfts)
        .set({
          price: price.toString(),
          status: "listed",
          listedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(nfts.mintAddress, mintAddress))
        .returning();
      res.json(updatedNFT);
    } catch (error) {
      console.error("Failed to list NFT:", error);
      res.status(500).json({ error: "Failed to list NFT" });
    }
  });

  // Process NFT sale
  app.post(
    "/api/nfts/purchase",
    validateTransactionData,
    validateBlockchainTransaction,
    async (req: any, res: any) => {
      try {
        const { mintAddress, buyerWallet, sellerWallet, price, signature, platformFee, creatorRoyalty } = req.body;
        if (!mintAddress || !buyerWallet || !sellerWallet || !price || !signature) {
          return res.status(400).json({ error: "Missing required transaction data" });
        }
        const [nft] = await db.select().from(nfts).where(eq(nfts.mintAddress, mintAddress));
        if (!nft) {
          return res.status(404).json({ error: "NFT not found" });
        }
        const [updatedNFT] = await db
          .update(nfts)
          .set({
            owner: buyerWallet,
            status: "sold",
            soldAt: new Date(),
            updatedAt: new Date()
          })
          .where(eq(nfts.mintAddress, mintAddress))
          .returning();
        await db.insert(nftTransactions).values({
          nftId: nft.id,
          mintAddress,
          fromWallet: sellerWallet,
          toWallet: buyerWallet,
          transactionType: "sale",
          price: price.toString(),
          platformFee: platformFee?.toString(),
          creatorRoyalty: creatorRoyalty?.toString(),
          signature,
          blockTime: new Date()
        });
        await updateUserStats(buyerWallet, "purchase", parseFloat(price));
        await updateUserStats(sellerWallet, "sale", parseFloat(price));
        res.json({ success: true, nft: updatedNFT, message: "NFT purchase completed successfully" });
      } catch (error) {
        console.error("Failed to process NFT purchase:", error);
        res.status(500).json({ error: "Failed to process NFT purchase" });
      }
    }
  );

  // Get NFT transaction history
  app.get("/api/nfts/:mintAddress/transactions", async (req: any, res: any) => {
    try {
      const { mintAddress } = req.params;
      const transactions = await db
        .select()
        .from(nftTransactions)
        .where(eq(nftTransactions.mintAddress, mintAddress))
        .orderBy(desc(nftTransactions.createdAt));
      res.json(transactions);
    } catch (error) {
      console.error("Failed to fetch NFT transactions:", error);
      res.status(500).json({ error: "Failed to fetch NFT transactions" });
    }
  });

  // Get user NFT stats
  app.get("/api/nfts/stats/:walletAddress", async (req: any, res: any) => {
    try {
      const { walletAddress } = req.params;
      const [stats] = await db.select().from(userNftStats).where(eq(userNftStats.walletAddress, walletAddress));
      if (!stats) {
        const [newStats] = await db
          .insert(userNftStats)
          .values({ walletAddress })
          .returning();
        return res.json(newStats);
      }
      res.json(stats);
    } catch (error) {
      console.error("Failed to fetch user stats:", error);
      res.status(500).json({ error: "Failed to fetch user stats" });
    }
  });

  // Process minting fee
  app.post("/api/platform/minting-fee", async (req: any, res: any) => {
    try {
      const { creatorWallet, feeAmount, timestamp } = req.body;
      if (!creatorWallet || !feeAmount || !timestamp) {
        return res.status(400).json({ error: "Missing required fields: creatorWallet, feeAmount, timestamp" });
      }
      console.log(`Minting fee processed: ${feeAmount} SOL from ${creatorWallet}`);
      res.json({
        success: true,
        message: "Minting fee processed successfully",
        feeAmount,
        timestamp
      });
    } catch (error) {
      console.error("Failed to process minting fee:", error);
      res.status(500).json({ error: "Failed to process minting fee" });
    }
  });

  // Get all NFTs
  app.get("/api/nfts", async (req: any, res: any) => {
    try {
      const allNfts = await db.select().from(nfts).orderBy(desc(nfts.createdAt));
      res.json(allNfts || []);
    } catch (error) {
      console.error("Error fetching NFTs:", error);
      res.status(500).json({ error: "Failed to fetch NFTs", nfts: [] });
    }
  });

  async function updateUserStats(
    walletAddress: string,
    action: "create" | "purchase" | "sale",
    amount?: number
  ) {
    try {
      let [userStats] = await db
        .select()
        .from(userNftStats)
        .where(eq(userNftStats.walletAddress, walletAddress));

      if (!userStats) {
        [userStats] = await db
          .insert(userNftStats)
          .values({ walletAddress })
          .returning();
      }

      const updates: any = {
        lastActivity: new Date(),
        updatedAt: new Date()
      };

      switch (action) {
        case "create":
          updates.nftsCreated = sql`${userNftStats.nftsCreated} + 1`;
          if (!userStats.firstNftCreated) {
            updates.firstNftCreated = new Date();
          }
          break;
        case "purchase":
          updates.nftsOwned = sql`${userNftStats.nftsOwned} + 1`;
          if (amount) {
            updates.totalPurchases = sql`${userNftStats.totalPurchases} + ${amount}`;
          }
          break;
        case "sale":
          updates.nftsOwned = sql`${userNftStats.nftsOwned} - 1`;
          if (amount) {
            updates.totalSales = sql`${userNftStats.totalSales} + ${amount}`;
          }
          break;
      }

      await db
        .update(userNftStats)
        .set(updates)
        .where(eq(userNftStats.walletAddress, walletAddress));
    } catch (error) {
      console.error("Failed to update user stats:", error);
      // Non-critical, so don't throw
    }
  }
}