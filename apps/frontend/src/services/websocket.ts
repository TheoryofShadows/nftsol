import { io, Socket } from 'socket.io-client';

export interface WebSocketEvents {
  // CLOUT events
  'clout-balance-update': { wallet: string; balance: number; cloutEarned: number };
  'clout-global-stats': { totalClout: number; activeUsers: number; transactions24h: number };
  'clout-leaderboard': Array<{ wallet: string; clout: number; rank: number }>;
  
  // Marketplace events
  'nft-listed': { nft: any; platform: string };
  'nft-sold': { nft: any; buyer: string; price: string; timestamp: number };
  'nft-purchased': { nft: any; buyer: string; price: string; timestamp: number };
  'nft-price-update': { mintAddress: string; oldPrice: string; newPrice: string };
  'marketplace-activity': { type: string; data: any; timestamp: number };
  
  // Wallet events
  'wallet-connected': { wallet: string };
  'wallet-disconnected': {};
  
  // General events
  'connection-status': { status: 'connected' | 'disconnected'; timestamp: number };
  'error': { message: string; code?: string };
}

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private isConnecting = false;
  private eventListeners: Map<string, Set<Function>> = new Map();

  constructor() {
    this.connect();
  }

  private connect() {
    if (this.isConnecting || (this.socket && this.socket.connected)) {
      return;
    }

    this.isConnecting = true;
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3000';

    try {
      this.socket = io(wsUrl, {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true
      });

      this.setupEventHandlers();
    } catch (error) {
      console.error('❌ WebSocket connection failed:', error);
      this.isConnecting = false;
      this.handleReconnect();
    }
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      this.reconnectAttempts = 0;
      this.isConnecting = false;
      this.emit('connection-status', { status: 'connected', timestamp: Date.now() });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('⚠️ WebSocket disconnected:', reason);
      this.isConnecting = false;
      this.emit('connection-status', { status: 'disconnected', timestamp: Date.now() });
      
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        this.handleReconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error);
      this.isConnecting = false;
      this.handleReconnect();
    });

    // Forward all events to listeners
    Object.keys(this.getEventTypes()).forEach(eventName => {
      this.socket?.on(eventName, (data) => {
        this.emit(eventName as keyof WebSocketEvents, data);
      });
    });
  }

  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`🔄 Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      this.connect();
    }, delay);
  }

  private getEventTypes(): Record<string, any> {
    return {
      'clout-balance-update': null,
      'clout-global-stats': null,
      'clout-leaderboard': null,
      'nft-listed': null,
      'nft-sold': null,
      'nft-price-update': null,
      'marketplace-activity': null,
      'connection-status': null,
      'error': null
    };
  }

  // Public methods
  public isConnected(): boolean {
    return this.socket?.connected || false;
  }

  public getConnectionStatus(): 'connected' | 'disconnecting' | 'disconnected' | 'connecting' {
    if (!this.socket) return 'disconnected';
    return this.socket.connected ? 'connected' : 'disconnected';
  }

  public emit<K extends keyof WebSocketEvents>(event: K, data: WebSocketEvents[K]) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  public on<K extends keyof WebSocketEvents>(event: K, listener: (data: WebSocketEvents[K]) => void) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(listener);

    // Return unsubscribe function
    return () => {
      const listeners = this.eventListeners.get(event);
      if (listeners) {
        listeners.delete(listener);
        if (listeners.size === 0) {
          this.eventListeners.delete(event);
        }
      }
    };
  }

  public off<K extends keyof WebSocketEvents>(event: K, listener: (data: WebSocketEvents[K]) => void) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(listener);
      if (listeners.size === 0) {
        this.eventListeners.delete(event);
      }
    }
  }

  public send<K extends keyof WebSocketEvents>(event: K, data: WebSocketEvents[K]) {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('WebSocket not connected, cannot send event:', event);
    }
  }

  // Specific methods for common operations
  public connectWallet(wallet: string) {
    this.send('wallet-connected', { wallet });
  }

  public disconnectWallet() {
    this.send('wallet-disconnected', {});
  }

  public notifyNFTListed(nft: any) {
    this.send('nft-listed', { nft, platform: 'nftsol' });
  }

  public notifyNFTPurchased(nft: any, buyer: string, price: string) {
    this.send('nft-purchased', { nft, buyer, price, timestamp: Date.now() });
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.eventListeners.clear();
  }

  public reconnect() {
    this.disconnect();
    this.reconnectAttempts = 0;
    this.connect();
  }
}

// Singleton instance
export const webSocketService = new WebSocketService();

// React hook for using WebSocket
export function useWebSocket() {
  return webSocketService;
}

// Hook for specific events
export function useWebSocketEvent<K extends keyof WebSocketEvents>(
  event: K,
  callback: (data: WebSocketEvents[K]) => void,
  deps: any[] = []
) {
  const { useEffect, useRef } = require('react');
  
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const unsubscribe = webSocketService.on(event, (data) => {
      callbackRef.current(data);
    });

    return unsubscribe;
  }, [event, ...deps]);
}

export default webSocketService;
