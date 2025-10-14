#!/bin/bash

echo "========================================"
echo "OBS Remote Media Controller - Backend"
echo "========================================"
echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  WARNING: .env file not found!"
    echo "Please create .env file from .env.example"
    echo ""
    read -p "Press Enter to continue anyway or Ctrl+C to exit..."
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    echo ""
fi

echo "========================================"
echo "Starting Backend Server..."
echo "========================================"
echo ""
echo "API Server: http://localhost:3000"
echo "WebSocket: ws://localhost:3000"
echo ""
echo "Health Check: http://localhost:3000/api/health"
echo ""
echo "Configure Nginx reverse proxy to forward:"
echo "  obs-media-control.piogino.ch -> localhost:3000"
echo ""
echo "Press Ctrl+C to stop the server"
echo "========================================"
echo ""

# Start the server
npm start
