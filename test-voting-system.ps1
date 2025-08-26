#!/usr/bin/env pwsh
# Test script for the voting system
# Run this script to test the voting API endpoints

$baseUrl = "http://localhost:8080"
$headers = @{
    "Content-Type" = "application/json"
}

Write-Host "🗳️ Testing Voting System API" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

# Test 1: Get all proposals
Write-Host "`n📋 Test 1: Getting all proposals..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/proposals" -Method GET -Headers $headers
    if ($response.success) {
        Write-Host "✅ Successfully retrieved $($response.count) proposals" -ForegroundColor Green
        
        # Find an active proposal for testing
        $activeProposal = $response.data | Where-Object { $_.active_status -eq $true } | Select-Object -First 1
        
        if ($activeProposal) {
            $proposalId = $activeProposal.id
            Write-Host "📌 Using proposal ID $proposalId for voting tests" -ForegroundColor Blue
            
            # Test 2: Vote YES
            Write-Host "`n🗳️ Test 2: Voting YES on proposal $proposalId..." -ForegroundColor Yellow
            $votePayload = @{
                proposalId = $proposalId
                voteType = "yes"
                walletAddress = "0x1234567890123456789012345678901234567890"
            } | ConvertTo-Json
            
            try {
                $voteResponse = Invoke-RestMethod -Uri "$baseUrl/api/proposals/vote" -Method POST -Headers $headers -Body $votePayload
                if ($voteResponse.success) {
                    Write-Host "✅ YES vote recorded successfully!" -ForegroundColor Green
                    Write-Host "   Previous vote: $($voteResponse.data.previous_vote)" -ForegroundColor Cyan
                    Write-Host "   New vote: $($voteResponse.data.new_vote)" -ForegroundColor Cyan
                    Write-Host "   Yes votes: $($voteResponse.data.yes_votes)" -ForegroundColor Cyan
                    Write-Host "   No votes: $($voteResponse.data.no_votes)" -ForegroundColor Cyan
                } else {
                    Write-Host "❌ YES vote failed: $($voteResponse.message)" -ForegroundColor Red
                }
            } catch {
                Write-Host "❌ YES vote request failed: $($_.Exception.Message)" -ForegroundColor Red
            }
            
            # Test 3: Change vote to NO
            Write-Host "`n🔄 Test 3: Changing vote to NO on proposal $proposalId..." -ForegroundColor Yellow
            $changeVotePayload = @{
                proposalId = $proposalId
                voteType = "no"
                walletAddress = "0x1234567890123456789012345678901234567890"
            } | ConvertTo-Json
            
            try {
                $changeResponse = Invoke-RestMethod -Uri "$baseUrl/api/proposals/vote" -Method POST -Headers $headers -Body $changeVotePayload
                if ($changeResponse.success) {
                    Write-Host "✅ Vote change recorded successfully!" -ForegroundColor Green
                    Write-Host "   Previous vote: $($changeResponse.data.previous_vote)" -ForegroundColor Cyan
                    Write-Host "   New vote: $($changeResponse.data.new_vote)" -ForegroundColor Cyan
                    Write-Host "   Vote changed: $($changeResponse.data.vote_change)" -ForegroundColor Cyan
                    Write-Host "   Yes votes: $($changeResponse.data.yes_votes)" -ForegroundColor Cyan
                    Write-Host "   No votes: $($changeResponse.data.no_votes)" -ForegroundColor Cyan
                } else {
                    Write-Host "❌ Vote change failed: $($changeResponse.message)" -ForegroundColor Red
                }
            } catch {
                Write-Host "❌ Vote change request failed: $($_.Exception.Message)" -ForegroundColor Red
            }
            
            # Test 4: Get user's current vote
            Write-Host "`n🔍 Test 4: Getting user's current vote..." -ForegroundColor Yellow
            try {
                $userVoteResponse = Invoke-RestMethod -Uri "$baseUrl/api/proposals/$proposalId/vote/0x1234567890123456789012345678901234567890" -Method GET -Headers $headers
                if ($userVoteResponse.success) {
                    Write-Host "✅ User vote retrieved successfully!" -ForegroundColor Green
                    Write-Host "   Current vote: $($userVoteResponse.data.current_vote)" -ForegroundColor Cyan
                } else {
                    Write-Host "❌ Get user vote failed: $($userVoteResponse.message)" -ForegroundColor Red
                }
            } catch {
                Write-Host "❌ Get user vote request failed: $($_.Exception.Message)" -ForegroundColor Red
            }
            
            # Test 5: Verify updated proposal
            Write-Host "`n📊 Test 5: Verifying updated proposal data..." -ForegroundColor Yellow
            try {
                $updatedProposal = Invoke-RestMethod -Uri "$baseUrl/api/proposals/$proposalId" -Method GET -Headers $headers
                if ($updatedProposal.success) {
                    Write-Host "✅ Proposal data retrieved successfully!" -ForegroundColor Green
                    Write-Host "   Title: $($updatedProposal.data.title)" -ForegroundColor Cyan
                    Write-Host "   Yes votes: $($updatedProposal.data.yes_votes)" -ForegroundColor Cyan
                    Write-Host "   No votes: $($updatedProposal.data.no_votes)" -ForegroundColor Cyan
                    Write-Host "   Total votes: $($updatedProposal.data.yes_votes + $updatedProposal.data.no_votes)" -ForegroundColor Cyan
                } else {
                    Write-Host "❌ Get proposal failed: $($updatedProposal.message)" -ForegroundColor Red
                }
            } catch {
                Write-Host "❌ Get proposal request failed: $($_.Exception.Message)" -ForegroundColor Red
            }
            
        } else {
            Write-Host "❌ No active proposals found for testing" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ Failed to get proposals: $($response.message)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Get proposals request failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Make sure the Ballerina server is running on port 8080" -ForegroundColor Yellow
}

# Test 6: Database health check
Write-Host "`n🏥 Test 6: Database health check..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-RestMethod -Uri "$baseUrl/api/db/health" -Method GET -Headers $headers
    if ($healthResponse.database.connected) {
        Write-Host "✅ Database connection healthy!" -ForegroundColor Green
        Write-Host "   Latency: $($healthResponse.database.latency)ms" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Database connection failed" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Database health check failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎉 Voting system test completed!" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
