/**
 * Performance Metrics API Routes
 * Collects and serves performance data for monitoring
 */

import { Router, Request, Response } from 'express';

const router = Router();

interface WebVitalMetric {
  name: string;
  value: number;
  timestamp: string;
  url: string;
  score: 'good' | 'needs-improvement' | 'poor';
}

// In-memory storage for metrics (in production, use a database)
const metricsStore: WebVitalMetric[] = [];
const MAX_METRICS = 10000;

/**
 * POST /api/metrics/web-vitals - Receive Web Vitals from clients
 */
router.post('/web-vitals', (req: Request, res: Response) => {
  try {
    const metric: WebVitalMetric = req.body;

    // Validate metric
    if (!metric.name || typeof metric.value !== 'number') {
      return res.status(400).json({ success: false, error: 'Invalid metric data' });
    }

    // Store metric
    metricsStore.push({
      ...metric,
      timestamp: new Date().toISOString()
    });

    // Keep store size manageable
    if (metricsStore.length > MAX_METRICS) {
      metricsStore.splice(0, metricsStore.length - MAX_METRICS);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Failed to store Web Vital:', error);
    res.status(500).json({ success: false, error: 'Failed to store metric' });
  }
});

/**
 * GET /api/metrics/performance - Get performance report
 */
router.get('/performance', async (req: Request, res: Response) => {
  try {
    const metricsReport = getMetricsReport();

    res.json({
      success: true,
      data: {
        webVitals: metricsReport,
        metricsCollected: metricsStore.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Failed to generate performance report:', error);
    res.status(500).json({ success: false, error: 'Failed to generate report' });
  }
});

/**
 * GET /api/metrics/health - Quick health check
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    metricsCollected: metricsStore.length
  });
});

/**
 * Generate performance metrics report
 */
function getMetricsReport() {
  const report: Record<string, any> = {};
  const metricNames = new Set(metricsStore.map(m => m.name));

  for (const name of metricNames) {
    const metrics = metricsStore.filter(m => m.name === name);
    const values = metrics.map(m => m.value);
    const goodCount = metrics.filter(m => m.score === 'good').length;
    const poorCount = metrics.filter(m => m.score === 'poor').length;

    report[name] = {
      count: metrics.length,
      average: (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2),
      min: Math.min(...values).toFixed(2),
      max: Math.max(...values).toFixed(2),
      p95: calculatePercentile(values, 0.95).toFixed(2),
      p99: calculatePercentile(values, 0.99).toFixed(2),
      goodPercentage: ((goodCount / metrics.length) * 100).toFixed(1),
      poorPercentage: ((poorCount / metrics.length) * 100).toFixed(1)
    };
  }

  return report;
}

/**
 * Calculate percentile of array values
 */
function calculatePercentile(values: number[], percentile: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil(sorted.length * percentile) - 1;
  return sorted[Math.max(0, index)] || 0;
}

export default router;
