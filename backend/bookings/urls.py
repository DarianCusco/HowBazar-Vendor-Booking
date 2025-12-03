from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EventViewSet, reserve_event_spot, stripe_webhook
from .views import reserve_multi_event_spots

router = DefaultRouter()
router.register(r'events', EventViewSet, basename='event')

urlpatterns = [
    path('', include(router.urls)),
    path('events/<int:event_id>/reserve/', reserve_event_spot, name='reserve-event-spot'),
    # Accept both with and without trailing slash for Stripe webhook
    path('stripe/webhook/', stripe_webhook, name='stripe-webhook'),
    path('stripe/webhook', stripe_webhook, name='stripe-webhook-no-slash'),
    path('events/multi/reserve/', reserve_multi_event_spots, name='reserve-multi-event-spots'),

]

