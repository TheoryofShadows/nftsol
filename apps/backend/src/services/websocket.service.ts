import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server } from 'http';
import { createLogger } from '../lib/logger';

const logger = createLogger('websocket-service');

export interface ActivityEvent {
  type: 'nft_created' | 'nft_sold' | 'offer_made' | 'user_followed' | 'collection_created' | 'clout_earned';
  data: any;
  timestamp: number;
  userId?: string;
}

export interface UserSession {
  userId: string;
  socketId: string;
  connectedAt: number;
}

export class WebSocketService {
  private io: SocketIOServer;
  private userSessions: Map<string, UserSession[]> = new Map();
  private activityHistory: ActivityEvent[] = [];
  private maxHistorySize = 1000;

  constructor(server: Server) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.VITE_CLIENT_URL || 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware(): void {
    this.io.use((socket, next) => {
      const userId = socket.handshake.query.userId as string;
      if (!userId) {
        return next(new Error('Unauthorized: userId required'));
      }
      socket.data.userId = userId;
      next();
    });
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      const userId = socket.data.userId;
      logger.info(`User ${userId} connected: ${socket.id}`);

      // Track user session
      if (!this.userSessions.has(userId)) {
        this.userSessions.set(userId, []);
      }
      this.userSessions.get(userId)!.push({
        userId,
        socketId: socket.id,
        connectedAt: Date.now(),
      });

      // Send activity history to newly connected client
      socket.emit('activity:history', this.activityHistory.slice(-50));

      // Heartbeat for connection health
      socket.on('ping', () => {
        socket.emit('pong');
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        logger.info(`User ${userId} disconnected: ${socket.id}`);
        const sessions = this.userSessions.get(userId);
        if (sessions) {
          const index = sessions.findIndex(s => s.socketId === socket.id);
          if (index > -1) sessions.splice(index, 1);
          if (sessions.length === 0) {
            this.userSessions.delete(userId);
          }
        }
      });

      // Handle custom events
      socket.on('subscribe:nft', (nftMint: string) => {
        socket.join(`nft:${nftMint}`);
        logger.debug(`User ${userId} subscribed to NFT: ${nftMint}`);
      });

      socket.on('unsubscribe:nft', (nftMint: string) => {
        socket.leave(`nft:${nftMint}`);
      });

      socket.on('subscribe:collection', (collectionId: string) => {
        socket.join(`collection:${collectionId}`);
        logger.debug(`User ${userId} subscribed to collection: ${collectionId}`);
      });

      socket.on('unsubscribe:collection', (collectionId: string) => {
        socket.leave(`collection:${collectionId}`);
      });
    });
  }

  /**
   * Broadcast activity event to all connected clients
   */
  public broadcastActivity(event: ActivityEvent): void {
    this.addToHistory(event);
    this.io.emit('activity:new', event);
    logger.debug(`Broadcast activity: ${event.type}`);
  }

  /**
   * Broadcast to specific NFT subscribers
   */
  public broadcastToNFT(nftMint: string, event: ActivityEvent): void {
    this.addToHistory(event);
    this.io.to(`nft:${nftMint}`).emit(`nft:${nftMint}:update`, event);
  }

  /**
   * Broadcast to specific collection subscribers
   */
  public broadcastToCollection(collectionId: string, event: ActivityEvent): void {
    this.addToHistory(event);
    this.io.to(`collection:${collectionId}`).emit(`collection:${collectionId}:update`, event);
  }

  /**
   * Send notification to specific user
   */
  public notifyUser(userId: string, notification: any): void {
    const sessions = this.userSessions.get(userId);
    if (sessions && sessions.length > 0) {
      sessions.forEach(session => {
        this.io.to(session.socketId).emit('notification', notification);
      });
    }
  }

  /**
   * Broadcast price update for an NFT
   */
  public broadcastPriceUpdate(nftMint: string, price: number, currency: 'SOL' | 'USDC'): void {
    const event: ActivityEvent = {
      type: 'nft_sold',
      data: { nftMint, price, currency },
      timestamp: Date.now(),
    };
    this.broadcastToNFT(nftMint, event);
  }

  /**
   * Get active users count
   */
  public getActiveUsersCount(): number {
    return this.userSessions.size;
  }

  /**
   * Get specific user's active sessions
   */
  public getUserSessions(userId: string): UserSession[] {
    return this.userSessions.get(userId) || [];
  }

  /**
   * Add event to history with max size limit
   */
  private addToHistory(event: ActivityEvent): void {
    this.activityHistory.push(event);
    if (this.activityHistory.length > this.maxHistorySize) {
      this.activityHistory.shift();
    }
  }

  /**
   * Get activity history
   */
  public getActivityHistory(limit: number = 50): ActivityEvent[] {
    return this.activityHistory.slice(-limit);
  }

  /**
   * Get IO instance for advanced usage
   */
  public getIO(): SocketIOServer {
    return this.io;
  }
}

let wsService: WebSocketService;

export function initializeWebSocket(server: Server): WebSocketService {
  if (!wsService) {
    wsService = new WebSocketService(server);
  }
  return wsService;
}

export function getWebSocketService(): WebSocketService {
  if (!wsService) {
    throw new Error('WebSocket service not initialized');
  }
  return wsService;
}
