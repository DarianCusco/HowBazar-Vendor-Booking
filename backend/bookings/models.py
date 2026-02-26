from django.db import models
from django.core.validators import EmailValidator, MinValueValidator, MaxValueValidator
from django.utils import timezone


class Event(models.Model):
    name = models.CharField(max_length=200)
    date = models.DateField(unique=True)  # One event per day
    location = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    
    # Separate spot counts for each vendor type
    regular_spots_total = models.PositiveIntegerField(
        default=24,
        validators=[MinValueValidator(0)],
        help_text="Total number of regular vendor spots available"
    )
    regular_spots_available = models.PositiveIntegerField(
        default=24,
        validators=[MinValueValidator(0)],
        help_text="Current number of regular vendor spots available"
    )
    
    food_spots_total = models.PositiveIntegerField(
        default=2,
        validators=[MinValueValidator(0)],
        help_text="Total number of food truck spots available"
    )
    food_spots_available = models.PositiveIntegerField(
        default=2,
        validators=[MinValueValidator(0)],
        help_text="Current number of food truck spots available"
    )
    
    # Prices
    regular_price = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=35.00,
        help_text="Price per regular vendor spot"
    )
    food_price = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=50.00,
        help_text="Price per food truck spot"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['date']

    def __str__(self):
        return f"{self.name} - {self.date}"

    def save(self, *args, **kwargs):
        # Ensure available counts don't exceed totals
        if self.regular_spots_available > self.regular_spots_total:
            self.regular_spots_available = self.regular_spots_total
        if self.food_spots_available > self.food_spots_total:
            self.food_spots_available = self.food_spots_total
        super().save(*args, **kwargs)

    @property
    def has_regular_spots(self):
        return self.regular_spots_available > 0

    @property
    def has_food_spots(self):
        return self.food_spots_available > 0

    @property
    def total_spots_available(self):
        return self.regular_spots_available + self.food_spots_available


class BoothSlot(models.Model):
    SLOT_TYPES = [
        ('regular', 'Regular Vendor'),
        ('food', 'Food Truck'),
    ]
    
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='booth_slots')
    spot_number = models.CharField(max_length=50)
    slot_type = models.CharField(max_length=10, choices=SLOT_TYPES, default='regular')
    is_available = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['slot_type', 'spot_number']
        unique_together = ['event', 'spot_number']

    def __str__(self):
        return f"{self.event.name} - {self.get_slot_type_display()} Spot {self.spot_number}"


class BaseVendorBooking(models.Model):
    """Abstract base model for common vendor booking fields"""
    PAYMENT_STATUS = [
        ('pending', 'Pending Payment'),
        ('authorized', 'Authorized (Awaiting Approval)'),
        ('approved', 'Approved'),
        ('cancelled', 'Cancelled'),
        ('expired', 'Expired'),
    ]
    
    # Keep booth_slot for backward compatibility
    booth_slot = models.ForeignKey(
        BoothSlot, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='%(class)s_bookings'
    )
    
    # Store event reference directly for easier querying
    event = models.ForeignKey(
        Event, 
        on_delete=models.CASCADE,
        related_name='%(class)s_bookings'
    )
    
    # Basic info
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
    social_media_consent = models.CharField(
        max_length=3, 
        blank=True, 
        choices=[('yes', 'Yes'), ('no', 'No')]
    )
    photo_consent = models.CharField(
        max_length=3, 
        blank=True, 
        choices=[('yes', 'Yes'), ('no', 'No')]
    )
    noise_sensitive = models.CharField(
        max_length=15, 
        blank=True,
        choices=[('yes', 'Yes'), ('no', 'No'), ('no-preference', 'No Preference')]
    )
    
    # Booth sharing
    sharing_booth = models.CharField(
        max_length=3, 
        blank=True, 
        choices=[('yes', 'Yes'), ('no', 'No')]
    )
    booth_partner_instagram = models.CharField(max_length=100, blank=True)
    
    # Additional information
    price_range = models.CharField(max_length=100, blank=True)
    additional_notes = models.TextField(blank=True)
    
    # Multi-date booking support
    is_multi_date = models.BooleanField(default=False)
    multi_date_group_id = models.CharField(max_length=100, blank=True, null=True)
    
    # Payment fields
    stripe_payment_id = models.CharField(
        max_length=200, 
        blank=True, 
        help_text="Stripe Checkout Session ID"
    )
    stripe_payment_intent_id = models.CharField(
        max_length=200, 
        blank=True, 
        help_text="Stripe Payment Intent ID"
    )
    payment_status = models.CharField(
        max_length=20,
        choices=PAYMENT_STATUS,
        default='pending'
    )
    is_paid = models.BooleanField(default=False)
    amount_paid = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=0.00,
        help_text="Amount paid in dollars"
    )
    timestamp = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.first_name} {self.last_name} - {self.event.date}"


class GeneralVendorBooking(BaseVendorBooking):
    """General vendor booking with vendor-specific fields"""
    products_selling = models.TextField(help_text="What products/items will be sold")
    electricity_cord = models.CharField(
        max_length=3,
        blank=True,
        choices=[('yes', 'Yes'), ('no', 'No')],
        help_text="Can bring own extension cord"
    )

    class Meta:
        ordering = ['-timestamp']
        verbose_name = 'General Vendor Booking'
        verbose_name_plural = 'General Vendor Bookings'

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        super().save(*args, **kwargs)
        
        # If this is a new booking and payment is completed, decrease available spots
        if is_new and self.payment_status == 'approved':
            self.event.regular_spots_available = models.F('regular_spots_available') - 1
            self.event.save(update_fields=['regular_spots_available'])


class FoodTruckBooking(BaseVendorBooking):
    """Food truck booking with food truck-specific fields"""
    cuisine_type = models.CharField(
        max_length=100, 
        help_text="Type of cuisine (e.g., Mexican, Italian, BBQ)"
    )
    food_items = models.TextField(help_text="What types of food will be sold")
    setup_size = models.CharField(max_length=100, blank=True, help_text="Truck size or dimensions")
    generator = models.CharField(
        max_length=10,
        blank=True,
        choices=[('yes', 'Yes - quiet generator'), ('no', 'No - need power hookup'), ('battery', 'Battery/Solar')],
        help_text="Power source"
    )
    health_permit = models.CharField(max_length=100, blank=True, help_text="Health permit number")

    class Meta:
        ordering = ['-timestamp']
        verbose_name = 'Food Truck Booking'
        verbose_name_plural = 'Food Truck Bookings'

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        super().save(*args, **kwargs)
        
        # If this is a new booking and payment is completed, decrease available spots
        if is_new and self.payment_status == 'approved':
            self.event.food_spots_available = models.F('food_spots_available') - 1
            self.event.save(update_fields=['food_spots_available'])