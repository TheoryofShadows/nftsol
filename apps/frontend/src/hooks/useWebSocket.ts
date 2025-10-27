import { useEffect, useState, useCallback } from 'react';
import { webSocketService, WebSocketEvents } from '../services/websocket';

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(webSocketService.isConnected());
  const [connectionStatus, setConnectionStatus] = useState(webSocketService.getConnectionStatus());

  useEffect(() => {
    const unsubscribe = webSocketService.on('connection-status', (data) => {
      setIsConnected(data.status === 'connected');
      setConnectionStatus(data.status);
    });

    return unsubscribe;
  }, []);

  const connectWallet = useCallback((wallet: string) => {
    webSocketService.connectWallet(wallet);
  }, []);

  const disconnectWallet = useCallback(() => {
    webSocketService.disconnectWallet();
  }, []);

  const reconnect = useCallback(() => {
    webSocketService.reconnect();
  }, []);

  return {
    isConnected,
    connectionStatus,
    connectWallet,
    disconnectWallet,
    reconnect
  };
}

export function useWebSocketEvent<K extends keyof WebSocketEvents>(
  event: K,
  callback: (data: WebSocketEvents[K]) => void,
  deps: any[] = []
) {
  useEffect(() => {
    const unsubscribe = webSocketService.on(event, callback);
    return unsubscribe;
  }, [event, ...deps]);
}

export function useCloutUpdates(wallet?: string) {
  const [balance, setBalance] = useState<number>(0);
  const [cloutEarned, setCloutEarned] = useState<number>(0);
  const [globalStats, setGlobalStats] = useState({
    totalClout: 0,
    activeUsers: 0,
    transactions24h: 0
  });

  useWebSocketEvent('clout-balance-update', (data) => {
    if (!wallet || data.wallet === wallet) {
      setBalance(data.balance);
      setCloutEarned(data.cloutEarned);
    }
  }, [wallet]);

  useWebSocketEvent('clout-global-stats', (data) => {
    setGlobalStats(data);
  });

  return {
    balance,
    cloutEarned,
    globalStats
  };
}

export function useMarketplaceUpdates() {
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [nftListings, setNftListings] = useState<any[]>([]);
  const [nftSales, setNftSales] = useState<any[]>([]);

  useWebSocketEvent('nft-listed', (data) => {
    setNftListings(prev => [data, ...prev.slice(0, 9)]); // Keep last 10
    setRecentActivity(prev => [{
      type: 'nft-listed',
      data,
      timestamp: Date.now()
    }, ...prev.slice(0, 19)]); // Keep last 20
  });

  useWebSocketEvent('nft-sold', (data) => {
    setNftSales(prev => [data, ...prev.slice(0, 9)]); // Keep last 10
    setRecentActivity(prev => [{
      type: 'nft-sold',
      data,
      timestamp: Date.now()
    }, ...prev.slice(0, 19)]); // Keep last 20
  });

  useWebSocketEvent('marketplace-activity', (data) => {
    setRecentActivity(prev => [data, ...prev.slice(0, 19)]); // Keep last 20
  });

  return {
    recentActivity,
    nftListings,
    nftSales
  };
}
