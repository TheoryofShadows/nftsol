# Centralized Logging Guide for NFTSol

**Status**: ✅ IMPLEMENTATION COMPLETE
**Date**: November 18, 2025
**Technology**: Winston Logger + JSON Structured Logs
**Integration**: Express.js middleware, ELK Stack, Datadog

---

## Quick Start (10 minutes)

### Step 1: Install Dependencies
```bash
cd apps/backend
npm install --save winston winston-daily-rotate-file
npm install --save-dev @types/winston
```

### Step 2: Initialize Logger
```typescript
import logger from './src/utils/logger';

// In Express app
app.use(requestLoggingMiddleware);

// In your code
logger.info('NFT minted successfully', { nftId: '123', price: 5.5 });
logger.error('Failed to mint NFT', { error: err.message });
```

### Step 3: View Logs
```bash
# Follow logs in real-time
tail -f logs/combined.log

# View errors only
tail -f logs/error.log

# Parse JSON logs
jq '.' logs/combined.log
```

### Step 4: Ship to ELK/Datadog (Optional)
```typescript
// logs/fluent-bit.conf
[INPUT]
    Name    tail
    Path    logs/combined.log
    Parser  json

[OUTPUT]
    Name    es
    Match   *
    Host    elasticsearch.example.com
    Port    9200
```

---

## Structured Logging Format

### What is Structured Logging?

**Traditional logs** (unstructured):
```
2025-11-18 14:32:45 INFO User 'alice' minted NFT titled 'Cool Art' for 5.5 SOL
```

Problem: Hard to parse, search, and analyze programmatically

**Structured logs** (JSON):
```json
{
  "timestamp": "2025-11-18T14:32:45.123Z",
  "level": "info",
  "message": "NFT minted successfully",
  "service": "nftsol-backend",
  "requestId": "abc-123-def-456",
  "userId": "user-789",
  "nftId": "nft-456",
  "nftTitle": "Cool Art",
  "price": 5.5,
  "duration": 2341
}
```

Benefits:
✅ Machine-readable and parseable
✅ Easy to search and filter
✅ Supports complex queries
✅ Integrates with log aggregation platforms
✅ Enables automated alerting

---

## Logger Configuration

### Log Levels (5 Levels)

```typescript
// error - System errors, exceptions (severity: critical)
logger.error('Database connection failed', { error: err.message });

// warn - Warnings, slow operations (severity: high)
logger.warn('Slow database query', { duration: 5234 });

// info - Important events (severity: medium)
logger.info('NFT minted successfully', { nftId: '123' });

// debug - Development debugging (severity: low)
logger.debug('Processing mint request', { payload: data });

// trace - Detailed tracing (severity: very low)
logger.trace('Function entry', { functionName: 'mintNFT' });
```

### Log Targets

Logs are written to:

1. **Console** - Colorized output during development
2. **logs/combined.log** - All logs
3. **logs/error.log** - Errors only
4. **logs/debug.log** - Debug and trace logs

Each file rotates when it reaches 5MB, keeping up to 10 historical files

---

## Logging Patterns

### Pattern 1: Request Logging

```typescript
// Automatic via middleware
app.use(requestLoggingMiddleware);

// Output:
{
  "timestamp": "2025-11-18T14:32:45.123Z",
  "level": "info",
  "message": "Incoming request",
  "requestId": "req-abc-123",
  "method": "POST",
  "path": "/api/nfts/mint",
  "userId": "user-789",
  "ip": "192.168.1.100",
  "userAgent": "Mozilla/5.0..."
}

// Then response:
{
  "timestamp": "2025-11-18T14:32:47.456Z",
  "level": "info",
  "message": "Request completed",
  "requestId": "req-abc-123",
  "method": "POST",
  "path": "/api/nfts/mint",
  "statusCode": 201,
  "duration": "2333ms"
}
```

### Pattern 2: Business Events

```typescript
// Log important business events
logger.info('NFT minted successfully', {
  nftId: 'nft-456',
  nftTitle: 'Cool Art',
  creator: 'user-789',
  price: 5.5,
  currency: 'SOL',
  royalty: 10,
  txSignature: 'abc123...xyz789',
  metadata: {
    rarity: 'rare',
    collection: 'digital-art'
  }
});
```

### Pattern 3: Error Logging

```typescript
try {
  await mintNFT(data);
} catch (error) {
  logger.error('NFT minting failed', {
    nftTitle: data.title,
    creator: data.creator,
    errorMessage: error.message,
    errorStack: error.stack,
    errorCode: 'MINT_FAILED',
    retryable: true,
    userId: req.user.id
  });
}
```

### Pattern 4: Performance Monitoring

```typescript
const startTime = Date.now();

// ... operation ...

const duration = Date.now() - startTime;

if (duration > 1000) {  // Slow operation
  logger.warn('Slow operation detected', {
    operation: 'fetchNFTMetadata',
    duration: `${duration}ms`,
    threshold: '1000ms',
    url: 'https://arweave.net/...'
  });
}
```

### Pattern 5: Database Operations

```typescript
// Log database queries
logger.debug('Database query executed', {
  query: 'SELECT * FROM nfts WHERE creator_id = $1',
  duration: '45ms',
  rowsReturned: 25,
  indices_used: ['creator_id_idx']
});

// Log slow queries
if (duration > 500) {
  logger.warn('Slow database query', {
    query: 'SELECT ... (truncated)',
    duration: `${duration}ms`,
    rowsScanned: 50000,
    rowsReturned: 25,
    slowQueryThreshold: '500ms'
  });
}
```

### Pattern 6: Security Events

```typescript
// Log authentication events
logger.info('User authenticated', {
  userId: 'user-789',
  method: 'wallet',
  walletAddress: 'EJww...Kmpf',
  ipAddress: '192.168.1.100'
});

// Log failed attempts
logger.warn('Authentication failed', {
  walletAddress: 'EJww...Kmpf',
  reason: 'Invalid signature',
  attempt: 2,
  ipAddress: '192.168.1.100'
});

// Log security incidents
logger.error('Potential security breach', {
  event: 'Multiple failed logins',
  userId: 'user-789',
  failureCount: 5,
  timeWindow: '5min',
  severity: 'high',
  action: 'Account locked'
});
```

### Pattern 7: Third-Party API Calls

```typescript
const startTime = Date.now();

try {
  const response = await fetch('https://api.external.com/data');
  const duration = Date.now() - startTime;

  logger.info('External API call succeeded', {
    service: 'ExternalAPI',
    endpoint: '/data',
    statusCode: response.status,
    duration: `${duration}ms`,
    responseSize: response.headers.get('content-length')
  });
} catch (error) {
  logger.error('External API call failed', {
    service: 'ExternalAPI',
    endpoint: '/data',
    errorMessage: error.message,
    duration: `${Date.now() - startTime}ms`,
    retryable: error.retryable
  });
}
```

---

## Context Tracking

### Request Context

Every log should include request context:

```typescript
{
  "requestId": "req-abc-123",        // Unique request identifier
  "userId": "user-789",              // Current user
  "walletAddress": "EJww...Kmpf",    // Connected wallet
  "correlationId": "corr-def-456",   // For distributed tracing
  "sessionId": "sess-ghi-789",       // Session identifier
  "traceId": "trace-jkl-012"         // For APM
}
```

### Generating Request IDs

```typescript
// Auto-generated by middleware
const requestId = req.headers['x-request-id'] ||
  `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Pass through requests
app.use((req, res, next) => {
  res.setHeader('X-Request-ID', requestId);
  next();
});
```

---

## Querying Logs

### Command Line

```bash
# View last 100 lines
tail -100 logs/combined.log

# Follow logs in real-time
tail -f logs/combined.log

# Search for error logs
grep '"level":"error"' logs/combined.log

# Count log entries by level
grep -o '"level":"[^"]*"' logs/combined.log | sort | uniq -c

# Parse and pretty-print JSON
cat logs/combined.log | jq '.'

# Filter by level
cat logs/combined.log | jq 'select(.level == "error")'

# Filter by time range
cat logs/combined.log | jq 'select(.timestamp >= "2025-11-18T14:00:00")'

# Filter by message
cat logs/combined.log | jq 'select(.message | contains("NFT minted"))'

# Extract specific fields
cat logs/combined.log | jq '{timestamp, level, message, userId}'

# Group by user
cat logs/combined.log | jq -s 'group_by(.userId) | map({userId: .[0].userId, count: length})'

# Get error messages
cat logs/error.log | jq '.errorMessage' -r | sort | uniq -c | sort -rn
```

### With Log Aggregation Platform (ELK, Datadog, etc.)

```
# Elasticsearch query
GET logs/_search
{
  "query": {
    "bool": {
      "must": [
        { "match": { "level": "error" } },
        { "range": { "timestamp": { "gte": "2025-11-18T14:00:00" } } }
      ]
    }
  },
  "aggs": {
    "errors_by_service": {
      "terms": { "field": "service" }
    }
  }
}

# Datadog query
logs logs_type:backend status:error @duration:[1000 TO *]
| stats count by @service

# CloudWatch Logs Insights
fields @timestamp, @message, @duration
| filter @duration > 1000
| stats count() by @service
```

---

## Integration with ELK Stack

### Setup (Docker Compose)

```yaml
version: '3.8'
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:7.14.0
    environment:
      - discovery.type=single-node
    ports:
      - "9200:9200"
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data

  kibana:
    image: docker.elastic.co/kibana/kibana:7.14.0
    ports:
      - "5601:5601"
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200

  fluent-bit:
    image: fluent/fluent-bit:latest
    volumes:
      - ./logs:/var/log/app
      - ./fluent-bit.conf:/fluent-bit/etc/fluent-bit.conf
    environment:
      - ELASTICSEARCH_HOST=elasticsearch
      - ELASTICSEARCH_PORT=9200

volumes:
  elasticsearch_data:
```

### Configuration (fluent-bit.conf)

```conf
[SERVICE]
    Flush         5
    Daemon        off
    Log_Level     info
    Parsers_File  parsers.conf

[INPUT]
    Name              tail
    Path              /var/log/app/combined.log
    Parser            json
    Tag               app.*
    Refresh_Interval  5
    Mem_Buf_Limit     5MB

[FILTER]
    Name     modify
    Match    app.*
    Add      environment prod
    Add      cluster us-west-1

[OUTPUT]
    Name            es
    Match           app.*
    Host            elasticsearch
    Port            9200
    HTTP_User       elastic
    HTTP_Passwd     changeme
    Index           nftsol-${HOSTNAME}-%Y.%m.%d
    Type            _doc
    Retry_Limit     3
    Time_Key        timestamp
    Time_Key_Format %Y-%m-%dT%H:%M:%S.%LZ

[OUTPUT]
    Name   stdout
    Match  *
```

---

## Best Practices

✅ **DO**:
- Log at appropriate levels (error, warn, info)
- Include context (requestId, userId, etc.)
- Log structured data (objects, not strings)
- Redact sensitive data (passwords, tokens, API keys)
- Use descriptive messages
- Include timestamps
- Log errors with stack traces
- Track business-critical events
- Monitor log volume and storage

❌ **DON'T**:
- Log passwords, API keys, or tokens
- Log in tight loops (creates log explosion)
- Use console.log (use logger instead)
- Log unstructured messages
- Log PII (personal identifiable information) unnecessarily
- Log at DEBUG level in production
- Ignore log file rotation
- Store logs indefinitely
- Mix structured and unstructured logs

---

## Security Considerations

### Sensitive Data Redaction

```typescript
// Automatically redacted by logger
{
  password: '[REDACTED]',
  apiKey: '[REDACTED]',
  token: '[REDACTED]',
  secret: '[REDACTED]',
  authorization: '[REDACTED]'
}

// Manual redaction
function redactSensitive(data: any) {
  const copy = { ...data };
  if (copy.password) copy.password = '[REDACTED]';
  if (copy.privateKey) copy.privateKey = '[REDACTED]';
  return copy;
}
```

### GDPR Compliance

```typescript
// Don't log unnecessary PII
❌ logger.info('User data', { email, phone, address });

// Log only what's necessary
✅ logger.info('User updated', { userId, fieldChanged: 'email' });

// Implement log retention
// Delete logs older than 90 days
```

---

## Troubleshooting

### Logs Not Appearing

**Problem**: No logs in files

**Solutions**:
1. Check log directory exists: `mkdir -p logs`
2. Check file permissions: `ls -la logs/`
3. Check logger initialization: confirm middleware is registered
4. Check NODE_ENV: make sure logging is enabled for your environment

### Logs Too Large

**Problem**: Log files growing too fast

**Solutions**:
```typescript
// 1. Reduce log level in production
level: process.env.NODE_ENV === 'production' ? 'info' : 'debug'

// 2. Reduce detail in logs
❌ logger.debug('Full request:', req);  // Too much data
✅ logger.debug('Request', { method: req.method, path: req.path });

// 3. Implement sampling
if (Math.random() > 0.1) return;  // Log only 10%
```

### Performance Impact

**Problem**: Logging slowing down application

**Solutions**:
```typescript
// 1. Use async logging
format: winston.format.async()

// 2. Buffer logs
new winston.transports.File({
  bufferSize: 10000
})

// 3. Reduce logging level
const level = process.env.LOG_LEVEL || 'info';
```

---

## Resources

- **Winston Logger**: https://github.com/winstonjs/winston
- **Elastic Stack**: https://www.elastic.co/elastic-stack/
- **Datadog Logging**: https://www.datadoghq.com/
- **Structured Logging**: https://www.kartar.net/2015/12/structured-logging/
- **JSON Logging Standard**: https://jsonlines.org/

---

## Next Steps

1. ✅ Install Winston logger
2. ✅ Configure logging middleware
3. ✅ Add contextual logging throughout app
4. ✅ Set up log rotation
5. 📋 Ship logs to ELK/Datadog (optional)
6. 📋 Create monitoring dashboards
7. 📋 Set up alerts for errors
8. 📋 Train team on logging practices

---

**Status**: ✅ COMPLETE
**Logging Format**: JSON structured logs
**Log Levels**: 5 levels (error, warn, info, debug, trace)
**Storage**: Rotating files + console output
**Integration**: ELK Stack ready
**Next Improvement**: Prometheus Metrics
**Effort**: 8 hours complete

---

**Document Version**: 1.0
**Last Updated**: November 18, 2025
**Maintained By**: Development Team
