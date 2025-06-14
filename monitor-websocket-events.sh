#!/bin/bash
# WebSocket Event Monitor for Auction System

echo "Starting WebSocket Event Monitor..."

# Function to monitor the WebSocket events in the frontend console
monitor_console() {
  echo "===== INSTRUCTIONS ====="
  echo "1. Open your browser console (F12 or right-click > Inspect)"
  echo "2. Make sure the 'Console' tab is active"
  echo "3. Look for messages starting with 'DEBUG -'"
  echo "4. Pay special attention to:"
  echo "   - 'Sending socket event: send:bid'"
  echo "   - 'Received event: item:sold'"
  echo "5. Try these steps:"
  echo "   a. Select an item by clicking on it"
  echo "   b. Enter a bid amount and click 'Submit Bid'"
  echo "   c. Or click 'Buy Now' to purchase the item"
  echo "===== END INSTRUCTIONS ====="
  echo ""
  echo "Press Enter to continue to backend monitoring..."
  read
}

# Function to monitor the WebSocket events in the backend
monitor_backend() {
  echo "===== BACKEND MONITORING ====="
  echo "Look for these messages in your backend terminal:"
  echo "1. 'DEBUG - Received bid:' - when a bid is received"
  echo "2. 'DEBUG - Received buy now:' - when a buy now request is received"
  echo "3. 'DEBUG - Marking item as sold:' - when an item is marked as sold"
  echo "===== END BACKEND MONITORING ====="
  echo ""
  echo "Press Enter to continue to WebSocket test tool..."
  read
}

# Function to run a simple WebSocket test
websocket_test() {
  echo "===== WEBSOCKET TEST TOOL ====="
  echo "1. Open the WebSocket test tool in your browser:"
  echo "   $BROWSER /workspaces/SAR25Project2-main/auction-ws-monitor.html"
  echo "2. Get your JWT token by running this in your browser console:"
  echo "   console.log(localStorage.getItem('id_token'))"
  echo "3. Copy and paste the token into the JWT Token field"
  echo "4. Click 'Connect' to establish a WebSocket connection"
  echo "5. When you see 'Connected' status, try these tests:"
  echo "   a. Find an item ID (visible in console logs when you select an item)"
  echo "   b. Enter that ID in the 'Item ID' field"
  echo "   c. Enter a bid amount and click 'Send Bid'"
  echo "   d. Or just click 'Buy Now' to test that functionality"
  echo "6. Watch for events appearing in the event logs"
  echo "===== END WEBSOCKET TEST TOOL ====="
}

# Run each function in sequence
monitor_console
monitor_backend
websocket_test

echo ""
echo "WebSocket Event Monitor complete. Happy debugging!"
