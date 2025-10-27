#!/bin/bash

# NFTSol Staging Deployment Script
# This script automates the deployment process for staging environment

set -e  # Exit on error

echo "🚀 NFTSol Staging Deployment Script"
echo "===================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Step 1: Verify prerequisites
echo ""
echo "📋 Step 1: Verifying prerequisites..."
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Are you in the project root?"
    exit 1
fi
print_info "Project root verified"

# Step 2: Run tests
echo ""
echo "📋 Step 2: Running tests..."
cd apps/backend
if npm run test:unit; then
    print_info "All tests passing"
else
    print_error "Tests failed. Please fix issues before deploying."
    exit 1
fi
cd ../..

# Step 3: Build backend
echo ""
echo "📋 Step 3: Building backend..."
cd apps/backend
if npm run build; then
    print_info "Backend build successful"
else
    print_error "Backend build failed"
    exit 1
fi
cd ../..

# Step 4: Build frontend
echo ""
echo "📋 Step 4: Building frontend..."
cd apps/frontend
if npm run build; then
    print_info "Frontend build successful"
else
    print_error "Frontend build failed"
    exit 1
fi
cd ../..

# Step 5: Check for environment files
echo ""
echo "📋 Step 5: Checking environment configuration..."
if [ ! -f ".env" ]; then
    print_warning ".env file not found. Make sure to set environment variables in Render."
else
    print_info "Environment configuration found"
fi

# Step 6: Git status check
echo ""
echo "📋 Step 6: Checking git status..."
if [ -n "$(git status --porcelain)" ]; then
    print_warning "Uncommitted changes detected. Consider committing before deployment."
    read -p "Continue with deployment? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Deployment cancelled"
        exit 0
    fi
else
    print_info "Working directory clean"
fi

# Step 7: Deployment summary
echo ""
echo "📋 Step 7: Deployment Summary"
echo "============================="
echo "✅ Tests: All passing"
echo "✅ Backend: Built successfully"
echo "✅ Frontend: Built successfully"
echo ""
echo "🚀 Ready for deployment to staging!"
echo ""
echo "Next steps:"
echo "1. Push to develop branch: git push origin develop"
echo "2. Render will auto-deploy if configured"
echo "3. Or deploy manually via Render dashboard"
echo ""

print_info "Deployment preparation complete!"
