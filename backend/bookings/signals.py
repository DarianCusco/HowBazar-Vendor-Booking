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
    Sync vendor booking to Google Sheets via Apps Script when created or updated
    This runs asynchronously and won't block the booking process
    Works for both GeneralVendorBooking and FoodTruckBooking
    
    Strategy: Only sync when Stripe payment ID is present to avoid duplicate entries.
    The booking is created first without Stripe info, then updated with Stripe ID.
    We sync once when Stripe ID is added, and again when payment is completed.
    """
    try:
        apps_script_sync = get_apps_script_sync()
        
        # Skip if Stripe payment ID is not set yet (booking just created, Stripe session not created yet)
        # This prevents syncing before Stripe info is available
        if not instance.stripe_payment_id:
            logger.debug(f"Skipping sync for booking {instance.id} - no Stripe payment ID yet (created={created})")
            return
        
        # Create a unique key for this booking
        booking_key = f"{sender.__name__}_{instance.id}"
        
        # Check if we've already synced this booking (to avoid duplicates)
        # We'll sync once when Stripe ID is added, and again when payment is completed
        if created:
            # New booking with Stripe ID already set (unlikely but handle it)
            if booking_key not in _synced_bookings:
                logger.info(f"New booking {instance.id} with Stripe ID - syncing to Google Sheets")
                result = apps_script_sync.sync_booking(instance)
                if result:
                    _synced_bookings.add(booking_key)
                    logger.info(f"Successfully synced new booking {instance.id} to Google Sheets")
                else:
                    logger.warning(f"Failed to sync new booking {instance.id} to Google Sheets")
        else:
            # Updated booking
            update_fields = kwargs.get('update_fields')
            
            # Check if payment status changed to paid
            if instance.is_paid:
                # Payment completed - sync update (even if we've synced before)
                logger.info(f"Payment completed for booking {instance.id} - syncing update to Google Sheets")
                result = apps_script_sync.update_booking(instance)
                if result:
                    logger.info(f"Successfully synced payment update for booking {instance.id} to Google Sheets")
                else:
                    logger.warning(f"Failed to sync payment update for booking {instance.id} to Google Sheets")
            elif booking_key not in _synced_bookings:
                # First time syncing this booking (Stripe ID was just added)
                # Check if this update includes stripe_payment_id
                if update_fields is None or 'stripe_payment_id' in update_fields:
                    logger.info(f"Stripe payment ID added for booking {instance.id} - syncing to Google Sheets")
                    result = apps_script_sync.sync_booking(instance)
                    if result:
                        _synced_bookings.add(booking_key)
                        logger.info(f"Successfully synced booking {instance.id} to Google Sheets")
                    else:
                        logger.warning(f"Failed to sync booking {instance.id} to Google Sheets")
                else:
                    logger.debug(f"Skipping sync for booking {instance.id} - stripe_payment_id not in update_fields")
            else:
                # Already synced this booking, skip to avoid duplicates
                logger.debug(f"Skipping sync for booking {instance.id} - already synced")
            
    except Exception as e:
        # Log error but don't fail the booking process
        logger.error(f"Error syncing booking {instance.id} to Google Sheets: {str(e)}", exc_info=True)
