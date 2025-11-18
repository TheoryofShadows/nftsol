# NFTSol Docker & Containerization Guide

**Document Status**: Complete
**Last Updated**: November 18, 2025
**Criticality**: 🟠 HIGH - Deployment & Consistency

---

## Quick Start (5 minutes)

### Prerequisites
- Docker Desktop installed and running
- At least 4GB RAM allocated to Docker
- 10GB free disk space

### Start Development Stack
```bash
# 1. Create environment file
cp apps/backend/.env.example .env.local

# 2. Edit environment variables
nano .env.local
# Key variables to set:
# - DATABASE_URL, SOLANA_RPC_URL, JWT_SECRET, etc.

# 3. Start all services
docker-compose up -d

# 4. View logs
docker-compose logs -f

# 5. Access services
# Frontend:  http://localhost
# Backend:   http://localhost:3001
# pgAdmin:   http://localhost:5050 (optional, run with --profile admin)
# API Docs:  http://localhost:3001/api-docs

# 6. Stop services
docker-compose down
```

---

## Architecture

### Services Overview
```
┌─────────────────────────────────────────────────────┐
│                   NFTSol Docker Stack               │
└─────────────────────────────────────────────────────┘

┌──────────────┐     ┌──────────────┐
│  Frontend    │     │   Backend    │
│  (Nginx)     │────▶│  (Node.js)   │
│  Port 80     │     │  Port 3001   │
└──────────────┘     └──────────────┘
                          │
                 ┌────────┼────────┐
                 │                 │
          ┌──────▼────┐   ┌────────▼──┐
          │ PostgreSQL│   │   Redis    │
          │ (DB)      │   │  (Cache)   │
          │ Port 5432 │   │ Port 6379  │
          └───────────┘   └────────────┘
```

### Configuration File Locations
- **Backend**: `.env.local` or `apps/backend/.env`
- **Frontend**: `client/.env` or `client/.env.local`
- **Docker Compose**: `docker-compose.yml`
- **Dockerfile**: `apps/backend/Dockerfile`, `client/Dockerfile`
- **Nginx Config**: `client/nginx.conf`

---

## Images

### Backend Image

**Location**: `apps/backend/Dockerfile`

**Multi-stage build**:
1. **Builder stage**: Compiles TypeScript, installs dev dependencies
2. **Runtime stage**: Alpine Linux with only production dependencies

**Size**: ~500MB (optimized)

**Features**:
- Non-root user (nodejs)
- Health checks enabled
- Proper signal handling (dumb-init)
- PostgreSQL client included

### Frontend Image

**Location**: `client/Dockerfile`

**Build process**:
1. **Builder**: Node 20 Alpine builds Vite application
2. **Runtime**: Nginx Alpine serves compiled assets

**Size**: ~150MB (optimized)

**Features**:
- Nginx reverse proxy
- Security headers configured
- WebSocket support for Socket.io
- API proxying to backend
- Gzip compression
- Health checks enabled

---

## Running Services

### Development Mode

#### Option 1: Docker Compose (Recommended)
```bash
# Start all services with one command
docker-compose up -d

# View real-time logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f postgres

# Stop services
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v

# Restart services
docker-compose restart
```

#### Option 2: Individual Containers
```bash
# Start PostgreSQL
docker run -d \
  --name nftsol-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  postgres:16-alpine

# Start Redis
docker run -d \
  --name nftsol-redis \
  -p 6379:6379 \
  redis:7-alpine

# Build and run backend
docker build -t nftsol-backend apps/backend/
docker run -d \
  --name nftsol-backend \
  -p 3001:3001 \
  --link nftsol-postgres \
  --link nftsol-redis \
  nftsol-backend

# Build and run frontend
docker build -t nftsol-frontend client/
docker run -d \
  --name nftsol-frontend \
  -p 80:80 \
  --link nftsol-backend \
  nftsol-frontend
```

### Production Mode

#### Basic Production Deployment
```bash
# Build images
docker build -t nftsol-backend:latest apps/backend/
docker build -t nftsol-frontend:latest client/

# Run with production settings
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# OR use Kubernetes (see kubernetes setup guide)
```

#### Production docker-compose.prod.yml
```yaml
version: '3.8'

services:
  backend:
    image: nftsol-backend:latest
    environment:
      NODE_ENV: production
      LOG_LEVEL: warn
    restart: always
    healthcheck:
      interval: 30s
      retries: 5

  postgres:
    environment:
      POSTGRES_INITDB_ARGS: "--encoding=UTF8 --lc-collate=C --lc-ctype=C"
    restart: always

  redis:
    restart: always
```

---

## Docker Commands Reference

### Image Management
```bash
# List images
docker images

# Remove image
docker rmi nftsol-backend

# Tag image
docker tag nftsol-backend myregistry/nftsol-backend:v1.0.0

# Push to registry
docker push myregistry/nftsol-backend:v1.0.0
```

### Container Management
```bash
# List running containers
docker ps

# List all containers
docker ps -a

# View container logs
docker logs nftsol-backend
docker logs -f nftsol-backend  # Follow logs
docker logs --tail 100 nftsol-backend  # Last 100 lines

# Execute command in container
docker exec -it nftsol-backend sh
docker exec -it nftsol-postgres psql -U postgres -d nftsol

# Copy files
docker cp nftsol-backend:/app/dist ./dist
docker cp ./config.json nftsol-backend:/app/config.json

# Stop container
docker stop nftsol-backend

# Start container
docker start nftsol-backend

# Remove container
docker rm nftsol-backend
```

### Compose Commands
```bash
# Build images defined in docker-compose
docker-compose build

# Start services
docker-compose up -d

# Stop services (preserve volumes)
docker-compose down

# Stop and remove volumes
docker-compose down -v

# View logs
docker-compose logs -f

# Execute command
docker-compose exec backend npm run type-check

# Restart specific service
docker-compose restart backend

# Remove unused images/volumes
docker-compose prune

# Validate compose file
docker-compose config
```

---

## Environment Configuration

### Backend Environment Variables
```bash
# Create .env.local
cat > .env.local << 'EOF'
# Node
NODE_ENV=development
PORT=3001

# Database
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/nftsol
DB_HOST=postgres
DB_PORT=5432
DB_NAME=nftsol
DB_USER=postgres
DB_PASSWORD=postgres

# Redis
REDIS_URL=redis://:redis123@redis:6379
REDIS_PASSWORD=redis123

# Solana
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_CLUSTER=mainnet-beta
HELIUS_API_KEY=<your_key>

# CLOUT Token
CLOUT_PROGRAM_ID=26iJ37BE3icVtoo2QRkfjtYXFHMudG2sbTHAnhF2D6ab

# Platform Wallet
PLATFORM_SECRET_KEY_BASE58=<base58_secret>
ADMIN_WALLETS=wallet1,wallet2

# Security
JWT_SECRET=your_256_char_secret_key_here_generate_new
SESSION_SECRET=your_session_secret_here

# CORS
ALLOWED_ORIGINS=http://localhost,http://localhost:80

# Logging
LOG_LEVEL=info
EOF
```

### Frontend Environment Variables
```bash
# In docker-compose.yml or client/.env
VITE_API_BASE=http://localhost:3001
VITE_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
VITE_SOLANA_CLUSTER=mainnet-beta
VITE_HELIUS_API_KEY=<your_key>
```

---

## Networking

### How Services Communicate
- **Service names as hostnames**: `backend`, `postgres`, `redis`
- **Bridge network**: All services on `nftsol-network`
- **Port mapping**: Only exposed ports accessible from host

### Example: Backend to PostgreSQL
```
Backend (http://backend:3001)
     │
     │ connects to
     ▼
PostgreSQL (postgres://postgres:5432)
  (DNS: postgres - Docker internal DNS)
```

### Accessing Services

| Service | Internal | External | Use Case |
|---------|----------|----------|----------|
| Backend | http://backend:3001 | http://localhost:3001 | API |
| Frontend | N/A | http://localhost | Web UI |
| PostgreSQL | postgres:5432 | localhost:5432 | Database |
| Redis | redis:6379 | localhost:6379 | Cache |
| pgAdmin | N/A | localhost:5050 | DB management |

---

## Volumes

### Data Persistence
```yaml
volumes:
  postgres_data:      # Database data
    driver: local
  redis_data:         # Redis persistence
    driver: local
  pgadmin_data:       # pgAdmin config
    driver: local
```

### Development Mounts
```bash
# Hot reload for backend
volumes:
  - ./apps/backend/src:/app/apps/backend/src
  - ./apps/backend/dist:/app/apps/backend/dist

# Static files for frontend
volumes:
  - ./client/dist:/usr/share/nginx/html:ro
```

### Backup Volumes
```bash
# Backup postgres data
docker run --rm -v nftsol_postgres_data:/data \
  -v $(pwd)/backups:/backup \
  busybox tar czf /backup/postgres_backup.tar.gz -C /data .

# Restore postgres data
docker run --rm -v nftsol_postgres_data:/data \
  -v $(pwd)/backups:/backup \
  busybox tar xzf /backup/postgres_backup.tar.gz -C /data --strip-components=1
```

---

## Monitoring & Debugging

### Health Checks
```bash
# Check service health
docker ps  # Shows health status

# Manual health checks
curl http://localhost:3001/health      # Backend
curl http://localhost                   # Frontend
curl http://localhost:5050              # pgAdmin

# View health check logs
docker inspect nftsol-backend | grep -A 5 "Health"
```

### Container Inspection
```bash
# View container details
docker inspect nftsol-backend

# View resource usage
docker stats

# View process list
docker top nftsol-backend

# View filesystem changes
docker diff nftsol-backend
```

### Debugging
```bash
# Interactive shell in container
docker exec -it nftsol-backend sh

# Check database connection
docker exec nftsol-postgres psql -U postgres -d nftsol -c "\dt"

# Check Redis connection
docker exec nftsol-redis redis-cli PING

# View environment variables
docker exec nftsol-backend printenv | grep DATABASE
```

### Log Troubleshooting
```bash
# View last 50 lines of logs
docker logs --tail 50 nftsol-backend

# View logs with timestamps
docker logs -t nftsol-backend

# Stream logs with filtering
docker logs -f nftsol-backend | grep ERROR

# Save logs to file
docker logs nftsol-backend > logs.txt 2>&1
```

---

## Registry & Distribution

### Docker Hub
```bash
# Tag image
docker tag nftsol-backend:latest myusername/nftsol-backend:v1.0.0

# Push to Docker Hub
docker login
docker push myusername/nftsol-backend:v1.0.0

# Pull image
docker pull myusername/nftsol-backend:v1.0.0

# Run pulled image
docker run -d myusername/nftsol-backend:v1.0.0
```

### Private Registry
```bash
# Tag for private registry
docker tag nftsol-backend:latest registry.mycompany.com/nftsol-backend:latest

# Push to private registry
docker push registry.mycompany.com/nftsol-backend:latest

# Use in docker-compose
# image: registry.mycompany.com/nftsol-backend:latest
```

---

## Optimization

### Image Size Reduction
- **Current**: 650MB (backend + frontend combined)
- **Targets**:
  - Remove unnecessary dependencies
  - Use Alpine Linux (already done)
  - Multi-stage builds (already done)
  - Reduce layers

### Build Optimization
```bash
# Use build cache
docker-compose build --no-cache  # Rebuild from scratch

# BuildKit (faster builds)
DOCKER_BUILDKIT=1 docker build -t nftsol-backend apps/backend/

# View build layers
docker history nftsol-backend
```

### Runtime Optimization
```bash
# Resource limits in docker-compose
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

---

## Security

### Best Practices Implemented
- ✅ Non-root user (nodejs)
- ✅ Multi-stage builds (smaller attack surface)
- ✅ Alpine Linux (minimal base image)
- ✅ Read-only volumes where possible
- ✅ Security headers in Nginx
- ✅ Health checks for resilience

### Additional Security Hardening
```bash
# Scan image for vulnerabilities
docker scan nftsol-backend

# Or use Trivy
trivy image nftsol-backend

# Limit container capabilities
docker run --cap-drop=ALL --cap-add=NET_BIND_SERVICE nftsol-backend

# Run as read-only filesystem
docker run --read-only nftsol-backend
```

### Secrets Management
```bash
# Use Docker Secrets (Swarm mode)
echo "my_secret_value" | docker secret create db_password -

# Or use environment files
docker-compose --env-file .env.production up -d

# Never commit secrets
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
```

---

## Troubleshooting

### Port Already in Use
```bash
# Find process using port
lsof -i :3001
netstat -ano | findstr :3001

# Kill process
kill -9 <PID>

# Or use different port in docker-compose
ports:
  - "3002:3001"
```

### Database Connection Errors
```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Test connection from backend container
docker exec nftsol-backend psql -h postgres -U postgres -d nftsol -c "\dt"

# View postgres logs
docker logs nftsol-postgres

# Reset database (destructive!)
docker exec nftsol-postgres psql -U postgres -c "DROP DATABASE nftsol;"
docker exec nftsol-postgres psql -U postgres -c "CREATE DATABASE nftsol;"
```

### Service Won't Start
```bash
# Check service logs
docker logs nftsol-backend

# Check resource availability
docker stats

# Check network
docker network ls
docker network inspect nftsol-network

# Rebuild image
docker-compose build --no-cache backend
```

### Memory/CPU Issues
```bash
# View resource usage
docker stats

# Limit resources
docker run -m 512m --cpus 1 nftsol-backend

# In docker-compose.yml
deploy:
  resources:
    limits:
      memory: 512M
      cpus: '1'
```

---

## CI/CD Integration

### GitHub Actions
```yaml
name: Build Docker Images

on: [push]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Build Docker images
        run: |
          docker build -t nftsol-backend:${{ github.sha }} apps/backend/
          docker build -t nftsol-frontend:${{ github.sha }} client/

      - name: Push to registry
        run: |
          echo ${{ secrets.REGISTRY_PASSWORD }} | docker login -u ${{ secrets.REGISTRY_USER }} --password-stdin
          docker push nftsol-backend:${{ github.sha }}
          docker push nftsol-frontend:${{ github.sha }}
```

---

## Deployment Strategies

### 1. Docker Compose (Development)
```bash
docker-compose up -d
# Simple, all-in-one, good for development
```

### 2. Docker Swarm (Moderate Scale)
```bash
docker swarm init
docker stack deploy -c docker-compose.yml nftsol
# Multi-node deployment, built-in orchestration
```

### 3. Kubernetes (Production)
```bash
kubectl apply -f k8s-manifests/
# Enterprise-grade orchestration, auto-scaling, self-healing
```

---

## Next Steps

1. ✅ **Test locally**: `docker-compose up -d`
2. ✅ **Verify services**: `docker ps`
3. ✅ **Access application**: http://localhost
4. 📋 **Deploy to staging**: Use docker-compose.yml
5. 📋 **Deploy to production**: Use Kubernetes manifests
6. 📋 **Setup CI/CD**: GitHub Actions with Docker builds
7. 📋 **Monitor**: Use Docker stats, logs, and health checks

---

**Document Version**: 1.0
**Last Updated**: November 18, 2025
**Maintained By**: DevOps Team
