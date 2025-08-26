#!/usr/bin/env pwsh
# Simple test to verify the database voting functions exist and work

$baseUrl = "http://localhost:8080"
$headers = @{
    "Content-Type" = "application/json"
}

Write-Host "🔍 Testing Database Voting Functions" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green

# Test 1: Test the direct database vote endpoint
Write-Host "`n🗳️ Test 1: Testing direct database vote endpoint..." -ForegroundColor Yellow

$testPayload = @{
    proposalId = 1
    voteType = "yes"
    walletAddress = "0x1234567890123456789012345678901234567890"
} | ConvertTo-Json

try {
    Write-Host "Sending payload: $testPayload" -ForegroundColor Cyan
    $response = Invoke-RestMethod -Uri "$baseUrl/api/proposals/vote" -Method POST -Headers $headers -Body $testPayload
    
    Write-Host "Response received:" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 3) -ForegroundColor Cyan
    
    if ($response.success) {
        Write-Host "✅ Database vote endpoint is working!" -ForegroundColor Green
        if ($response.data) {
            Write-Host "   Previous vote: $($response.data.previous_vote)" -ForegroundColor Cyan
            Write-Host "   New vote: $($response.data.new_vote)" -ForegroundColor Cyan
            Write-Host "   Yes votes: $($response.data.yes_votes)" -ForegroundColor Cyan
            Write-Host "   No votes: $($response.data.no_votes)" -ForegroundColor Cyan
        }
    } else {
        Write-Host "❌ Database vote failed: $($response.message)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Database vote request failed:" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        try {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "   Response body: $responseBody" -ForegroundColor Red
        } catch {
            Write-Host "   Could not read response body" -ForegroundColor Red
        }
    }
}

# Test 2: Check if proposal exists and has vote counts
Write-Host "`n📊 Test 2: Checking proposal vote counts..." -ForegroundColor Yellow
try {
    $proposalResponse = Invoke-RestMethod -Uri "$baseUrl/api/proposals/1" -Method GET -Headers $headers
    
    if ($proposalResponse.success) {
        Write-Host "✅ Proposal data retrieved:" -ForegroundColor Green
        Write-Host "   Title: $($proposalResponse.data.title)" -ForegroundColor Cyan
        Write-Host "   Yes votes: $($proposalResponse.data.yes_votes)" -ForegroundColor Cyan
        Write-Host "   No votes: $($proposalResponse.data.no_votes)" -ForegroundColor Cyan
        Write-Host "   Active: $($proposalResponse.data.active_status)" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Failed to get proposal: $($proposalResponse.message)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Proposal request failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Check database health
Write-Host "`n🏥 Test 3: Database health check..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-RestMethod -Uri "$baseUrl/api/db/health" -Method GET -Headers $headers
    
    if ($healthResponse.database.connected) {
        Write-Host "✅ Database connection healthy!" -ForegroundColor Green
        Write-Host "   Message: $($healthResponse.database.message)" -ForegroundColor Cyan
        Write-Host "   Latency: $($healthResponse.database.latency)ms" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Database connection failed" -ForegroundColor Red
        Write-Host "   Message: $($healthResponse.database.message)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Database health check failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n📋 Test completed!" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. If database vote endpoint failed, run the SQL migration script" -ForegroundColor White
Write-Host "2. If proposal data shows 0 votes, the database functions may not exist" -ForegroundColor White
Write-Host "3. Check Supabase logs for detailed error messages" -ForegroundColor White
