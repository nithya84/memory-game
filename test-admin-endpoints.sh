#!/bin/bash

# Test script for admin endpoints
# Usage: ./test-admin-endpoints.sh [API_BASE_URL]

API_BASE_URL=${1:-"http://localhost:3001"}

if [ -z "${ADMIN_TOKEN}" ]; then
  echo "Error: ADMIN_TOKEN environment variable must be set"
  echo "Example: export ADMIN_TOKEN=your_secure_token_here"
  exit 1
fi

echo "Testing admin endpoints at: $API_BASE_URL"
echo "Using admin token: [REDACTED]"
echo ""

# Test 1: Generate theme for curation
echo "1. Testing theme generation..."
THEME_RESPONSE=$(curl -s -X POST "$API_BASE_URL/admin/themes/generate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "theme": "dinosaurs",
    "style": "cartoon",
    "count": 35
  }')

echo "Response: $THEME_RESPONSE"
THEME_ID=$(echo "$THEME_RESPONSE" | grep -o '"themeId":"[^"]*' | cut -d'"' -f4)
echo "Extracted Theme ID: $THEME_ID"
echo ""

# Test 2: List themes
echo "2. Testing list themes..."
LIST_RESPONSE=$(curl -s -X GET "$API_BASE_URL/admin/themes" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

echo "Response: $LIST_RESPONSE"
echo ""

# Test 3: Public endpoints (no auth)
echo "3. Testing public themes endpoint..."
PUBLIC_RESPONSE=$(curl -s -X GET "$API_BASE_URL/themes")

echo "Response: $PUBLIC_RESPONSE"
echo ""

echo "Admin endpoint testing complete!"