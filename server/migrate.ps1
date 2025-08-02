# Ballerina Database Migration Script
# Similar to 'npx prisma migrate dev' for Prisma

Write-Host "🚀 Starting Ballerina Database Migration..." -ForegroundColor Green

# Check if Ballerina is installed
if (!(Get-Command bal -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Ballerina not found. Please install Ballerina first." -ForegroundColor Red
    exit 1
}

# Build the project
Write-Host "📦 Building Ballerina project..." -ForegroundColor Yellow
bal build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed. Please fix compilation errors." -ForegroundColor Red
    exit 1
}

# Run database setup
Write-Host "🗄️ Setting up database tables..." -ForegroundColor Yellow
Start-Process -FilePath "bal" -ArgumentList "run" -NoNewWindow

# Wait for server to start
Start-Sleep -Seconds 5

# Check if tables exist
Write-Host "🔍 Checking if tables exist..." -ForegroundColor Yellow
$tablesResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/db/tables" -Method GET -ErrorAction SilentlyContinue

if ($tablesResponse.tablesExist) {
    Write-Host "✅ Database tables already exist!" -ForegroundColor Green
} else {
    Write-Host "⚠️ Tables not found. Please create them manually via Supabase dashboard." -ForegroundColor Yellow
    Write-Host "📋 Instructions:" -ForegroundColor Cyan
    Write-Host "1. Go to https://supabase.com/dashboard" -ForegroundColor White
    Write-Host "2. Navigate to your project: hhnxsixgjcdhvzuwbmzf" -ForegroundColor White
    Write-Host "3. Go to SQL Editor" -ForegroundColor White
    Write-Host "4. Copy SQL from db/schema.bal functions" -ForegroundColor White
    Write-Host "5. Execute the SQL to create tables" -ForegroundColor White
}

# Stop the server
Get-Process | Where-Object {$_.ProcessName -eq "bal"} | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host "🎉 Migration process completed!" -ForegroundColor Green
