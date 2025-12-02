"""
Management command to test Google Sheets sync
Usage: python manage.py test_google_sheets_sync [booking_id]
"""
from django.core.management.base import BaseCommand
from bookings.models import GeneralVendorBooking, FoodTruckBooking
from bookings.google_apps_script import get_apps_script_sync
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Test Google Sheets sync for a booking'

    def add_arguments(self, parser):
        parser.add_argument(
            'booking_id',
            type=int,
            nargs='?',
            help='ID of the booking to sync (if not provided, syncs the most recent booking)'
        )

    def handle(self, *args, **options):
        booking_id = options.get('booking_id')
        
        # Get the booking
        if booking_id:
            try:
                booking = GeneralVendorBooking.objects.get(id=booking_id)
            except GeneralVendorBooking.DoesNotExist:
                try:
                    booking = FoodTruckBooking.objects.get(id=booking_id)
                except FoodTruckBooking.DoesNotExist:
                    self.stdout.write(self.style.ERROR(f'Booking {booking_id} not found'))
                    return
        else:
            # Get most recent booking
            general = GeneralVendorBooking.objects.first()
            food = FoodTruckBooking.objects.first()
            
            if not general and not food:
                self.stdout.write(self.style.ERROR('No bookings found'))
                return
            
            if general and food:
                booking = general if general.timestamp > food.timestamp else food
            else:
                booking = general or food
        
        self.stdout.write(f'Testing sync for booking {booking.id}')
        self.stdout.write(f'Type: {type(booking).__name__}')
        self.stdout.write(f'Name: {booking.first_name} {booking.last_name}')
        self.stdout.write(f'Email: {booking.vendor_email}')
        self.stdout.write(f'Is Paid: {booking.is_paid}')
        self.stdout.write('')
        
        # Test sync
        apps_script_sync = get_apps_script_sync()
        
        if not apps_script_sync.enabled:
            self.stdout.write(self.style.ERROR('Google Apps Script sync is DISABLED'))
            self.stdout.write('Check that GOOGLE_APPS_SCRIPT_WEBHOOK_URL is set in your .env file')
            return
        
        self.stdout.write(f'Webhook URL: {apps_script_sync.webhook_url[:50]}...')
        self.stdout.write('')
        self.stdout.write('Attempting to sync...')
        
        result = apps_script_sync.sync_booking(booking)
        
        if result:
            self.stdout.write(self.style.SUCCESS('✓ Sync successful!'))
            self.stdout.write('Check your Google Sheet to verify the data was added.')
        else:
            self.stdout.write(self.style.ERROR('✗ Sync failed!'))
            self.stdout.write('Check the Django logs for error details.')

