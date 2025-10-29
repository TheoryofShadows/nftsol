# NFTSol Platform Deployment Instructions

## 🚀 Quick Start

### Local Development
1. **Start Backend:**
   ```bash
   cd apps/backend
   npm run dev
   ```

2. **Start Frontend:**
   ```bash
   cd client
   npm run dev
   ```

3. **Or use the quick start scripts:**
   - Linux/Mac: `./start-platform.sh`
   - Windows: `start-platform.bat`

### Production Deployment

#### 1. Environment Setup
- Copy `.env.production` to your production environment
- Update all placeholder values with real production values
- Set secure JWT secret and platform keys

#### 2. Backend Deployment (Render/Heroku/etc.)
- Deploy `apps/backend` directory
- Set environment variables from `.env.production`
- Ensure database is configured and accessible

#### 3. Frontend Deployment (Netlify/Vercel/etc.)
- Deploy `client` directory
- Set build command: `npm run build`
- Set output directory: `dist`
- Configure redirects for SPA routing

#### 4. Platform Wallet Setup
- Fund the platform wallet with SOL
- Test withdrawals with small amounts first
- Monitor wallet balance and transactions

## 🔒 Security Checklist

- [ ] All environment variables set securely
- [ ] Platform wallet funded and tested
- [ ] Database connection secured
- [ ] CORS origins configured for production domains
- [ ] Rate limiting configured appropriately
- [ ] Audit logging enabled and monitored
- [ ] SSL/TLS certificates configured
- [ ] Regular security monitoring in place

## 📊 Monitoring

- Monitor `/healthz` endpoint for system health
- Check audit logs for security events
- Monitor platform wallet balance
- Track withdrawal transactions
- Monitor rate limiting and error rates

## 🆘 Troubleshooting

### Common Issues
1. **Backend won't start:** Check environment variables and database connection
2. **Frontend build fails:** Check Node.js version and dependencies
3. **Authentication fails:** Verify JWT_SECRET is set
4. **Withdrawals fail:** Check platform wallet balance and Solana RPC connection

### Support
- Check logs in `apps/backend/logs`
- Monitor `/api/v1/admin/emergency/status` for system status
- Review security logs for any suspicious activity

## 🔄 Maintenance

- Regularly rotate platform keys
- Update dependencies for security patches
- Monitor and review audit logs
- Backup platform keys securely
- Test disaster recovery procedures

---
Generated: 2025-10-29T17:23:23.684Z
Platform: NFTSol v1.0.0
Security Level: Enterprise
