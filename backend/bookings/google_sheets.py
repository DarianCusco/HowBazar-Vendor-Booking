"""
Google Sheets integration for syncing vendor bookings
"""
import os
import json
import logging
from typing import Optional, Dict, Any
from django.conf import settings

logger = logging.getLogger(__name__)

try:
    import gspread
    from google.oauth2.service_account import Credentials
    GSPREAD_AVAILABLE = True
except ImportError:
    GSPREAD_AVAILABLE = False
    logger.warning("gspread not installed. Google Sheets integration disabled.")


class GoogleSheetsSync:
    """Handle syncing vendor bookings to Google Sheets"""
    
    def __init__(self):
        self.enabled = self._is_enabled()
        self.client = None
        self.spreadsheet = None
        
        if self.enabled:
            self._initialize_client()
    
    def _is_enabled(self) -> bool:
        """Check if Google Sheets integration is enabled"""
        if not GSPREAD_AVAILABLE:
            return False
        
        # Check if required settings are configured
        required_settings = [
            'GOOGLE_SHEETS_CREDENTIALS',
            'GOOGLE_SHEETS_SPREADSHEET_ID',
            'GOOGLE_SHEETS_WORKSHEET_NAME',
        ]
        
        for setting in required_settings:
            if not hasattr(settings, setting) or not getattr(settings, setting):
                logger.info(f"Google Sheets disabled: {setting} not configured")
                return False
        
        return True
    
    def _initialize_client(self):
        """Initialize Google Sheets client"""
        try:
            # Parse credentials from JSON string or file path
            creds_json = settings.GOOGLE_SHEETS_CREDENTIALS
            
            # If it's a file path, read it
            if os.path.isfile(creds_json):
                with open(creds_json, 'r') as f:
                    creds_data = json.load(f)
            else:
                # Assume it's a JSON string
                creds_data = json.loads(creds_json)
            
            # Create credentials
            scopes = [
                'https://www.googleapis.com/auth/spreadsheets',
                'https://www.googleapis.com/auth/drive'
            ]
            credentials = Credentials.from_service_account_info(creds_data, scopes=scopes)
            
            # Create client
            self.client = gspread.authorize(credentials)
            
            # Open spreadsheet
            self.spreadsheet = self.client.open_by_key(settings.GOOGLE_SHEETS_SPREADSHEET_ID)
            
            logger.info("Google Sheets client initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize Google Sheets client: {str(e)}")
            self.enabled = False
    
    def _get_worksheet(self):
        """Get or create the worksheet"""
        if not self.enabled or not self.spreadsheet:
            return None
        
        try:
            worksheet_name = settings.GOOGLE_SHEETS_WORKSHEET_NAME
            try:
                worksheet = self.spreadsheet.worksheet(worksheet_name)
            except gspread.exceptions.WorksheetNotFound:
                # Create worksheet if it doesn't exist
                worksheet = self.spreadsheet.add_worksheet(
                    title=worksheet_name,
                    rows=1000,
                    cols=20
                )
                # Add headers
                headers = self._get_headers()
                worksheet.append_row(headers)
                logger.info(f"Created new worksheet: {worksheet_name}")
            
            return worksheet
        except Exception as e:
            logger.error(f"Failed to get worksheet: {str(e)}")
            return None
    
    def _get_headers(self) -> list:
        """Get column headers for the sheet"""
        return [
            'Timestamp',
            'Vendor Type',
            'First Name',
            'Last Name',
            'Email',
            'Business Name',
            'Phone',
            'Preferred Name',
            'Pronouns',
            'Instagram',
            'Event Name',
            'Event Date',
            'Event Location',
            'Spot Number',
            # General Vendor specific
            'Products Selling',
            'Price Range',
            'Electricity Cord',
            # Food Truck specific
            'Cuisine Type',
            'Food Items',
            'Setup Size',
            'Generator',
            # Consents
            'Social Media Consent',
            'Photo Consent',
            'Noise Sensitive',
            'Sharing Booth',
            'Booth Partner Instagram',
            'Additional Notes',
            'Payment Status',
            'Stripe Payment ID',
            'Stripe Payment Intent ID',
        ]
    
    def _booking_to_row(self, booking) -> list:
        """Convert booking object to row data - handles both GeneralVendorBooking and FoodTruckBooking"""
        try:
            from .models import GeneralVendorBooking, FoodTruckBooking
            
            # Determine vendor type
            if isinstance(booking, GeneralVendorBooking):
                vendor_type_display = 'General Vendor'
            elif isinstance(booking, FoodTruckBooking):
                vendor_type_display = 'Food Truck'
            else:
                vendor_type_display = 'Unknown'
            
            # Determine payment status
            if booking.is_paid:
                payment_status = 'Paid'
            elif booking.stripe_payment_intent_id:
                payment_status = 'Pending Approval'
            elif booking.stripe_payment_id:
                payment_status = 'Authorized'
            else:
                payment_status = 'Not Started'
            
            # Common fields
            row = [
                booking.timestamp.strftime('%Y-%m-%d %H:%M:%S') if booking.timestamp else '',
                vendor_type_display,
                booking.first_name or '',
                booking.last_name or '',
                booking.vendor_email or '',
                booking.business_name or '',
                booking.phone or '',
                booking.preferred_name or '',
                booking.pronouns or '',
                booking.instagram or '',
                booking.event.name if booking.event else '',
                booking.event.date.strftime('%Y-%m-%d') if booking.event else '',
                booking.event.location if booking.event else '',
                '',  # Booth slot no longer used
            ]
            
            # Vendor-specific fields
            if isinstance(booking, GeneralVendorBooking):
                row.extend([
                    booking.products_selling or '',  # General vendor specific
                    booking.price_range or '',
                    booking.electricity_cord or '',
                    '',  # Cuisine Type (food truck only)
                    '',  # Food Items (food truck only)
                    '',  # Setup Size (food truck only)
                    '',  # Generator (food truck only)
                ])
            elif isinstance(booking, FoodTruckBooking):
                row.extend([
                    '',  # Products Selling (general vendor only)
                    booking.price_range or '',
                    '',  # Electricity Cord (general vendor only)
                    booking.cuisine_type or '',  # Food truck specific
                    booking.food_items or '',
                    booking.setup_size or '',
                    booking.generator or '',
                ])
            else:
                # Fallback - empty fields
                row.extend(['', '', '', '', '', '', ''])
            
            # Consents and additional info
            row.extend([
                booking.social_media_consent or '',
                booking.photo_consent or '',
                booking.noise_sensitive or '',
                booking.sharing_booth or '',
                booking.booth_partner_instagram or '',
                booking.additional_notes or '',
                payment_status,
                booking.stripe_payment_id or '',
                booking.stripe_payment_intent_id or '',
            ])
            
            return row
        except Exception as e:
            logger.error(f"Error converting booking to row: {str(e)}")
            return []
    
    def sync_booking(self, booking) -> bool:
        """
        Sync a single booking to Google Sheets
        Returns True if successful, False otherwise
        """
        if not self.enabled:
            return False
        
        try:
            worksheet = self._get_worksheet()
            if not worksheet:
                return False
            
            # Convert booking to row
            row_data = self._booking_to_row(booking)
            if not row_data:
                logger.warning(f"Empty row data for booking {booking.id}")
                return False
            
            # Append row to sheet
            worksheet.append_row(row_data)
            logger.info(f"Successfully synced booking {booking.id} to Google Sheets")
            return True
            
        except Exception as e:
            logger.error(f"Failed to sync booking {booking.id} to Google Sheets: {str(e)}")
            return False
    
    def update_booking(self, booking) -> bool:
        """
        Update an existing booking in Google Sheets
        This finds the row by booking ID or email+timestamp and updates it
        """
        if not self.enabled:
            return False
        
        try:
            worksheet = self._get_worksheet()
            if not worksheet:
                return False
            
            # Find the row (search by email and timestamp)
            all_values = worksheet.get_all_values()
            booking_timestamp = booking.timestamp.strftime('%Y-%m-%d %H:%M:%S') if booking.timestamp else ''
            
            row_index = None
            for idx, row in enumerate(all_values[1:], start=2):  # Skip header row
                if len(row) >= 4:  # Ensure row has enough columns
                    if row[3] == booking.vendor_email and row[0] == booking_timestamp:
                        row_index = idx
                        break
            
            if row_index:
                # Update existing row
                row_data = self._booking_to_row(booking)
                # Calculate column range (A to last column based on headers)
                last_col = chr(ord('A') + len(self._get_headers()) - 1)
                worksheet.update(f'A{row_index}:{last_col}{row_index}', [row_data])
                logger.info(f"Updated booking {booking.id} in Google Sheets (row {row_index})")
                return True
            else:
                # Row not found, append as new
                logger.warning(f"Booking {booking.id} not found in sheet, appending as new row")
                return self.sync_booking(booking)
                
        except Exception as e:
            logger.error(f"Failed to update booking {booking.id} in Google Sheets: {str(e)}")
            return False


# Global instance
_sheets_sync = None

def get_sheets_sync() -> GoogleSheetsSync:
    """Get or create Google Sheets sync instance"""
    global _sheets_sync
    if _sheets_sync is None:
        _sheets_sync = GoogleSheetsSync()
    return _sheets_sync

