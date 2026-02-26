from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'events', views.EventViewSet, basename='event')

urlpatterns = [
    path('', include(router.urls)),
    
    # Booth slot endpoints
    path('booth-slots/<int:pk>/', views.booth_slot_detail, name='booth-slot-detail'),
    
    # Single event booking
    path('events/<int:event_id>/reserve/', views.reserve_event_spot, name='reserve-event-spot'),
    
    # Multi-date booking
    path('events/multi/reserve/', views.reserve_multi_event_spots, name='reserve-multi-event-spots'),
    
    # Availability endpoints
    path('events/availability/<str:date>/', views.event_availability, name='event-availability'),
    
    # Booking status
    path('bookings/status/<str:session_id>/', views.booking_status, name='booking-status'),
    
    # Stripe webhook (accept both with and without trailing slash)
    path('stripe/webhook/', views.stripe_webhook, name='stripe-webhook'),
    path('stripe/webhook', views.stripe_webhook, name='stripe-webhook-no-slash'),
]