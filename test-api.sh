#!/bin/bash

# Check if the server is already running
if pgrep -f "npm run dev" > /dev/null; then
    echo "Stopping existing server..."
    pkill -f "npm run dev"
    sleep 2  # Give it time to shut down
fi

# Start the development server in the background
cd /workspaces/SAR25Project2-main/Backend
npm run dev &

# Wait a moment for the server to start
sleep 5

echo "Server started. Now testing the API..."

# Test registration endpoint with curl using -k flag to ignore certificate validation
curl -k -X POST https://localhost:3043/api/newuser \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","username":"testuser","password":"password123"}'

echo -e "\n\nNow you can test login with:"
echo "curl -k -X POST https://localhost:3043/api/authenticate \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"username\":\"testuser\",\"password\":\"password123\"}'"

echo -e "\n\nYou can also open the WebSocket tester in your browser:"
echo "\$BROWSER /workspaces/SAR25Project2-main/Backend/websocket-tester.html"
