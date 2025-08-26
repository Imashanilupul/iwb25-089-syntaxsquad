# Test Database Vote System
# This script tests the voting database update functionality

Write-Host "🔍 Testing Database Vote System" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan

# Test configuration
$baseUrl = "http://localhost:8080"
$testProposalId = 1
$testWalletAddress = "0x1234567890123456789012345678901234567890"

Write-Host "`n1. Testing database vote endpoint..." -ForegroundColor Yellow

try {
    $votePayload = @{
        proposalId = $testProposalId
        voteType = "yes"
        walletAddress = $testWalletAddress
    } | ConvertTo-Json

    Write-Host "Sending vote payload: $votePayload" -ForegroundColor Gray

    $response = Invoke-RestMethod -Uri "$baseUrl/api/proposals/vote" -Method POST -Body $votePayload -ContentType "application/json" -ErrorAction Stop
    
    Write-Host "✅ Database vote endpoint responded successfully" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json -Depth 3)" -ForegroundColor Gray
    
} catch {
    Write-Host "❌ Database vote endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $errorDetails = $_.Exception.Response | ConvertTo-Json -Depth 3
        Write-Host "Error details: $errorDetails" -ForegroundColor Red
    }
}

Write-Host "`n2. Checking proposal data..." -ForegroundColor Yellow

try {
    $proposalResponse = Invoke-RestMethod -Uri "$baseUrl/api/proposals/$testProposalId" -Method GET -ErrorAction Stop
    
    Write-Host "✅ Retrieved proposal data" -ForegroundColor Green
    Write-Host "Proposal ID: $($proposalResponse.id)" -ForegroundColor Gray
    Write-Host "Title: $($proposalResponse.title)" -ForegroundColor Gray
    Write-Host "Yes votes: $($proposalResponse.yes_votes)" -ForegroundColor Gray
    Write-Host "No votes: $($proposalResponse.no_votes)" -ForegroundColor Gray
    Write-Host "Total votes: $($proposalResponse.total_votes)" -ForegroundColor Gray
    
} catch {
    Write-Host "❌ Failed to retrieve proposal data: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n3. Testing database health..." -ForegroundColor Yellow

try {
    $healthResponse = Invoke-RestMethod -Uri "$baseUrl/health" -Method GET -ErrorAction Stop
    Write-Host "✅ Database connection healthy" -ForegroundColor Green
} catch {
    Write-Host "❌ Database health check failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n📋 Test completed!" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. If database vote endpoint failed, run the SQL migration script" -ForegroundColor White
Write-Host "2. If proposal data shows 0 votes, the database functions may not exist" -ForegroundColor White
Write-Host "3. Check Supabase logs for detailed error messages" -ForegroundColor White
