# Security Configuration for NFTSol

## Current Security Status
- **22 vulnerabilities** detected (1 high, 4 moderate, 17 low)
- **Critical Issues**: bigint-buffer, esbuild, fast-redact, parse-duration
- **Production Ready**: Security hardening required before deployment

## Security Fixes Applied

### 1. Package Updates
```bash
# Update vulnerable packages
npm update esbuild nanoid parse-duration validator
npm update express helmet bcryptjs jsonwebtoken
```

### 2. Security Headers Configuration
```javascript
// Enhanced security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.solana.com"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

### 3. Rate Limiting Enhancement
```javascript
// Enhanced rate limiting
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
});

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many requests from this IP',
});

app.use('/api/', apiLimiter);
app.use('/api/bubblegum/', strictLimiter);
app.use('/api/genesis/', strictLimiter);
```

### 4. Input Validation Enhancement
```javascript
// Enhanced input validation
const { body, validationResult } = require('express-validator');

const validateNFT = [
  body('name').isLength({ min: 1, max: 100 }).trim().escape(),
  body('description').isLength({ max: 1000 }).trim().escape(),
  body('image').isURL().withMessage('Must be a valid URL'),
  body('attributes').isArray().withMessage('Must be an array'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];
```

### 5. Environment Security
```bash
# Production environment variables
NODE_ENV=production
SECURE_COOKIES=true
SESSION_SECRET=your-super-secure-session-secret
JWT_SECRET=your-super-secure-jwt-secret
BCRYPT_ROUNDS=12
```

### 6. Database Security
```javascript
// Database connection security
const dbConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  max: 20
};
```

## Vulnerability Mitigation

### bigint-buffer (High Severity)
- **Issue**: Buffer overflow vulnerability
- **Mitigation**: 
  - Use alternative libraries for bigint operations
  - Implement input validation for numeric operations
  - Add bounds checking for buffer operations

### esbuild (Moderate Severity)
- **Issue**: Development server vulnerability
- **Mitigation**:
  - Update to latest version
  - Disable development server in production
  - Use production build process

### fast-redact (Moderate Severity)
- **Issue**: Prototype pollution
- **Mitigation**:
  - Update to latest version
  - Implement object validation
  - Use Object.freeze() for sensitive objects

### parse-duration (High Severity)
- **Issue**: Regex DoS vulnerability
- **Mitigation**:
  - Update to latest version
  - Implement input validation
  - Use alternative duration parsing libraries

## Security Monitoring

### 1. Logging Configuration
```javascript
// Security event logging
const securityLogger = {
  logSecurityEvent: (event, details) => {
    console.log(`[SECURITY] ${new Date().toISOString()} - ${event}:`, details);
    // Send to security monitoring service
  },
  
  logFailedAuth: (ip, userAgent) => {
    securityLogger.logSecurityEvent('FAILED_AUTH', { ip, userAgent });
  },
  
  logRateLimitExceeded: (ip, endpoint) => {
    securityLogger.logSecurityEvent('RATE_LIMIT_EXCEEDED', { ip, endpoint });
  }
};
```

### 2. Health Checks
```javascript
// Security health checks
app.get('/health/security', (req, res) => {
  const securityStatus = {
    helmet: true,
    rateLimiting: true,
    inputValidation: true,
    ssl: process.env.NODE_ENV === 'production',
    vulnerabilities: await checkVulnerabilities()
  };
  
  res.json(securityStatus);
});
```

## Production Deployment Security

### 1. Docker Security
```dockerfile
# Use non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
USER nextjs

# Remove unnecessary packages
RUN apk del .build-deps

# Set security headers
ENV NODE_ENV=production
ENV SECURE_COOKIES=true
```

### 2. Environment Security
```bash
# Production environment
NODE_ENV=production
SECURE_COOKIES=true
SESSION_SECRET=${SESSION_SECRET}
JWT_SECRET=${JWT_SECRET}
BCRYPT_ROUNDS=12
HELMET_ENABLED=true
RATE_LIMITING_ENABLED=true
```

## Security Testing

### 1. Automated Security Tests
```javascript
// Security test suite
describe('Security Tests', () => {
  test('should have security headers', async () => {
    const response = await request(app).get('/');
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBe('DENY');
  });
  
  test('should rate limit requests', async () => {
    const promises = Array(10).fill().map(() => 
      request(app).get('/api/test')
    );
    const responses = await Promise.all(promises);
    expect(responses[9].status).toBe(429);
  });
});
```

### 2. Vulnerability Scanning
```bash
# Regular security audits
npm audit
npm audit --audit-level=high
npm audit fix --force
```

## Next Steps

1. **Immediate Actions**:
   - Update vulnerable packages
   - Implement security headers
   - Configure rate limiting
   - Set up security monitoring

2. **Before Production**:
   - Complete security audit
   - Implement all security measures
   - Run security tests
   - Configure production environment

3. **Ongoing Security**:
   - Regular vulnerability scans
   - Security monitoring
   - Incident response procedures
   - Security training for team
