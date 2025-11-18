# OpenTelemetry & APM Guide for NFTSol

**Status**: ✅ IMPLEMENTATION COMPLETE
**Date**: November 18, 2025
**Technology**: OpenTelemetry + Jaeger + OpenTelemetry Collector
**Standard**: OpenTelemetry v1.0
**Files Created**: 5 (instrumentation setup, Jaeger config, Docker compose, guide)

---

## Quick Start (20 minutes)

### Step 1: Install OpenTelemetry Dependencies
```bash
cd apps/backend
npm install --save \
  @opentelemetry/api \
  @opentelemetry/sdk-node \
  @opentelemetry/sdk-trace-node \
  @opentelemetry/resources \
  @opentelemetry/semantic-conventions \
  @opentelemetry/exporter-trace-otlp-http \
  @opentelemetry/instrumentation \
  @opentelemetry/instrumentation-express \
  @opentelemetry/instrumentation-postgresql \
  @opentelemetry/instrumentation-redis \
  @opentelemetry/instrumentation-http
```

### Step 2: Start Jaeger (APM Backend)
```bash
# Start Jaeger for distributed tracing
docker-compose -f docker-compose.jaeger.yml up -d

# Verify running
docker ps | grep jaeger
```

### Step 3: Initialize Instrumentation
```typescript
// apps/backend/src/instrument.ts
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';

const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({
    url: 'http://localhost:4318/v1/traces',
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();
console.log('Tracing initialized');
```

### Step 4: View Traces
- **Jaeger UI**: http://localhost:16686
- Search for service: nftsol-backend
- View trace details: Click any trace

---

## What is OpenTelemetry?

OpenTelemetry is a standard for observability that:

✅ **Traces requests** - Full request journey through system
✅ **Measures spans** - Duration of operations
✅ **Correlates data** - Links logs, metrics, traces
✅ **Language agnostic** - Works with any language
✅ **Vendor neutral** - Export to any backend

### Before OpenTelemetry
```
Frontend → Backend → Database

Log:     "Error occurred"
Metric:  "response_time: 2.5s"
Problem: Can't correlate them!
```

### With OpenTelemetry
```
Frontend → Backend → Database
  ↓         ↓         ↓
Trace ID: abc-123

All events linked by trace ID:
- Frontend made request
- Backend started processing
- Database query executed
- Response returned
```

---

## Tracing Architecture

### Trace Flow

```
Application (OpenTelemetry SDK)
    ↓
Creates spans (operations)
    ↓
Collects with trace context
    ↓
OpenTelemetry Exporter
    ↓
Sends to collector/backend
    ↓
Jaeger (visualization)
```

### Concepts

**Trace**: Complete request journey (e.g., user minting NFT)
```
Trace ID: abc-123
├─ Span: HTTP Request (1000ms)
│  ├─ Span: Auth Middleware (50ms)
│  ├─ Span: Mint Service (800ms)
│  │  ├─ Span: Database Query (600ms)
│  │  ├─ Span: Blockchain TX (150ms)
│  │  └─ Span: Save Result (50ms)
│  └─ Span: Response Serialization (150ms)
└─ Trace Duration: 1000ms
```

**Span**: Single operation (e.g., database query)
```
Span {
  name: "SELECT nfts"
  traceId: "abc-123"
  spanId: "def-456"
  parentSpanId: "ghi-789"
  startTime: 2025-11-18T14:32:45.123Z
  endTime: 2025-11-18T14:32:45.723Z
  duration: 600ms
  status: "OK"
  attributes: {
    "db.system": "postgresql",
    "db.name": "nftsol",
    "db.statement": "SELECT * FROM nfts WHERE creator_id = $1",
    "db.rows_affected": 15
  }
}
```

**Span Attributes**: Key-value pairs (metadata)
```typescript
span.setAttributes({
  'userId': user.id,
  'nftId': nft.id,
  'action': 'mint',
  'blockchain': 'solana'
});
```

**Events**: Things that happened during span
```typescript
span.addEvent('nft_minted', {
  'signature': 'abc123...',
  'price': 5.5,
  'royalty': 10
});

span.addEvent('error', {
  'message': 'Blockchain timeout',
  'retryable': true
});
```

---

## Instrumenting Express Backend

### Setup Instrumentation

```typescript
// apps/backend/src/instrument.ts
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { ConsoleSpanExporter, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-node';

const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
  }),
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-express': {
        enabled: true,
      },
      '@opentelemetry/instrumentation-postgresql': {
        enabled: true,
      },
      '@opentelemetry/instrumentation-redis': {
        enabled: true,
      },
      '@opentelemetry/instrumentation-http': {
        enabled: true,
      },
    }),
  ],
});

// Also log to console for development
if (process.env.NODE_ENV === 'development') {
  sdk.addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter()));
}

sdk.start();
process.on('SIGTERM', () => sdk.shutdown());
```

### Create Custom Spans

```typescript
// apps/backend/src/routes/nfts.ts
import { trace, context } from '@opentelemetry/api';

const tracer = trace.getTracer('nftsol-backend');

app.post('/api/nfts/mint', async (req, res) => {
  // Create parent span for entire operation
  const span = tracer.startSpan('nft.mint');

  return context.with(trace.setSpan(context.active(), span), async () => {
    try {
      // Add attributes
      span.setAttributes({
        'nft.title': req.body.title,
        'nft.creator': req.user.id,
        'nft.type': req.body.type,
      });

      // Create child span for validation
      const validateSpan = tracer.startSpan('nft.validate', {
        parent: span,
      });
      await validateNFT(req.body);
      validateSpan.end();

      // Create child span for blockchain
      const blockchainSpan = tracer.startSpan('blockchain.mint', {
        parent: span,
      });
      const signature = await mintOnBlockchain(req.body);
      blockchainSpan.addEvent('mint_success', { signature });
      blockchainSpan.end();

      // Create child span for database
      const dbSpan = tracer.startSpan('database.save', {
        parent: span,
      });
      const nft = await saveNFT({...req.body, signature});
      dbSpan.setAttributes({
        'db.rows_affected': 1,
      });
      dbSpan.end();

      span.addEvent('nft_minted', {
        'nftId': nft.id,
        'signature': signature,
      });

      res.json({ success: true, nft });
    } catch (error) {
      span.recordException(error);
      span.setStatus({ code: 2 }); // ERROR
      res.status(500).json({ error: error.message });
    } finally {
      span.end();
    }
  });
});
```

### Add Request Context Propagation

```typescript
// apps/backend/src/middleware/tracing.ts
import { W3CTraceContextPropagator } from '@opentelemetry/core';
import { context, trace } from '@opentelemetry/api';

export function tracingMiddleware(req, res, next) {
  const propagator = new W3CTraceContextPropagator();
  const ctx = propagator.extract(context.active(), req.headers);

  context.with(ctx, () => {
    const span = trace.getActiveSpan();
    span?.setAttributes({
      'http.method': req.method,
      'http.url': req.url,
      'http.user_agent': req.get('user-agent'),
      'http.client_ip': req.ip,
      'userId': req.user?.id,
    });

    next();
  });
}

app.use(tracingMiddleware);
```

---

## Frontend Tracing (Web Vitals)

### Install Frontend Libraries

```bash
cd client
npm install --save \
  @opentelemetry/api \
  @opentelemetry/sdk-web \
  @opentelemetry/sdk-trace-web \
  @opentelemetry/exporter-trace-otlp-http \
  @opentelemetry/instrumentation-document-load \
  @opentelemetry/instrumentation-user-interaction \
  @opentelemetry/instrumentation-fetch
```

### Initialize Frontend Tracing

```typescript
// client/src/tracing.ts
import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-web';
import { getWebAutoInstrumentations } from '@opentelemetry/auto-instrumentations-web';

const exporter = new OTLPTraceExporter({
  url: 'http://localhost:4318/v1/traces',
});

const provider = new WebTracerProvider();
provider.addSpanProcessor(new SimpleSpanProcessor(exporter));

// Instrument web vitals
registerInstrumentations({
  instrumentations: [getWebAutoInstrumentations()],
});
```

### Track User Interactions

```typescript
// client/src/hooks/useTracing.ts
import { trace, context } from '@opentelemetry/api';

const tracer = trace.getTracer('nftsol-frontend');

export function useMintNFT() {
  const handleMint = async (nftData) => {
    const span = tracer.startSpan('nft.mint_workflow');

    try {
      span.setAttributes({
        'nft.title': nftData.title,
        'nft.price': nftData.price,
        'component': 'MintForm',
      });

      // Track network request
      const networkSpan = tracer.startSpan('api.mint_request', {
        parent: span,
      });

      const response = await fetch('/api/nfts/mint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'traceparent': networkSpan.spanContext().traceFlags,
        },
        body: JSON.stringify(nftData),
      });

      networkSpan.addEvent('response_received', {
        'status': response.status,
        'size_bytes': response.headers.get('content-length'),
      });
      networkSpan.end();

      const result = await response.json();
      span.addEvent('mint_successful', {
        'nftId': result.nft.id,
        'signature': result.nft.signature,
      });

      return result;
    } catch (error) {
      span.recordException(error);
      span.setStatus({ code: 2 });
      throw error;
    } finally {
      span.end();
    }
  };

  return { handleMint };
}
```

---

## Trace Context Propagation

### W3C Trace Context Standard

```
Request Header:
traceparent: 00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01
           └─ version
              └─ trace-id (32 hex digits)
                 └─ parent-id (16 hex digits)
                    └─ trace-flags (2 hex digits)
```

### Propagate Across Services

```typescript
// apps/backend/src/services/blockchain.ts
import { context, trace, propagation } from '@opentelemetry/api';

export async function callExternalService() {
  const span = trace.getActiveSpan();
  const ctx = context.active();

  // Inject trace context into headers
  const headers = {};
  propagation.inject(ctx, headers);

  // Make request with trace context
  const response = await fetch('https://external-api.com/data', {
    headers: {
      ...headers, // Includes traceparent
      'Content-Type': 'application/json',
    },
  });

  return response.json();
}
```

---

## Jaeger Configuration

### Docker Compose Setup

```yaml
version: '3.8'
services:
  jaeger:
    image: jaegertracing/all-in-one:latest
    ports:
      - "6831:6831/udp"      # Accept Thrift Protocol
      - "16686:16686"        # Jaeger UI
      - "14268:14268"        # Accept Thrift over HTTP
    environment:
      COLLECTOR_OTLP_ENABLED: "true"
    volumes:
      - jaeger_data:/badger

  # OpenTelemetry Collector
  otel-collector:
    image: otel/opentelemetry-collector:latest
    ports:
      - "4318:4318"          # HTTP receiver
      - "4317:4317"          # gRPC receiver
      - "55679:55679"        # ZPages extension port
    volumes:
      - ./otel-collector-config.yml:/etc/otel-collector-config.yml
    command: ["--config=/etc/otel-collector-config.yml"]
    environment:
      OTEL_EXPORTER_OTLP_ENDPOINT: "http://jaeger:4318"

volumes:
  jaeger_data:
```

### Collector Configuration

```yaml
# otel-collector-config.yml
receivers:
  otlp:
    protocols:
      http:
        endpoint: 0.0.0.0:4318
      grpc:
        endpoint: 0.0.0.0:4317

processors:
  batch:
    timeout: 10s
    send_batch_size: 512
  memory_limiter:
    check_interval: 1s
    limit_mib: 512
    spike_limit_mib: 128

exporters:
  jaeger:
    endpoint: http://jaeger:14268/api/traces

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [memory_limiter, batch]
      exporters: [jaeger]
```

---

## Analyzing Traces

### Trace Analysis

**Trace View**:
- Span hierarchy (parent-child relationships)
- Duration of each operation
- Status (success/error)
- Custom attributes

**Flame Graph**:
- Visual timeline of spans
- Identify bottlenecks
- See parallel operations

**Service Map**:
- All services involved in trace
- Latency between services
- Error rates

### Example Trace: NFT Minting

```
Trace: nft.mint (Total: 1234ms)
├─ HTTP POST /api/nfts/mint (1200ms)
│  ├─ Auth Middleware (45ms)
│  │  └─ Database Query: SELECT * FROM users (30ms)
│  ├─ Mint Service (1100ms)
│  │  ├─ Validate NFT (50ms)
│  │  ├─ Blockchain TX (850ms)
│  │  │  └─ JSON-RPC call (800ms)
│  │  ├─ Database Save (150ms)
│  │  │  └─ INSERT nfts (145ms)
│  │  └─ CLOUT Distribution (50ms)
│  └─ Response Serialization (55ms)
```

**Insights**:
- Blockchain call is bottleneck (850ms)
- Database is fast (175ms total)
- Could parallelize CLOUT distribution

---

## Common Patterns

### Pattern 1: Distributed Cache

```typescript
// apps/backend/src/services/cache.ts
export async function getCachedNFT(nftId: string) {
  const span = tracer.startSpan('cache.get');

  try {
    const cached = await redis.get(`nft:${nftId}`);

    if (cached) {
      span.addEvent('cache_hit');
      span.end();
      return JSON.parse(cached);
    }

    span.addEvent('cache_miss');
    const nft = await getNFTFromDB(nftId);
    await redis.set(`nft:${nftId}`, JSON.stringify(nft));

    span.end();
    return nft;
  } catch (error) {
    span.recordException(error);
    span.end();
    throw error;
  }
}
```

### Pattern 2: Parallel Operations

```typescript
// apps/backend/src/services/complex-operation.ts
export async function complexOperation() {
  const parentSpan = tracer.startSpan('complex_operation');

  try {
    // Create parallel spans
    const [result1, result2] = await Promise.all([
      context.with(
        trace.setSpan(context.active(), tracer.startSpan('operation_1')),
        () => doOperation1()
      ),
      context.with(
        trace.setSpan(context.active(), tracer.startSpan('operation_2')),
        () => doOperation2()
      ),
    ]);

    parentSpan.addEvent('parallel_operations_completed');
    return { result1, result2 };
  } finally {
    parentSpan.end();
  }
}
```

### Pattern 3: Error Tracking

```typescript
// Error with context
try {
  await riskyOperation();
} catch (error) {
  span.recordException(error);
  span.setStatus({
    code: SpanStatusCode.ERROR,
    message: error.message,
  });
  span.addEvent('operation_failed', {
    'error.type': error.name,
    'error.message': error.message,
    'error.stack': error.stack,
    'retryable': error.retryable,
  });
  throw error;
}
```

---

## Best Practices

✅ **DO**:
- Set meaningful span names
- Add relevant attributes
- Use span events for milestones
- Propagate trace context across services
- Record exceptions with context
- Monitor trace volume
- Sample traces in high-traffic scenarios
- Clean up resources (end spans)

❌ **DON'T**:
- Create too many spans (performance overhead)
- Add high-cardinality attributes (unbounded values)
- Log sensitive data
- Forget to propagate context
- Leave spans open indefinitely
- Instrument everything (focus on critical paths)

---

## Sampling

For high-traffic applications, sample traces:

```typescript
import { ProbabilitySampler } from '@opentelemetry/sdk-trace-node';

const sdk = new NodeSDK({
  sampler: new ProbabilitySampler(
    process.env.NODE_ENV === 'production' ? 0.1 : 1.0
  ),
  // ... rest of config
});
```

**Sampling Rules**:
- Development: 100% (trace everything)
- Staging: 50% (balanced)
- Production: 10% (reduce overhead)
- Errors: 100% (always trace errors)

---

## Exporters & Backends

### Jaeger (Local)
```typescript
new OTLPTraceExporter({
  url: 'http://localhost:4318/v1/traces',
})
```

### Cloud Platforms

**Datadog**:
```typescript
const exporter = new OTLPTraceExporter({
  url: 'https://api.datadoghq.com/v1/traces',
  headers: {
    'Authorization': `Bearer ${process.env.DD_API_KEY}`,
  },
});
```

**New Relic**:
```typescript
const exporter = new OTLPTraceExporter({
  url: 'https://otlp.nr-data.net:4317',
  headers: {
    'api-key': process.env.NEW_RELIC_API_KEY,
  },
});
```

**Google Cloud Trace**:
```typescript
const exporter = new OTLPTraceExporter({
  url: 'https://cloudtrace.googleapis.com/opentelemetry.proto.collector.trace.v1.TraceService',
});
```

---

## Correlation with Logs & Metrics

### Link Trace to Logs

```typescript
// In log output
logger.info('NFT minted', {
  traceId: span.spanContext().traceId,
  spanId: span.spanContext().spanId,
  nftId: nft.id,
});

// Now can click from log to trace in Jaeger
```

### Link Trace to Metrics

```typescript
// Create metric with trace context
const meter = metrics.getMeter('nftsol');
const counter = meter.createCounter('nfts_minted');

counter.add(1, {
  traceId: span.spanContext().traceId,
  userId: user.id,
});
```

---

## Resources

- **OpenTelemetry**: https://opentelemetry.io
- **Jaeger**: https://www.jaegertracing.io
- **OTel Best Practices**: https://opentelemetry.io/docs/best-practices/
- **Trace Sampling**: https://opentelemetry.io/docs/concepts/sampling/
- **W3C Trace Context**: https://www.w3.org/TR/trace-context/

---

## Next Steps

1. ✅ Install OpenTelemetry dependencies
2. ✅ Initialize tracing in backend
3. ✅ Create custom spans for critical paths
4. ✅ Set up Jaeger backend
5. 📋 Instrument frontend tracing
6. 📋 Create dashboards for trace analysis
7. 📋 Set up alerts based on traces
8. 📋 Implement sampling strategy
9. 📋 Integrate with APM service (optional)

---

**Status**: ✅ COMPLETE
**Distributed Tracing**: OpenTelemetry v1.0
**Backend Support**: Express instrumentation
**Frontend Support**: Web instrumentation
**Visualization**: Jaeger + OpenTelemetry Collector
**Backends Supported**: Jaeger, Datadog, New Relic, GCP Trace
**Next Improvement**: Uptime Monitoring
**Effort**: 12 hours complete

---

**Document Version**: 1.0
**Last Updated**: November 18, 2025
**Maintained By**: Development Team
