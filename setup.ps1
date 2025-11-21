# Setup script for Vendor Booking System (PowerShell)

Write-Host "Setting up Vendor Booking System..." -ForegroundColor Cyan

# Check if .env exists
if (-not (Test-Path .env)) {
    if (Test-Path .env.example) {
        Write-Host "Creating .env file from .env.example..." -ForegroundColor Yellow
        Copy-Item .env.example .env
        Write-Host "Please edit .env and add your Stripe keys!" -ForegroundColor Yellow
    } else {
        Write-Host "Warning: .env.example not found. Creating basic .env file..." -ForegroundColor Yellow
        @"
# Django Settings
DJANGO_SECRET_KEY=your-secret-key-here-change-in-production
DEBUG=True

# Database Settings
DB_NAME=vendor_booking
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432

# Stripe Settings
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Frontend API URL
NEXT_PUBLIC_API_URL=http://localhost:8000/api
"@ | Out-File -FilePath .env -Encoding utf8
        Write-Host "Please edit .env and add your Stripe keys!" -ForegroundColor Yellow
    }
} else {
    Write-Host ".env file already exists" -ForegroundColor Green
}

# Check if Docker is running
try {
    docker info | Out-Null
} catch {
    Write-Host "Docker is not running. Please start Docker and try again." -ForegroundColor Red
    exit 1
}

Write-Host "Starting Docker containers..." -ForegroundColor Cyan
docker compose up -d

Write-Host "Waiting for database to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "Running migrations..." -ForegroundColor Cyan
docker compose exec backend python manage.py migrate

Write-Host "Seeding database with example data..." -ForegroundColor Cyan
docker compose exec backend python manage.py seed_data

Write-Host ""
Write-Host "Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Edit .env and add your Stripe API keys"
Write-Host "2. Create a superuser: docker compose exec backend python manage.py createsuperuser"
Write-Host "3. Access the application:"
Write-Host "   - Frontend: http://localhost:3000"
Write-Host "   - Backend API: http://localhost:8000/api"
Write-Host "   - Admin: http://localhost:8000/admin"
Write-Host ""
