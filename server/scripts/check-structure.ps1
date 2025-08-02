# Quick Project Check Script
# This script verifies that the project structure is properly organized

Write-Host "Checking Transparent Governance Platform Structure..." -ForegroundColor Cyan

# Check main files
$mainFiles = @("main.bal", "Config.toml", "Ballerina.toml", "Dependencies.toml")
Write-Host "`nMain Files:" -ForegroundColor Yellow
foreach ($file in $mainFiles) {
    if (Test-Path $file) {
        Write-Host "  [OK] $file" -ForegroundColor Green
    } else {
        Write-Host "  [MISSING] $file" -ForegroundColor Red
    }
}

# Check directories
$directories = @("config", "db", "services", "routes", "docs", "scripts", "tests", "utils", "target")
Write-Host "`nDirectories:" -ForegroundColor Yellow
foreach ($dir in $directories) {
    if (Test-Path $dir -PathType Container) {
        $fileCount = (Get-ChildItem $dir -File).Count
        Write-Host "  [OK] $dir/ ($fileCount files)" -ForegroundColor Green
    } else {
        Write-Host "  [MISSING] $dir/" -ForegroundColor Red
    }
}

# Check configuration
Write-Host "`nConfiguration:" -ForegroundColor Yellow
if (Test-Path "Config.toml") {
    $config = Get-Content "Config.toml" -Raw
    if ($config -match "port\s*=") {
        Write-Host "  [OK] Port configuration found" -ForegroundColor Green
    }
    if ($config -match "supabaseUrl\s*=") {
        Write-Host "  [OK] Supabase URL configuration found" -ForegroundColor Green
    }
    if ($config -match "supabaseServiceRoleKey\s*=") {
        Write-Host "  [OK] Service role key configuration found" -ForegroundColor Green
    }
} else {
    Write-Host "  [MISSING] Config.toml not found" -ForegroundColor Red
}

# Check build status
Write-Host "`nBuild Status:" -ForegroundColor Yellow
if (Test-Path "target/bin/server_bal.jar") {
    Write-Host "  [OK] Project builds successfully" -ForegroundColor Green
} else {
    Write-Host "  [INFO] Project not built yet (run 'bal build')" -ForegroundColor Yellow
}

# Check documentation
Write-Host "`nDocumentation:" -ForegroundColor Yellow
$docFiles = @("README.md", "docs/DEPLOYMENT.md")
foreach ($file in $docFiles) {
    if (Test-Path $file) {
        Write-Host "  [OK] $file" -ForegroundColor Green
    } else {
        Write-Host "  [MISSING] $file" -ForegroundColor Red
    }
}

Write-Host "`nProject structure check complete!" -ForegroundColor Cyan
Write-Host "To start the server: bal run" -ForegroundColor Blue
Write-Host "To build the project: bal build" -ForegroundColor Blue
Write-Host "To test endpoints: curl http://localhost:8080/api/health" -ForegroundColor Blue
