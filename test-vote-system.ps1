# Test Vote Change System - Run after applying the database fix
# This script tests the complete vote change flow

try {
    Write-Output "🗳️ Testing Proposal Voting System"
    Write-Output "=================================="
    
    $headers = @{
        'Content-Type' = 'application/json'
        'Origin' = 'http://localhost:3000'
    }
    
    # Test 1: Vote YES on proposal 1
    Write-Output "`n📊 Test 1: Voting YES on proposal 1"
    $body1 = @{
        proposalId = 1
        voteType = "yes"
        walletAddress = "0x1234567890123456789012345678901234567890"
    } | ConvertTo-Json
    
    $response1 = Invoke-WebRequest -Uri "http://localhost:8080/api/proposals/vote" -Method POST -Headers $headers -Body $body1 -UseBasicParsing
    Write-Output "Status: $($response1.StatusCode)"
    $result1 = $response1.Content | ConvertFrom-Json
    Write-Output "Result: $($result1.message)"
    Write-Output "Vote counts: Yes=$($result1.data.yes_votes), No=$($result1.data.no_votes)"
    
    # Test 2: Change vote to NO (same wallet)
    Write-Output "`n📊 Test 2: Changing vote to NO (same wallet)"
    $body2 = @{
        proposalId = 1
        voteType = "no"
        walletAddress = "0x1234567890123456789012345678901234567890"
    } | ConvertTo-Json
    
    $response2 = Invoke-WebRequest -Uri "http://localhost:8080/api/proposals/vote" -Method POST -Headers $headers -Body $body2 -UseBasicParsing
    Write-Output "Status: $($response2.StatusCode)"
    $result2 = $response2.Content | ConvertFrom-Json
    Write-Output "Result: $($result2.message)"
    Write-Output "Vote change: $($result2.data.previous_vote) → $($result2.data.new_vote)"
    Write-Output "Vote counts: Yes=$($result2.data.yes_votes), No=$($result2.data.no_votes)"
    
    # Test 3: New voter votes YES
    Write-Output "`n📊 Test 3: New voter votes YES"
    $body3 = @{
        proposalId = 1
        voteType = "yes"
        walletAddress = "0xABCDEF1234567890123456789012345678901234"
    } | ConvertTo-Json
    
    $response3 = Invoke-WebRequest -Uri "http://localhost:8080/api/proposals/vote" -Method POST -Headers $headers -Body $body3 -UseBasicParsing
    Write-Output "Status: $($response3.StatusCode)"
    $result3 = $response3.Content | ConvertFrom-Json
    Write-Output "Result: $($result3.message)"
    Write-Output "Vote counts: Yes=$($result3.data.yes_votes), No=$($result3.data.no_votes)"
    
    # Test 4: Check final proposal state
    Write-Output "`n📊 Test 4: Final proposal state verification"
    $checkResponse = Invoke-WebRequest -Uri "http://localhost:8080/api/proposals/1" -Headers $headers -UseBasicParsing
    $finalProposal = $checkResponse.Content | ConvertFrom-Json
    Write-Output "Final vote counts: Yes=$($finalProposal.data.yes_votes), No=$($finalProposal.data.no_votes)"
    
    Write-Output "`n✅ All tests completed!"
    Write-Output "Expected final result: Yes=1, No=1 (one voter changed from yes to no, another voted yes)"
    
} catch {
    Write-Output "❌ Test failed: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $responseBody = $reader.ReadToEnd()
        Write-Output "Response Body: $responseBody"
    }
}
