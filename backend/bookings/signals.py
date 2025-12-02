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
    Sync vendor booking to Google Sheets via Apps Script when payment is completed
    This runs asynchronously and won't block the booking process
    Works for both GeneralVendorBooking and FoodTruckBooking
    
    Strategy: Only sync when payment is completed (is_paid = True) to avoid duplicate entries.
    The booking is created first, then Stripe ID is added, then payment is completed.
    We only sync once when payment is completed.
    """
    try:
        apps_script_sync = get_apps_script_sync()
        
        # Only sync when payment is completed
        if not instance.is_paid:
            logger.debug(f"Skipping sync for booking {instance.id} - payment not completed yet (created={created}, is_paid={instance.is_paid})")
            return
        
        # Create a unique key for this booking
        booking_key = f"{sender.__name__}_{instance.id}"
        
        # Check if we've already synced this booking (to avoid duplicates)
        if booking_key in _synced_bookings:
            logger.debug(f"Skipping sync for booking {instance.id} - already synced")
            return
        
        # Payment is completed and we haven't synced yet - sync now
        update_fields = kwargs.get('update_fields')
        
        # Only sync if this is a payment status update (is_paid changed to True)
        # or if update_fields is None (full save) and payment is paid
        if update_fields is None or 'is_paid' in update_fields:
            logger.info(f"Payment completed for booking {instance.id} - syncing to Google Sheets")
            result = apps_script_sync.sync_booking(instance)
            if result:
                _synced_bookings.add(booking_key)
                logger.info(f"Successfully synced booking {instance.id} to Google Sheets")
            else:
                logger.warning(f"Failed to sync booking {instance.id} to Google Sheets")
        else:
            logger.debug(f"Skipping sync for booking {instance.id} - is_paid not in update_fields: {update_fields}")
            
    except Exception as e:
        # Log error but don't fail the booking process
        logger.error(f"Error syncing booking {instance.id} to Google Sheets: {str(e)}", exc_info=True)
