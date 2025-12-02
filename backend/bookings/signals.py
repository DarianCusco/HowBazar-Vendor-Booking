"""
Django signals for vendor bookings
"""
import logging
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import GeneralVendorBooking, FoodTruckBooking
from .google_sheets import get_sheets_sync

logger = logging.getLogger(__name__)


@receiver(post_save, sender=GeneralVendorBooking)
@receiver(post_save, sender=FoodTruckBooking)
def sync_booking_to_google_sheets(sender, instance, created, **kwargs):
    """
    Sync vendor booking to Google Sheets when created or updated
    This runs asynchronously and won't block the booking process
    Works for both GeneralVendorBooking and FoodTruckBooking
    """
    try:
        sheets_sync = get_sheets_sync()
        
        if created:
            # New booking - append to sheet
            sheets_sync.sync_booking(instance)
        else:
            # Updated booking - try to update existing row
            sheets_sync.update_booking(instance)
            
    except Exception as e:
        # Log error but don't fail the booking process
        logger.error(f"Error syncing booking {instance.id} to Google Sheets: {str(e)}")

