#!/bin/bash

# NFTSol Development Deployment Script
echo "🚀 Deploying NFTSol to Development Environment..."

# Set environment
export NODE_ENV=development

# Install dependencies
echo "📦 Installing dependencies..."
npm install
cd client && npm install
cd ../server && npm install
cd ..

# Copy environment files
echo "🔧 Setting up environment variables..."
cp client/env.development client/.env.local
cp server/env.development server/.env

# Build frontend
echo "🏗️ Building frontend..."
cd client
npm run build
cd ..

# Start development servers
echo "🎯 Starting development servers..."
echo "Frontend: http://localhost:5173"
echo "Backend: http://localhost:3000"

# Start backend in background
cd server && npm run dev &
BACKEND_PID=$!

# Start frontend
cd ../client && npm run dev &
FRONTEND_PID=$!

# Wait for user to stop
echo "Press Ctrl+C to stop all servers"
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
