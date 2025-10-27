import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress, createTransferInstruction } from '@solana/spl-token';

interface FeeCollection {
  id: string;
  transactionId: string;
  amount: number;
  token: 'SOL' | 'CLOUT';
  from: string;
  to: string;
  timestamp: number;
  type: 'mint' | 'trade' | 'staking' | 'governance';
  status: 'pending' | 'completed' | 'failed';
  solscanUrl?: string;
}

interface FeeStats {
  totalCollected: number;
  totalTransactions: number;
  byType: Record<string, number>;
  byToken: Record<string, number>;
  dailyVolume: number;
  weeklyVolume: number;
  monthlyVolume: number;
  treasuryBalance: number;
  lastUpdated: number;
}

export class FeeCollectionService {
  private connection: Connection;
  private cloutMint: PublicKey;
  private treasury: PublicKey;
  private feeCollector: PublicKey;
  private feeHistory: FeeCollection[] = [];

  constructor(connection: Connection) {
    this.connection = connection;
    this.cloutMint = new PublicKey('4aHwytKbZnTJY5uNDSX75g2zChfYnC53GdNJHEZtwDPf');
    this.treasury = new PublicKey('J9msWkhEUPMLBXzkycwZjuU6B5vjfvNguASHLxJKAAfh');
    this.feeCollector = new PublicKey('5Gu3RnFApFEDmMJj5czHTFPRf6A5xNypSRPrqewmPLHW');
  }

  async collectFee(
    amount: number,
    token: 'SOL' | 'CLOUT',
    type: 'mint' | 'trade' | 'staking' | 'governance',
    from: PublicKey
  ): Promise<FeeCollection> {
    const feeId = `fee_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // Create fee collection transaction
      const transaction = new Transaction();
      
      if (token === 'CLOUT') {
        // Transfer CLOUT tokens to treasury
        const fromTokenAccount = await getAssociatedTokenAddress(this.cloutMint, from);
        const treasuryTokenAccount = await getAssociatedTokenAddress(this.cloutMint, this.treasury);
        
        // Add transfer instruction
        transaction.add(
          createTransferInstruction(
            fromTokenAccount,
            treasuryTokenAccount,
            from,
            amount
          )
        );
      } else {
        // Transfer SOL to treasury
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: from,
            toPubkey: this.treasury,
            lamports: amount
          })
        );
      }

      // Sign and send transaction
      const signature = await this.connection.sendTransaction(transaction, []);
      await this.connection.confirmTransaction(signature);

      const feeCollection: FeeCollection = {
        id: feeId,
        transactionId: signature,
        amount,
        token,
        from: from.toString(),
        to: this.treasury.toString(),
        timestamp: Date.now(),
        type,
        status: 'completed',
        solscanUrl: `https://solscan.io/tx/${signature}`
      };

      // Store in memory (in production, use database)
      this.feeHistory.push(feeCollection);
      
      return feeCollection;
    } catch (error) {
      console.error('Fee collection failed:', error);
      
      const failedFee: FeeCollection = {
        id: feeId,
        transactionId: '',
        amount,
        token,
        from: from.toString(),
        to: this.treasury.toString(),
        timestamp: Date.now(),
        type,
        status: 'failed'
      };
      
      this.feeHistory.push(failedFee);
      throw error;
    }
  }

  async getFeeStats(): Promise<FeeStats> {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const oneWeek = 7 * oneDay;
    const oneMonth = 30 * oneDay;

    const completedFees = this.feeHistory.filter(f => f.status === 'completed');
    
    // Calculate stats
    const totalCollected = completedFees.reduce((sum, fee) => sum + fee.amount, 0);
    const totalTransactions = completedFees.length;
    
    // Group by type
    const byType = completedFees.reduce((acc, fee) => {
      acc[fee.type] = (acc[fee.type] || 0) + fee.amount;
      return acc;
    }, {} as Record<string, number>);
    
    // Group by token
    const byToken = completedFees.reduce((acc, fee) => {
      acc[fee.token] = (acc[fee.token] || 0) + fee.amount;
      return acc;
    }, {} as Record<string, number>);
    
    // Calculate volumes
    const dailyVolume = completedFees
      .filter(fee => now - fee.timestamp < oneDay)
      .reduce((sum, fee) => sum + fee.amount, 0);
      
    const weeklyVolume = completedFees
      .filter(fee => now - fee.timestamp < oneWeek)
      .reduce((sum, fee) => sum + fee.amount, 0);
      
    const monthlyVolume = completedFees
      .filter(fee => now - fee.timestamp < oneMonth)
      .reduce((sum, fee) => sum + fee.amount, 0);

    // Get treasury balance
    let treasuryBalance = 0;
    try {
      const balance = await this.connection.getBalance(this.treasury);
      treasuryBalance = balance / 1e9; // Convert lamports to SOL
    } catch (error) {
      console.error('Failed to fetch treasury balance:', error);
    }

    return {
      totalCollected,
      totalTransactions,
      byType,
      byToken,
      dailyVolume,
      weeklyVolume,
      monthlyVolume,
      treasuryBalance,
      lastUpdated: now
    };
  }

  async getFeeHistory(limit: number = 100): Promise<FeeCollection[]> {
    return this.feeHistory
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  async getTreasuryBalance(): Promise<{ balance: number; balanceLamports: number; address: string }> {
    try {
      const balance = await this.connection.getBalance(this.treasury);
      return {
        balance: balance / 1e9,
        balanceLamports: balance,
        address: this.treasury.toString()
      };
    } catch (error) {
      console.error('Failed to fetch treasury balance:', error);
      return {
        balance: 0,
        balanceLamports: 0,
        address: this.treasury.toString()
      };
    }
  }

  // Simulate fee collection for demo purposes
  async simulateFeeCollection(type: 'mint' | 'trade' | 'staking' | 'governance'): Promise<FeeCollection> {
    const amount = Math.random() * 0.1 + 0.01; // Random amount between 0.01 and 0.11 SOL
    const from = new PublicKey('11111111111111111111111111111112'); // System program for demo
    
    const feeCollection: FeeCollection = {
      id: `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      transactionId: `demo_tx_${Math.random().toString(36).substr(2, 16)}`,
      amount,
      token: 'SOL',
      from: from.toString(),
      to: this.treasury.toString(),
      timestamp: Date.now(),
      type,
      status: 'completed',
      solscanUrl: `https://solscan.io/tx/demo_tx_${Math.random().toString(36).substr(2, 16)}`
    };

    this.feeHistory.push(feeCollection);
    return feeCollection;
  }
}
