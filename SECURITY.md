# Security Policy

**Last Updated:** May 2026

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 2.x     | :white_check_mark: |
| 1.x     | :x:                |

## Reporting a Vulnerability

**Do NOT open public issues for security vulnerabilities.**

Report privately via one of:

1. **Email**: security@nftsol.app
2. **GitHub Security Advisory**: use GitHub's private advisory feature

### Response Time

| Severity | Initial response |
| -------- | ---------------- |
| Critical | 24 hours         |
| High     | 72 hours         |
| Medium   | 7 days           |
| Low      | 30 days          |

### What to Include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if available)

---

## Security Best Practices

### For Developers

1. **Never commit secrets** — API keys, private keys, DB credentials, JWT secrets. Use `.env` files (gitignored) and platform secrets (Render, Netlify).
2. **Use environment variables** — Store all secrets in `.env`. Use different keys for dev/prod. Rotate regularly.
3. **Secure key handling** — `PLATFORM_SECRET_KEY_BASE58` is the platform wallet; treat as crown-jewel.
4. **Input validation** — Validate all user inputs; parameterized queries only.
5. **Authentication** — JWT tokens for API; wallet signatures for blockchain ops; rate limiting on endpoints.

### For Users

1. **Wallet security** — Never share your private key or seed phrase. Use a hardware wallet for large balances. Verify transaction details before signing.
2. **Platform security** — Strong passwords for admin accounts, enable 2FA where available, watch for phishing.

---

## Current Security Measures

### Backend (`apps/backend/`)

**Authentication**
- JWT (stateless) with token expiration and refresh mechanism
- Secure cookie settings (`httpOnly`, `secure`, `sameSite`)
- CSRF tokens for state-changing operations (double-submit cookie pattern); API routes using token auth are exempted

**Rate limiting**
- Global: 100 req/min per IP, 15-minute block on exceed
- Auth endpoints: 20 req/min
- API endpoints: 300 req/min
- File uploads: 30 req/min
- Redis-backed for distributed environments

**CORS**
- Strict origin checking in production, permissive in dev
- Pre-flight handling; methods: GET/POST/PUT/DELETE/OPTIONS
- Headers: `Content-Type`, `Authorization`, `X-CSRF-Token`
- Credentials allowed

**Security headers (via Helmet.js)**
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security`
- `Content-Security-Policy`
- `Referrer-Policy: no-referrer`
- `Permissions-Policy`

**Request validation**
- Input sanitization (XSS, NoSQL injection protection)
- `express-validator` and Zod schemas (`shared/validation/schemas.ts`) for request bodies; type checking on every endpoint
- 10MB request size limit

**Monitoring**
- Prometheus metrics endpoint at `/metrics`
- Structured JSON logging with sensitive-data redaction
- Request/response logging, error tracking

### Frontend (`client/`)

- No sensitive data in client code
- Secure wallet adapter integration
- XSS prevention via React's default escaping
- Content Security Policy enforced

### Infrastructure

- SSL/TLS encryption everywhere
- Database connection encryption
- Secrets stored in platform secrets management (Render, Netlify)
- Automated dependency updates

---

## Required Environment Variables (security-sensitive)

```env
# JWT
JWT_SECRET=your-secure-jwt-secret
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=your-secure-refresh-secret
JWT_REFRESH_EXPIRES_IN=7d

# Redis (rate limiting + session store)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# CORS — must include every origin the frontend can be served from
ALLOWED_ORIGINS=https://nftsol.app,https://www.nftsol.app,https://nftsolmarket.netlify.app

# Rate limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=100

# Platform wallet (NEVER commit)
PLATFORM_SECRET_KEY_BASE58=...
```

---

## Known Issues

None at this time. All known vulnerabilities have been addressed.

## Acknowledgments

We thank security researchers who responsibly disclose vulnerabilities.
