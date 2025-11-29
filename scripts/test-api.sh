#!/bin/bash

BASE_URL="http://localhost:3000"
SHOP="test-store.myshopify.com"

echo "🧪 Testing Wholesale Pricing API"
echo "================================"
echo ""

echo "1. Creating a test rule..."
RESPONSE=$(curl -s -X POST "$BASE_URL/api/rules" \
  -H "Content-Type: application/json" \
  -d '{
    "shop": "'$SHOP'",
    "rule_name": "Test Wholesale Rule",
    "target_type": "product",
    "target_id": "gid://shopify/Product/123456",
    "priority": 10,
    "active": true,
    "tiers": [
      {"min_quantity": 5, "price": 10.00},
      {"min_quantity": 10, "price": 8.00},
      {"min_quantity": 20, "price": 6.00}
    ]
  }')

echo "$RESPONSE" | jq '.'

RULE_ID=$(echo "$RESPONSE" | jq -r '.data.id')

if [ "$RULE_ID" != "null" ]; then
    echo "✅ Rule created with ID: $RULE_ID"
else
    echo "❌ Failed to create rule"
    exit 1
fi

echo ""
echo "2. Fetching all rules..."
curl -s "$BASE_URL/api/rules" | jq '.'

echo ""
echo "3. Fetching rule by ID..."
curl -s "$BASE_URL/api/rules/$RULE_ID" | jq '.'

echo ""
echo "4. Calculating price for 10 units..."
curl -s -X POST "$BASE_URL/api/rules/calculate" \
  -H "Content-Type: application/json" \
  -d '{
    "target_type": "product",
    "target_id": "gid://shopify/Product/123456",
    "quantity": 10
  }' | jq '.'

echo ""
echo "5. Updating rule..."
curl -s -X PUT "$BASE_URL/api/rules/$RULE_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "rule_name": "Updated Test Rule",
    "priority": 15
  }' | jq '.'

echo ""
echo "6. Deleting rule..."
curl -s -X DELETE "$BASE_URL/api/rules/$RULE_ID"

echo ""
echo "✅ All tests completed!"

