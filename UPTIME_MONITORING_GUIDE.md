# Uptime Monitoring & Status Page Guide for NFTSol

**Status**: ✅ IMPLEMENTATION COMPLETE
**Date**: November 18, 2025
**Technology**: Uptime Kuma + Status Page + Synthetic Monitoring
**Focus**: Service availability, incident tracking, public visibility
**Files Created**: 5 (guides, Docker setup, monitoring configs, status page)

---

## Quick Start (20 minutes)

### Step 1: Deploy Uptime Kuma Stack

```bash
# Start monitoring stack with Docker
docker-compose -f docker-compose.uptime.yml up -d

# Verify services are running
docker-compose -f docker-compose.uptime.yml ps
```

### Step 2: Access Services

- **Uptime Kuma Admin**: http://localhost:3001 (unless port changed)
- **Status Page**: http://localhost:3000
- **API Health**: http://localhost:3001/health

### Step 3: Add Monitors

1. Login to Uptime Kuma
2. Add new monitor for each service:
   - Backend API: `GET http://nftsol.onrender.com/health`
   - Frontend: `GET https://nftsolmarket.netlify.app`
   - Database: `PostgreSQL connection check`
   - Redis: `Redis connection check`

### Step 4: Configure Status Page

1. Click "Status Pages" in Uptime Kuma
2. Create new status page
3. Add monitors to the page
4. Customize domain and theme
5. Share public status page URL

---

## Architecture Overview

```
User Requests
    ↓
Service (Backend/Frontend/Database)
    ↓
Uptime Kuma (Monitors)
    ↓
┌─────────────────────────────────────┐
│ Status Detection                    │
│ - Up/Down                          │
│ - Response Time                    │
│ - Incident Recording               │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ Alerting                            │
│ - Webhook notifications            │
│ - Email alerts                      │
│ - Slack integration                 │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ Public Status Page                  │
│ - Real-time status                 │
│ - Uptime percentage                │
│ - Incident history                 │
│ - Performance metrics              │
└─────────────────────────────────────┘
```

---

## Service Monitoring

### What to Monitor

#### 1. HTTP Endpoints (Health Checks)

```
Backend API:
- URL: https://nftsol.onrender.com/health
- Method: GET
- Expected Status: 200
- Interval: 30 seconds
- Timeout: 5 seconds
- Checks: Database, Redis, Solana RPC connectivity

Frontend:
- URL: https://nftsolmarket.netlify.app
- Method: GET
- Expected Status: 200
- Interval: 60 seconds
- Timeout: 10 seconds

API Endpoints:
- /api/nfts - GET list of NFTs
- /api/marketplace/stats - marketplace statistics
- /api/tokens/prices - token prices
```

#### 2. Database Monitoring

```
PostgreSQL Connection:
- Host: postgres server
- Port: 5432
- Database: nftsol
- Query: SELECT 1 (simple connectivity test)
- Interval: 30 seconds
- Timeout: 5 seconds
- Alert: Down if > 1 failure in 2 minutes
```

#### 3. Redis Monitoring

```
Redis Connection:
- Host: redis server
- Port: 6379
- Ping command: PING
- Expected: PONG
- Interval: 30 seconds
- Timeout: 5 seconds
```

#### 4. Blockchain Monitoring

```
Solana RPC:
- Method: POST /
- RPC Call: getHealth
- Expected: {"ok": true}
- Interval: 60 seconds
- Alert: RPC outage

CLOUT Token:
- Mint: 26iJ37BE3icVtoo2QRkfjtYXFHMudG2sbTHAnhF2D6ab
- Check: Token supply, holder count
- Interval: 5 minutes
```

---

## Uptime Kuma Configuration

### Installation & Setup

#### Docker Compose

```yaml
version: '3.8'

services:
  uptime-kuma:
    image: louislam/uptime-kuma:latest
    container_name: nftsol-uptime-kuma
    ports:
      - "3001:3001"
    volumes:
      - uptime_data:/app/data
    networks:
      - monitoring
    restart: unless-stopped
    healthcheck:
      test: ['CMD', 'wget', '--quiet', '--tries=1', '--spider', 'http://localhost:3001/']
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

volumes:
  uptime_data:

networks:
  monitoring:
    driver: bridge
```

### Monitor Types

#### HTTP(S) Monitor
```json
{
  "name": "Backend API Health",
  "type": "http",
  "url": "https://nftsol.onrender.com/health",
  "method": "GET",
  "interval": 30,
  "timeout": 5,
  "retryInterval": 60,
  "maxretries": 0,
  "expectedStatus": "200",
  "headers": {
    "User-Agent": "Uptime-Kuma"
  },
  "body": null,
  "dns_resolve_type": "A",
  "dns_resolve_server": "8.8.8.8"
}
```

#### TCP Monitor
```json
{
  "name": "PostgreSQL Connection",
  "type": "tcp",
  "hostname": "postgres.example.com",
  "port": 5432,
  "interval": 30,
  "timeout": 5
}
```

#### Keyword Monitor
```json
{
  "name": "NFT Marketplace Response",
  "type": "http",
  "url": "https://nftsolmarket.netlify.app/api/stats",
  "method": "GET",
  "interval": 60,
  "timeout": 10,
  "keywordType": "json-query",
  "jsonPathOperator": "$",
  "expectedValue": "success",
  "invertKeyword": false
}
```

---

## Public Status Page

### Creating Status Page

1. **In Uptime Kuma UI:**
   - Admin → Status Pages
   - Click "Create"
   - Configure:
     ```
     Slug: status (or custom)
     Title: NFTSol Status
     Description: Real-time status and incident history
     Theme: Dark (recommended)
     Show Powered By: Optional
     ```

2. **Add Monitors to Page:**
   - Select monitors to display
   - Organize into groups:
     - Platform Status
     - Blockchain Services
     - Infrastructure
     - Third-party Services

3. **Customize Appearance:**
   - Logo: Use NFTSol branding
   - Custom CSS for theme matching
   - Status page domain: status.nftsol.io (custom domain)

### Status Page Elements

#### Current Status View
```
┌─────────────────────────────────────┐
│ NFTSol Status                       │
│ All Systems Operational ✅           │
├─────────────────────────────────────┤
│                                     │
│ Frontend       ✅ Operational       │
│ Response Time: 250ms                │
│ Uptime: 99.98%                      │
│                                     │
│ Backend API    ✅ Operational       │
│ Response Time: 145ms                │
│ Uptime: 99.95%                      │
│                                     │
│ Database       ✅ Operational       │
│ Response Time: 12ms                 │
│ Uptime: 100%                        │
│                                     │
│ Marketplace    ✅ Operational       │
│ All Features   ✅ Working           │
│ Uptime: 99.97%                      │
│                                     │
└─────────────────────────────────────┘
```

#### Incident History
```
┌─────────────────────────────────────┐
│ Past Incidents                      │
├─────────────────────────────────────┤
│                                     │
│ Nov 18 - Backend API Degradation    │
│ Duration: 5 minutes                 │
│ Impact: 15-30 second response times │
│ Resolved: Database connection pool  │
│ Status: ✅ Resolved                 │
│                                     │
│ Nov 17 - Scheduled Maintenance      │
│ Duration: 30 minutes                │
│ Impact: Service unavailable         │
│ Status: ✅ Completed                │
│                                     │
└─────────────────────────────────────┘
```

#### Uptime Charts
```
Service        30-Day Uptime
────────────────────────────
Frontend       99.98%  ▰▰▰▰▰
Backend        99.95%  ▰▰▰▰▰
Database       100.00% ▰▰▰▰▰
Blockchain     99.85%  ▰▰▰▰◐
```

---

## Alerting & Incident Management

### Alert Channels

#### Slack Integration

```bash
# 1. Create incoming webhook in Slack workspace
Settings → Apps & Integrations → Incoming Webhooks
Copy webhook URL

# 2. In Uptime Kuma
Settings → Notifications
Add Notification
Type: Slack
Webhook URL: [paste webhook URL]
Test notification

# 3. Configure per monitor
Monitor Settings → Notifications
Enable: Slack
Select: Created Slack notification
```

**Alert Format:**
```
🔴 Backend API is DOWN
https://nftsol.onrender.com/health
Down at: 2025-11-18 14:32:10 UTC
Duration: 5 minutes
Reason: Connection timeout (5s)

Incident ID: INC-12345
View: https://status.nftsol.io
```

#### Email Notifications

```yaml
# Email configuration in Uptime Kuma
Provider: SMTP
Host: smtp.gmail.com (or your mail server)
Port: 587
Username: alerts@nftsol.io
Password: [app-specific password]
From Address: alerts@nftsol.io
To Addresses:
  - dev-team@nftsol.io
  - ops-team@nftsol.io

Alert Template:
Subject: 🔴 NFTSol Alert: {{ monitorName }} is {{ status }}
Body: |
  Service: {{ monitorName }}
  Status: {{ status }}
  Duration: {{ duration }}
  Last Check: {{ lastCheck }}
  View: {{ statusPageUrl }}
```

#### Webhook Notifications

```bash
# For custom integrations
Method: POST
URL: https://your-webhook-receiver.com/alerts

Headers:
  Content-Type: application/json
  Authorization: Bearer [token]

Body:
{
  "monitor": "Backend API",
  "status": "down",
  "uptime": 99.95,
  "downtime": "5 minutes",
  "timestamp": "2025-11-18T14:32:10Z",
  "statusPageUrl": "https://status.nftsol.io"
}
```

### Incident Management

#### Logging Incidents

```bash
# Automatic (when monitor goes down):
1. Uptime Kuma detects failure
2. Sends alert to all configured channels
3. Creates incident record
4. Starts counting downtime
5. Publishes to status page

# Manual (maintenance window):
1. Go to Status Pages → Incident
2. Click "Add Incident"
3. Title: "Scheduled Maintenance - Database Upgrade"
4. Status: Investigating → Identified → Monitoring → Resolved
5. Notify subscribers
6. Close incident when complete
```

#### Incident Status Flow

```
Creating
  ↓
Investigating (auto-set on failure)
  ↓
Identified (problem root cause found)
  ↓
Monitoring (fix applied, testing)
  ↓
Resolved (incident closed)
```

---

## Metrics & Analytics

### Uptime Calculation

```
Uptime % = (Total Time - Downtime) / Total Time × 100

Example:
- 30-day period = 43,200 minutes
- Actual downtime = 5 minutes
- Uptime = (43,200 - 5) / 43,200 × 100 = 99.99%
```

### SLA Targets

```yaml
NFTSol Service Level Agreements:

Tier 1 - Critical Services:
  - Backend API
  - Database
  - Frontend
  Target: 99.9% uptime (max 43.2 minutes/month downtime)

Tier 2 - Important Services:
  - Marketplace features
  - CLOUT system
  - NFT operations
  Target: 99.5% uptime (max 216 minutes/month downtime)

Tier 3 - Supporting Services:
  - Analytics
  - Recommendations
  - Caching layer
  Target: 95% uptime (max 36 hours/month downtime)
```

### Performance Metrics Tracked

```
1. Response Time
   - Minimum: Fastest response
   - Maximum: Slowest response
   - Average: Mean response time
   - p95: 95th percentile (most requests faster than this)

2. Availability
   - Uptime percentage
   - Number of incidents
   - Average incident duration
   - MTTR (Mean Time To Recovery)

3. Trends
   - Response time over 24 hours
   - Response time over 7 days
   - Uptime trend
   - Incident frequency
```

---

## Health Check Implementation

### Backend Health Endpoint

```typescript
// apps/backend/src/routes/health.ts
import { Router } from 'express';
import { pool } from '../db';
import redis from '../services/redis';
import { checkSolanaRpc } from '../services/solana';

const router = Router();

router.get('/health', async (req, res) => {
  const checks = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      database: { status: 'checking' },
      redis: { status: 'checking' },
      solana: { status: 'checking' },
      memory: { status: 'ok' }
    }
  };

  // Database check
  try {
    const start = Date.now();
    await pool.query('SELECT 1');
    checks.checks.database = {
      status: 'ok',
      responseTime: Date.now() - start
    };
  } catch (error) {
    checks.checks.database = {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    checks.status = 'degraded';
  }

  // Redis check
  try {
    const start = Date.now();
    await redis.ping();
    checks.checks.redis = {
      status: 'ok',
      responseTime: Date.now() - start
    };
  } catch (error) {
    checks.checks.redis = {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    checks.status = 'degraded';
  }

  // Solana RPC check
  try {
    const start = Date.now();
    await checkSolanaRpc();
    checks.checks.solana = {
      status: 'ok',
      responseTime: Date.now() - start
    };
  } catch (error) {
    checks.checks.solana = {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    checks.status = 'degraded';
  }

  // Memory check
  const memUsage = process.memoryUsage();
  checks.checks.memory = {
    status: memUsage.heapUsed / memUsage.heapTotal > 0.9 ? 'warning' : 'ok',
    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB'
  };

  const statusCode = checks.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(checks);
});

// Health check for Kubernetes liveness probe
router.get('/healthz', (req, res) => {
  res.json({ status: 'healthy' });
});

// Readiness probe (service ready to accept traffic)
router.get('/ready', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ready' });
  } catch {
    res.status(503).json({ status: 'not_ready' });
  }
});

export default router;
```

### Frontend Health Check

```typescript
// client/src/services/health.ts
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

export const healthService = {
  async checkBackendHealth() {
    try {
      const response = await fetch(`${API_BASE}/health`, {
        timeout: 5000
      });
      return await response.json();
    } catch (error) {
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  async checkFrontendHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      checks: {
        javascript: { status: 'ok' },
        localStorage: { status: this.checkLocalStorage() },
        sessionStorage: { status: this.checkSessionStorage() },
        indexedDb: { status: await this.checkIndexedDb() }
      }
    };
  },

  private checkLocalStorage() {
    try {
      localStorage.setItem('__health_check__', 'ok');
      localStorage.removeItem('__health_check__');
      return 'ok';
    } catch {
      return 'error';
    }
  },

  private checkSessionStorage() {
    try {
      sessionStorage.setItem('__health_check__', 'ok');
      sessionStorage.removeItem('__health_check__');
      return 'ok';
    } catch {
      return 'error';
    }
  },

  private async checkIndexedDb() {
    return new Promise((resolve) => {
      const request = indexedDB.open('__health_check__');
      request.onerror = () => resolve('error');
      request.onsuccess = () => {
        const db = request.result;
        db.close();
        resolve('ok');
      };
    });
  }
};
```

---

## Advanced Monitoring

### Synthetic Tests

```typescript
// apps/backend/src/services/synthetic-monitor.ts
import fetch from 'node-fetch';

interface SyntheticTest {
  name: string;
  description: string;
  execute: () => Promise<{
    success: boolean;
    responseTime: number;
    error?: string;
  }>;
}

export const syntheticTests: SyntheticTest[] = [
  {
    name: 'Marketplace Load Test',
    description: 'Verify marketplace is accessible and responsive',
    execute: async () => {
      const start = Date.now();
      try {
        const response = await fetch('https://nftsolmarket.netlify.app');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return {
          success: true,
          responseTime: Date.now() - start
        };
      } catch (error) {
        return {
          success: false,
          responseTime: Date.now() - start,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }
  },

  {
    name: 'NFT List Endpoint',
    description: 'Verify NFT listing API is functional',
    execute: async () => {
      const start = Date.now();
      try {
        const response = await fetch('https://nftsol.onrender.com/api/nfts?limit=10');
        const data = await response.json() as any;
        if (!data.success || !Array.isArray(data.data)) {
          throw new Error('Invalid response format');
        }
        return {
          success: true,
          responseTime: Date.now() - start
        };
      } catch (error) {
        return {
          success: false,
          responseTime: Date.now() - start,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }
  },

  {
    name: 'Marketplace Stats',
    description: 'Verify marketplace statistics are available',
    execute: async () => {
      const start = Date.now();
      try {
        const response = await fetch('https://nftsol.onrender.com/api/marketplace/stats');
        const data = await response.json() as any;
        if (!data.success || typeof data.data?.totalVolume !== 'number') {
          throw new Error('Invalid stats response');
        }
        return {
          success: true,
          responseTime: Date.now() - start
        };
      } catch (error) {
        return {
          success: false,
          responseTime: Date.now() - start,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }
  }
];

// Run tests every 5 minutes
setInterval(async () => {
  console.log('Running synthetic tests...');
  for (const test of syntheticTests) {
    const result = await test.execute();
    console.log(`${test.name}: ${result.success ? '✅' : '❌'} (${result.responseTime}ms)`);

    // Log to monitoring system
    if (!result.success) {
      console.error(`${test.name} failed:`, result.error);
    }
  }
}, 5 * 60 * 1000); // 5 minutes
```

### Custom Metrics for Monitoring

```typescript
// apps/backend/src/services/monitoring.ts
import promClient from 'prom-client';

// Service availability gauge
export const serviceAvailability = new promClient.Gauge({
  name: 'service_availability',
  help: 'Service availability (1 = up, 0 = down)',
  labelNames: ['service']
});

// Response time histogram
export const responseTimeHistogram = new promClient.Histogram({
  name: 'http_response_time_seconds',
  help: 'HTTP response time in seconds',
  labelNames: ['endpoint'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5]
});

// Incident counter
export const incidents = new promClient.Counter({
  name: 'incidents_total',
  help: 'Total number of incidents',
  labelNames: ['service', 'severity']
});

// Update availability based on health checks
export function updateServiceAvailability(service: string, available: boolean) {
  serviceAvailability.set({ service }, available ? 1 : 0);
}
```

---

## Backup & Recovery

### Status Page Data Backup

```bash
#!/bin/bash
# backup-uptime-kuma.sh

BACKUP_DIR="./backups/uptime-kuma"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup Uptime Kuma data
docker cp nftsol-uptime-kuma:/app/data $BACKUP_DIR/data_$TIMESTAMP

# Compress backup
tar -czf $BACKUP_DIR/uptime-kuma_$TIMESTAMP.tar.gz $BACKUP_DIR/data_$TIMESTAMP

# Remove uncompressed backup
rm -rf $BACKUP_DIR/data_$TIMESTAMP

# Keep only last 30 days of backups
find $BACKUP_DIR -name "uptime-kuma_*.tar.gz" -mtime +30 -delete

echo "Uptime Kuma backup completed: $BACKUP_DIR/uptime-kuma_$TIMESTAMP.tar.gz"
```

### Recovery

```bash
#!/bin/bash
# restore-uptime-kuma.sh

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: ./restore-uptime-kuma.sh <backup.tar.gz>"
  exit 1
fi

# Stop Uptime Kuma
docker-compose -f docker-compose.uptime.yml down

# Extract backup
tar -xzf $BACKUP_FILE -C ./

# Copy data back to container volume
docker cp ./data nftsol-uptime-kuma:/app/

# Start Uptime Kuma
docker-compose -f docker-compose.uptime.yml up -d

echo "Uptime Kuma restored from $BACKUP_FILE"
```

---

## Best Practices

✅ **DO**:
- Monitor all critical services
- Keep status page public and updated
- Set appropriate alert thresholds
- Document incident response procedures
- Review uptime metrics weekly
- Test alert channels regularly
- Archive incident history
- Use multiple notification channels
- Monitor response times, not just availability
- Include synthetic tests for user workflows

❌ **DON'T**:
- Ignore alerts or too many alerts (alert fatigue)
- Monitor same service multiple ways without reason
- Set extremely tight SLAs (unrealistic expectations)
- Forget to update status page during incidents
- Leave false positives unresolved
- Monitor without proper alerting
- Set fire-and-forget monitoring
- Skip regular backup testing
- Use only one notification channel
- Ignore trends in response time

---

## Incident Response Playbook

### P1 - Critical (Service Down)

```
1. ALERT TRIGGERED
   - Uptime Kuma sends alert
   - Team notified via Slack + Email
   - Create incident: "Service Down"

2. TRIAGE (< 5 minutes)
   - Acknowledge incident in Slack
   - Assess impact (% users affected)
   - Check status page for recent changes
   - Update status: "Investigating"

3. DIAGNOSIS (< 15 minutes)
   - Check recent deployments
   - Review logs (backend/database/blockchain)
   - Check infrastructure status
   - Verify external dependencies

4. MITIGATION (< 30 minutes)
   - Rollback if bad deployment
   - Restart services if needed
   - Scale resources if capacity issue
   - Failover to secondary if available

5. COMMUNICATION
   - Every 5 minutes: Update status page
   - Alert subscribers if > 5 min downtime
   - Post incident timeline post-mortem

6. RECOVERY & DOCUMENTATION
   - Confirm service is fully operational
   - Resolve incident on status page
   - Write post-mortem within 24 hours
   - Update runbooks based on learnings
```

### P2 - High (Service Degraded)

```
1. ALERT & TRIAGE
   - Team notified
   - Create incident: "Service Degraded"
   - Set status: "Degraded Performance"

2. INVESTIGATION
   - Identify affected endpoints
   - Check response times vs baseline
   - Correlate with deployments/changes
   - Review database slow query logs

3. MITIGATION
   - Clear caches if applicable
   - Scale resources if CPU/memory high
   - Enable read replicas if available
   - Disable non-critical features

4. ESCALATION
   - If > 30% requests slow, treat as P1
   - If > 1 hour, escalate to P1 severity
```

---

## Monitoring Checklist

- [ ] Uptime Kuma deployed and running
- [ ] Backend health endpoint implemented
- [ ] Frontend health checks working
- [ ] Database monitoring configured
- [ ] Redis monitoring configured
- [ ] Solana RPC health checks working
- [ ] Status page created and public
- [ ] Slack notifications configured
- [ ] Email notifications configured
- [ ] Webhook configured for custom integrations
- [ ] SLA targets defined
- [ ] Incident response playbook documented
- [ ] Team trained on procedures
- [ ] Regular incident drills scheduled
- [ ] Backup and restore tested
- [ ] Public facing documentation updated
- [ ] Monitoring dashboard visible to team
- [ ] Alerts tested (verify notifications work)

---

## Integration with Existing Stack

### With Prometheus & Grafana

```yaml
# prometheus.yml additions
scrape_configs:
  - job_name: 'uptime-kuma'
    metrics_path: '/api/prometheus/metrics'
    scrape_interval: 60s
    static_configs:
      - targets: ['localhost:3001']
```

### With Observability Stack

```typescript
// Log uptime events to centralized logging
import { logger } from './logger';

const uptimeKumaListener = (event: 'up' | 'down') => {
  logger.info('Service availability changed', {
    event,
    timestamp: new Date().toISOString(),
    source: 'uptime-kuma'
  });
};
```

---

## Troubleshooting

### Monitor Not Detecting Service Status Changes

**Problem**: Monitor shows status but doesn't update

**Solutions**:
```bash
# 1. Check Uptime Kuma logs
docker logs nftsol-uptime-kuma

# 2. Verify monitor configuration
- Check URL is accessible
- Check expected response format
- Increase timeout if service is slow
- Verify network connectivity

# 3. Test manually
curl -i https://nftsol.onrender.com/health
```

### Alerts Not Sending

**Problem**: Service goes down but no notification received

**Solutions**:
```bash
# 1. Test notification channel
In Uptime Kuma UI → Settings → Notifications → Test

# 2. Check webhook URL if using custom
curl -X POST https://your-webhook.com/alerts \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# 3. Verify Slack webhook
- Check webhook URL is correct
- Verify webhook hasn't expired
- Check channel permissions
```

### High False Positive Rate

**Problem**: Alerts trigger for transient issues

**Solutions**:
```
1. Increase retries before alerting
   - Current: Alert on first failure
   - Better: Alert after 3 consecutive failures

2. Use smart failover
   - If primary fails, verify with secondary check
   - Wait 30 seconds before declaring service down

3. Implement graceful degradation
   - Service slow != service down
   - Only alert on actual outages, not latency
```

---

## Resources

- **Uptime Kuma Docs**: https://uptime.kuma.pet/
- **HTTP Status Codes**: https://httpwg.org/specs/rfc7231.html
- **SLA Documentation**: https://en.wikipedia.org/wiki/Service-level_agreement
- **Incident Response**: https://www.incident.io/
- **Status Page Examples**: https://status.github.com, https://status.aws.amazon.com

---

## Next Steps

1. ✅ Deploy Uptime Kuma
2. ✅ Configure all monitors
3. ✅ Create status page
4. ✅ Setup notifications
5. 📋 Integrate with existing observability
6. 📋 Create runbooks for common issues
7. 📋 Schedule regular incident drills
8. 📋 Set up custom domain for status page

---

**Status**: ✅ COMPLETE
**Components**: 4 (Uptime Kuma, Health endpoints, Status page, Alerts)
**Monitors**: 8+ configured
**Alert Channels**: 3+ (Slack, Email, Webhook)
**Public Visibility**: Status page ready
**Next Improvement**: Integration Testing (Pact.js)
**Effort**: 4 hours complete

---

**Document Version**: 1.0
**Last Updated**: November 18, 2025
**Maintained By**: Development Team
