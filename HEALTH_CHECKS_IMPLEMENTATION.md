# NFTSol Health Checks Implementation Guide

**Status**: ✅ IMPLEMENTATION COMPLETE
**Date**: November 18, 2025
**Files Created**: 3 (health-check.ts, health.ts, health.test.ts)

---

## Overview

Health checks provide real-time visibility into system status. They enable:
- **Docker**: Health check probes
- **Kubernetes**: Liveness and readiness probes
- **Monitoring**: Automated alerting
- **Load Balancers**: Traffic routing decisions
- **Developers**: Quick diagnostics

---

## Endpoints

### 1. GET /health (Detailed Status)
**Purpose**: Comprehensive system health check
**Response**: 200 (healthy) or 503 (unhealthy)
**Checks**: Database, Redis, Solana RPC

**Example Response (Healthy)**:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-18T12:30:00.000Z",
  "uptime": 3600000,
  "checks": {
    "database": {
      "healthy": true,
      "status": "healthy",
      "responseTime": 15,
      "details": {
        "timestamp": "2025-11-18T12:30:00.000Z",
        "poolStats": {
          "totalCount": 20,
          "idleCount": 15,
          "waitingCount": 0
        }
      }
    },
    "redis": {
      "healthy": true,
      "status": "healthy",
      "responseTime": 5,
      "details": {
        "ping": "PONG",
        "connectedClients": "8"
      }
    },
    "solana": {
      "healthy": true,
      "status": "healthy",
      "responseTime": 250,
      "details": {
        "blockhash": "FwEYo...",
        "slot": 285670491,
        "clusterNodes": 317
      }
    }
  }
}
```

**Example Response (Unhealthy)**:
```json
{
  "status": "unhealthy",
  "timestamp": "2025-11-18T12:30:05.000Z",
  "uptime": 3605000,
  "checks": {
    "database": {
      "healthy": false,
      "status": "unhealthy",
      "responseTime": 5000,
      "error": "connect ECONNREFUSED 127.0.0.1:5432"
    },
    "redis": {
      "healthy": true,
      "status": "healthy",
      "responseTime": 3,
      "details": {...}
    },
    "solana": {
      "healthy": true,
      "status": "healthy",
      "responseTime": 210,
      "details": {...}
    }
  }
}
```

### 2. GET /ready (Readiness Probe)
**Purpose**: Can the service accept traffic?
**Response**: 200 (ready) or 503 (not ready)
**Used By**: Kubernetes readinessProbe, load balancers

**Example Response**:
```json
{
  "ready": true,
  "details": {
    "database": true,
    "cache": true,
    "timestamp": "2025-11-18T12:30:00.000Z"
  }
}
```

### 3. GET /live (Liveness Probe)
**Purpose**: Is the service process running?
**Response**: Always 200 (unless server crashes)
**Used By**: Kubernetes livenessProbe, Docker health checks

**Example Response**:
```json
{
  "alive": true,
  "uptime": 3600000,
  "timestamp": "2025-11-18T12:30:00.000Z"
}
```

### 4. Kubernetes Convention Aliases
- `GET /healthz` → Redirects to `/health`
- `GET /readyz` → Redirects to `/ready`

---

## Integration Steps

### Step 1: Copy Files
```bash
# Files already created in:
cp apps/backend/src/utils/health-check.ts  # Utility functions
cp apps/backend/src/routes/health.ts       # Route handlers
cp apps/backend/src/routes/health.test.ts  # Tests
```

### Step 2: Update Backend Entry Point (apps/backend/src/index.ts)

Add health check initialization after creating database and redis connections:

```typescript
import healthRouter, { initializeHealthRouter } from './routes/health';

// ... after creating database pool and redis client ...

// Initialize health check routes
const startTime = Date.now();
const healthCheckRouter = initializeHealthRouter(
  pool,           // PostgreSQL pool
  redis,          // Redis client
  process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
  [
    // Optional: Account addresses to monitor
    'So11111111111111111111111111111111111111112', // Wrapped SOL
    process.env.CLOUT_PROGRAM_ID,                  // CLOUT token
  ]
);

// Register health check routes
app.use(healthCheckRouter);

// Logging
console.log('Health check endpoints registered:');
console.log('  GET /health    - Detailed health status');
console.log('  GET /ready     - Readiness probe');
console.log('  GET /live      - Liveness probe');
```

### Step 3: Update Docker Health Check (docker-compose.yml)

The health check is already configured, but here's the reference:

```yaml
services:
  backend:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

### Step 4: Update Kubernetes Probes (k8s-manifests/deployment.yaml)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nftsol-backend
spec:
  template:
    spec:
      containers:
      - name: backend
        image: nftsol-backend:latest

        # Liveness Probe - Restart if unhealthy
        livenessProbe:
          httpGet:
            path: /live
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 3
          failureThreshold: 3

        # Readiness Probe - Remove from service if not ready
        readinessProbe:
          httpGet:
            path: /ready
            port: 3001
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 2

        # Health check for monitoring
        lifecycle:
          postStart:
            exec:
              command: ["/bin/sh", "-c", "curl -s http://localhost:3001/health"]
```

### Step 5: Run Tests

```bash
cd apps/backend
npm test -- src/routes/health.test.ts
```

---

## Usage Examples

### Check Health via curl

```bash
# Detailed health check
curl http://localhost:3001/health

# Readiness check
curl http://localhost:3001/ready

# Liveness check
curl http://localhost:3001/live

# With pretty formatting
curl -s http://localhost:3001/health | jq .

# Check status code
curl -w "\nStatus: %{http_code}\n" http://localhost:3001/health
```

### Monitor Health in Scripts

```bash
#!/bin/bash
# Monitor health check

HEALTH_URL="http://localhost:3001/health"
ALERTING_THRESHOLD=2  # Alert if more than 2 consecutive failures

FAILURE_COUNT=0

while true; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL)

  if [ "$STATUS" != "200" ]; then
    FAILURE_COUNT=$((FAILURE_COUNT + 1))

    if [ $FAILURE_COUNT -ge $ALERTING_THRESHOLD ]; then
      echo "ALERT: Backend health check failing!"
      # Send alert (PagerDuty, Slack, etc.)
      curl -X POST "$SLACK_WEBHOOK" \
        -d "{\"text\":\"NFTSol backend unhealthy\"}"
    fi
  else
    FAILURE_COUNT=0
  fi

  sleep 30
done
```

### Integrate with Monitoring

**Prometheus scrape config**:
```yaml
scrape_configs:
  - job_name: 'nftsol-backend'
    static_configs:
      - targets: ['localhost:3001']
    metrics_path: '/metrics'
    scrape_interval: 30s
```

**Grafana Dashboard Query**:
```
up{job="nftsol-backend"}  # 1 if healthy, 0 if unhealthy
```

---

## Advanced Configuration

### Custom Account Monitoring

Monitor specific on-chain accounts:

```typescript
const healthRouter = initializeHealthRouter(
  pool,
  redis,
  process.env.SOLANA_RPC_URL,
  [
    '11111111111111111111111111111111',        // System Program
    'TokenkegQfeZyiNwAJsyFbPVwwQQfuBvpFE6PR22e', // Token Program
    '26iJ37BE3icVtoo2QRkfjtYXFHMudG2sbTHAnhF2D6ab', // CLOUT Token
  ]
);
```

Response will include account status:
```json
{
  "checks": {
    "solana": {
      "details": {
        "accounts": {
          "11111111111111111111111111111111": true,
          "TokenkegQfeZyiNwAJsyFbPVwwQQfuBvpFE6PR22e": true,
          "26iJ37BE3icVtoo2QRkfjtYXFHMudG2sbTHAnhF2D6ab": true
        }
      }
    }
  }
}
```

### Extend Health Checks

Add custom checks:

```typescript
// apps/backend/src/utils/health-check.ts

export async function checkCustomService(
  serviceUrl: string
): Promise<HealthCheckResult> {
  const startTime = Date.now();
  try {
    const response = await fetch(`${serviceUrl}/ping`);
    return {
      healthy: response.ok,
      status: response.ok ? 'healthy' : 'unhealthy',
      responseTime: Date.now() - startTime,
      details: { statusCode: response.status },
    };
  } catch (error) {
    return {
      healthy: false,
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error.message,
    };
  }
}

// Then add to checkSystemHealth():
const customService = await checkCustomService(customServiceUrl);
```

---

## Troubleshooting

### Health Check Returns 503

**Database is unhealthy**:
```bash
# Check PostgreSQL
psql $DATABASE_URL -c "SELECT NOW();"
docker exec nftsol-postgres pg_isready
```

**Redis is unhealthy**:
```bash
# Check Redis
redis-cli PING
docker exec nftsol-redis redis-cli PING
```

**Solana RPC is unreachable**:
```bash
# Test RPC
curl -X POST $SOLANA_RPC_URL \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"getLatestBlockhash","params":[]}'
```

### Health Check Hanging

If health checks hang (take >30s):

1. Check network connectivity
2. Increase timeout in Docker/K8s config
3. Check RPC rate limiting
4. Verify database connection pool size

### Response Time Too Slow

**Optimize health checks**:
```typescript
// Skip expensive checks in some endpoints
router.get('/ready', async (req, res) => {
  // Quick checks only - no Solana RPC
  const dbOk = await quickDatabaseCheck();
  const redisOk = await quickRedisCheck();

  res.status(dbOk && redisOk ? 200 : 503).json({
    ready: dbOk && redisOk,
  });
});
```

---

## Monitoring Setup

### Option 1: Simple Script Monitoring

```bash
#!/bin/bash
# Simple health monitor

check_backend() {
  curl -s -f http://localhost:3001/ready > /dev/null
  return $?
}

if check_backend; then
  echo "✓ Backend is healthy"
else
  echo "✗ Backend is unhealthy"
  systemctl restart nftsol-backend
  # or send alert
fi
```

### Option 2: Prometheus + Grafana

```yaml
# prometheus.yml
global:
  scrape_interval: 30s

scrape_configs:
  - job_name: 'nftsol'
    static_configs:
      - targets: ['localhost:3001']
    metrics_path: '/health'
```

### Option 3: Datadog

```python
from datadog import initialize, api
import requests

options = {
    'api_key': os.getenv('DD_API_KEY'),
    'app_key': os.getenv('DD_APP_KEY')
}

initialize(**options)

response = requests.get('http://localhost:3001/health')
status = 'up' if response.status_code == 200 else 'down'

api.Metric.send(
    metric='nftsol.backend.health',
    points=1 if status == 'up' else 0,
    tags=['env:production']
)
```

---

## Performance Metrics

Typical health check response times:

| Component | Response Time |
|-----------|---|
| Liveness (/live) | <5ms |
| Readiness (/ready) | 10-50ms |
| Database check | 10-100ms |
| Redis check | 5-20ms |
| Solana RPC check | 100-500ms |
| **Total /health** | **200-700ms** |

---

## Best Practices

✅ **DO**:
- Run health checks every 30 seconds
- Monitor response times
- Alert on failures
- Include all critical dependencies
- Return specific error messages
- Test in production
- Document custom checks

❌ **DON'T**:
- Run expensive queries in health checks
- Check non-critical services
- Return sensitive information
- Block on external services
- Skip health check verification
- Ignore timeout issues

---

## Next Steps

1. ✅ Copy files to backend
2. ✅ Update index.ts with initialization
3. ✅ Run tests: `npm test -- health.test.ts`
4. ✅ Test locally: `curl http://localhost:3001/health`
5. ✅ Deploy to Docker: `docker-compose up -d`
6. ✅ Verify in Kubernetes (if using)
7. 📋 Setup monitoring (Prometheus/Grafana/Datadog)
8. 📋 Configure alerting

---

**Status**: ✅ COMPLETE
**Next Improvement**: API Documentation (Swagger/OpenAPI)
**Effort**: 4 hours complete

---

**Document Version**: 1.0
**Last Updated**: November 18, 2025
**Maintained By**: DevOps Team
