#!/bin/bash

# Setup script for the MEAN stack auction project backend

echo "Setting up backend environment..."

# Install dependencies
echo "Installing dependencies..."
npm install

# Create logs directory if it doesn't exist
mkdir -p logs

# Build TypeScript files
echo "Building TypeScript files..."
npm run build

# Basic instructions for students
echo ""
echo "========================================"
echo "Setup complete!"
echo ""
echo "To start the server in development mode:"
echo "  npm run dev"
echo ""
echo "To build and start the server:"
echo "  npm run build"
echo "  npm start"
echo ""
echo "The server will run at:"
echo "  HTTP: http://localhost:3000 (redirects to HTTPS)"
echo "  HTTPS: https://localhost:3043"
echo "========================================"