#!/bin/bash

# Create test users script

echo "Creating test users..."

# Test for testuser1
curl -k -X POST https://localhost:3043/api/newuser \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User 1",
    "email": "testuser1@example.com",
    "username": "testuser1",
    "password": "password123"
  }'

echo -e "\nCreated testuser1"

# Test for testuser2
curl -k -X POST https://localhost:3043/api/newuser \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User 2",
    "email": "testuser2@example.com",
    "username": "testuser2",
    "password": "password123"
  }'

echo -e "\nCreated testuser2"

echo "Test users created successfully!"
