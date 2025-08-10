# Transparent Governance Platform API Test Script (PowerShell)
# Make sure the server is running on localhost:8080

Write-Host "🚀 Testing Transparent Governance Platform API" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green

$BaseUrl = "http://localhost:8080/api"

Write-Host ""
Write-Host "📊 TESTING CATEGORIES API" -ForegroundColor Cyan
Write-Host "==========================" -ForegroundColor Cyan

Write-Host ""
Write-Host "1. Creating a new category..." -ForegroundColor Yellow
$categoryData = Get-Content "test_data/create_category.json" -Raw
Invoke-RestMethod -Uri "$BaseUrl/categories" -Method Post -Body $categoryData -ContentType "application/json"

Write-Host ""
Write-Host "2. Getting all categories..." -ForegroundColor Yellow
Invoke-RestMethod -Uri "$BaseUrl/categories" -Method Get

Write-Host ""
Write-Host "3. Getting category by ID (assuming ID 1 exists)..." -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri "$BaseUrl/categories/1" -Method Get
} catch {
    Write-Host "Category with ID 1 not found (this is expected if no data exists)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "4. Updating category (assuming ID 1 exists)..." -ForegroundColor Yellow
try {
    $updateCategoryData = Get-Content "test_data/update_category.json" -Raw
    Invoke-RestMethod -Uri "$BaseUrl/categories/1" -Method Put -Body $updateCategoryData -ContentType "application/json"
} catch {
    Write-Host "Could not update category with ID 1 (this is expected if no data exists)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📋 TESTING POLICIES API" -ForegroundColor Cyan
Write-Host "=======================" -ForegroundColor Cyan

Write-Host ""
Write-Host "1. Creating a new policy..." -ForegroundColor Yellow
$policyData = Get-Content "test_data/create_policy.json" -Raw
Invoke-RestMethod -Uri "$BaseUrl/policies" -Method Post -Body $policyData -ContentType "application/json"

Write-Host ""
Write-Host "2. Getting all policies..." -ForegroundColor Yellow
Invoke-RestMethod -Uri "$BaseUrl/policies" -Method Get

Write-Host ""
Write-Host "3. Getting policy by ID (assuming ID 1 exists)..." -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri "$BaseUrl/policies/1" -Method Get
} catch {
    Write-Host "Policy with ID 1 not found (this is expected if no data exists)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "4. Updating policy (assuming ID 1 exists)..." -ForegroundColor Yellow
try {
    $updatePolicyData = Get-Content "test_data/update_policy.json" -Raw
    Invoke-RestMethod -Uri "$BaseUrl/policies/1" -Method Put -Body $updatePolicyData -ContentType "application/json"
} catch {
    Write-Host "Could not update policy with ID 1 (this is expected if no data exists)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "5. Getting policies by status..." -ForegroundColor Yellow
Invoke-RestMethod -Uri "$BaseUrl/policies/status/DRAFT" -Method Get

Write-Host ""
Write-Host "6. Getting policies by ministry..." -ForegroundColor Yellow
Invoke-RestMethod -Uri "$BaseUrl/policies/ministry/Ministry%20of%20Education" -Method Get

Write-Host ""
Write-Host "✅ API Testing Complete!" -ForegroundColor Green
Write-Host "======================="  -ForegroundColor Green

# Uncomment these lines to test DELETE operations
# Write-Host ""
# Write-Host "🗑️  DELETE OPERATIONS (Uncomment to test)" -ForegroundColor Red
# Write-Host "==========================================" -ForegroundColor Red
# Write-Host "Deleting category 1..."
# try { Invoke-RestMethod -Uri "$BaseUrl/categories/1" -Method Delete } catch { Write-Host "Could not delete category 1" }
# Write-Host "Deleting policy 1..."
# try { Invoke-RestMethod -Uri "$BaseUrl/policies/1" -Method Delete } catch { Write-Host "Could not delete policy 1" }
