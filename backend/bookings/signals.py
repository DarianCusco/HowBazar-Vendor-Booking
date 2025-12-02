"""
Django signals for vendor bookings
"""
import logging
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import GeneralVendorBooking, FoodTruckBooking
from .google_apps_script import get_apps_script_sync

logger = logging.getLogger(__name__)


@receiver(post_save, sender=GeneralVendorBooking)
@receiver(post_save, sender=FoodTruckBooking)
def sync_booking_to_google_sheets(sender, instance, created, **kwargs):
    """
    Sync vendor booking to Google Sheets via Apps Script when created or updated
    This runs asynchronously and won't block the booking process
    Works for both GeneralVendorBooking and FoodTruckBooking
    """
    try:
        apps_script_sync = get_apps_script_sync()
        
        if created:
            # New booking - append to sheet
            apps_script_sync.sync_booking(instance)
        else:
            # Updated booking - sync as new row (or implement update logic in Apps Script)
            apps_script_sync.update_booking(instance)
            
    except Exception as e:
        # Log error but don't fail the booking process
        logger.error(f"Error syncing booking {instance.id} to Google Sheets: {str(e)}")

