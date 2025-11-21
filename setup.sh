#!/bin/bash

# Setup script for Vendor Booking System

echo "🚀 Setting up Vendor Booking System..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "⚠️  Please edit .env and add your Stripe keys!"
else
    echo "✅ .env file already exists"
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

echo "🐳 Starting Docker containers..."
docker compose up -d

echo "⏳ Waiting for database to be ready..."
sleep 5

echo "📦 Running migrations..."
docker compose exec backend python manage.py migrate

echo "🌱 Seeding database with example data..."
docker compose exec backend python manage.py seed_data

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Edit .env and add your Stripe API keys"
echo "2. Create a superuser: docker compose exec backend python manage.py createsuperuser"
echo "3. Access the application:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend API: http://localhost:8000/api"
echo "   - Admin: http://localhost:8000/admin"
echo ""

