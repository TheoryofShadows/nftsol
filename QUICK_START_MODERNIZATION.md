# NFTSol Modernization: Quick Start Guide

**Start implementing today. These 5 quick wins take ~7 hours and provide immediate ROI.**

---

## Quick Wins - Do These First (7 hours total)

### 1. Sentry Error Tracking (2 hours)

**What it does**: Captures all errors in production, notifies you immediately, tracks error trends

**Steps**:

```bash
# Install Sentry
cd apps/backend
npm install @sentry/node
npm install @sentry/integrations

cd ../../client
npm install @sentry/react
npm install @sentry/tracing
```

**Backend Setup** (`apps/backend/src/index.ts`):
```typescript
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Express({
      app: true,
      request: true,
    }),
  ],
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());
```

**Frontend Setup** (`client/src/main.tsx`):
```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 1.0,
  integrations: [
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

**Create Sentry Account**:
1. Go to https://sentry.io
2. Create free account
3. Create project for NFTSol
4. Copy DSN
5. Add to `.env` files

**Verify**: Throw test error, check Sentry dashboard

---

### 2. Web Vitals Monitoring (1 hour)

**What it does**: Tracks Core Web Vitals (LCP, FID, CLS), sends to Sentry

**Steps**:

```bash
cd client
npm install web-vitals
```

**Add to** `client/src/main.tsx`:
```typescript
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';
import * as Sentry from '@sentry/react';

getCLS(metric => Sentry.captureMessage(`CLS: ${metric.value}`));
getFID(metric => Sentry.captureMessage(`FID: ${metric.value}`));
getFCP(metric => Sentry.captureMessage(`FCP: ${metric.value}`));
getLCP(metric => Sentry.captureMessage(`LCP: ${metric.value}`));
getTTFB(metric => Sentry.captureMessage(`TTFB: ${metric.value}`));
```

**Verify**: Open Chrome DevTools, check Network tab for metrics

---

### 3. Dependabot Security Scanning (30 minutes)

**What it does**: Automatic alerts for dependency vulnerabilities, auto-creates PRs with fixes

**Steps**:

1. Go to GitHub repository
2. Click "Settings" → "Security & analysis"
3. Enable "Dependabot alerts"
4. Enable "Dependabot security updates"
5. Configure in `.github/dependabot.yml`:

```yaml
version: 2
updates:
  # Backend
  - package-ecosystem: "npm"
    directory: "/apps/backend"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 5

  # Frontend
  - package-ecosystem: "npm"
    directory: "/client"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 5
```

**Verify**: You should see Dependabot PRs within 24 hours

---

### 4. Structured Logging (3 hours)

**What it does**: Convert logs to JSON format for better parsing, adds correlation IDs

**Steps**:

```bash
cd apps/backend
npm install pino pino-pretty
npm install --save-dev @types/pino
```

**Create** `apps/backend/src/lib/logger.ts`:
```typescript
import pino from 'pino';

const pinoLogger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname'
    }
  }
});

export const logger = pinoLogger;
```

**Update** `apps/backend/src/index.ts`:
```typescript
import { logger } from './lib/logger';

// Add middleware for correlation IDs
app.use((req, res, next) => {
  const correlationId = req.headers['x-correlation-id'] || crypto.randomUUID();
  res.locals.correlationId = correlationId;
  req.id = correlationId;

  logger.info({
    correlationId,
    method: req.method,
    path: req.path,
    timestamp: new Date().toISOString()
  });

  next();
});

// Replace console.log calls with logger
// Example: logger.info({ message: 'Server started', port })
```

**Verify**: Run backend and see JSON-formatted logs

---

### 5. Pre-commit Hooks with Husky (1 hour)

**What it does**: Automatically runs linting before commits, prevents bad code from being committed

**Steps**:

```bash
cd /c/Users/KHK89/NFTSol
npm install husky --save-dev
npx husky init

# Create hook
npx husky add .husky/pre-commit "npm run lint"
npx husky add .husky/pre-commit "npm run type-check"
```

**Create** `.husky/pre-commit`:
```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

echo "Running pre-commit checks..."

# Lint staged files
npx lint-staged

# Type check
npm run type-check

if [ $? -ne 0 ]; then
  echo "Pre-commit checks failed. Commit aborted."
  exit 1
fi
```

**Install** `lint-staged`:
```bash
npm install lint-staged --save-dev
```

**Add to** `package.json`:
```json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
}
```

**Verify**: Try committing with a linting error - it should be rejected

---

## Next: Quick Wins Verification Checklist

Run this after implementing quick wins:

```bash
# 1. Verify Sentry
- Check Sentry dashboard
- Should show recent errors
- Test with: throw new Error('test')

# 2. Verify Web Vitals
- Open frontend in Chrome
- Check DevTools Console
- Should see Web Vitals metrics

# 3. Verify Dependabot
- Check GitHub Security tab
- Should see Dependabot alerts
- Look for dependency updates

# 4. Verify Structured Logging
- Run: npm run dev
- Check logs in terminal
- Should see JSON format with timestamps

# 5. Verify Husky
- Try: git commit --allow-empty -m "test"
- Should run linting
- Should reject if linting fails
```

---

## Week 1 Phase 1: Observability Foundation (14 hours)

After quick wins, start Phase 1 work:

### Task 1: Prometheus + Grafana (6 hours)

**Reference**: MODERNIZATION_STRATEGY.md, Phase 1 Week 1

**Install**:
```bash
# Docker-based setup (easiest)
docker run -d \
  --name prometheus \
  -p 9090:9090 \
  -v /c/prometheus.yml:/etc/prometheus/prometheus.yml \
  prom/prometheus

docker run -d \
  --name grafana \
  -p 3000:3000 \
  grafana/grafana
```

**Backend Metrics** (`apps/backend/src/lib/metrics.ts`):
```typescript
import { Counter, Histogram, register } from 'prom-client';

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

### Task 2: Production Checklist

Create `PRODUCTION_CHECKLIST.md`:
- Database backups configured
- Monitoring alerting rules
- Incident response procedures
- Rollback procedures
- Deployment procedures

---

## Success Metrics

### After Quick Wins (Week 1)
✓ All errors captured in Sentry
✓ Web Vitals being monitored
✓ Dependabot enabled and scanning
✓ Logs in JSON format with correlation IDs
✓ Pre-commit linting working

### After Phase 1 (Week 2)
✓ Prometheus collecting metrics
✓ Grafana dashboards created
✓ All tests running in Vitest
✓ E2E tests for critical flows
✓ Load testing framework ready

---

## Common Issues & Solutions

### Sentry Not Capturing Errors
**Problem**: Errors not showing in Sentry
**Solution**: Check DSN is correct, check environment variable is set
```bash
echo $SENTRY_DSN  # Should output your DSN
```

### Dependabot Not Creating PRs
**Problem**: No Dependabot PRs after 24 hours
**Solution**: Check GitHub Security settings, ensure `.github/dependabot.yml` syntax is correct

### Husky Hooks Not Running
**Problem**: Commits bypass linting
**Solution**: Run `npx husky install` after clone
```bash
npm install
npx husky install
```

### Prometheus Not Scraping Metrics
**Problem**: Prometheus has no data
**Solution**: Check `prometheus.yml` targets and backend `/metrics` endpoint
```bash
curl http://localhost:9090/api/v1/targets  # Check targets
curl http://localhost:3001/metrics          # Check metrics endpoint
```

---

## Timeline

| Task | Time | Difficulty | ROI |
|------|------|------------|-----|
| Sentry | 2h | Low | HIGH |
| Web Vitals | 1h | Low | HIGH |
| Dependabot | 0.5h | Low | HIGH |
| Structured Logging | 3h | Medium | HIGH |
| Husky | 1h | Low | HIGH |
| **TOTAL** | **7.5h** | **Low-Medium** | **VERY HIGH** |

---

## Next Steps

1. **Today**: Implement all 5 quick wins (7 hours)
2. **This Week**:
   - Verify all quick wins working
   - Begin Phase 1 Week 1 (Prometheus + Grafana)
   - Set up production monitoring
3. **Next Week**:
   - Complete Phase 1 Week 2 (Testing Framework)
   - Begin Phase 2 Week 3 (State Management)

---

## Resources

**Documentation**:
- MODERNIZATION_STRATEGY.md - Full 8-week plan
- SECURITY_AUDIT_REPORT.md - Current security status

**Tools**:
- Sentry: https://sentry.io
- Prometheus: https://prometheus.io
- Grafana: https://grafana.com
- Dependabot: https://dependabot.com

**Support**:
- Questions? Review MODERNIZATION_STRATEGY.md Phase 1 details
- Issues? Check Common Issues & Solutions above

---

**Remember**: Start with quick wins for immediate ROI, then move to Phase 1 work.
**Estimated completion of all quick wins: 1 working day**
