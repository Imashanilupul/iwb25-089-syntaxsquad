# Run voting migration script
# This script adds likes/dislikes fields to reports and creates user_votes table

Write-Host "Running voting migration..." -ForegroundColor Green

# Read database configuration
$configPath = "..\config\database.toml"
if (Test-Path $configPath) {
    $config = Get-Content $configPath | ConvertFrom-Toml
    $host = $config.database.host
    $port = $config.database.port
    $database = $config.database.name
    $user = $config.database.user
    $password = $config.database.password
} else {
    Write-Host "Database config not found. Using default values." -ForegroundColor Yellow
    $host = "localhost"
    $port = "5432"
    $database = "governance_platform"
    $user = "postgres"
    $password = "password"
}

# SQL file path
$sqlFile = "add_voting_fields.sql"

if (Test-Path $sqlFile) {
    Write-Host "Running SQL migration from $sqlFile..." -ForegroundColor Blue
    
    # Run the migration using psql
    try {
        $env:PGPASSWORD = $password
        $result = psql -h $host -p $port -U $user -d $database -f $sqlFile 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Migration completed successfully!" -ForegroundColor Green
            Write-Host "Added likes/dislikes fields to reports table" -ForegroundColor Green
            Write-Host "Created user_votes table for tracking votes" -ForegroundColor Green
            Write-Host "Updated existing reports with default values" -ForegroundColor Green
        } else {
            Write-Host "Migration failed with exit code: $LASTEXITCODE" -ForegroundColor Red
            Write-Host "Error output: $result" -ForegroundColor Red
        }
    } catch {
        Write-Host "Error running migration: $_" -ForegroundColor Red
    } finally {
        Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
    }
} else {
    Write-Host "SQL migration file not found: $sqlFile" -ForegroundColor Red
}

Write-Host "Migration script completed." -ForegroundColor Green
