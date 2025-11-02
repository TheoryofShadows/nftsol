# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | :white_check_mark: |

## Reporting a Vulnerability

**Do NOT open public issues for security vulnerabilities.**

Instead, please report vulnerabilities privately:

1. **Email**: [Add your security contact email]
2. **GitHub Security Advisory**: Use GitHub's private security advisory feature
3. **Response Time**: We aim to respond within 48 hours

### What to Include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if available)

## Security Best Practices

### For Developers

1. **Never commit secrets**:
   - API keys
   - Private keys
   - Database credentials
   - JWT secrets
   - Environment variables with sensitive data

2. **Use environment variables**:
   - Store all secrets in `.env` files (not committed)
   - Use platform secrets management (Render Secrets, Netlify Environment Variables)
   - Never hardcode credentials

3. **Secure key handling**:
   - Use `PLATFORM_SECRET_KEY_BASE58` for platform wallet
   - Rotate keys regularly
   - Use different keys for development/production

4. **Input validation**:
   - Validate all user inputs
   - Sanitize data before database operations
   - Use parameterized queries

5. **Authentication**:
   - JWT tokens for API authentication
   - Session management for admin
   - Rate limiting on endpoints

### For Users

1. **Wallet Security**:
   - Never share your private key or seed phrase
   - Use hardware wallets for large amounts
   - Verify transaction details before signing

2. **Platform Security**:
   - Use strong passwords for admin accounts
   - Enable 2FA where available
   - Be cautious of phishing attempts

## Current Security Measures

### Backend

- ✅ Environment variable secrets management
- ✅ JWT token authentication
- ✅ Rate limiting on API endpoints
- ✅ Input validation and sanitization
- ✅ SQL injection prevention (parameterized queries)
- ✅ CORS configuration
- ✅ Helmet.js security headers
- ✅ HTTPS-only in production

### Frontend

- ✅ No sensitive data in client code
- ✅ Secure wallet adapter integration
- ✅ XSS prevention
- ✅ Content Security Policy (CSP)

### Infrastructure

- ✅ SSL/TLS encryption
- ✅ Database connection encryption
- ✅ Secrets stored in platform secrets management
- ✅ Regular dependency updates

## Known Issues

None at this time. All known vulnerabilities have been addressed.

## Security Updates

We regularly:
- Update dependencies to latest secure versions
- Review and audit code changes
- Monitor for security advisories
- Perform security scans

## Acknowledgments

We thank security researchers who responsibly disclose vulnerabilities.

---

**Last Updated:** November 2025