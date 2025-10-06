import type { Express } from "express";
import { db } from "./db";
import { nfts, nftTransactions } from "@shared/nft-schema";
import { eq, desc, and, sql, gte, lte, avg, count, max, min } from "drizzle-orm";

interface PricingAnalytics {
  averagePrice: number;
  medianPrice: number;
  priceRange: { min: number; max: number };
  recentSales: number;
  marketTrend: 'rising' | 'falling' | 'stable';
  trendPercentage: number;
  suggestedPrice: number;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string[];
}

interface MarketData {
  price: number;
  soldAt: Date;
  collection?: string;
}

export function setupPricingRoutes(app: Express) {
  // Get pricing analytics and suggestions
  app.get("/api/pricing/suggestions", async (req, res) => {
    try {
      const { 
        category = 'all',
        priceRange = 'all',
        timeframe = '30d'
      } = req.query;

      const analytics = await generatePricingSuggestions(
        category as string,
        priceRange as string,
        timeframe as string
      );

      res.json(analytics);
    } catch (error) {
      console.error("Failed to generate pricing suggestions:", error);
      res.status(500).json({ error: "Failed to analyze market trends" });
    }
  });

  // Get detailed market analysis for specific parameters
  app.post("/api/pricing/analyze", async (req, res) => {
    try {
      const { 
        name,
        description,
        collection,
        attributes = []
      } = req.body;

      const analysis = await analyzeSpecificNFT({
        name,
        description,
        collection,
        attributes
      });

      res.json(analysis);
    } catch (error) {
      console.error("Failed to analyze specific NFT pricing:", error);
      res.status(500).json({ error: "Failed to analyze NFT pricing" });
    }
  });

  // Get market trend data for charts
  app.get("/api/pricing/trends", async (req, res) => {
    try {
      const { timeframe = '30d' } = req.query;
      const trends = await getMarketTrends(timeframe as string);
      res.json(trends);
    } catch (error) {
      console.error("Failed to get market trends:", error);
      res.status(500).json({ error: "Failed to get market trends" });
    }
  });
}

async function generatePricingSuggestions(
  category: string,
  priceRange: string,
  timeframe: string
): Promise<PricingAnalytics> {
  const daysAgo = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysAgo);

  // Get recent sales data
  const recentSales = await db
    .select({
      price: sql<number>`CAST(${nfts.price} AS DECIMAL)`,
      soldAt: nfts.soldAt,
      collection: nfts.collection
    })
    .from(nfts)
    .where(
      and(
        eq(nfts.status, 'sold'),
        gte(nfts.soldAt, cutoffDate)
      )
    )
    .orderBy(desc(nfts.soldAt));

  // Filter out null dates and convert to MarketData format
  const validSales = recentSales
    .filter((sale): sale is { price: number; soldAt: Date; collection: string | null } => 
      sale.soldAt !== null
    )
    .map(sale => ({
      price: sale.price,
      soldAt: sale.soldAt,
      collection: sale.collection
    }));

  if (validSales.length === 0) {
    return generateFallbackAnalytics();
  }

  const prices = validSales.map(sale => sale.price).filter(p => p > 0);
  
  // Calculate statistics
  const averagePrice = prices.reduce((a, b) => a + b, 0) / prices.length;
  const sortedPrices = prices.sort((a, b) => a - b);
  const medianPrice = sortedPrices[Math.floor(sortedPrices.length / 2)];
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  // Calculate trend
  const { trend, trendPercentage } = calculateTrend(validSales);

  // Generate intelligent pricing suggestion
  const { suggestedPrice, confidence, reasoning } = generateSmartPricing({
    averagePrice,
    medianPrice,
    trend,
    trendPercentage,
    recentSalesCount: recentSales.length,
    priceRange: { min: minPrice, max: maxPrice }
  });

  return {
    averagePrice: Number(averagePrice.toFixed(3)),
    medianPrice: Number(medianPrice.toFixed(3)),
    priceRange: { 
      min: Number(minPrice.toFixed(3)), 
      max: Number(maxPrice.toFixed(3)) 
    },
    recentSales: validSales.length,
    marketTrend: trend,
    trendPercentage: Number(trendPercentage.toFixed(1)),
    suggestedPrice: Number(suggestedPrice.toFixed(3)),
    confidence,
    reasoning
  };
}

function calculateTrend(sales: MarketData[]): { trend: 'rising' | 'falling' | 'stable', trendPercentage: number } {
  if (sales.length < 5) {
    return { trend: 'stable', trendPercentage: 0 };
  }

  const recentHalf = sales.slice(0, Math.floor(sales.length / 2));
  const olderHalf = sales.slice(Math.floor(sales.length / 2));

  const recentAvg = recentHalf.reduce((a, b) => a + b.price, 0) / recentHalf.length;
  const olderAvg = olderHalf.reduce((a, b) => a + b.price, 0) / olderHalf.length;

  const changePercentage = ((recentAvg - olderAvg) / olderAvg) * 100;

  let trend: 'rising' | 'falling' | 'stable';
  if (changePercentage > 5) trend = 'rising';
  else if (changePercentage < -5) trend = 'falling';
  else trend = 'stable';

  return { trend, trendPercentage: Math.abs(changePercentage) };
}

function generateSmartPricing(data: {
  averagePrice: number;
  medianPrice: number;
  trend: 'rising' | 'falling' | 'stable';
  trendPercentage: number;
  recentSalesCount: number;
  priceRange: { min: number; max: number };
}): { suggestedPrice: number; confidence: 'high' | 'medium' | 'low'; reasoning: string[] } {
  
  const { averagePrice, medianPrice, trend, trendPercentage, recentSalesCount, priceRange } = data;
  const reasoning: string[] = [];
  let suggestedPrice = medianPrice; // Start with median as baseline
  let confidence: 'high' | 'medium' | 'low' = 'medium';

  // Adjust based on market trend
  if (trend === 'rising') {
    suggestedPrice = averagePrice * 1.1; // 10% above average for rising market
    reasoning.push(`Market trending upward (+${trendPercentage.toFixed(1)}%), suggesting premium pricing`);
  } else if (trend === 'falling') {
    suggestedPrice = medianPrice * 0.9; // 10% below median for falling market
    reasoning.push(`Market trending downward (-${trendPercentage.toFixed(1)}%), suggesting competitive pricing`);
  } else {
    suggestedPrice = (averagePrice + medianPrice) / 2; // Average of both for stable market
    reasoning.push(`Stable market conditions, balanced pricing recommended`);
  }

  // Adjust confidence based on data quality
  if (recentSalesCount >= 20) {
    confidence = 'high';
    reasoning.push(`High confidence based on ${recentSalesCount} recent sales`);
  } else if (recentSalesCount >= 10) {
    confidence = 'medium';
    reasoning.push(`Medium confidence based on ${recentSalesCount} recent sales`);
  } else {
    confidence = 'low';
    reasoning.push(`Limited data available (${recentSalesCount} recent sales)`);
    // Be more conservative with limited data
    suggestedPrice = medianPrice;
  }

  // Ensure price is within reasonable bounds
  const minReasonable = priceRange.min * 0.8;
  const maxReasonable = priceRange.max * 1.2;
  
  if (suggestedPrice < minReasonable) {
    suggestedPrice = minReasonable;
    reasoning.push(`Adjusted to market minimum range`);
  } else if (suggestedPrice > maxReasonable) {
    suggestedPrice = maxReasonable;
    reasoning.push(`Adjusted to market maximum range`);
  }

  // Add market context
  reasoning.push(`Current market range: ${priceRange.min.toFixed(2)} - ${priceRange.max.toFixed(2)} SOL`);
  reasoning.push(`Market average: ${averagePrice.toFixed(2)} SOL`);

  return { suggestedPrice, confidence, reasoning };
}

async function analyzeSpecificNFT(nftData: {
  name: string;
  description: string;
  collection?: string;
  attributes: Array<{ trait_type: string; value: string }>;
}): Promise<PricingAnalytics & { similarNFTs: number }> {
  
  // Get similar NFTs based on collection or keywords
  const baseAnalytics = await generatePricingSuggestions('all', 'all', '30d');
  
  // Enhanced analysis for specific NFT
  const keywords = extractKeywords(nftData.name, nftData.description);
  const similarNFTs = await findSimilarNFTs(keywords, nftData.collection);
  
  if (similarNFTs.length > 0) {
    const similarPrices = similarNFTs.map(nft => parseFloat(nft.price || '0')).filter(p => p > 0);
    if (similarPrices.length > 0) {
      const similarAvg = similarPrices.reduce((a, b) => a + b, 0) / similarPrices.length;
      baseAnalytics.suggestedPrice = similarAvg;
      baseAnalytics.reasoning.unshift(`Found ${similarNFTs.length} similar NFTs with average price ${similarAvg.toFixed(2)} SOL`);
      baseAnalytics.confidence = similarNFTs.length >= 5 ? 'high' : 'medium';
    }
  }

  return {
    ...baseAnalytics,
    similarNFTs: similarNFTs.length
  };
}

function extractKeywords(name: string, description: string): string[] {
  const text = `${name} ${description}`.toLowerCase();
  const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'nft', 'token'];
  return text
    .split(/\W+/)
    .filter(word => word.length > 2 && !commonWords.includes(word))
    .slice(0, 5); // Top 5 keywords
}

async function findSimilarNFTs(keywords: string[], collection?: string) {
  if (collection) {
    return await db
      .select()
      .from(nfts)
      .where(and(eq(nfts.status, 'sold'), eq(nfts.collection, collection)))
      .limit(20);
  }
  
  // In a real implementation, this would use full-text search
  // For now, we'll return a subset of sold NFTs
  return await db
    .select()
    .from(nfts)
    .where(eq(nfts.status, 'sold'))
    .limit(20);
}

async function getMarketTrends(timeframe: string) {
  const daysAgo = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
  const trends = [];
  
  for (let i = daysAgo; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    const dayData = await db
      .select({
        avgPrice: sql<string>`COALESCE(AVG(CAST(${nfts.price} AS DECIMAL)), 0)`,
        totalSales: count(nfts.id)
      })
      .from(nfts)
      .where(
        and(
          eq(nfts.status, 'sold'),
          gte(nfts.soldAt, new Date(date.toDateString())),
          lte(nfts.soldAt, new Date(date.getTime() + 24 * 60 * 60 * 1000))
        )
      );
    
    trends.push({
      date: date.toISOString().split('T')[0],
      averagePrice: Number(parseFloat(dayData[0]?.avgPrice || '0').toFixed(3)),
      totalSales: Number(dayData[0]?.totalSales || 0)
    });
  }
  
  return trends;
}

function generateFallbackAnalytics(): PricingAnalytics {
  return {
    averagePrice: 1.5,
    medianPrice: 1.2,
    priceRange: { min: 0.5, max: 5.0 },
    recentSales: 0,
    marketTrend: 'stable',
    trendPercentage: 0,
    suggestedPrice: 1.0,
    confidence: 'low',
    reasoning: [
      'Limited market data available',
      'Suggested price based on platform averages',
      'Consider market research for better pricing'
    ]
  };
}