# Vendor Event Booking System

A full-stack web application for booking vendor booths at market events. Vendors can browse events on a calendar, view available booth spots, and reserve them with a simple form and Stripe payment integration.

## 🎯 Features

- ✅ **Calendar View** - Browse events by month with highlighted dates
- ✅ **Event Details** - View event information and available booth spots
- ✅ **No Account Required** - Vendors can book without creating an account
- ✅ **Stripe Integration** - Secure payment processing via Stripe Checkout
- ✅ **Admin Interface** - Django admin for managing events and booth slots
- ✅ **Webhook Support** - Automatic booking confirmation via Stripe webhooks

## 🏗️ Tech Stack

### Frontend
- **Next.js 14** (App Router)
- **TypeScript**
- **TailwindCSS**

### Backend
- **Django 4.2**
- **Django REST Framework**
- **PostgreSQL**
- **Stripe API**

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- Stripe account (for payment processing)

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd HowBazar-Vendor-Booking
   ```

2. **Create environment file**
   ```bash
   cp .env.example .env
   ```

3. **Configure Stripe**
   - Sign up at [stripe.com](https://stripe.com)
   - Get your API keys from the [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
   - Add them to `.env`:
     ```
     STRIPE_SECRET_KEY=sk_test_...
     STRIPE_PUBLISHABLE_KEY=pk_test_...
     ```

4. **Set up Stripe Webhook** (for production)
   - In Stripe Dashboard, go to Developers → Webhooks
   - Add endpoint: `http://your-domain.com/api/stripe/webhook`
   - Copy the webhook signing secret to `.env`:
     ```
     STRIPE_WEBHOOK_SECRET=whsec_...
     ```

5. **Start the application**
   ```bash
   docker compose up
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000/api
   - Django Admin: http://localhost:8000/admin
     - Create a superuser: `docker compose exec backend python manage.py createsuperuser`

7. **Seed example data** (optional)
   ```bash
   docker compose exec backend python manage.py seed_data
   ```

## 📁 Project Structure

```
.
├── backend/                 # Django backend
│   ├── bookings/           # Main app
│   │   ├── models.py      # Event, BoothSlot, VendorBooking models
│   │   ├── views.py       # API views
│   │   ├── serializers.py # DRF serializers
│   │   ├── admin.py       # Django admin configuration
│   │   └── management/    # Management commands
│   └── vendor_booking/    # Django project settings
├── frontend/               # Next.js frontend
│   ├── app/               # App Router pages
│   │   ├── page.tsx       # Calendar view
│   │   ├── event/[id]/    # Event details page
│   │   └── checkout/      # Success/cancel pages
│   └── lib/               # API utilities
└── docker-compose.yml     # Docker configuration
```

## 🔌 API Endpoints

### Events
- `GET /api/events/` - List all events
- `GET /api/events/calendar/` - Get events for calendar view
- `GET /api/events/{id}/` - Get event details with booth slots

### Booth Slots
- `GET /api/booth-slots/{id}/` - Get booth slot details
- `POST /api/booth-slots/{id}/reserve/` - Reserve a booth slot (creates Stripe session)

### Webhooks
- `POST /api/stripe/webhook` - Stripe webhook endpoint

## 💳 Stripe Integration

The application uses Stripe Checkout for payment processing:

1. Vendor fills out booking form
2. Backend creates a `VendorBooking` (unpaid)
3. Stripe Checkout session is created
4. Vendor is redirected to Stripe Checkout
5. On successful payment, Stripe webhook marks booking as paid and slot as unavailable

### Testing with Stripe

Use Stripe's test cards:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Any future expiry date and CVC

## 🛠️ Development

### Running without Docker

#### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_data
python manage.py runserver
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Database Migrations
```bash
docker compose exec backend python manage.py makemigrations
docker compose exec backend python manage.py migrate
```

### Creating Admin User
```bash
docker compose exec backend python manage.py createsuperuser
```

## 📝 Environment Variables

See `.env.example` for all required environment variables:

- `DJANGO_SECRET_KEY` - Django secret key
- `DB_*` - Database configuration
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret
- `NEXT_PUBLIC_API_URL` - Backend API URL

## 🎨 Admin Interface

Access the Django admin at http://localhost:8000/admin to:
- Create and manage events
- Add booth slots to events
- View vendor bookings
- Monitor payment status

## 📧 Email Confirmation (TODO)

Currently, the webhook handler includes a TODO for sending confirmation emails. To implement:

1. Configure Django email settings in `settings.py`
2. Add email sending logic in `bookings/views.py` webhook handler
3. Use Django's `send_mail` or a service like SendGrid/Mailgun

## 🐛 Troubleshooting

### Database connection errors
- Ensure PostgreSQL container is running: `docker compose ps`
- Check database credentials in `.env`

### Stripe webhook not working
- For local development, use [Stripe CLI](https://stripe.com/docs/stripe-cli) to forward webhooks:
  ```bash
  stripe listen --forward-to localhost:8000/api/stripe-webhook/
  ```

### CORS errors
- Ensure `CORS_ALLOWED_ORIGINS` in `backend/vendor_booking/settings.py` includes your frontend URL

## 📄 License

MIT
