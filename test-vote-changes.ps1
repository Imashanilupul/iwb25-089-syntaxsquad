# Test script for vote change functionality
# This script tests the complete vote change scenario described by the user

Write-Host "🗳️ Testing Vote Change Functionality" -ForegroundColor Green
Write-Host "=====================================`n" -ForegroundColor Green

# Configuration
$baseUrl = "http://localhost:8080/api"
$proposalId = 1
$testWallet = "0x1234567890123456789012345678901234567890"  # Test wallet address

# Function to make API calls with error handling
function Invoke-ApiCall {
    param(
        [string]$Method,
        [string]$Url,
        [hashtable]$Body = $null,
        [string]$Description
    )
    
    try {
        Write-Host "📡 $Description..." -ForegroundColor Cyan
        
        $params = @{
            Method = $Method
            Uri = $Url
            ContentType = "application/json"
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json)
            Write-Host "📤 Request: $($params.Body)" -ForegroundColor Gray
        }
        
        $response = Invoke-RestMethod @params
        Write-Host "✅ Response: $($response | ConvertTo-Json -Depth 3)" -ForegroundColor Green
        return $response
    }
    catch {
        Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            $errorDetails = $_.Exception.Response | ConvertTo-Json -Depth 2
            Write-Host "📋 Error Details: $errorDetails" -ForegroundColor Yellow
        }
        return $null
    }
}

# Function to get current vote counts
function Get-ProposalCounts {
    param([int]$ProposalId)
    
    $proposal = Invoke-ApiCall -Method "GET" -Url "$baseUrl/proposals/$ProposalId" -Description "Getting current proposal data"
    
    if ($proposal -and $proposal.success -and $proposal.data) {
        $data = $proposal.data
        Write-Host "📊 Current Counts - Yes: $($data.yes_votes), No: $($data.no_votes)" -ForegroundColor Magenta
        return @{
            yes = $data.yes_votes
            no = $data.no_votes
        }
    }
    else {
        Write-Host "⚠️ Could not retrieve proposal data" -ForegroundColor Yellow
        return $null
    }
}

# Function to check user's current vote
function Get-UserVote {
    param([int]$ProposalId, [string]$WalletAddress)
    
    $currentVote = Invoke-ApiCall -Method "GET" -Url "$baseUrl/proposals/$ProposalId/vote/$WalletAddress" -Description "Checking user's current vote"
    
    if ($currentVote -and $currentVote.success -and $currentVote.data) {
        $vote = $currentVote.data.current_vote
        Write-Host "👤 User's current vote: $vote" -ForegroundColor Magenta
        return $vote
    }
    else {
        Write-Host "👤 User has not voted yet" -ForegroundColor Yellow
        return "none"
    }
}

# Function to cast a vote
function Cast-Vote {
    param([int]$ProposalId, [string]$VoteType, [string]$WalletAddress)
    
    $body = @{
        proposalId = $ProposalId
        voteType = $VoteType
        walletAddress = $WalletAddress
    }
    
    return Invoke-ApiCall -Method "POST" -Url "$baseUrl/proposals/vote" -Body $body -Description "Casting $VoteType vote"
}

Write-Host "🔧 Starting Test Scenario:" -ForegroundColor Yellow
Write-Host "1. Initial state: Yes=2, No=2" -ForegroundColor Yellow
Write-Host "2. User votes YES → Yes=3, No=2" -ForegroundColor Yellow  
Write-Host "3. User changes to NO → Yes=2, No=3" -ForegroundColor Yellow
Write-Host ""

# Step 1: Check if server is running
Write-Host "🚀 Step 1: Checking if server is running" -ForegroundColor Blue
$healthCheck = Invoke-ApiCall -Method "GET" -Url "$baseUrl/proposals" -Description "Health check - getting proposals list"

if (-not $healthCheck) {
    Write-Host "❌ Server appears to be down. Please start the Ballerina server first." -ForegroundColor Red
    Write-Host "   Run: cd server && bal run" -ForegroundColor Gray
    exit 1
}

Write-Host ""

# Step 2: Get initial state
Write-Host "🔍 Step 2: Getting initial proposal state" -ForegroundColor Blue
$initialCounts = Get-ProposalCounts -ProposalId $proposalId
if (-not $initialCounts) {
    Write-Host "❌ Cannot proceed without initial proposal data" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 3: Check user's current vote
Write-Host "👤 Step 3: Checking user's current vote status" -ForegroundColor Blue
$currentUserVote = Get-UserVote -ProposalId $proposalId -WalletAddress $testWallet
Write-Host ""

# Step 4: Cast first vote (YES)
Write-Host "🗳️ Step 4: Casting first vote (YES)" -ForegroundColor Blue
$firstVote = Cast-Vote -ProposalId $proposalId -VoteType "yes" -WalletAddress $testWallet

if ($firstVote -and $firstVote.success) {
    Write-Host "✅ First vote successful!" -ForegroundColor Green
    
    if ($firstVote.data) {
        $voteData = $firstVote.data
        Write-Host "📊 Vote Details:" -ForegroundColor Magenta
        Write-Host "   Previous vote: $($voteData.previous_vote)" -ForegroundColor Gray
        Write-Host "   New vote: $($voteData.new_vote)" -ForegroundColor Gray
        Write-Host "   Vote change: $($voteData.vote_change)" -ForegroundColor Gray
        Write-Host "   New counts - Yes: $($voteData.yes_votes), No: $($voteData.no_votes)" -ForegroundColor Gray
    }
}
else {
    Write-Host "❌ First vote failed" -ForegroundColor Red
}

Write-Host ""

# Step 5: Verify counts after first vote
Write-Host "📊 Step 5: Verifying counts after first vote" -ForegroundColor Blue
$countsAfterFirst = Get-ProposalCounts -ProposalId $proposalId
Write-Host ""

# Step 6: Change vote to NO
Write-Host "🔄 Step 6: Changing vote to NO" -ForegroundColor Blue
$secondVote = Cast-Vote -ProposalId $proposalId -VoteType "no" -WalletAddress $testWallet

if ($secondVote -and $secondVote.success) {
    Write-Host "✅ Vote change successful!" -ForegroundColor Green
    
    if ($secondVote.data) {
        $voteData = $secondVote.data
        Write-Host "📊 Vote Change Details:" -ForegroundColor Magenta
        Write-Host "   Previous vote: $($voteData.previous_vote)" -ForegroundColor Gray
        Write-Host "   New vote: $($voteData.new_vote)" -ForegroundColor Gray
        Write-Host "   Vote change: $($voteData.vote_change)" -ForegroundColor Gray
        Write-Host "   Final counts - Yes: $($voteData.yes_votes), No: $($voteData.no_votes)" -ForegroundColor Gray
        
        # Verify the expected behavior
        if ($voteData.previous_vote -eq "yes" -and $voteData.new_vote -eq "no" -and $voteData.vote_change -eq $true) {
            Write-Host "🎉 EXPECTED BEHAVIOR CONFIRMED!" -ForegroundColor Green
            Write-Host "   ✓ Previous vote was 'yes'" -ForegroundColor Green
            Write-Host "   ✓ New vote is 'no'" -ForegroundColor Green
            Write-Host "   ✓ Vote change detected" -ForegroundColor Green
            Write-Host "   ✓ Counts should be properly adjusted" -ForegroundColor Green
        }
        else {
            Write-Host "⚠️ Unexpected vote change behavior" -ForegroundColor Yellow
        }
    }
}
else {
    Write-Host "❌ Vote change failed" -ForegroundColor Red
}

Write-Host ""

# Step 7: Final verification
Write-Host "🏁 Step 7: Final verification" -ForegroundColor Blue
$finalCounts = Get-ProposalCounts -ProposalId $proposalId
$finalUserVote = Get-UserVote -ProposalId $proposalId -WalletAddress $testWallet

Write-Host ""
Write-Host "📋 SUMMARY REPORT" -ForegroundColor Green
Write-Host "=================" -ForegroundColor Green

if ($initialCounts -and $finalCounts) {
    Write-Host "📊 Count Changes:" -ForegroundColor Cyan
    Write-Host "   Initial: Yes=$($initialCounts.yes), No=$($initialCounts.no)" -ForegroundColor Gray
    Write-Host "   Final:   Yes=$($finalCounts.yes), No=$($finalCounts.no)" -ForegroundColor Gray
    
    $yesChange = $finalCounts.yes - $initialCounts.yes
    $noChange = $finalCounts.no - $initialCounts.no
    
    Write-Host "   Change:  Yes=$yesChange, No=$noChange" -ForegroundColor Gray
    
    # Expected behavior: If we did the complete cycle (none → yes → no), 
    # the net effect should be: Yes unchanged, No +1
    Write-Host ""
    Write-Host "🔍 Expected vs Actual:" -ForegroundColor Cyan
    
    if ($currentUserVote -eq "none") {
        # User had no previous vote, so yes should be unchanged, no should be +1
        $expectedYes = $initialCounts.yes
        $expectedNo = $initialCounts.no + 1
        
        if ($finalCounts.yes -eq $expectedYes -and $finalCounts.no -eq $expectedNo) {
            Write-Host "   ✅ PERFECT! Vote change working correctly" -ForegroundColor Green
            Write-Host "   ✅ Yes count unchanged: $($finalCounts.yes)" -ForegroundColor Green
            Write-Host "   ✅ No count increased by 1: $($finalCounts.no)" -ForegroundColor Green
        }
        else {
            Write-Host "   ❌ Vote change not working correctly" -ForegroundColor Red
            Write-Host "   Expected: Yes=$expectedYes, No=$expectedNo" -ForegroundColor Red
            Write-Host "   Actual:   Yes=$($finalCounts.yes), No=$($finalCounts.no)" -ForegroundColor Red
        }
    }
    else {
        Write-Host "   ℹ️ User had previous vote: $currentUserVote" -ForegroundColor Yellow
        Write-Host "   ℹ️ Results may vary based on initial state" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "👤 Final user vote: $finalUserVote" -ForegroundColor Cyan

Write-Host ""
Write-Host "🏆 Test completed! Check the results above to verify vote change functionality." -ForegroundColor Green
