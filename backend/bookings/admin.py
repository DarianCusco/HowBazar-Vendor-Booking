from django.contrib import admin
from .models import Event, BoothSlot, GeneralVendorBooking, FoodTruckBooking


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    # Remove available_spots_count from list_display since it's the same as number_of_spots
    list_display = ['name', 'date', 'location', 'price', 'number_of_spots', 'created_at']
    list_filter = ['date', 'created_at']
    search_fields = ['name', 'location']
    date_hierarchy = 'date'
    fields = ['name', 'date', 'location', 'description', 'price', 'number_of_spots']
    readonly_fields = ['created_at', 'updated_at']

@admin.register(BoothSlot)
class BoothSlotAdmin(admin.ModelAdmin):
    list_display = ['event', 'spot_number', 'is_available']
    list_filter = ['is_available', 'event']
    search_fields = ['spot_number', 'event__name']
    raw_id_fields = ['event']


@admin.register(GeneralVendorBooking)
class GeneralVendorBookingAdmin(admin.ModelAdmin):
    list_display = ['first_name', 'last_name', 'booth_slot', 'vendor_email', 'business_name', 'payment_status', 'is_paid', 'timestamp']
    list_filter = ['is_paid', 'timestamp']
    search_fields = ['first_name', 'last_name', 'vendor_email', 'business_name', 'products_selling']
    raw_id_fields = ['booth_slot']
    readonly_fields = ['timestamp', 'stripe_payment_id', 'stripe_payment_intent_id']
    fieldsets = (
        ('Vendor Information', {
            'fields': ('first_name', 'last_name', 'preferred_name', 'pronouns', 'vendor_email', 'phone', 'business_name', 'instagram')
        }),
        ('Booth Details', {
            'fields': ('booth_slot', 'products_selling', 'price_range', 'electricity_cord')
        }),
        ('Consents & Preferences', {
            'fields': ('social_media_consent', 'photo_consent', 'noise_sensitive', 'sharing_booth', 'booth_partner_instagram')
        }),
        ('Additional Information', {
            'fields': ('additional_notes',)
        }),
        ('Payment Information', {
            'fields': ('stripe_payment_id', 'stripe_payment_intent_id', 'is_paid', 'timestamp')
        }),
    )
    
    def payment_status(self, obj):
        if obj.is_paid:
            return "✅ Paid"
        elif obj.stripe_payment_intent_id:
            return "⏳ Pending Approval"
        elif obj.stripe_payment_id:
            return "🔵 Authorized"
        return "❌ Not Started"
    payment_status.short_description = 'Payment Status'


@admin.register(FoodTruckBooking)
class FoodTruckBookingAdmin(admin.ModelAdmin):
    list_display = ['first_name', 'last_name', 'booth_slot', 'vendor_email', 'business_name', 'cuisine_type', 'payment_status', 'is_paid', 'timestamp']
    list_filter = ['is_paid', 'timestamp', 'cuisine_type']
    search_fields = ['first_name', 'last_name', 'vendor_email', 'business_name', 'cuisine_type', 'food_items']
    raw_id_fields = ['booth_slot']
    readonly_fields = ['timestamp', 'stripe_payment_id', 'stripe_payment_intent_id']
    fieldsets = (
        ('Vendor Information', {
            'fields': ('first_name', 'last_name', 'preferred_name', 'pronouns', 'vendor_email', 'phone', 'business_name', 'instagram')
        }),
        ('Food Truck Details', {
            'fields': ('booth_slot', 'cuisine_type', 'food_items', 'setup_size', 'price_range', 'generator')
        }),
        ('Consents & Preferences', {
            'fields': ('social_media_consent', 'photo_consent', 'noise_sensitive', 'sharing_booth', 'booth_partner_instagram')
        }),
        ('Additional Information', {
            'fields': ('additional_notes',)
        }),
        ('Payment Information', {
            'fields': ('stripe_payment_id', 'stripe_payment_intent_id', 'is_paid', 'timestamp')
        }),
    )
    
    def payment_status(self, obj):
        if obj.is_paid:
            return "✅ Paid"
        elif obj.stripe_payment_intent_id:
            return "⏳ Pending Approval"
        elif obj.stripe_payment_id:
            return "🔵 Authorized"
        return "❌ Not Started"
    payment_status.short_description = 'Payment Status'

