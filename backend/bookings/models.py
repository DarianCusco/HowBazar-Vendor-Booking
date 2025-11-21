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
        is_new = self.pk is None
        old_number_of_spots = None
        
        if not is_new:
            try:
                old_event = Event.objects.get(pk=self.pk)
                old_number_of_spots = old_event.number_of_spots
            except Event.DoesNotExist:
                pass
        
        super().save(*args, **kwargs)
        
        # Create or update booth slots based on number_of_spots
        current_slots = self.booth_slots.count()
        target_slots = self.number_of_spots
        
        if is_new or old_number_of_spots != target_slots:
            if target_slots > current_slots:
                # Add new slots
                for i in range(current_slots + 1, target_slots + 1):
                    self.booth_slots.create(
                        spot_number=f"{i:03d}",
                        is_available=True
                    )
            elif target_slots < current_slots:
                # Remove excess slots (only if they're not booked)
                excess_slots = self.booth_slots.order_by('spot_number')[target_slots:]
                for slot in excess_slots:
                    if slot.is_available:
                        slot.delete()
                    # If slot is booked, we keep it but don't count it as available


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


class VendorBooking(models.Model):
    booth_slot = models.ForeignKey(BoothSlot, on_delete=models.CASCADE, related_name='bookings')
    vendor_name = models.CharField(max_length=200)
    vendor_email = models.EmailField(validators=[EmailValidator()])
    business_name = models.CharField(max_length=200, blank=True)
    phone = models.CharField(max_length=20)
    notes = models.TextField(blank=True)
    stripe_payment_id = models.CharField(max_length=200, blank=True)
    is_paid = models.BooleanField(default=False)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.vendor_name} - {self.booth_slot}"

