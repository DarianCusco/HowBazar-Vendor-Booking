from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from bookings.models import Event, BoothSlot


class Command(BaseCommand):
    help = 'Seeds the database with example events and booth slots'

    def handle(self, *args, **options):
        # Check if events already exist
        if Event.objects.exists():
            self.stdout.write(
                self.style.WARNING('Events already exist. Skipping seed data.')
            )
            return

        # Create events
        today = timezone.now().date()
        
        event1 = Event.objects.create(
            name='Spring Market Festival',
            date=today + timedelta(days=30),
            location='Central Park, Main Plaza',
            description='Join us for our annual spring market featuring local vendors, food trucks, and live music!',
            price=150.00,
            number_of_spots=20
        )

        event2 = Event.objects.create(
            name='Summer Craft Fair',
            date=today + timedelta(days=45),
            location='Downtown Community Center',
            description='A celebration of local artisans and craftspeople. Perfect for finding unique handmade items.',
            price=125.00,
            number_of_spots=15
        )

        event3 = Event.objects.create(
            name='Farmers Market Weekend',
            date=today + timedelta(days=60),
            location='City Square',
            description='Fresh produce, local goods, and community vendors. Family-friendly event with activities for kids.',
            price=100.00,
            number_of_spots=25
        )

        # Create booth slots for event 1
        for i in range(1, event1.number_of_spots + 1):
            BoothSlot.objects.create(
                event=event1,
                spot_number=f'A{i:02d}',
                is_available=True
            )

        # Create booth slots for event 2
        for i in range(1, event2.number_of_spots + 1):
            BoothSlot.objects.create(
                event=event2,
                spot_number=f'B{i:02d}',
                is_available=True
            )

        # Create booth slots for event 3
        for i in range(1, event3.number_of_spots + 1):
            BoothSlot.objects.create(
                event=event3,
                spot_number=f'C{i:02d}',
                is_available=True
            )

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully created:\n'
                f'- 3 Events\n'
                f'- {BoothSlot.objects.count()} Booth Slots'
            )
        )

