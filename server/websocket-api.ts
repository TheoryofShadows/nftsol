
import { Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import { db } from "./db";
import { nfts, nftTransactions } from "@shared/nft-schema";
import { desc, eq } from "drizzle-orm";

export function setupWebSocketAPI(httpServer: Server) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: (_origin, callback) => {
        if (process.env.NODE_ENV === 'production') return callback(null, true);
        const devOrigins = ["http://localhost:5173", "http://localhost:3000"];
        if (!_origin || devOrigins.includes(_origin)) return callback(null, true);
        return callback(new Error('Not allowed by CORS'));
      },
      methods: ["GET", "POST"]
    }
  });

  // Track connected clients
  const connectedClients = new Map();

  io.on('connection', (socket) => {
    console.log(`✅ Client connected: ${socket.id}`);
    connectedClients.set(socket.id, {
      connectedAt: new Date(),
      subscriptions: new Set()
    });

    // Subscribe to live NFT updates
    socket.on('subscribe:nft-updates', () => {
      socket.join('nft-updates');
      connectedClients.get(socket.id)?.subscriptions.add('nft-updates');
      console.log(`📡 Client ${socket.id} subscribed to NFT updates`);
    });

    // Subscribe to specific collection updates
    socket.on('subscribe:collection', (collectionName) => {
      socket.join(`collection:${collectionName}`);
      connectedClients.get(socket.id)?.subscriptions.add(`collection:${collectionName}`);
      console.log(`📡 Client ${socket.id} subscribed to collection: ${collectionName}`);
    });

    // Subscribe to price alerts
    socket.on('subscribe:price-alerts', (params) => {
      const { mintAddress, targetPrice, direction } = params;
      socket.join(`price-alert:${mintAddress}`);
      connectedClients.get(socket.id)?.subscriptions.add(`price-alert:${mintAddress}`);
      console.log(`💰 Client ${socket.id} subscribed to price alerts for ${mintAddress}`);
    });

    // Subscribe to wallet activity
    socket.on('subscribe:wallet', (walletAddress) => {
      socket.join(`wallet:${walletAddress}`);
      connectedClients.get(socket.id)?.subscriptions.add(`wallet:${walletAddress}`);
      console.log(`👛 Client ${socket.id} subscribed to wallet: ${walletAddress}`);
    });

    // Get live marketplace stats
    socket.on('get:live-stats', async () => {
      try {
        const stats = await getLiveMarketplaceStats();
        socket.emit('live-stats', stats);
      } catch (error) {
        console.error('Live stats error:', error);
        socket.emit('error', { message: 'Failed to fetch live stats' });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
      connectedClients.delete(socket.id);
    });
  });

  // Broadcast functions for server-side events
  const broadcast = {
    // New NFT listed
    nftListed: (nft: any) => {
      io.to('nft-updates').emit('nft:listed', {
        type: 'nft_listed',
        nft,
        timestamp: new Date().toISOString()
      });
      
      if (nft.collection) {
        io.to(`collection:${nft.collection}`).emit('collection:new-listing', {
          type: 'collection_listing',
          nft,
          timestamp: new Date().toISOString()
        });
      }
    },

    // NFT sold
    nftSold: (nft: any, transaction: any) => {
      io.to('nft-updates').emit('nft:sold', {
        type: 'nft_sold',
        nft,
        transaction,
        timestamp: new Date().toISOString()
      });

      if (nft.collection) {
        io.to(`collection:${nft.collection}`).emit('collection:sale', {
          type: 'collection_sale',
          nft,
          transaction,
          timestamp: new Date().toISOString()
        });
      }

      // Notify wallet subscribers
      if (transaction.fromWallet) {
        io.to(`wallet:${transaction.fromWallet}`).emit('wallet:nft-sold', {
          type: 'wallet_sale',
          nft,
          transaction,
          timestamp: new Date().toISOString()
        });
      }

      if (transaction.toWallet) {
        io.to(`wallet:${transaction.toWallet}`).emit('wallet:nft-purchased', {
          type: 'wallet_purchase',
          nft,
          transaction,
          timestamp: new Date().toISOString()
        });
      }
    },

    // Price change alert
    priceAlert: (mintAddress: string, currentPrice: number, targetPrice: number) => {
      io.to(`price-alert:${mintAddress}`).emit('price-alert', {
        type: 'price_alert',
        mintAddress,
        currentPrice,
        targetPrice,
        timestamp: new Date().toISOString()
      });
    },

    // Market stats update
    marketStats: (stats: any) => {
      io.emit('market:stats-update', {
        type: 'market_stats',
        stats,
        timestamp: new Date().toISOString()
      });
    }
  };

  // Periodic updates
  setInterval(async () => {
    try {
      const stats = await getLiveMarketplaceStats();
      broadcast.marketStats(stats);
    } catch (error) {
      console.error('Periodic stats update error:', error);
    }
  }, 30000); // Update every 30 seconds

  return { io, broadcast };
}

async function getLiveMarketplaceStats() {
  const totalListed = await db
    .select()
    .from(nfts)
    .where(eq(nfts.status, 'listed'));

  const recentSales = await db
    .select()
    .from(nfts)
    .where(eq(nfts.status, 'sold'))
    .orderBy(desc(nfts.soldAt))
    .limit(10);

  return {
    connectedUsers: 0, // Will be updated with real count
    totalListed: totalListed.length,
    recentSales: recentSales,
    lastUpdated: new Date().toISOString()
  };
}
