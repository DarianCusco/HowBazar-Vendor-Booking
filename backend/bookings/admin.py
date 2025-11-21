from django.contrib import admin
from .models import Event, BoothSlot, VendorBooking


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ['name', 'date', 'location', 'price', 'number_of_spots', 'available_spots_count', 'created_at']
    list_filter = ['date', 'created_at']
    search_fields = ['name', 'location']
    date_hierarchy = 'date'
    fields = ['name', 'date', 'location', 'description', 'price', 'number_of_spots']
    readonly_fields = []
    
    def available_spots_count(self, obj):
        return obj.booth_slots.filter(is_available=True).count()
    available_spots_count.short_description = 'Available Spots'
    
    def get_readonly_fields(self, request, obj=None):
        # Make number_of_spots read-only if there are booked slots (to prevent data loss)
        if obj and obj.booth_slots.filter(is_available=False).exists():
            return ['number_of_spots']
        return []


@admin.register(BoothSlot)
class BoothSlotAdmin(admin.ModelAdmin):
    list_display = ['event', 'spot_number', 'is_available']
    list_filter = ['is_available', 'event']
    search_fields = ['spot_number', 'event__name']
    raw_id_fields = ['event']


@admin.register(VendorBooking)
class VendorBookingAdmin(admin.ModelAdmin):
    list_display = ['vendor_name', 'booth_slot', 'vendor_email', 'is_paid', 'timestamp']
    list_filter = ['is_paid', 'timestamp']
    search_fields = ['vendor_name', 'vendor_email', 'business_name']
    raw_id_fields = ['booth_slot']
    readonly_fields = ['timestamp', 'stripe_payment_id']

