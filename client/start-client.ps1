# Start the Next.js client application
Write-Host "🌐 Starting Transparent Governance Platform Frontend Client..." -ForegroundColor Green
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Node.js is installed: $nodeVersion" -ForegroundColor Green
    } else {
        throw "Node.js not found"
    }
} catch {
    Write-Host "❌ Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js from: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Check if pnpm is installed
try {
    $pnpmVersion = pnpm --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ pnpm is installed: $pnpmVersion" -ForegroundColor Green
    } else {
        throw "pnpm not found"
    }
} catch {
    Write-Host "❌ pnpm is not installed" -ForegroundColor Red
    Write-Host "Installing pnpm..." -ForegroundColor Yellow
    npm install -g pnpm
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install pnpm" -ForegroundColor Red
        exit 1
    }
}

# Change to client directory
Set-Location $PSScriptRoot

# Check if package.json exists
if (!(Test-Path "package.json")) {
    Write-Host "❌ package.json not found!" -ForegroundColor Red
    Write-Host "Please ensure you are in the client directory." -ForegroundColor Yellow
    exit 1
}

# Check if .env.local exists
if (!(Test-Path ".env.local")) {
    Write-Host "⚠️  .env.local not found. Using default configuration." -ForegroundColor Yellow
} else {
    Write-Host "📋 Environment configuration found" -ForegroundColor Green
}

# Install dependencies if node_modules doesn't exist
if (!(Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    pnpm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
}

Write-Host "🔗 Frontend will be available at: http://localhost:3000" -ForegroundColor Cyan
Write-Host "🔌 Backend API endpoint: http://localhost:8080" -ForegroundColor Cyan
Write-Host ""
Write-Host "📄 Available pages:" -ForegroundColor Yellow
Write-Host "  • http://localhost:3000 - Home page" -ForegroundColor Gray
Write-Host "  • Policy Hub with real database integration" -ForegroundColor Gray
Write-Host ""

try {
    Write-Host "⚡ Starting development server..." -ForegroundColor Yellow
    pnpm dev
} catch {
    Write-Host "❌ Failed to start development server: $_" -ForegroundColor Red
    exit 1
}
