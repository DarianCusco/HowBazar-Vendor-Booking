from django.contrib import admin
from django.db.models import Count
from .models import Event, BoothSlot, GeneralVendorBooking, FoodTruckBooking


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'date', 'location', 
        'regular_spots_available', 'regular_spots_total',
        'food_spots_available', 'food_spots_total',
        'total_bookings'
    ]
    list_filter = ['date', 'location']
    search_fields = ['name', 'location']
    date_hierarchy = 'date'
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'date', 'location', 'description')
        }),
        ('Regular Vendor Spots', {
            'fields': ('regular_spots_total', 'regular_spots_available', 'regular_price'),
            'description': 'Regular vendors (artisans, makers, creators)'
        }),
        ('Food Truck Spots', {
            'fields': ('food_spots_total', 'food_spots_available', 'food_price'),
            'description': 'Food trucks and food vendors'
        }),
    )
    readonly_fields = ['created_at', 'updated_at']
    
    def total_bookings(self, obj):
        regular_count = GeneralVendorBooking.objects.filter(event=obj).count()
        food_count = FoodTruckBooking.objects.filter(event=obj).count()
        return f"{regular_count + food_count} total"
    total_bookings.short_description = 'Total Bookings'


@admin.register(BoothSlot)
class BoothSlotAdmin(admin.ModelAdmin):
    list_display = ['event', 'slot_type', 'spot_number', 'is_available']
    list_filter = ['is_available', 'slot_type', 'event']
    search_fields = ['spot_number', 'event__name']
    raw_id_fields = ['event']


class BaseBookingAdmin(admin.ModelAdmin):
    """Base admin class for both booking types"""
    list_filter = ['payment_status', 'is_paid', 'event__date']
    search_fields = ['first_name', 'last_name', 'vendor_email', 'business_name']
    raw_id_fields = ['event', 'booth_slot']
    readonly_fields = ['timestamp', 'updated_at', 'stripe_payment_id', 'stripe_payment_intent_id']
    
    def event_date(self, obj):
        return obj.event.date
    event_date.short_description = 'Event Date'
    event_date.admin_order_field = 'event__date'
    
    def payment_status_display(self, obj):
        status_icons = {
            'pending': '⏳',
            'authorized': '🔵',
            'approved': '✅',
            'cancelled': '❌',
            'expired': '⌛',
        }
        icon = status_icons.get(obj.payment_status, '❓')
        return f"{icon} {obj.get_payment_status_display()}"
    payment_status_display.short_description = 'Payment Status'


@admin.register(GeneralVendorBooking)
class GeneralVendorBookingAdmin(BaseBookingAdmin):
    list_display = [
        'first_name', 'last_name', 'business_name', 
        'event_date', 'products_selling', 'payment_status_display', 'amount_paid'
    ]
    fieldsets = (
        ('Vendor Information', {
            'fields': ('first_name', 'last_name', 'preferred_name', 'pronouns', 
                      'vendor_email', 'phone', 'business_name', 'instagram')
        }),
        ('Event Details', {
            'fields': ('event', 'booth_slot', 'products_selling', 'price_range', 'electricity_cord')
        }),
        ('Consents & Preferences', {
            'fields': ('social_media_consent', 'photo_consent', 'noise_sensitive', 
                      'sharing_booth', 'booth_partner_instagram')
        }),
        ('Multi-Date Booking', {
            'fields': ('is_multi_date', 'multi_date_group_id'),
            'classes': ('collapse',),
        }),
        ('Additional Information', {
            'fields': ('additional_notes',)
        }),
        ('Payment Information', {
            'fields': ('payment_status', 'is_paid', 'amount_paid', 
                      'stripe_payment_id', 'stripe_payment_intent_id', 'timestamp', 'updated_at')
        }),
    )


@admin.register(FoodTruckBooking)
class FoodTruckBookingAdmin(BaseBookingAdmin):
    list_display = [
        'first_name', 'last_name', 'business_name', 'cuisine_type',
        'event_date', 'payment_status_display', 'amount_paid'
    ]
    fieldsets = (
        ('Vendor Information', {
            'fields': ('first_name', 'last_name', 'preferred_name', 'pronouns', 
                      'vendor_email', 'phone', 'business_name', 'instagram')
        }),
        ('Event Details', {
            'fields': ('event', 'booth_slot')
        }),
        ('Food Truck Details', {
            'fields': ('cuisine_type', 'food_items', 'setup_size', 'price_range', 
                      'generator', 'health_permit')
        }),
        ('Consents & Preferences', {
            'fields': ('social_media_consent', 'photo_consent', 'noise_sensitive', 
                      'sharing_booth', 'booth_partner_instagram')
        }),
        ('Multi-Date Booking', {
            'fields': ('is_multi_date', 'multi_date_group_id'),
            'classes': ('collapse',),
        }),
        ('Additional Information', {
            'fields': ('additional_notes',)
        }),
        ('Payment Information', {
            'fields': ('payment_status', 'is_paid', 'amount_paid', 
                      'stripe_payment_id', 'stripe_payment_intent_id', 'timestamp', 'updated_at')
        }),
    )