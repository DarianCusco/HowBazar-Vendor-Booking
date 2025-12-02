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
        
        # Log for debugging
        logger.info(f"Syncing booking {instance.id} to Google Sheets (created={created}, is_paid={instance.is_paid})")
        
        if created:
            # New booking - append to sheet
            result = apps_script_sync.sync_booking(instance)
            if result:
                logger.info(f"Successfully synced new booking {instance.id} to Google Sheets")
            else:
                logger.warning(f"Failed to sync new booking {instance.id} to Google Sheets")
        else:
            # Updated booking - sync as new row (or implement update logic in Apps Script)
            result = apps_script_sync.update_booking(instance)
            if result:
                logger.info(f"Successfully synced updated booking {instance.id} to Google Sheets")
            else:
                logger.warning(f"Failed to sync updated booking {instance.id} to Google Sheets")
            
    except Exception as e:
        # Log error but don't fail the booking process
        logger.error(f"Error syncing booking {instance.id} to Google Sheets: {str(e)}", exc_info=True)

