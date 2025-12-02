"""
Django signals for vendor bookings
"""
import logging
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import GeneralVendorBooking, FoodTruckBooking
from .google_apps_script import get_apps_script_sync

logger = logging.getLogger(__name__)

# Track which bookings we've already synced to avoid duplicates
_synced_bookings = set()


@receiver(post_save, sender=GeneralVendorBooking)
@receiver(post_save, sender=FoodTruckBooking)
def sync_booking_to_google_sheets(sender, instance, created, **kwargs):
    """
    Sync vendor booking to Google Sheets via Apps Script
    This signal is now disabled - syncing happens directly in the webhook handler
    when checkout.session.completed event is received (when payment is made).
    
    This prevents duplicate syncing and ensures we sync at the right time (when payment is made,
    not when it's captured).
    """
    # Disabled - syncing now happens in stripe_webhook when checkout.session.completed is received
    # This ensures we sync when payment is made, not when it's captured
    pass
