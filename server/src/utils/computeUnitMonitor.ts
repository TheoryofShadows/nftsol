import { Connection, Transaction, TransactionSignature } from '@solana/web3.js';

/**
 * Compute Unit Monitoring and Benchmarking Utilities
 * Tracks CU usage and provides optimization recommendations
 */

export interface ComputeUnitMetrics {
  instructionName: string;
  computeUnitsUsed: number;
  computeUnitsRequested: number;
  efficiency: number; // percentage
  timestamp: number;
  success: boolean;
  error?: string;
}

export interface BenchmarkResult {
  averageCU: number;
  minCU: number;
  maxCU: number;
  efficiency: number;
  recommendations: string[];
}

class ComputeUnitMonitor {
  private metrics: ComputeUnitMetrics[] = [];
  private readonly maxMetrics = 1000; // Keep last 1000 measurements

  /**
   * Record compute unit usage for an instruction
   */
  recordMetrics(metrics: Omit<ComputeUnitMetrics, 'timestamp'>): void {
    const fullMetrics: ComputeUnitMetrics = {
      ...metrics,
      timestamp: Date.now()
    };

    this.metrics.push(fullMetrics);

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log efficiency warnings
    if (fullMetrics.efficiency < 50) {
      console.warn(`⚠️ Low CU efficiency for ${fullMetrics.instructionName}: ${fullMetrics.efficiency.toFixed(1)}%`);
    }
  }

  /**
   * Get benchmark results for an instruction
   */
  getBenchmark(instructionName: string): BenchmarkResult | null {
    const instructionMetrics = this.metrics.filter(m => m.instructionName === instructionName);
    
    if (instructionMetrics.length === 0) {
      return null;
    }

    const successfulMetrics = instructionMetrics.filter(m => m.success);
    if (successfulMetrics.length === 0) {
      return null;
    }

    const averageCU = successfulMetrics.reduce((sum, m) => sum + m.computeUnitsUsed, 0) / successfulMetrics.length;
    const minCU = Math.min(...successfulMetrics.map(m => m.computeUnitsUsed));
    const maxCU = Math.max(...successfulMetrics.map(m => m.computeUnitsUsed));
    const efficiency = (averageCU / 200_000) * 100; // Efficiency relative to 200k limit

    const recommendations: string[] = [];
    
    if (efficiency > 80) {
      recommendations.push('Consider optimizing logic to reduce compute units');
    }
    if (maxCU > 180_000) {
      recommendations.push('Maximum CU usage is close to limit - add safety margin');
    }
    if (averageCU < 10_000) {
      recommendations.push('Very low CU usage - consider batching with other operations');
    }

    return {
      averageCU,
      minCU,
      maxCU,
      efficiency,
      recommendations
    };
  }

  /**
   * Get all benchmark results
   */
  getAllBenchmarks(): Record<string, BenchmarkResult> {
    const instructionNames = [...new Set(this.metrics.map(m => m.instructionName))];
    const benchmarks: Record<string, BenchmarkResult> = {};

    for (const name of instructionNames) {
      const benchmark = this.getBenchmark(name);
      if (benchmark) {
        benchmarks[name] = benchmark;
      }
    }

    return benchmarks;
  }

  /**
   * Get optimization recommendations
   */
  getOptimizationRecommendations(): string[] {
    const benchmarks = this.getAllBenchmarks();
    const recommendations: string[] = [];

    for (const [instructionName, benchmark] of Object.entries(benchmarks)) {
      if (benchmark.efficiency > 75) {
        recommendations.push(`${instructionName}: High CU usage (${benchmark.efficiency.toFixed(1)}%) - consider optimization`);
      }
      if (benchmark.maxCU > 180_000) {
        recommendations.push(`${instructionName}: Near CU limit (${benchmark.maxCU}) - add safety margin`);
      }
    }

    return recommendations;
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Get metrics summary
   */
  getSummary(): {
    totalInstructions: number;
    averageEfficiency: number;
    highUsageInstructions: string[];
    recommendations: string[];
  } {
    const benchmarks = this.getAllBenchmarks();
    const instructionNames = Object.keys(benchmarks);
    
    const averageEfficiency = instructionNames.length > 0 
      ? Object.values(benchmarks).reduce((sum, b) => sum + b.efficiency, 0) / instructionNames.length
      : 0;

    const highUsageInstructions = instructionNames.filter(name => 
      benchmarks[name].efficiency > 75
    );

    return {
      totalInstructions: instructionNames.length,
      averageEfficiency,
      highUsageInstructions,
      recommendations: this.getOptimizationRecommendations()
    };
  }
}

// Singleton instance
export const computeUnitMonitor = new ComputeUnitMonitor();

/**
 * Enhanced transaction sending with CU monitoring
 */
export async function sendTransactionWithMonitoring(
  connection: Connection,
  transaction: Transaction,
  signers: any[],
  instructionName: string = 'unknown'
): Promise<TransactionSignature> {
  const startTime = Date.now();
  
  try {
    // Send transaction
    const signature = await connection.sendTransaction(transaction, signers, {
      skipPreflight: false,
      preflightCommitment: 'confirmed'
    });

    // Wait for confirmation to get CU usage
    const confirmation = await connection.confirmTransaction(signature, 'confirmed');
    
    if (confirmation.value.err) {
      throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
    }

    // Get transaction details for CU metrics
    const txDetails = await connection.getTransaction(signature, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0
    });

    const computeUnitsUsed = txDetails?.meta?.computeUnitsConsumed || 0;
    const computeUnitsRequested = 200_000; // Default limit
    const efficiency = (computeUnitsUsed / computeUnitsRequested) * 100;

    // Record metrics
    computeUnitMonitor.recordMetrics({
      instructionName,
      computeUnitsUsed,
      computeUnitsRequested,
      efficiency,
      success: true
    });

    console.log(`✅ ${instructionName}: ${computeUnitsUsed} CU used (${efficiency.toFixed(1)}% efficiency)`);

    return signature;

  } catch (error: any) {
    // Record failed transaction
    computeUnitMonitor.recordMetrics({
      instructionName,
      computeUnitsUsed: 0,
      computeUnitsRequested: 200_000,
      efficiency: 0,
      success: false,
      error: error.message
    });

    throw error;
  }
}

/**
 * Get CU usage statistics for monitoring dashboard
 */
export function getComputeUnitStats() {
  return {
    monitor: computeUnitMonitor.getSummary(),
    benchmarks: computeUnitMonitor.getAllBenchmarks()
  };
}
