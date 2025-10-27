# NFTSol Deployment Guide

## 🚀 Production Deployment

### Frontend (Netlify)

1. **Build the frontend**
   ```bash
   cd client
   npm run build
   ```

2. **Deploy to Netlify**
   - Drag and drop `client/dist` folder to Netlify dashboard
   - Or use Netlify CLI: `netlify deploy --prod --dir=client/dist`

3. **Set environment variables in Netlify**
   ```bash
   VITE_API_BASE=https://nftsol.onrender.com
   VITE_NODE_ENV=production
   VITE_SOLANA_CLUSTER=mainnet-beta
   # ... see client/env.production for complete list
   ```

### Backend (Render)

1. **Connect GitHub repository**
   - Go to Render dashboard
   - Create new Web Service
   - Connect to `TheoryofShadows/nftsol`

2. **Configure build settings**
   - Build Command: `cd server && npm install && npm run build`
   - Start Command: `cd server && npm start`
   - Node Version: 18

3. **Set environment variables in Render**
   ```bash
   ALLOWED_ORIGINS=https://nftsol.app
   DATABASE_URL=postgresql://...
   SOLANA_CLUSTER=mainnet-beta
   # ... see server/env.production for complete list
   ```

## 🛠️ Development Setup

### Local Development

1. **Clone and install**
   ```bash
   git clone https://github.com/TheoryofShadows/nftsol.git
   cd nftsol
   npm install
   ```

2. **Set up environment**
   ```bash
   # Copy environment files
   cp client/env.development client/.env.local
   cp server/env.development server/.env
   ```

3. **Start development servers**
   ```bash
   # Terminal 1 - Backend
   cd server && npm run dev
   
   # Terminal 2 - Frontend
   cd client && npm run dev
   ```

### Environment Variables

#### Frontend (Development)
- `VITE_API_BASE=http://localhost:3000`
- `VITE_SOLANA_CLUSTER=devnet`
- `VITE_WS_URL=ws://localhost:3000`

#### Frontend (Production)
- `VITE_API_BASE=https://nftsol.onrender.com`
- `VITE_SOLANA_CLUSTER=mainnet-beta`
- `VITE_WS_URL=wss://nftsol.onrender.com`

#### Backend (Development)
- `NODE_ENV=development`
- `SOLANA_CLUSTER=devnet`
- `LOG_LEVEL=debug`

#### Backend (Production)
- `NODE_ENV=production`
- `SOLANA_CLUSTER=mainnet-beta`
- `LOG_LEVEL=info`

## 🔧 Troubleshooting

### Common Issues

1. **Build failures**
   - Check Node.js version (18+)
   - Clear node_modules and reinstall
   - Check environment variables

2. **CORS errors**
   - Verify `ALLOWED_ORIGINS` in backend
   - Check frontend `VITE_API_BASE` URL

3. **Database connection issues**
   - Verify `DATABASE_URL` format
   - Check PostgreSQL service status

4. **WebSocket connection issues**
   - Verify `VITE_WS_URL` in frontend
   - Check backend WebSocket service

### Debug Commands

```bash
# Check backend logs
cd server && npm run dev

# Check frontend build
cd client && npm run build

# Run tests
npm run test:all
```

## 📊 Monitoring

### Health Checks

- **Frontend**: https://nftsol.netlify.app
- **Backend**: https://nftsol.onrender.com/health
- **Database**: Check Render PostgreSQL dashboard

### Performance Monitoring

- **Frontend**: Netlify Analytics
- **Backend**: Render Metrics
- **Database**: PostgreSQL Query Performance

## 🔄 CI/CD

### Automatic Deployment

- **Main branch** → Production (Render + Netlify)
- **Development branch** → Staging (if configured)

### Manual Deployment

```bash
# Deploy to production
./scripts/deploy-production.sh

# Deploy to development
./scripts/deploy-development.sh
```
