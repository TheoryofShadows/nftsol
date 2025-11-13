# Security Documentation

This document outlines the security measures implemented in the NFTSol backend application.

## Table of Contents
- [Authentication](#authentication)
- [Rate Limiting](#rate-limiting)
- [CORS](#cors)
- [Security Headers](#security-headers)
- [Request Validation](#request-validation)
- [Monitoring and Logging](#monitoring-and-logging)
- [Environment Variables](#environment-variables)
- [Best Practices](#best-practices)

## Authentication

### JWT Authentication
- Uses JSON Web Tokens (JWT) for stateless authentication
- Token expiration and refresh mechanism
- Secure cookie settings (httpOnly, secure, sameSite)

### CSRF Protection
- CSRF tokens required for state-changing operations
- Double-submit cookie pattern implementation
- Exempted API routes that use token-based auth

## Rate Limiting

### Global Rate Limiting
- 100 requests per minute per IP address
- 15-minute block on exceeding limits
- Redis-backed rate limiting for distributed environments

### Endpoint-Specific Limits
- Authentication endpoints: 20 requests/minute
- API endpoints: 300 requests/minute
- File uploads: 30 requests/minute

## CORS

### Configuration
- Strict origin checking in production
- Development allows all origins
- Pre-flight request handling
- Allowed methods: GET, POST, PUT, DELETE, OPTIONS
- Allowed headers: Content-Type, Authorization, X-CSRF-Token
- Credentials allowed for cross-origin requests

## Security Headers

The following security headers are automatically added to all responses:

- `X-Frame-Options: DENY` - Prevents clickjacking
- `X-Content-Type-Options: nosniff` - Prevents MIME type sniffing
- `X-XSS-Protection: 1; mode=block` - Enables XSS filtering
- `Strict-Transport-Security` - Enforces HTTPS
- `Content-Security-Policy` - Restricts resource loading
- `Referrer-Policy: no-referrer` - Controls referrer information
- `Permissions-Policy` - Controls browser features

## Request Validation

### Input Sanitization
- All user input is sanitized
- Protection against NoSQL injection
- Protection against XSS attacks
- Request size limits (10MB)

### Schema Validation
- Request body validation using Joi
- Parameter validation for all routes
- Type checking for all API endpoints

## Monitoring and Logging

### Metrics
- Prometheus metrics endpoint at `/metrics`
- Request duration tracking
- Database query monitoring
- Memory and CPU usage metrics

### Logging
- Structured JSON logging
- Request/response logging
- Error tracking
- Sensitive data redaction

## Environment Variables

### Required
```env
# JWT
JWT_SECRET=your-secure-jwt-secret
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=your-secure-refresh-secret
JWT_REFRESH_EXPIRES_IN=7d

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

### Optional
```env
# CORS (comma-separated list of allowed origins)
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=100

# Logging
LOG_LEVEL=info
NODE_ENV=development
```

## Best Practices

### Code Security
- Regular dependency updates
- Security audits with `npm audit`
- Static code analysis
- Secrets management

### API Security
- Input validation for all endpoints
- Proper error handling
- Rate limiting
- Request size limits

### Infrastructure
- HTTPS enforcement
- Secure headers
- Regular security patches
- Monitoring and alerting

## Incident Response

### Reporting Security Issues
Please report security issues to security@nftsol.app

### Response Time
- Critical: 24 hours
- High: 72 hours
- Medium: 7 days
- Low: 30 days

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
