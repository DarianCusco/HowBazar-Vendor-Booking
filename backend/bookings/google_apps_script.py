"""
Google Apps Script Web App integration for syncing vendor bookings
This is a simpler alternative to the Google Sheets API that uses Apps Script webhooks
"""
import os
import logging
import requests
from typing import Optional
from django.conf import settings

logger = logging.getLogger(__name__)


class GoogleAppsScriptSync:
    """Handle syncing vendor bookings to Google Sheets via Apps Script Web App"""
    
    def __init__(self):
        self.enabled = self._is_enabled()
        self.webhook_url = getattr(settings, 'GOOGLE_APPS_SCRIPT_WEBHOOK_URL', '')
    
    def _is_enabled(self) -> bool:
        """Check if Google Apps Script integration is enabled"""
        webhook_url = getattr(settings, 'GOOGLE_APPS_SCRIPT_WEBHOOK_URL', '')
        
        if not webhook_url:
            logger.info("Google Apps Script disabled: GOOGLE_APPS_SCRIPT_WEBHOOK_URL not configured")
            return False
        
        return True
    
    def _prepare_booking_data(self, booking) -> dict:
        """Convert booking object to dictionary for Apps Script"""
        from .models import GeneralVendorBooking, FoodTruckBooking
        
        # Common fields
        data = {
            'event_name': booking.booth_slot.event.name if booking.booth_slot else '',
            'event_date': booking.booth_slot.event.date.strftime('%Y-%m-%d') if booking.booth_slot and booking.booth_slot.event else '',
            'first_name': booking.first_name or '',
            'last_name': booking.last_name or '',
            'preferred_name': booking.preferred_name or '',
            'pronouns': booking.pronouns or '',
            'vendor_email': booking.vendor_email or '',
            'phone': booking.phone or '',
            'business_name': booking.business_name or '',
            'instagram': booking.instagram or '',
            'booth_slot': booking.booth_slot.spot_number if booking.booth_slot else '',
            'price_range': booking.price_range or '',
            'social_media_consent': booking.social_media_consent or '',
            'photo_consent': booking.photo_consent or '',
            'noise_sensitive': booking.noise_sensitive or '',
            'sharing_booth': booking.sharing_booth or '',
            'booth_partner_instagram': booking.booth_partner_instagram or '',
            'additional_notes': booking.additional_notes or '',
            'stripe_payment_id': booking.stripe_payment_id or '',
            'stripe_checkout_session_id': booking.stripe_payment_id or '',  # Maps to Stripe Checkout Session ID column
            'stripe_payment_intent_id': booking.stripe_payment_intent_id or '',
            'is_paid': booking.is_paid,
            'timestamp': booking.timestamp.isoformat() if booking.timestamp else '',
        }
        
        # Add vendor-specific fields
        if isinstance(booking, GeneralVendorBooking):
            data['vendor_type'] = 'general'
            data['products_selling'] = booking.products_selling or ''
            data['electricity_cord'] = booking.electricity_cord or ''
        elif isinstance(booking, FoodTruckBooking):
            data['vendor_type'] = 'food'
            data['cuisine_type'] = booking.cuisine_type or ''
            data['food_items'] = booking.food_items or ''
            data['setup_size'] = booking.setup_size or ''
            data['generator'] = booking.generator or ''
        
        return data
    
    def sync_booking(self, booking) -> bool:
        """
        Sync a single booking to Google Sheets via Apps Script
        Returns True if successful, False otherwise
        """
        if not self.enabled:
            return False
        
        try:
            # Prepare data
            data = self._prepare_booking_data(booking)
            
            # Send POST request to Apps Script webhook
            response = requests.post(
                self.webhook_url,
                json=data,
                headers={'Content-Type': 'application/json'},
                timeout=10  # 10 second timeout
            )
            
            # Check response
            if response.status_code == 200:
                result = response.json()
                if result.get('success'):
                    logger.info(f"Successfully synced booking {booking.id} to Google Sheets")
                    return True
                else:
                    logger.error(f"Apps Script returned error: {result.get('error', 'Unknown error')}")
                    return False
            else:
                logger.error(f"Failed to sync booking {booking.id}: HTTP {response.status_code}")
                return False
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Network error syncing booking {booking.id} to Google Sheets: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"Error syncing booking {booking.id} to Google Sheets: {str(e)}")
            return False
    
    def update_booking(self, booking) -> bool:
        """
        Update an existing booking in Google Sheets
        Note: Apps Script approach typically appends new rows.
        For updates, you may need to implement a different approach
        or just append the updated data as a new row.
        """
        # For simplicity, we'll just sync as a new row
        # You could enhance this to use a doPut method in Apps Script
        # that finds and updates existing rows
        return self.sync_booking(booking)


# Global instance
_apps_script_sync = None

def get_apps_script_sync() -> GoogleAppsScriptSync:
    """Get or create Google Apps Script sync instance"""
    global _apps_script_sync
    if _apps_script_sync is None:
        _apps_script_sync = GoogleAppsScriptSync()
    return _apps_script_sync

