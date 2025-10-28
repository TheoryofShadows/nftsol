// src/workers/reconciliation.ts
import { pool } from '../lib/db';
import { connection } from '../lib/solana';

interface ReconciliationIssue {
  type: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  data: any;
}

class ReconciliationWorker {
  private isRunning = false;

  async runReconciliation(): Promise<ReconciliationIssue[]> {
    if (this.isRunning) {
      console.log('Reconciliation already running, skipping...');
      return [];
    }

    this.isRunning = true;
    const issues: ReconciliationIssue[] = [];

    try {
      console.log('🔍 Starting reconciliation check...');

      // Check 1: Negative balances
      const negativeBalances = await this.checkNegativeBalances();
      issues.push(...negativeBalances);

      // Check 2: Pending withdrawal mismatches
      const pendingMismatches = await this.checkPendingMismatches();
      issues.push(...pendingMismatches);

      // Check 3: Missing transaction signatures
      const missingTxSigs = await this.checkMissingTxSigs();
      issues.push(...missingTxSigs);

      // Check 4: Stuck withdrawals
      const stuckWithdrawals = await this.checkStuckWithdrawals();
      issues.push(...stuckWithdrawals);

      // Check 5: Platform balance
      const platformBalance = await this.checkPlatformBalance();
      issues.push(...platformBalance);

      // Process issues
      await this.processIssues(issues);

      console.log(`✅ Reconciliation complete. Found ${issues.length} issues.`);
      return issues;

    } catch (error) {
      console.error('❌ Reconciliation failed:', error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  private async checkNegativeBalances(): Promise<ReconciliationIssue[]> {
    const result = await pool.query(`
      SELECT user_id, available_lamports, pending_withdrawal_lamports
      FROM wallets
      WHERE available_lamports < 0 OR pending_withdrawal_lamports < 0
    `);

    return result.rows.map(row => ({
      type: 'NEGATIVE_BALANCE',
      severity: 'HIGH' as const,
      description: `User ${row.user_id} has negative balance`,
      data: row
    }));
  }

  private async checkPendingMismatches(): Promise<ReconciliationIssue[]> {
    const result = await pool.query(`
      SELECT 
        w.user_id,
        COALESCE(SUM(amount_lamports) FILTER (WHERE status IN ('pending','approved','processing')),0) AS sum_withdrawals_pending,
        COALESCE(wt.pending_withdrawal_lamports,0) AS wallet_pending
      FROM (SELECT DISTINCT user_id FROM withdrawals) d
      LEFT JOIN wallets wt ON wt.user_id = d.user_id
      LEFT JOIN withdrawals w ON w.user_id = d.user_id
      GROUP BY w.user_id, wt.pending_withdrawal_lamports
      HAVING COALESCE(SUM(amount_lamports) FILTER (WHERE status IN ('pending','approved','processing')),0)
             <> COALESCE(wt.pending_withdrawal_lamports,0)
    `);

    return result.rows.map(row => ({
      type: 'PENDING_MISMATCH',
      severity: 'HIGH' as const,
      description: `User ${row.user_id} has pending withdrawal mismatch`,
      data: row
    }));
  }

  private async checkMissingTxSigs(): Promise<ReconciliationIssue[]> {
    const result = await pool.query(`
      SELECT id, user_id, amount_lamports, processed_tx_sig, created_at
      FROM withdrawals
      WHERE status = 'completed' 
        AND (processed_tx_sig IS NULL OR processed_tx_sig = '')
    `);

    return result.rows.map(row => ({
      type: 'MISSING_TX_SIG',
      severity: 'HIGH' as const,
      description: `Completed withdrawal ${row.id} missing transaction signature`,
      data: row
    }));
  }

  private async checkStuckWithdrawals(): Promise<ReconciliationIssue[]> {
    const result = await pool.query(`
      SELECT id, user_id, amount_lamports, status, created_at
      FROM withdrawals
      WHERE status IN ('pending','processing','approved')
        AND created_at < now() - INTERVAL '6 hours'
    `);

    return result.rows.map(row => ({
      type: 'STUCK_WITHDRAWAL',
      severity: 'MEDIUM' as const,
      description: `Withdrawal ${row.id} stuck in ${row.status} for >6 hours`,
      data: row
    }));
  }

  private async checkPlatformBalance(): Promise<ReconciliationIssue[]> {
    try {
      const { loadPlatformKeypair } = await import('../lib/solana');
      const keypair = loadPlatformKeypair();
      const balance = await connection.getBalance(keypair.publicKey);
      
      // Alert if balance is too low (less than 10 SOL)
      const minBalance = 10 * 1_000_000_000; // 10 SOL in lamports
      
      if (balance < minBalance) {
        return [{
          type: 'LOW_PLATFORM_BALANCE',
          severity: 'HIGH' as const,
          description: `Platform balance is low: ${balance / 1_000_000_000} SOL`,
          data: { balance, minBalance }
        }];
      }
    } catch (error) {
      return [{
        type: 'PLATFORM_BALANCE_CHECK_FAILED',
        severity: 'MEDIUM' as const,
        description: `Failed to check platform balance: ${error}`,
        data: { error: (error as Error).message }
      }];
    }

    return [];
  }

  private async processIssues(issues: ReconciliationIssue[]): Promise<void> {
    for (const issue of issues) {
      console.log(`🚨 ${issue.severity}: ${issue.description}`);
      
      // Log to monitoring system
      await this.logIssue(issue);
      
      // Send alerts for high severity issues
      if (issue.severity === 'HIGH') {
        await this.sendAlert(issue);
      }
    }
  }

  private async logIssue(issue: ReconciliationIssue): Promise<void> {
    // Log to database for audit trail
    await pool.query(`
      INSERT INTO reconciliation_logs (issue_type, severity, description, data, created_at)
      VALUES ($1, $2, $3, $4, now())
    `, [issue.type, issue.severity, issue.description, JSON.stringify(issue.data)]);
  }

  private async sendAlert(issue: ReconciliationIssue): Promise<void> {
    // Send to monitoring system (PagerDuty, Slack, etc.)
    console.log(`🚨 ALERT: ${issue.type} - ${issue.description}`);
    
    // TODO: Integrate with your alerting system
    // Example: await sendSlackAlert(issue);
    // Example: await sendPagerDutyAlert(issue);
  }
}

export const reconciliationWorker = new ReconciliationWorker();

// Run reconciliation every 15 minutes
if (process.env.NODE_ENV === 'production') {
  setInterval(() => {
    reconciliationWorker.runReconciliation().catch(console.error);
  }, 15 * 60 * 1000); // 15 minutes
}
