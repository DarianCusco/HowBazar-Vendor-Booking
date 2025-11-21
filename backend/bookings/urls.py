from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EventViewSet, booth_slot_detail, reserve_booth_slot, reserve_event_spot, stripe_webhook

router = DefaultRouter()
router.register(r'events', EventViewSet, basename='event')

urlpatterns = [
    path('', include(router.urls)),
    path('booth-slots/<int:pk>/', booth_slot_detail, name='booth-slot-detail'),
    path('booth-slots/<int:pk>/reserve/', reserve_booth_slot, name='reserve-booth-slot'),
    path('events/<int:event_id>/reserve/', reserve_event_spot, name='reserve-event-spot'),
    path('stripe-webhook/', stripe_webhook, name='stripe-webhook'),
]

