# Ballerina Database Setup Script
# Similar to 'npx prisma db push' for Prisma

param(
    [string]$Action = "setup"
)

Write-Host "🗄️ Ballerina Database Setup Tool" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green

switch ($Action.ToLower()) {
    "setup" {
        Write-Host "📋 Setting up database tables..." -ForegroundColor Yellow
        
        # Build and run to setup tables
        bal build
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Project built successfully" -ForegroundColor Green
            Write-Host "🚀 Starting server to initialize database..." -ForegroundColor Yellow
            bal run
        } else {
            Write-Host "❌ Build failed" -ForegroundColor Red
        }
    }
    
    "check" {
        Write-Host "🔍 Checking database tables..." -ForegroundColor Yellow
        
        # Start server temporarily to check tables
        $job = Start-Job -ScriptBlock { Set-Location $using:PWD; bal run }
        Start-Sleep -Seconds 8
        
        try {
            $response = Invoke-RestMethod -Uri "http://localhost:8080/api/db/tables" -Method GET
            if ($response.tablesExist) {
                Write-Host "✅ All database tables exist" -ForegroundColor Green
            } else {
                Write-Host "⚠️ Some tables are missing" -ForegroundColor Yellow
            }
        } catch {
            Write-Host "❌ Could not connect to database" -ForegroundColor Red
        }
        
        Stop-Job $job
        Remove-Job $job
    }
    
    "reset" {
        Write-Host "🔄 Database reset functionality" -ForegroundColor Yellow
        Write-Host "⚠️ For safety, please reset manually via Supabase dashboard:" -ForegroundColor Yellow
        Write-Host "1. Go to https://supabase.com/dashboard" -ForegroundColor White
        Write-Host "2. Navigate to your project" -ForegroundColor White
        Write-Host "3. Go to SQL Editor" -ForegroundColor White
        Write-Host "4. Drop tables manually if needed" -ForegroundColor White
    }
    
    "generate" {
        Write-Host "🔧 Generating Ballerina types..." -ForegroundColor Yellow
        Write-Host "ℹ️ Ballerina types are defined in:" -ForegroundColor Cyan
        Write-Host "   - models/usr-model.bal" -ForegroundColor White
        Write-Host "   - db/schema.bal" -ForegroundColor White
        Write-Host "✅ No generation needed - types are manually maintained" -ForegroundColor Green
    }
    
    default {
        Write-Host "📖 Available commands:" -ForegroundColor Cyan
        Write-Host "  .\database.ps1 setup    - Setup database tables" -ForegroundColor White
        Write-Host "  .\database.ps1 check    - Check if tables exist" -ForegroundColor White
        Write-Host "  .\database.ps1 reset    - Instructions for database reset" -ForegroundColor White
        Write-Host "  .\database.ps1 generate - Information about type generation" -ForegroundColor White
    }
}
