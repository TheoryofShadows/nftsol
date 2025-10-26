import { describe, it, expect, beforeEach } from '@jest/globals';
import { computeUnitMonitor, getComputeUnitStats } from '../src/utils/computeUnitMonitor';

describe('Compute Unit Monitoring', () => {
  beforeEach(() => {
    computeUnitMonitor.clearMetrics();
  });

  describe('Metrics Recording', () => {
    it('should record successful instruction metrics', () => {
      computeUnitMonitor.recordMetrics({
        instructionName: 'test_instruction',
        computeUnitsUsed: 50000,
        computeUnitsRequested: 100000,
        efficiency: 50,
        success: true
      });

      const stats = getComputeUnitStats();
      expect(stats.monitor.totalInstructions).toBe(1);
      expect(stats.monitor.averageEfficiency).toBe(50);
    });

    it('should record failed instruction metrics', () => {
      computeUnitMonitor.recordMetrics({
        instructionName: 'failed_instruction',
        computeUnitsUsed: 0,
        computeUnitsRequested: 100000,
        efficiency: 0,
        success: false,
        error: 'Test error'
      });

      const stats = getComputeUnitStats();
      expect(stats.monitor.totalInstructions).toBe(1);
    });

    it('should track multiple instructions', () => {
      // Record multiple metrics
      computeUnitMonitor.recordMetrics({
        instructionName: 'instruction_1',
        computeUnitsUsed: 30000,
        computeUnitsRequested: 100000,
        efficiency: 30,
        success: true
      });

      computeUnitMonitor.recordMetrics({
        instructionName: 'instruction_2',
        computeUnitsUsed: 80000,
        computeUnitsRequested: 100000,
        efficiency: 80,
        success: true
      });

      const stats = getComputeUnitStats();
      expect(stats.monitor.totalInstructions).toBe(2);
      expect(stats.monitor.averageEfficiency).toBe(55); // (30 + 80) / 2
    });
  });

  describe('Benchmarking', () => {
    it('should generate benchmark results for instructions', () => {
      // Record multiple metrics for the same instruction
      for (let i = 0; i < 5; i++) {
        computeUnitMonitor.recordMetrics({
          instructionName: 'benchmark_instruction',
          computeUnitsUsed: 40000 + (i * 5000), // 40k, 45k, 50k, 55k, 60k
          computeUnitsRequested: 100000,
          efficiency: 40 + (i * 5), // 40%, 45%, 50%, 55%, 60%
          success: true
        });
      }

      const benchmark = computeUnitMonitor.getBenchmark('benchmark_instruction');
      expect(benchmark).not.toBeNull();
      expect(benchmark!.averageCU).toBe(50000); // (40k + 45k + 50k + 55k + 60k) / 5
      expect(benchmark!.minCU).toBe(40000);
      expect(benchmark!.maxCU).toBe(60000);
      expect(benchmark!.efficiency).toBe(25); // 50k / 200k * 100
    });

    it('should provide optimization recommendations', () => {
      // Record high CU usage
      computeUnitMonitor.recordMetrics({
        instructionName: 'high_cu_instruction',
        computeUnitsUsed: 180000,
        computeUnitsRequested: 200000,
        efficiency: 90,
        success: true
      });

      const benchmark = computeUnitMonitor.getBenchmark('high_cu_instruction');
      expect(benchmark!.recommendations).toContain('Consider optimizing logic to reduce compute units');
      expect(benchmark!.recommendations).toContain('Maximum CU usage is close to limit - add safety margin');
    });

    it('should recommend batching for low CU usage', () => {
      computeUnitMonitor.recordMetrics({
        instructionName: 'low_cu_instruction',
        computeUnitsUsed: 5000,
        computeUnitsRequested: 200000,
        efficiency: 2.5,
        success: true
      });

      const benchmark = computeUnitMonitor.getBenchmark('low_cu_instruction');
      expect(benchmark!.recommendations).toContain('Very low CU usage - consider batching with other operations');
    });
  });

  describe('Optimization Recommendations', () => {
    it('should identify high usage instructions', () => {
      computeUnitMonitor.recordMetrics({
        instructionName: 'high_usage',
        computeUnitsUsed: 160000,
        computeUnitsRequested: 200000,
        efficiency: 80,
        success: true
      });

      const recommendations = computeUnitMonitor.getOptimizationRecommendations();
      expect(recommendations).toContain('high_usage: High CU usage (80.0%) - consider optimization');
    });

    it('should identify near-limit instructions', () => {
      computeUnitMonitor.recordMetrics({
        instructionName: 'near_limit',
        computeUnitsUsed: 185000,
        computeUnitsRequested: 200000,
        efficiency: 92.5,
        success: true
      });

      const recommendations = computeUnitMonitor.getOptimizationRecommendations();
      expect(recommendations).toContain('near_limit: Near CU limit (185000) - add safety margin');
    });
  });

  describe('Summary Statistics', () => {
    it('should provide comprehensive summary', () => {
      // Record various metrics
      computeUnitMonitor.recordMetrics({
        instructionName: 'efficient_instruction',
        computeUnitsUsed: 30000,
        computeUnitsRequested: 100000,
        efficiency: 30,
        success: true
      });

      computeUnitMonitor.recordMetrics({
        instructionName: 'inefficient_instruction',
        computeUnitsUsed: 170000,
        computeUnitsRequested: 200000,
        efficiency: 85,
        success: true
      });

      const summary = computeUnitMonitor.getSummary();
      expect(summary.totalInstructions).toBe(2);
      expect(summary.averageEfficiency).toBe(57.5); // (30 + 85) / 2
      expect(summary.highUsageInstructions).toContain('inefficient_instruction');
      expect(summary.recommendations.length).toBeGreaterThan(0);
    });
  });
});
