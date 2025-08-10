#!/bin/bash

# Transparent Governance Platform API Test Script
# Make sure the server is running on localhost:8080

echo "🚀 Testing Transparent Governance Platform API"
echo "=============================================="

BASE_URL="http://localhost:8080/api"

echo ""
echo "📊 TESTING CATEGORIES API"
echo "=========================="

echo ""
echo "1. Creating a new category..."
curl -X POST $BASE_URL/categories \
  -H "Content-Type: application/json" \
  -d @test_data/create_category.json

echo ""
echo ""
echo "2. Getting all categories..."
curl -X GET $BASE_URL/categories

echo ""
echo ""
echo "3. Getting category by ID (assuming ID 1 exists)..."
curl -X GET $BASE_URL/categories/1

echo ""
echo ""
echo "4. Updating category (assuming ID 1 exists)..."
curl -X PUT $BASE_URL/categories/1 \
  -H "Content-Type: application/json" \
  -d @test_data/update_category.json

echo ""
echo ""
echo "📋 TESTING POLICIES API"
echo "======================="

echo ""
echo "1. Creating a new policy..."
curl -X POST $BASE_URL/policies \
  -H "Content-Type: application/json" \
  -d @test_data/create_policy.json

echo ""
echo ""
echo "2. Getting all policies..."
curl -X GET $BASE_URL/policies

echo ""
echo ""
echo "3. Getting policy by ID (assuming ID 1 exists)..."
curl -X GET $BASE_URL/policies/1

echo ""
echo ""
echo "4. Updating policy (assuming ID 1 exists)..."
curl -X PUT $BASE_URL/policies/1 \
  -H "Content-Type: application/json" \
  -d @test_data/update_policy.json

echo ""
echo ""
echo "5. Getting policies by status..."
curl -X GET $BASE_URL/policies/status/DRAFT

echo ""
echo ""
echo "6. Getting policies by ministry..."
curl -X GET "$BASE_URL/policies/ministry/Ministry%20of%20Education"

echo ""
echo ""
echo "✅ API Testing Complete!"
echo "======================="

# Uncomment these lines to test DELETE operations
# echo ""
# echo "🗑️  DELETE OPERATIONS (Uncomment to test)"
# echo "=========================================="
# echo "Deleting category 1..."
# curl -X DELETE $BASE_URL/categories/1
# echo ""
# echo "Deleting policy 1..."
# curl -X DELETE $BASE_URL/policies/1
