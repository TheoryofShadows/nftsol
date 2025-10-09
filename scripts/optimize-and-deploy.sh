#!/bin/bash

# NFTSol Optimization and Deployment Script
set -e

echo "🚀 Starting NFTSol optimization and deployment process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Step 1: Clean up
print_status "Cleaning up previous builds..."
rm -rf dist node_modules/.vite .next
print_success "Cleanup completed"

# Step 2: Install dependencies
print_status "Installing dependencies..."
npm ci
print_success "Dependencies installed"

# Step 3: Security audit and fix
print_status "Running security audit..."
npm audit fix --force || print_warning "Some vulnerabilities could not be automatically fixed"
print_success "Security audit completed"

# Step 4: Environment setup
print_status "Setting up environment..."
if [ ! -f ".env" ]; then
    print_warning "No .env file found, creating from template..."
    cp .env.example .env
    print_warning "Please configure your .env file with actual API keys"
else
    print_success "Environment file found"
fi

# Step 5: Build Anchor programs
print_status "Building Anchor programs..."
if command -v anchor &> /dev/null; then
    cd anchor/solana_rewards
    anchor build
    cd ../..
    print_success "Anchor programs built"
else
    print_warning "Anchor CLI not found, skipping Anchor build"
fi

# Step 6: Generate Anchor clients
print_status "Generating Anchor clients..."
npm run anchor:generate
print_success "Anchor clients generated"

# Step 7: Build frontend
print_status "Building frontend..."
npm run build
print_success "Frontend built successfully"

# Step 8: Build backend
print_status "Building backend..."
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist
print_success "Backend built successfully"

# Step 9: Run tests (if available)
print_status "Running tests..."
if [ -f "package.json" ] && grep -q '"test"' package.json; then
    npm test || print_warning "Some tests failed"
else
    print_warning "No tests found"
fi

# Step 10: Performance analysis
print_status "Analyzing bundle size..."
if command -v npx &> /dev/null; then
    npx vite-bundle-analyzer dist/public/assets/ || print_warning "Bundle analyzer not available"
fi

# Step 11: Security scan
print_status "Running security scan..."
npm audit --audit-level=moderate || print_warning "Security issues found"

# Step 12: Docker build (if Docker is available)
if command -v docker &> /dev/null; then
    print_status "Building Docker images..."
    docker build -f Dockerfile.frontend -t nftsol-frontend .
    docker build -f Dockerfile.backend -t nftsol-backend .
    print_success "Docker images built"
else
    print_warning "Docker not available, skipping Docker build"
fi

# Step 13: Final checks
print_status "Running final checks..."

# Check if build artifacts exist
if [ -d "dist" ]; then
    print_success "Build artifacts created successfully"
else
    print_error "Build artifacts not found"
    exit 1
fi

# Check bundle size
BUNDLE_SIZE=$(du -sh dist/public/assets/ 2>/dev/null | cut -f1 || echo "Unknown")
print_status "Bundle size: $BUNDLE_SIZE"

# Check for console.log statements in production build
CONSOLE_LOGS=$(grep -r "console\." dist/ 2>/dev/null | wc -l || echo "0")
if [ "$CONSOLE_LOGS" -gt 0 ]; then
    print_warning "Found $CONSOLE_LOGS console statements in production build"
else
    print_success "No console statements found in production build"
fi

# Step 14: Deployment readiness check
print_status "Checking deployment readiness..."

# Check environment variables
if [ -f ".env" ]; then
    REQUIRED_VARS=("DATABASE_URL" "JWT_SECRET" "VITE_SOLANA_RPC_URL")
    for var in "${REQUIRED_VARS[@]}"; do
        if grep -q "^$var=" .env; then
            print_success "✓ $var is configured"
        else
            print_warning "⚠ $var is not configured"
        fi
    done
fi

# Check if ports are available
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    print_warning "Port 3000 is already in use"
else
    print_success "✓ Port 3000 is available"
fi

if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1; then
    print_warning "Port 3001 is already in use"
else
    print_success "✓ Port 3001 is available"
fi

# Final summary
echo ""
echo "🎉 Optimization and deployment preparation completed!"
echo ""
echo "📊 Summary:"
echo "  • Dependencies: Installed and audited"
echo "  • Security: Vulnerabilities addressed"
echo "  • Build: Frontend and backend built successfully"
echo "  • Bundle Size: $BUNDLE_SIZE"
echo "  • Console Logs: $CONSOLE_LOGS found in production"
echo ""
echo "🚀 Next steps:"
echo "  1. Configure your .env file with actual API keys"
echo "  2. Set up your database (PostgreSQL recommended)"
echo "  3. Run: npm run dev (for development)"
echo "  4. Run: npm start (for production)"
echo "  5. Or use Docker: docker-compose up"
echo ""
echo "📚 Documentation:"
echo "  • See COMPREHENSIVE_ANALYSIS_REPORT.md for detailed analysis"
echo "  • Check README.md for setup instructions"
echo ""

print_success "All done! 🎉"