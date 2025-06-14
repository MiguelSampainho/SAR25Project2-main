#!/bin/bash

# Test script for the auction application
# This script performs a series of actions to test real-time functionality

echo "Starting auction test script..."

# 1. Test user login
echo "1. Testing user login..."
curl -k -X POST https://localhost:3043/api/authenticate \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser1","password":"password123"}' \
  > login_response1.json

# Extract token from response
TOKEN1=$(grep -o '"token":"[^"]*' login_response1.json | grep -o '[^"]*$')
echo "  Logged in as testuser1, token: ${TOKEN1:0:15}..."

# Login as second user
curl -k -X POST https://localhost:3043/api/authenticate \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser2","password":"password123"}' \
  > login_response2.json

# Extract token from response
TOKEN2=$(grep -o '"token":"[^"]*' login_response2.json | grep -o '[^"]*$')
echo "  Logged in as testuser2, token: ${TOKEN2:0:15}..."

# 2. Test creating items
echo "2. Testing item creation..."
curl -k -X POST https://localhost:3043/api/newitem \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN1" \
  -d '{
    "description": "Test Item 1",
    "currentbid": 100,
    "remainingtime": 300000,
    "buynow": 500,
    "owner": "testuser1"
  }' \
  > create_item1.json

echo "  Created Test Item 1"

curl -k -X POST https://localhost:3043/api/newitem \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN2" \
  -d '{
    "description": "Test Item 2",
    "currentbid": 200,
    "remainingtime": 120000,
    "buynow": 800,
    "owner": "testuser2"
  }' \
  > create_item2.json

echo "  Created Test Item 2"

# 3. Test getting items
echo "3. Testing get items..."
curl -k -X GET https://localhost:3043/api/items \
  -H "Authorization: Bearer $TOKEN1" \
  -v > items.json  # Added -v for verbose output

echo "  Items retrieved, check items.json for details"
echo "  Contents of items.json:"
cat items.json

# 4. Test bidding using WebSocket
echo "4. Open two browser windows to https://localhost:3043 and login with testuser1 and testuser2"
echo "   Then place bids on each other's items to see real-time updates"

# 5. Test removing items
echo "5. Testing item removal..."
# We need the item ID from the items.json file
ITEM_ID=$(grep -o '"id":[0-9]*' items.json | head -1 | grep -o '[0-9]*')

if [ -n "$ITEM_ID" ]; then
  curl -k -X POST https://localhost:3043/api/removeitem \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN1" \
    -d "{\"itemId\": $ITEM_ID}" \
    > remove_item.json

  echo "  Attempted to remove item with ID $ITEM_ID, check remove_item.json for result"
else
  echo "  Could not find an item ID to remove"
fi

echo "Test script completed!"
echo "For complete testing, please open multiple browser windows and verify real-time updates."
