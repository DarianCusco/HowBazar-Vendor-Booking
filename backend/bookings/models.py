from django.db import models
from django.core.validators import EmailValidator


class Event(models.Model):
    name = models.CharField(max_length=200)
    date = models.DateField()
    location = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, help_text="Price per spot")
    number_of_spots = models.PositiveIntegerField(default=0, help_text="Total number of spots available")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['date']

    def __str__(self):
        return f"{self.name} - {self.date}"

    def save(self, *args, **kwargs):
        # SIMPLIFY - Just save, don't auto-create booth slots
        # number_of_spots now means "available spots" not "total capacity"
        super().save(*args, **kwargs)
        
        # Optional: You can still create booth slots if needed for tracking
        # But they won't be tied to number_of_spots anymore
        # Create booth slots only if none exist
        if self.booth_slots.count() == 0 and self.number_of_spots > 0:
            for i in range(1, self.number_of_spots + 1):
                self.booth_slots.create(
                    spot_number=f"{i:03d}",
                    is_available=True
                )
    
    @property
    def available_spots_count(self):
        # Now just return number_of_spots since that's the available count
        return self.number_of_spots

class BoothSlot(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='booth_slots')
    spot_number = models.CharField(max_length=50)
    is_available = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['spot_number']
        unique_together = ['event', 'spot_number']

    def __str__(self):
        return f"{self.event.name} - Spot {self.spot_number}"


class BaseVendorBooking(models.Model):
    """Abstract base model for common vendor booking fields"""
    booth_slot = models.ForeignKey(BoothSlot, on_delete=models.CASCADE, related_name='%(class)s_bookings')
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    vendor_email = models.EmailField(validators=[EmailValidator()])
    business_name = models.CharField(max_length=200, blank=True)
    phone = models.CharField(max_length=20)
    
    # Personal information
    preferred_name = models.CharField(max_length=100, blank=True)
    pronouns = models.CharField(max_length=50, blank=True)
    instagram = models.CharField(max_length=100, blank=True)
    
    # Consents and preferences
    social_media_consent = models.CharField(max_length=10, blank=True, choices=[('yes', 'Yes'), ('no', 'No')])
    photo_consent = models.CharField(max_length=10, blank=True, choices=[('yes', 'Yes'), ('no', 'No')])
    noise_sensitive = models.CharField(max_length=15, blank=True)
    
    # Booth sharing
    sharing_booth = models.CharField(max_length=10, blank=True, choices=[('yes', 'Yes'), ('no', 'No')])
    booth_partner_instagram = models.CharField(max_length=100, blank=True)
    
    # Additional information
    price_range = models.CharField(max_length=100, blank=True)
    additional_notes = models.TextField(blank=True)
    
    # Payment fields
    stripe_payment_id = models.CharField(max_length=200, blank=True, help_text="Stripe Checkout Session ID")
    stripe_payment_intent_id = models.CharField(max_length=200, blank=True, help_text="Stripe Payment Intent ID")
    is_paid = models.BooleanField(default=False)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        abstract = True
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.first_name} {self.last_name} - {self.booth_slot}"


class GeneralVendorBooking(BaseVendorBooking):
    """General vendor booking with vendor-specific fields"""
    products_selling = models.TextField(help_text="What products/items will be sold")
    electricity_cord = models.CharField(
        max_length=10,
        blank=True,
        choices=[('yes', 'Yes'), ('no', 'No')],
        help_text="Can bring own extension cord"
    )

    class Meta:
        ordering = ['-timestamp']
        verbose_name = 'General Vendor Booking'
        verbose_name_plural = 'General Vendor Bookings'


class FoodTruckBooking(BaseVendorBooking):
    """Food truck booking with food truck-specific fields"""
    cuisine_type = models.CharField(max_length=100, help_text="Type of cuisine (e.g., Mexican, Italian, BBQ)")
    food_items = models.TextField(help_text="What types of food will be sold")
    setup_size = models.CharField(max_length=100, blank=True, help_text="Truck size or dimensions")
    generator = models.CharField(
        max_length=10,
        blank=True,
        choices=[('yes', 'Yes'), ('no', 'No')],
        help_text="Can bring own quiet generator"
    )

    class Meta:
        ordering = ['-timestamp']
        verbose_name = 'Food Truck Booking'
        verbose_name_plural = 'Food Truck Bookings'

