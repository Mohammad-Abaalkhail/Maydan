# Staging Deployment Script (PowerShell)
# Usage: .\scripts\deploy-staging.ps1

$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting staging deployment..." -ForegroundColor Green

# Generate random basic auth credentials
$stagingUser = -join ((48..57) + (97..122) | Get-Random -Count 8 | ForEach-Object {[char]$_})
$stagingPass = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 16 | ForEach-Object {[char]$_})

Write-Host "📝 Generated staging credentials:" -ForegroundColor Yellow
Write-Host "   Username: $stagingUser"
Write-Host "   Password: $stagingPass"
Write-Host ""
Write-Host "⚠️  Save these credentials securely!" -ForegroundColor Red

# Create staging auth file
New-Item -ItemType Directory -Force -Path "nginx/auth" | Out-Null
$htpasswdContent = "$stagingUser`:`$apr1`$$(New-Guid | ForEach-Object { $_.ToString().Substring(0,8) })$(ConvertTo-SecureString $stagingPass -AsPlainText -Force | ConvertFrom-SecureString | ForEach-Object { $_.Substring(0,16) })"
Set-Content -Path "nginx/auth/.htpasswd" -Value $htpasswdContent

Write-Host "✅ Created staging auth file" -ForegroundColor Green

# Pull latest images
Write-Host "📥 Pulling latest Docker images..." -ForegroundColor Cyan
docker compose -f docker-compose.staging.yml pull

# Start services
Write-Host "🚀 Starting services..." -ForegroundColor Cyan
docker compose -f docker-compose.staging.yml up -d

# Wait for services
Write-Host "⏳ Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Run migrations
Write-Host "🗄️  Running database migrations..." -ForegroundColor Cyan
docker compose -f docker-compose.staging.yml exec -T backend npx prisma migrate deploy

# Health check
Write-Host "🏥 Running health check..." -ForegroundColor Cyan
docker compose -f docker-compose.staging.yml exec -T backend node scripts/healthcheck.js

Write-Host ""
Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Staging Information:" -ForegroundColor Yellow
Write-Host "   URL: http://staging-url/"
Write-Host "   Username: $stagingUser"
Write-Host "   Password: $stagingPass"

