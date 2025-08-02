# SQL Extractor Script for Ballerina Schema
# Extracts pure SQL from schema.bal file

param(
    [string]$InputFile = "db\schema.bal",
    [string]$OutputFile = "database_migration.sql"
)

Write-Host "🔧 Extracting SQL from Ballerina schema..." -ForegroundColor Green

if (!(Test-Path $InputFile)) {
    Write-Host "❌ Input file not found: $InputFile" -ForegroundColor Red
    exit 1
}

$content = Get-Content $InputFile -Raw
$sqlStatements = @()

# Add header
$sqlStatements += "-- Database Migration SQL for Transparent Governance Platform"
$sqlStatements += "-- Generated from $InputFile on $(Get-Date)"
$sqlStatements += "-- Copy and paste this entire content into Supabase SQL Editor"
$sqlStatements += ""

# Extract SQL from each function
$functions = @(
    "createUsersTable",
    "createCategoriesTable", 
    "createProjectsTable",
    "createTransactionsTable",
    "createProposalsTable",
    "createPoliciesTable",
    "createPolicyCommentsTable",
    "createReportsTable",
    "createPetitionsTable",
    "createPetitionActivitiesTable"
)

foreach ($func in $functions) {
    Write-Host "📋 Extracting SQL from $func..." -ForegroundColor Yellow
    
    # Find the function and extract SQL between backticks
    $pattern = "function $func.*?``(.*?)``"
    $regexMatches = [regex]::Matches($content, $pattern, [System.Text.RegularExpressions.RegexOptions]::Singleline)
    
    if ($regexMatches.Count -gt 0) {
        $sql = $regexMatches[0].Groups[1].Value
        # Clean up the SQL
        $sql = $sql -replace '\s+', ' '
        $sql = $sql.Trim()
        
        # Add comment
        $tableName = $func -replace "create|Table", ""
        $sqlStatements += "-- Create $tableName table"
        $sqlStatements += $sql + ";"
        $sqlStatements += ""
    }
}

# Add verification query
$sqlStatements += "-- Verify tables were created"
$sqlStatements += @"
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'users', 'categories', 'projects', 'transactions', 
    'proposals', 'policies', 'policy_comments', 
    'reports', 'petitions', 'petition_activities'
)
ORDER BY table_name;
"@

# Write to output file
$sqlStatements -join "`n" | Out-File -FilePath $OutputFile -Encoding UTF8

Write-Host "✅ SQL extracted successfully to: $OutputFile" -ForegroundColor Green
Write-Host "📋 You can now copy the content of $OutputFile to Supabase SQL Editor" -ForegroundColor Cyan
