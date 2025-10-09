# 🚀 NFTSol Deployment Guide

Complete guide for deploying NFTSol to production.

## 📋 Pre-Deployment Checklist

### 1. Environment Configuration ✅

- [ ] Copy `.env.example` to `.env`
- [ ] Set `DATABASE_URL`
- [ ] Set `JWT_SECRET` (min 32 characters)
- [ ] Configure `HELIUS_API_KEY` (recommended)
- [ ] Set `NODE_ENV=production`
- [ ] Configure `SENTRY_DSN` for monitoring

### 2. Database Setup ✅

- [ ] Create PostgreSQL database
- [ ] Verify connection string
- [ ] Run migrations: `npm run db:push`
- [ ] Test database connectivity

### 3. Solana Programs ✅

- [ ] Build programs: `npm run anchor:build`
- [ ] Deploy to devnet: `anchor deploy --provider.cluster devnet`
- [ ] Update `.env` with program IDs
- [ ] Deploy CLOUT token: `npm run deploy:token`
- [ ] Update `.env` with CLOUT_TOKEN_MINT_ADDRESS

### 4. Security ✅

- [ ] Change default JWT_SECRET
- [ ] Configure ADMIN_ALLOWED_IPS
- [ ] Enable rate limiting
- [ ] Review CORS settings
- [ ] Set up Sentry error tracking

### 5. Build & Test ✅

- [ ] Run `npm install`
- [ ] Run `npm run build`
- [ ] Test production build locally: `npm start`
- [ ] Verify all routes work
- [ ] Test API endpoints

## 🌐 Deployment Options

### Option 1: Vercel (Recommended for Monorepo)

#### Features
- ✅ Automatic deployments from Git
- ✅ Built-in CDN
- ✅ Serverless functions
- ✅ Free SSL certificates
- ✅ Environment variable management
- ✅ Free tier available

#### Setup

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Configure Project**
   ```bash
   vercel
   ```

4. **Set Environment Variables**
   ```bash
   # Via CLI
   vercel env add DATABASE_URL production
   vercel env add JWT_SECRET production
   vercel env add HELIUS_API_KEY production
   
   # Or via Vercel Dashboard:
   # Project Settings → Environment Variables
   ```

5. **Deploy**
   ```bash
   vercel --prod
   ```

6. **Custom Domain (Optional)**
   ```bash
   vercel domains add yourdomain.com
   ```

#### Vercel Configuration

File: `vercel.json` (already created)

```json
{
  "version": 2,
  "builds": [
    { "src": "server/index.ts", "use": "@vercel/node" },
    { "src": "package.json", "use": "@vercel/static-build" }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "server/index.ts" },
    { "src": "/(.*)", "dest": "/index.html" }
  ]
}
```

---

### Option 2: Railway (Recommended for Database Included)

#### Features
- ✅ Built-in PostgreSQL
- ✅ Automatic deployments
- ✅ Easy environment management
- ✅ $5/month free credit
- ✅ Usage-based pricing

#### Setup

1. **Create Railway Account**
   - Visit: https://railway.app
   - Sign up with GitHub

2. **Create New Project**
   ```bash
   # Install Railway CLI
   npm i -g @railway/cli
   
   # Login
   railway login
   
   # Initialize
   railway init
   
   # Link project
   railway link
   ```

3. **Add PostgreSQL**
   ```bash
   railway add --database postgresql
   
   # This automatically sets DATABASE_URL
   ```

4. **Set Environment Variables**
   ```bash
   railway variables set JWT_SECRET="your-secret-key"
   railway variables set HELIUS_API_KEY="your-helius-key"
   railway variables set SOLANA_NETWORK="devnet"
   ```

5. **Deploy**
   ```bash
   railway up
   ```

6. **Monitor Deployment**
   ```bash
   railway logs
   ```

#### Railway Configuration

File: `railway.json` (already created)

```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npm run build"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/health"
  }
}
```

---

### Option 3: Render (Recommended for Free Tier)

#### Features
- ✅ Free tier available
- ✅ PostgreSQL included
- ✅ Auto-deploy from Git
- ✅ Free SSL
- ✅ Easy to use

#### Setup

1. **Create Render Account**
   - Visit: https://render.com
   - Sign up with GitHub

2. **Create Web Service**
   - Click "New +" → "Web Service"
   - Connect your repository
   - Name: `nftsol`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`

3. **Create PostgreSQL Database**
   - Click "New +" → "PostgreSQL"
   - Name: `nftsol-db`
   - Plan: Free

4. **Set Environment Variables**
   - In Web Service settings → Environment
   - Add from `.env.example`
   - DATABASE_URL: Use internal database URL from Render

5. **Deploy**
   - Push to main branch
   - Render auto-deploys

#### Render Configuration

File: `render.yaml` (already created)

```yaml
services:
  - type: web
    name: nftsol
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm start
    
databases:
  - name: nftsol-db
    databaseName: nftsol
    plan: free
```

---

### Option 4: Traditional VPS (DigitalOcean, AWS, etc.)

#### Setup

1. **Create Droplet/Instance**
   - Ubuntu 22.04 LTS
   - 2GB RAM minimum
   - 2 CPUs recommended

2. **Install Dependencies**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Node.js 18
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install -y nodejs
   
   # Install PostgreSQL
   sudo apt install -y postgresql postgresql-contrib
   
   # Install PM2
   sudo npm install -g pm2
   ```

3. **Setup PostgreSQL**
   ```bash
   sudo -u postgres createdb nftsol
   sudo -u postgres createuser nftsol_user
   sudo -u postgres psql
   
   # In PostgreSQL:
   ALTER USER nftsol_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE nftsol TO nftsol_user;
   \q
   ```

4. **Deploy Application**
   ```bash
   # Clone repository
   git clone <your-repo> /var/www/nftsol
   cd /var/www/nftsol
   
   # Install dependencies
   npm install
   
   # Create .env file
   cp .env.example .env
   nano .env  # Edit with your values
   
   # Build
   npm run build
   
   # Start with PM2
   pm2 start npm --name nftsol -- start
   pm2 save
   pm2 startup
   ```

5. **Setup Nginx**
   ```bash
   sudo apt install -y nginx
   sudo nano /etc/nginx/sites-available/nftsol
   ```
   
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       
       location / {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
   
   ```bash
   sudo ln -s /etc/nginx/sites-available/nftsol /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

6. **Setup SSL with Certbot**
   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com
   ```

---

## 🔧 Post-Deployment

### 1. Verify Deployment ✅

```bash
# Check health endpoint
curl https://yourdomain.com/health

# Check API
curl https://yourdomain.com/api/health

# Check security
curl https://yourdomain.com/api/security/health
```

### 2. Monitor Application ✅

#### Sentry Setup
1. Create Sentry account: https://sentry.io
2. Create new project
3. Copy DSN
4. Add to environment: `SENTRY_DSN=your-dsn`

#### Uptime Monitoring
- Use UptimeRobot: https://uptimerobot.com
- Set up monitors for:
  - `/health`
  - `/api/health`

### 3. Database Maintenance ✅

```bash
# Backup database
pg_dump -U username -d nftsol > backup_$(date +%Y%m%d).sql

# Restore database
psql -U username -d nftsol < backup.sql

# Automated backups (cron)
0 2 * * * pg_dump -U username -d nftsol > /backups/nftsol_$(date +\%Y\%m\%d).sql
```

### 4. Performance Monitoring ✅

Monitor these metrics:
- Response times
- Error rates
- Database queries
- Memory usage
- CPU usage

---

## 🚨 Troubleshooting

### Build Fails

```bash
# Clear cache
rm -rf node_modules package-lock.json
npm install

# Check Node version
node -v  # Should be 18+

# Check build logs
npm run build 2>&1 | tee build.log
```

### Database Connection Issues

```bash
# Test connection
psql $DATABASE_URL

# Check if PostgreSQL is running
sudo systemctl status postgresql

# Check logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

### Application Crashes

```bash
# Check PM2 logs
pm2 logs nftsol

# Check error logs
tail -f /var/log/nginx/error.log

# Restart application
pm2 restart nftsol
```

### High Memory Usage

```bash
# Increase PM2 memory limit
pm2 start npm --name nftsol --max-memory-restart 500M -- start

# Monitor memory
pm2 monit
```

---

## 🔐 Security Hardening

### 1. Firewall Setup

```bash
# Ubuntu/Debian
sudo ufw allow 22      # SSH
sudo ufw allow 80      # HTTP
sudo ufw allow 443     # HTTPS
sudo ufw enable

# Check status
sudo ufw status
```

### 2. SSH Hardening

```bash
sudo nano /etc/ssh/sshd_config

# Set:
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes

sudo systemctl restart sshd
```

### 3. Fail2Ban

```bash
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 4. Auto Updates

```bash
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

---

## 📊 Performance Optimization

### 1. Enable Caching

Already implemented via `node-cache` in backend.

### 2. CDN Setup

Use Cloudflare or Vercel CDN for static assets:
- Images
- JavaScript bundles
- CSS files

### 3. Database Indexing

```sql
-- Add indexes for frequently queried columns
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_nfts_category ON nfts(category);
CREATE INDEX idx_nfts_price ON nfts(price);
```

### 4. Connection Pooling

Already configured in `drizzle.config.ts`:
```typescript
pool: {
  max: 20,
  min: 5,
  idle: 10000
}
```

---

## 🔄 CI/CD Setup

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
        env:
          NODE_ENV: production
      
      - name: Deploy to Vercel
        run: vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
```

---

## 📞 Support

If you encounter issues:
1. Check logs
2. Verify environment variables
3. Review [OPTIMIZATION_ROADMAP.md](./OPTIMIZATION_ROADMAP.md)
4. Create an issue on GitHub

---

**Last Updated**: 2025-10-09
