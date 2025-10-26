interface UsageMetrics {
  timestamp: number;
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  userId?: string;
  walletAddress?: string;
  ipAddress: string;
  userAgent: string;
  requestSize?: number;
  responseSize?: number;
}

interface UsageStats {
  totalRequests: number;
  uniqueUsers: number;
  averageResponseTime: number;
  errorRate: number;
  topEndpoints: Array<{ endpoint: string; count: number; avgResponseTime: number }>;
  hourlyStats: Array<{ hour: string; requests: number; errors: number }>;
  dailyStats: Array<{ date: string; requests: number; errors: number }>;
  statusCodeDistribution: Record<number, number>;
  userAgents: Array<{ userAgent: string; count: number }>;
  lastUpdated: number;
}

export class UsageMonitoringService {
  private metrics: UsageMetrics[] = [];
  private maxMetrics = 50000; // Keep last 50k metrics in memory
  private uniqueUsers = new Set<string>();

  recordUsage(metrics: UsageMetrics): void {
    this.metrics.push(metrics);
    
    // Track unique users
    if (metrics.userId) {
      this.uniqueUsers.add(metrics.userId);
    } else if (metrics.walletAddress) {
      this.uniqueUsers.add(metrics.walletAddress);
    } else {
      this.uniqueUsers.add(metrics.ipAddress);
    }
    
    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  getUsageStats(timeframe: 'hour' | 'day' | 'week' | 'month' = 'day'): UsageStats {
    const now = Date.now();
    const timeframeMs = this.getTimeframeMs(timeframe);
    const relevantMetrics = this.metrics.filter(m => now - m.timestamp < timeframeMs);

    const totalRequests = relevantMetrics.length;
    const uniqueUsers = this.getUniqueUsersInTimeframe(relevantMetrics);
    const averageResponseTime = relevantMetrics.length > 0 
      ? relevantMetrics.reduce((sum, m) => sum + m.responseTime, 0) / relevantMetrics.length 
      : 0;
    const errorRate = relevantMetrics.length > 0 
      ? relevantMetrics.filter(m => m.statusCode >= 400).length / relevantMetrics.length 
      : 0;

    // Top endpoints with response times
    const endpointStats = relevantMetrics.reduce((acc, m) => {
      if (!acc[m.endpoint]) {
        acc[m.endpoint] = { count: 0, totalResponseTime: 0 };
      }
      acc[m.endpoint].count++;
      acc[m.endpoint].totalResponseTime += m.responseTime;
      return acc;
    }, {} as Record<string, { count: number; totalResponseTime: number }>);

    const topEndpoints = Object.entries(endpointStats)
      .map(([endpoint, stats]) => ({
        endpoint,
        count: stats.count,
        avgResponseTime: stats.totalResponseTime / stats.count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Status code distribution
    const statusCodeDistribution = relevantMetrics.reduce((acc, m) => {
      acc[m.statusCode] = (acc[m.statusCode] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    // User agents
    const userAgentCounts = relevantMetrics.reduce((acc, m) => {
      const ua = m.userAgent || 'Unknown';
      acc[ua] = (acc[ua] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const userAgents = Object.entries(userAgentCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([userAgent, count]) => ({ userAgent, count }));

    // Hourly/Daily stats
    const hourlyStats = this.getHourlyStats(relevantMetrics);
    const dailyStats = this.getDailyStats(relevantMetrics);

    return {
      totalRequests,
      uniqueUsers,
      averageResponseTime,
      errorRate,
      topEndpoints,
      hourlyStats,
      dailyStats,
      statusCodeDistribution,
      userAgents,
      lastUpdated: now
    };
  }

  private getTimeframeMs(timeframe: string): number {
    switch (timeframe) {
      case 'hour': return 60 * 60 * 1000;
      case 'day': return 24 * 60 * 60 * 1000;
      case 'week': return 7 * 24 * 60 * 60 * 1000;
      case 'month': return 30 * 24 * 60 * 60 * 1000;
      default: return 24 * 60 * 60 * 1000;
    }
  }

  private getUniqueUsersInTimeframe(metrics: UsageMetrics[]): number {
    const users = new Set<string>();
    metrics.forEach(m => {
      if (m.userId) {
        users.add(m.userId);
      } else if (m.walletAddress) {
        users.add(m.walletAddress);
      } else {
        users.add(m.ipAddress);
      }
    });
    return users.size;
  }

  private getHourlyStats(metrics: UsageMetrics[]): Array<{ hour: string; requests: number; errors: number }> {
    const hourlyCounts = metrics.reduce((acc, m) => {
      const hour = new Date(m.timestamp).toISOString().slice(0, 13) + ':00:00Z';
      if (!acc[hour]) {
        acc[hour] = { requests: 0, errors: 0 };
      }
      acc[hour].requests++;
      if (m.statusCode >= 400) {
        acc[hour].errors++;
      }
      return acc;
    }, {} as Record<string, { requests: number; errors: number }>);

    return Object.entries(hourlyCounts)
      .map(([hour, stats]) => ({ hour, ...stats }))
      .sort((a, b) => a.hour.localeCompare(b.hour));
  }

  private getDailyStats(metrics: UsageMetrics[]): Array<{ date: string; requests: number; errors: number }> {
    const dailyCounts = metrics.reduce((acc, m) => {
      const date = new Date(m.timestamp).toISOString().slice(0, 10);
      if (!acc[date]) {
        acc[date] = { requests: 0, errors: 0 };
      }
      acc[date].requests++;
      if (m.statusCode >= 400) {
        acc[date].errors++;
      }
      return acc;
    }, {} as Record<string, { requests: number; errors: number }>);

    return Object.entries(dailyCounts)
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  // Get real-time metrics for dashboard
  getRealTimeMetrics(): {
    requestsPerSecond: number;
    averageResponseTime: number;
    errorRate: number;
    activeUsers: number;
  } {
    const now = Date.now();
    const lastMinute = this.metrics.filter(m => now - m.timestamp < 60000);
    
    const requestsPerSecond = lastMinute.length / 60;
    const averageResponseTime = lastMinute.length > 0 
      ? lastMinute.reduce((sum, m) => sum + m.responseTime, 0) / lastMinute.length 
      : 0;
    const errorRate = lastMinute.length > 0 
      ? lastMinute.filter(m => m.statusCode >= 400).length / lastMinute.length 
      : 0;
    
    const activeUsers = new Set(lastMinute.map(m => m.userId || m.walletAddress || m.ipAddress)).size;

    return {
      requestsPerSecond,
      averageResponseTime,
      errorRate,
      activeUsers
    };
  }

  // Simulate some usage data for demo
  generateDemoData(): void {
    const endpoints = [
      '/api/nfts',
      '/api/marketplace',
      '/api/mint',
      '/api/clout/info',
      '/api/transparency/fees/stats',
      '/api/transparency/usage/stats',
      '/api/healthz'
    ];
    
    const methods = ['GET', 'POST', 'PUT', 'DELETE'];
    const statusCodes = [200, 201, 400, 401, 404, 500];
    
    for (let i = 0; i < 1000; i++) {
      const timestamp = Date.now() - Math.random() * 24 * 60 * 60 * 1000; // Last 24 hours
      const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
      const method = methods[Math.floor(Math.random() * methods.length)];
      const statusCode = statusCodes[Math.floor(Math.random() * statusCodes.length)];
      const responseTime = Math.random() * 1000 + 50; // 50-1050ms
      
      this.recordUsage({
        timestamp,
        endpoint,
        method,
        responseTime,
        statusCode,
        userId: `user_${Math.floor(Math.random() * 100)}`,
        walletAddress: `wallet_${Math.floor(Math.random() * 50)}`,
        ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
        userAgent: 'NFTSol-Client/1.0.0',
        requestSize: Math.floor(Math.random() * 10000),
        responseSize: Math.floor(Math.random() * 50000)
      });
    }
  }
}
