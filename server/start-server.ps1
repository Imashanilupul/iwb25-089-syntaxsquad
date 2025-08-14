# Start the Ballerina server
Write-Host "🚀 Starting Transparent Governance Platform Backend Server..." -ForegroundColor Green
Write-Host ""

# Check if Ballerina is installed
try {
    $ballerinaVersion = bal version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Ballerina is installed" -ForegroundColor Green
    } else {
        throw "Ballerina not found"
    }
} catch {
    Write-Host "❌ Ballerina is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Ballerina from: https://ballerina.io/downloads/" -ForegroundColor Yellow
    exit 1
}

# Change to server directory
Set-Location $PSScriptRoot

# Check if Config.toml exists
if (!(Test-Path "Config.toml")) {
    Write-Host "❌ Config.toml not found!" -ForegroundColor Red
    Write-Host "Please ensure you have the Config.toml file with proper database configuration." -ForegroundColor Yellow
    exit 1
}

Write-Host "📋 Configuration found" -ForegroundColor Green
Write-Host "🔗 Backend will be available at: http://localhost:8080" -ForegroundColor Cyan
Write-Host "🗄️  Using Supabase database" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Available API endpoints:" -ForegroundColor Yellow
Write-Host "  • GET  /api/health - Health check" -ForegroundColor Gray
Write-Host "  • GET  /api/policies - List all policies" -ForegroundColor Gray
Write-Host "  • GET  /api/policycomments - List all policy comments" -ForegroundColor Gray
Write-Host "  • POST /api/policycomments - Create new comment" -ForegroundColor Gray
Write-Host ""

try {
    Write-Host "⚡ Starting server..." -ForegroundColor Yellow
    bal run
} catch {
    Write-Host "❌ Failed to start server: $_" -ForegroundColor Red
    exit 1
}
