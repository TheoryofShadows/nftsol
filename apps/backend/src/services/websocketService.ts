import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { CloutTokenService } from './cloutToken';
import { MarketplaceService } from './marketplace';
import { UniversalNFTDetectionService } from './universalNFTDetection';

export interface WebSocketEvents {
  // CLOUT events
  'clout-balance-update': { wallet: string; balance: number; cloutEarned: number };
  'clout-global-stats': { totalClout: number; activeUsers: number; transactions24h: number };
  'clout-leaderboard': Array<{ wallet: string; clout: number; rank: number }>;
  
  // Marketplace events
  'nft-listed': { nft: any; platform: string };
  'nft-sold': { nft: any; buyer: string; price: string; timestamp: number };
  'nft-price-update': { mintAddress: string; oldPrice: string; newPrice: string };
  'marketplace-activity': { type: string; data: any; timestamp: number };
  
  // General events
  'connection-status': { status: 'connected' | 'disconnected'; timestamp: number };
  'error': { message: string; code?: string };
}

export class WebSocketService {
  private io: SocketIOServer;
  private cloutService: CloutTokenService;
  private marketplaceService: MarketplaceService;
  private nftDetectionService: UniversalNFTDetectionService;
  private connectedClients: Map<string, { wallet?: string; lastActivity: number }> = new Map();

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.cloutService = new CloutTokenService();
    this.marketplaceService = new MarketplaceService();
    this.nftDetectionService = new UniversalNFTDetectionService();

    this.setupEventHandlers();
    this.startPeriodicUpdates();
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`🔌 WebSocket client connected: ${socket.id}`);
      
      // Store client info
      this.connectedClients.set(socket.id, {
        lastActivity: Date.now()
      });

      // Send connection status
      socket.emit('connection-status', {
        status: 'connected',
        timestamp: Date.now()
      });

      // Handle wallet connection
      socket.on('wallet-connected', async (data: { wallet: string }) => {
        console.log(`💰 Wallet connected: ${data.wallet}`);
        this.connectedClients.set(socket.id, {
          wallet: data.wallet,
          lastActivity: Date.now()
        });

        // Send initial CLOUT balance
        try {
          const balance = await this.cloutService.getCloutBalance(data.wallet);
          socket.emit('clout-balance-update', {
            wallet: data.wallet,
            balance: balance.balance || 0,
            cloutEarned: balance.cloutEarned || 0
          });
        } catch (error) {
          console.error('Error fetching CLOUT balance:', error);
        }
      });

      // Handle wallet disconnection
      socket.on('wallet-disconnected', () => {
        console.log(`💰 Wallet disconnected: ${socket.id}`);
        this.connectedClients.set(socket.id, {
          lastActivity: Date.now()
        });
      });

      // Handle NFT listing
      socket.on('nft-listed', async (data: { nft: any }) => {
        try {
          // Broadcast to all clients
          this.io.emit('nft-listed', {
            nft: data.nft,
            platform: 'nftsol',
            timestamp: Date.now()
          });
        } catch (error) {
          console.error('Error handling NFT listing:', error);
          socket.emit('error', { message: 'Failed to list NFT' });
        }
      });

      // Handle NFT purchase
      socket.on('nft-purchased', async (data: { nft: any; buyer: string; price: string }) => {
        try {
          // Broadcast to all clients
          this.io.emit('nft-sold', {
            nft: data.nft,
            buyer: data.buyer,
            price: data.price,
            timestamp: Date.now()
          });

          // Update CLOUT balance for buyer
          const balance = await this.cloutService.getCloutBalance(data.buyer);
          socket.emit('clout-balance-update', {
            wallet: data.buyer,
            balance: balance.balance || 0,
            cloutEarned: balance.cloutEarned || 0
          });
        } catch (error) {
          console.error('Error handling NFT purchase:', error);
          socket.emit('error', { message: 'Failed to process purchase' });
        }
      });

      // Handle client disconnection
      socket.on('disconnect', () => {
        console.log(`🔌 WebSocket client disconnected: ${socket.id}`);
        this.connectedClients.delete(socket.id);
      });

      // Handle errors
      socket.on('error', (error) => {
        console.error(`WebSocket error for ${socket.id}:`, error);
        socket.emit('error', { message: 'WebSocket error occurred' });
      });
    });
  }

  private startPeriodicUpdates() {
    // Update global CLOUT stats every 30 seconds
    setInterval(async () => {
      try {
        const globalStats = await this.getGlobalCloutStats();
        this.io.emit('clout-global-stats', globalStats);
      } catch (error) {
        console.error('Error updating global CLOUT stats:', error);
      }
    }, 30000);

    // Update leaderboard every 2 minutes
    setInterval(async () => {
      try {
        const leaderboard = await this.getCloutLeaderboard();
        this.io.emit('clout-leaderboard', leaderboard);
      } catch (error) {
        console.error('Error updating leaderboard:', error);
      }
    }, 120000);

    // Clean up inactive clients every 5 minutes
    setInterval(() => {
      const now = Date.now();
      const inactiveThreshold = 5 * 60 * 1000; // 5 minutes

      for (const [socketId, client] of this.connectedClients.entries()) {
        if (now - client.lastActivity > inactiveThreshold) {
          this.connectedClients.delete(socketId);
        }
      }
    }, 300000);
  }

  private async getGlobalCloutStats() {
    // This would typically query your database for real stats
    return {
      totalClout: 1000000,
      activeUsers: this.connectedClients.size,
      transactions24h: 1500
    };
  }

  private async getCloutLeaderboard() {
    // This would typically query your database for real leaderboard data
    return [
      { wallet: 'ABC123...', clout: 50000, rank: 1 },
      { wallet: 'DEF456...', clout: 45000, rank: 2 },
      { wallet: 'GHI789...', clout: 40000, rank: 3 }
    ];
  }

  // Public methods for emitting events from other services
  public emitCloutUpdate(wallet: string, balance: number, cloutEarned: number) {
    this.io.emit('clout-balance-update', {
      wallet,
      balance,
      cloutEarned,
      timestamp: Date.now()
    });
  }

  public emitNFTListed(nft: any, platform: string = 'nftsol') {
    this.io.emit('nft-listed', {
      nft,
      platform,
      timestamp: Date.now()
    });
  }

  public emitNFTSold(nft: any, buyer: string, price: string) {
    this.io.emit('nft-sold', {
      nft,
      buyer,
      price,
      timestamp: Date.now()
    });
  }

  public emitPriceUpdate(mintAddress: string, oldPrice: string, newPrice: string) {
    this.io.emit('nft-price-update', {
      mintAddress,
      oldPrice,
      newPrice,
      timestamp: Date.now()
    });
  }

  public emitMarketplaceActivity(type: string, data: any) {
    this.io.emit('marketplace-activity', {
      type,
      data,
      timestamp: Date.now()
    });
  }

  public getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  public getConnectedWallets(): string[] {
    const wallets: string[] = [];
    for (const client of this.connectedClients.values()) {
      if (client.wallet) {
        wallets.push(client.wallet);
      }
    }
    return wallets;
  }
}
