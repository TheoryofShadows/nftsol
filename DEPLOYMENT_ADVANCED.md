# NFTSol Advanced Deployment Guide

This document provides comprehensive deployment instructions for the NFTSol marketplace with its complete full-stack architecture.

## Repository Structure

NFTSol is a comprehensive application with multiple components:
- **Frontend**: Modern React/TypeScript client with Solana wallet integration
- **Backend**: Express.js API server with PostgreSQL database
- **Admin Dashboard**: Administrative interface for platform management
- **Advanced Backend**: Extended backend services with controllers, webhooks, and utilities
- **Contracts**: Solana smart contracts and blockchain integration
- **Scripts**: Automation tools for NFT simulations and reporting

## GitHub Repository Setup

### 1. Initialize and Push to GitHub
```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit with comprehensive message
git commit -m "feat: Complete NFTSol marketplace with advanced backend, admin dashboard, and contracts"

# Set main branch
git branch -M main

# Add your GitHub repository (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/nftsol.git

# Push to GitHub
git push -u origin main
```

### 2. Repository Secrets Configuration
Add these secrets in GitHub repository settings (Settings → Secrets and variables → Actions):

```
VERCEL_TOKEN=your_vercel_deployment_token
VERCEL_ORG_ID=your_vercel_organization_id
VERCEL_PROJECT_ID=your_vercel_project_id
DATABASE_URL=your_postgresql_connection_string
NEON_DATABASE_URL=your_neon_database_url
```

## Full-Stack Deployment Options

### Option 1: Vercel (Recommended for Frontend + Serverless)

**Best for**: Frontend with serverless API functions

1. **Connect Repository**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project" → Import from GitHub
   - Select your NFTSol repository

2. **Configuration**
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

3. **Environment Variables**
   ```
   NODE_ENV=production
   VITE_APP_NAME=NFTSol
   DATABASE_URL=your_postgres_connection
   ```

4. **Automatic Deployment**
   - Pushes to `main` branch auto-deploy
   - GitHub Actions workflow handles CI/CD

### Option 2: Railway (Recommended for Full Backend)

**Best for**: Complete backend services with database

1. **Connect Repository**
   - Go to [railway.app](https://railway.app)
   - Create new project from GitHub

2. **Database Setup**
   - Add PostgreSQL service
   - Note the connection string

3. **Environment Configuration**
   ```
   NODE_ENV=production
   PORT=5000
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   ```

### Option 3: Render (Alternative Full-Stack)

**Best for**: Comprehensive hosting with database

1. **Web Service Setup**
   - Connect GitHub repository
   - Build Command: `npm run build`
   - Start Command: `npm start`

2. **Database Service**
   - Create PostgreSQL database
   - Configure connection string

## Custom Domain Setup (NFTSol.app)

### DNS Configuration

1. **Add CNAME Records**
   ```
   Type: CNAME
   Name: www
   Value: your-deployment.vercel.app
   
   Type: CNAME  
   Name: @
   Value: your-deployment.vercel.app
   ```

2. **Alternative A Records**
   ```
   Type: A
   Name: @
   Value: 76.76.19.61 (Vercel IP)
   
   Type: A
   Name: www  
   Value: 76.76.19.61
   ```

### SSL Certificate
- Automatic SSL provisioning (24-48 hours)
- Force HTTPS redirect enabled
- Certificate auto-renewal

## Multi-Environment Strategy

### Development Environment
```bash
# Local development
npm run dev

# Features:
- Hot module replacement
- In-memory database option
- Debug logging
- Source maps enabled
```

### Staging Environment
```bash
# Deploy staging branch
git push origin staging

# Features:
- Preview deployments
- Staging database
- Performance monitoring
- User acceptance testing
```

### Production Environment
```bash
# Deploy to production
git push origin main

# Features:
- Production database
- Error tracking
- Analytics
- Performance optimization
```

## Advanced Features Configuration

### Admin Dashboard Access
- URL: `https://nftsol.app/admin`
- Secure authentication required
- Platform management interface

### NFT Simulation Scripts
```bash
# Run resale simulation
node scripts/simulateResale.js

# Generate CSV reports
node scripts/generateCSVReport.js

# Development simulations
node scripts/runDevSimulations.js
```

### API Endpoints
- `/api/nfts` - NFT marketplace operations
- `/api/users` - User management
- `/api/admin` - Administrative functions
- `/api/webhooks` - Blockchain event handling

## Performance Optimization

### Frontend Optimization
- Code splitting with dynamic imports
- Image optimization and lazy loading
- CSS purging and minification
- Service worker for caching

### Backend Optimization
- Database connection pooling
- API response caching
- Gzip compression
- CDN integration

### Monitoring Setup
- Real User Monitoring (RUM)
- Core Web Vitals tracking
- Error tracking with Sentry
- Performance alerts

## Security Configuration

### Frontend Security
- Content Security Policy (CSP)
- XSS protection headers
- HTTPS enforcement
- Environment variable protection

### Backend Security
- Rate limiting on APIs
- Input validation and sanitization
- JWT token security
- Database query protection

### Wallet Security
- Secure wallet connections
- Transaction verification
- Private key protection
- Audit logging

## Deployment Verification

### Automated Testing
```bash
# Run test suite
npm test

# E2E testing
npm run test:e2e

# Performance testing
npm run test:performance
```

### Manual Verification Checklist
- [ ] Homepage loads correctly
- [ ] Wallet connection functional
- [ ] NFT browsing works
- [ ] Admin dashboard accessible
- [ ] API endpoints responding
- [ ] Mobile responsiveness
- [ ] Cross-browser compatibility
- [ ] SSL certificate active
- [ ] Custom domain working

## Troubleshooting Guide

### Common Build Issues
1. **Node.js Version Mismatch**
   - Ensure Node.js 18+ is used
   - Check `.nvmrc` file

2. **TypeScript Compilation Errors**
   - Run `npx tsc --noEmit` locally
   - Fix type errors before deployment

3. **Missing Dependencies**
   - Verify `package.json` completeness
   - Run `npm audit` for vulnerabilities

### Database Connection Issues
1. **Connection String Format**
   ```
   postgresql://user:password@host:port/database?sslmode=require
   ```

2. **SSL Configuration**
   - Ensure SSL is enabled for production
   - Check certificate validity

### Wallet Integration Problems
1. **Network Configuration**
   - Verify Solana network settings
   - Test with multiple wallets

2. **Browser Compatibility**
   - Check wallet adapter compatibility
   - Test on different browsers

## Continuous Deployment

### GitHub Actions Workflow
- Automated on every push to main
- Runs tests before deployment
- Zero-downtime deployments
- Rollback capability

### Monitoring and Alerts
- Deployment status notifications
- Performance threshold alerts
- Error rate monitoring
- Uptime monitoring

## Support and Maintenance

### Regular Maintenance Tasks
- Dependency updates
- Security patch applications
- Performance monitoring review
- Database optimization

### Backup Strategy
- Automated database backups
- Code repository versioning
- Environment configuration backup
- Disaster recovery procedures