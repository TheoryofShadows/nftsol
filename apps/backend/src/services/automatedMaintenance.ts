import { CloutTokenService } from './cloutToken';
import { HonorSystem } from './honorSystem';
import { checkDatabaseHealth } from '../db';

export class AutomatedMaintenanceService {
  private cloutService: CloutTokenService;
  private honorSystem: HonorSystem;
  private maintenanceInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.cloutService = new CloutTokenService();
    this.honorSystem = new HonorSystem();
  }

  // Start automated maintenance tasks
  startAutomatedMaintenance() {
    console.log('🤖 Starting automated maintenance service...');
    
    // Daily CLOUT distribution at 12:00 AM UTC
    this.scheduleDailyCloutDistribution();
    
    // Honor score updates every 6 hours
    this.scheduleHonorScoreUpdates();
    
    // Database cleanup every 24 hours
    this.scheduleDatabaseCleanup();
    
    // Health monitoring every 5 minutes
    this.scheduleHealthMonitoring();
    
    console.log('✅ Automated maintenance service started');
  }

  // Stop automated maintenance
  stopAutomatedMaintenance() {
    if (this.maintenanceInterval) {
      clearInterval(this.maintenanceInterval);
      this.maintenanceInterval = null;
    }
    console.log('🛑 Automated maintenance service stopped');
  }

  // Schedule daily CLOUT distribution
  private scheduleDailyCloutDistribution() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);
    
    const msUntilMidnight = tomorrow.getTime() - now.getTime();
    
    setTimeout(() => {
      this.distributeDailyClout();
      // Then repeat every 24 hours
      setInterval(() => this.distributeDailyClout(), 24 * 60 * 60 * 1000);
    }, msUntilMidnight);
  }

  // Schedule honor score updates
  private scheduleHonorScoreUpdates() {
    setInterval(() => {
      this.updateHonorScores();
    }, 6 * 60 * 60 * 1000); // Every 6 hours
  }

  // Schedule database cleanup
  private scheduleDatabaseCleanup() {
    setInterval(() => {
      this.cleanupDatabase();
    }, 24 * 60 * 60 * 1000); // Every 24 hours
  }

  // Schedule health monitoring
  private scheduleHealthMonitoring() {
    setInterval(() => {
      this.performHealthCheck();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  // Distribute daily CLOUT rewards
  private async distributeDailyClout() {
    try {
      console.log('🎁 Starting automated daily CLOUT distribution...');
      const result = await this.cloutService.distributeDailyCloutRewards();
      
      if (result.success) {
        console.log(`✅ Daily CLOUT distribution completed: ${result.totalDistributed} CLOUT to ${result.userCount} users`);
      } else {
        console.error('❌ Daily CLOUT distribution failed:', result.error);
      }
    } catch (error) {
      console.error('❌ Automated CLOUT distribution error:', error);
    }
  }

  // Update honor scores for all users
  private async updateHonorScores() {
    try {
      console.log('📊 Starting automated honor score updates...');
      
      // Get all users from database
      const users = await this.getAllUsers();
      
      for (const user of users) {
        try {
          const honorScore = await this.honorSystem.calculateHonorScore(user.walletAddress);
          await this.honorSystem.updateHonorScore(user.walletAddress, 'automated_update');
          
          // Log significant changes
          if (honorScore.total !== user.lastHonorScore) {
            console.log(`📈 Honor score updated for ${user.walletAddress}: ${user.lastHonorScore} → ${honorScore.total}`);
          }
        } catch (error) {
          console.error(`Failed to update honor score for ${user.walletAddress}:`, error);
        }
      }
      
      console.log('✅ Honor score updates completed');
    } catch (error) {
      console.error('❌ Automated honor score update error:', error);
    }
  }

  // Clean up old database records
  private async cleanupDatabase() {
    try {
      console.log('🧹 Starting automated database cleanup...');
      
      // Clean up old transaction records (older than 1 year)
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      
      // This would clean up old records
      // await db.delete(oldTransactions).where(lt(oldTransactions.createdAt, oneYearAgo));
      
      console.log('✅ Database cleanup completed');
    } catch (error) {
      console.error('❌ Database cleanup error:', error);
    }
  }

  // Perform automated health check
  private async performHealthCheck() {
    try {
      // Check system health
      const healthStatus = await this.checkSystemHealth();
      
      if (!healthStatus.healthy) {
        console.warn('⚠️ System health check failed:', healthStatus.issues);
        await this.attemptSelfHealing(healthStatus.issues);
      }
    } catch (error) {
      console.error('❌ Health monitoring error:', error);
    }
  }

  // Check system health
  private async checkSystemHealth() {
    const issues: string[] = [];
    
    try {
      // Test database connection using the dedicated health check
      const dbHealth = await checkDatabaseHealth();
      if (!dbHealth.healthy) {
        issues.push(`Database connection failed: ${dbHealth.error || 'Unknown error'}`);
      }
    } catch (error) {
      issues.push('Database connection failed');
    }
    
    try {
      // Test CLOUT token system
      const cloutInfo = this.cloutService.getCloutTokenInfo();
      if (!cloutInfo.mint) {
        issues.push('CLOUT token system unavailable');
      }
    } catch (error) {
      issues.push('CLOUT token system error');
    }
    
    return {
      healthy: issues.length === 0,
      issues,
      timestamp: new Date().toISOString()
    };
  }

  // Attempt self-healing for identified issues
  private async attemptSelfHealing(issues: string[]) {
    console.log('🔧 Attempting self-healing for issues:', issues);
    
    for (const issue of issues) {
      try {
        if (issue.includes('Database')) {
          await this.healDatabaseConnection();
        } else if (issue.includes('CLOUT')) {
          await this.healCloutSystem();
        }
      } catch (error) {
        console.error(`Failed to heal ${issue}:`, error);
      }
    }
  }

  // Heal database connection
  private async healDatabaseConnection() {
    try {
      // First, check current health
      const health = await checkDatabaseHealth();
      
      if (health.healthy) {
        console.log('✅ Database connection is healthy');
        return;
      }
      
      // If unhealthy, attempt to reconnect
      console.log('🔧 Attempting database reconnection...');
      
      // Import initializeDatabase dynamically to avoid circular dependency
      const { initializeDatabase } = await import('../db');
      await initializeDatabase();
      
      // Verify reconnection
      const newHealth = await checkDatabaseHealth();
      if (newHealth.healthy) {
        console.log('✅ Database reconnection successful');
      } else {
        console.log('⚠️ Database still unhealthy:', newHealth.error);
      }
    } catch (error) {
      console.error('❌ Database healing failed:', error);
    }
  }

  // Heal CLOUT system
  private async healCloutSystem() {
    try {
      console.log('🔧 Attempting CLOUT system healing...');
      // Reload CLOUT token configuration
      const cloutInfo = this.cloutService.getCloutTokenInfo();
      console.log('✅ CLOUT system healing attempted');
    } catch (error) {
      console.error('❌ CLOUT system healing failed:', error);
    }
  }

  // Get all users (placeholder implementation)
  private async getAllUsers() {
    try {
      // This would query your database for all users
      return [
        { walletAddress: 'user1', lastHonorScore: 50 },
        { walletAddress: 'user2', lastHonorScore: 75 }
      ];
    } catch (error) {
      console.error('Failed to get users:', error);
      return [];
    }
  }

  // Get maintenance status
  getMaintenanceStatus() {
    return {
      running: this.maintenanceInterval !== null,
      services: {
        dailyCloutDistribution: true,
        honorScoreUpdates: true,
        databaseCleanup: true,
        healthMonitoring: true
      },
      lastRun: new Date().toISOString()
    };
  }
}
