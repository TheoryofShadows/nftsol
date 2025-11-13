import express from 'express';
import promBundle from 'express-prom-bundle';
import client from 'prom-client';
import { collectDefaultMetrics } from 'prom-client';

// Enable default Prometheus metrics
collectDefaultMetrics({
  prefix: 'nftsol_',
  timeout: 10000,
  gcDurationBuckets: [0.1, 0.2, 0.5, 1, 2, 5],
});

// Create a custom registry
const register = new client.Registry();
register.setDefaultLabels({
  app: 'nftsol-backend',
  environment: process.env.NODE_ENV || 'development',
});

// Custom metrics
const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
});

const databaseQueryDuration = new client.Histogram({
  name: 'db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'table'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
});

// Register custom metrics
register.registerMetric(httpRequestDurationMicroseconds);
register.registerMetric(databaseQueryDuration);

// Create metrics middleware
const metricsMiddleware = promBundle({
  includeMethod: true,
  includePath: true,
  includeStatusCode: true,
  includeUp: true,
  customLabels: { app: 'nftsol-backend' },
  promClient: {
    collectDefaultMetrics: {
      timeout: 1000,
    },
  },
});

export {
  register,
  metricsMiddleware,
  httpRequestDurationMicroseconds,
  databaseQueryDuration,
};

// Helper function to measure database query duration
export async function withQueryMetrics<T>(
  operation: string,
  table: string,
  query: () => Promise<T>
): Promise<T> {
  const end = databaseQueryDuration.startTimer({ operation, table });
  try {
    return await query();
  } finally {
    end();
  }
}

// Health check endpoint
export function createHealthCheckRouter() {
  const router = express.Router();
  
  router.get('/health', (_req, res) => {
    res.json({
      status: 'UP',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      env: process.env.NODE_ENV,
      nodeVersion: process.version,
    });
  });

  // Metrics endpoint for Prometheus
  router.get('/metrics', async (_req, res) => {
    try {
      res.set('Content-Type', register.contentType);
      res.end(await register.metrics());
    } catch (error) {
      res.status(500).end(error);
    }
  });

  return router;
}
