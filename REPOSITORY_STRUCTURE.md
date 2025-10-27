# NFTSol Repository Structure

This document outlines the organized structure of the NFTSol repository after cleanup and reorganization.

## 📁 Repository Structure

```
NFTSol/
├── apps/                          # Main applications
│   ├── frontend/                  # React frontend application
│   │   ├── src/                   # Source code
│   │   │   ├── components/        # React components
│   │   │   ├── hooks/            # Custom React hooks
│   │   │   ├── lib/              # Library utilities
│   │   │   ├── services/         # API services
│   │   │   ├── styles/           # CSS styles
│   │   │   ├── test/             # Test utilities
│   │   │   ├── utils/            # Utility functions
│   │   │   └── wallet/           # Wallet integration
│   │   ├── public/               # Static assets
│   │   ├── tests/                # Test files
│   │   │   └── cypress/          # E2E tests
│   │   ├── package.json          # Frontend dependencies
│   │   ├── vite.config.ts        # Vite configuration
│   │   └── tsconfig.json         # TypeScript configuration
│   │
│   ├── backend/                  # Node.js backend application
│   │   ├── src/                  # Source code
│   │   │   ├── routes/           # API routes
│   │   │   ├── services/         # Business logic
│   │   │   ├── middleware/       # Express middleware
│   │   │   ├── utils/            # Utility functions
│   │   │   └── types/            # TypeScript types
│   │   ├── tests/                # Test files
│   │   ├── scripts/              # Deployment scripts
│   │   ├── dist/                 # Compiled JavaScript
│   │   ├── package.json          # Backend dependencies
│   │   └── tsconfig.json         # TypeScript configuration
│   │
│   └── smart-contracts/          # Solana smart contracts
│       ├── programs/             # Anchor programs
│       ├── scripts/              # Deployment scripts
│       └── Cargo.toml            # Rust dependencies
│
├── config/                       # Environment configurations
│   ├── development/              # Development environment configs
│   │   ├── frontend.env          # Frontend dev environment
│   │   └── backend.env           # Backend dev environment
│   ├── production/               # Production environment configs
│   │   ├── frontend.env          # Frontend prod environment
│   │   └── backend.env           # Backend prod environment
│   ├── frontend.env.example      # Frontend env template
│   └── backend.env.example       # Backend env template
│
├── docs/                         # Documentation
│   ├── development/              # Development documentation
│   ├── production/               # Production documentation
│   └── deployment/               # Deployment guides
│
├── scripts/                      # Build and deployment scripts
│   ├── development/              # Development scripts
│   └── production/               # Production scripts
│
├── tests/                        # Global test utilities
├── secrets/                      # Secret management
├── package.json                  # Root package.json
├── docker-compose.yml            # Docker configuration
├── netlify.toml                  # Netlify deployment config
├── render.yaml                   # Render deployment config
└── README.md                     # Main README
```

## 🚀 Quick Start

### Development Environment

1. **Install dependencies:**
   ```bash
   npm install
   cd apps/frontend && npm install
   cd ../backend && npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp config/frontend.env.example config/development/frontend.env
   cp config/backend.env.example config/development/backend.env
   ```

3. **Start development servers:**
   ```bash
   # Frontend (port 3000)
   cd apps/frontend && npm run dev
   
   # Backend (port 5000)
   cd apps/backend && npm run dev
   ```

### Production Deployment

1. **Build applications:**
   ```bash
   npm run build
   ```

2. **Deploy:**
   ```bash
   # Using scripts
   ./scripts/production/deploy-production.sh
   ```

## 📋 Environment Separation

### Development
- **Frontend**: `config/development/frontend.env`
- **Backend**: `config/development/backend.env`
- **Scripts**: `scripts/development/`

### Production
- **Frontend**: `config/production/frontend.env`
- **Backend**: `config/production/backend.env`
- **Scripts**: `scripts/production/`

## 🔧 Configuration Files

- **Frontend**: Vite, TypeScript, Cypress
- **Backend**: Express, TypeScript, Jest
- **Smart Contracts**: Anchor, Rust
- **Deployment**: Docker, Netlify, Render

## 📚 Documentation

- **Development**: Setup guides, API documentation
- **Production**: Deployment guides, monitoring
- **Deployment**: Step-by-step deployment instructions

## 🧪 Testing

- **Frontend**: Cypress E2E tests
- **Backend**: Jest unit tests
- **Global**: Shared test utilities

## 🔐 Security

- Environment variables are separated by environment
- Secrets are managed in the `secrets/` directory
- Production configurations are isolated

## 📦 Dependencies

- **Root**: Monorepo management
- **Frontend**: React, Vite, TypeScript
- **Backend**: Express, TypeScript, Solana
- **Smart Contracts**: Anchor, Rust

This structure provides clear separation of concerns, easy environment management, and scalable organization for the NFTSol project.
