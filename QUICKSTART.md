# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1. Prerequisites
- Docker Desktop installed and running
- Stripe account (free test account works)

### 2. Setup

**Windows:**
```powershell
.\setup.ps1
```

**Mac/Linux:**
```bash
chmod +x setup.sh
./setup.sh
```

**Or manually:**
```bash
# Copy environment file
cp .env.example .env

# Edit .env and add your Stripe keys
# Get them from: https://dashboard.stripe.com/test/apikeys

# Start services
docker compose up -d

# Run migrations
docker compose exec backend python manage.py migrate

# Seed example data
docker compose exec backend python manage.py seed_data

# Create admin user
docker compose exec backend python manage.py createsuperuser
```

### 3. Access the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000/api
- **Admin Panel:** http://localhost:8000/admin

### 4. Test the Flow

1. Go to http://localhost:3000
2. Click on a highlighted date (event)
3. Click "Reserve This Spot" on any available booth
4. Fill out the vendor form
5. Use Stripe test card: `4242 4242 4242 4242`
6. Complete payment
7. See confirmation page

### 5. Stripe Webhook Setup (Local Development)

For local webhook testing, use Stripe CLI:

```bash
# Install Stripe CLI: https://stripe.com/docs/stripe-cli
stripe listen --forward-to localhost:8000/api/stripe-webhook/
```

Copy the webhook signing secret and add it to `.env`:
```
STRIPE_WEBHOOK_SECRET=whsec_...
```

## 🛠️ Common Commands

```bash
# View logs
docker compose logs -f

# Stop services
docker compose down

# Rebuild after code changes
docker compose up --build

# Access backend shell
docker compose exec backend bash

# Access database
docker compose exec db psql -U postgres -d vendor_booking
```

## 📝 Next Steps

1. Add your Stripe API keys to `.env`
2. Create events and booth slots via Django admin
3. Customize the UI in `frontend/app/`
4. Add email notifications (see TODO in `backend/bookings/views.py`)

