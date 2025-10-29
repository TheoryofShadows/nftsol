#!/bin/bash
# NFTSol Quick Start Script

echo "🚀 Starting NFTSol Platform..."

# Start backend
echo "Starting backend..."
cd apps/backend
npm run dev &
BACKEND_PID=$!

# Wait for backend to start
sleep 5

# Start frontend
echo "Starting frontend..."
cd ../client
npm run dev &
FRONTEND_PID=$!

echo "✅ Platform started!"
echo "Backend: http://localhost:3000"
echo "Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both services"

# Wait for user to stop
wait $BACKEND_PID $FRONTEND_PID
