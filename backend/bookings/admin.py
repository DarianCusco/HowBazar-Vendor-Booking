from django.contrib import admin
from django.db.models import Count, Q
from .models import Event, BoothSlot, GeneralVendorBooking, FoodTruckBooking


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'date', 'location', 
        # Regular Vendor Columns
        'regular_spots_total_display', 'regular_spots_available_display', 'regular_bookings_count',
        # Food Truck Columns  
        'food_spots_total_display', 'food_spots_available_display', 'food_bookings_count',
        # Summary
        'total_bookings_display'
    ]
    list_filter = ['date', 'location']
    search_fields = ['name', 'location']
    date_hierarchy = 'date'
    
    # Organize fieldsets with clear sections
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'date', 'location', 'description')
        }),
        ('Regular Vendor Spots (26 total)', {
            'fields': ('regular_spots_total', 'regular_spots_available', 'regular_price'),
            'description': 'Regular vendors (artisans, makers, creators) - 26 spots per event'
        }),
        ('Food Truck Spots (2 total)', {
            'fields': ('food_spots_total', 'food_spots_available', 'food_price'),
            'description': 'Food trucks and food vendors - 2 spots per event'
        }),
    )
    readonly_fields = ['created_at', 'updated_at']
    
    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        queryset = queryset.annotate(
            regular_bookings=Count('generalvendorbooking_bookings', distinct=True),
            food_bookings=Count('foodtruckbooking_bookings', distinct=True)
        )
        return queryset

    # Regular Vendor Column Methods
    def regular_spots_total_display(self, obj):
        return obj.regular_spots_total
    regular_spots_total_display.short_description = 'Reg Total'
    regular_spots_total_display.admin_order_field = 'regular_spots_total'
    
    def regular_spots_available_display(self, obj):
        available = obj.regular_spots_available
        total = obj.regular_spots_total
        if available == 0:
            return f"❌ 0/{total}"
        elif available <= 3:
            return f"⚠️ {available}/{total}"
        else:
            return f"✅ {available}/{total}"
    regular_spots_available_display.short_description = 'Reg Available'
    regular_spots_available_display.admin_order_field = 'regular_spots_available'
    
    def regular_bookings_count(self, obj):
        return obj.regular_bookings
    regular_bookings_count.short_description = 'Reg Booked'
    
    # Food Truck Column Methods
    def food_spots_total_display(self, obj):
        return obj.food_spots_total
    food_spots_total_display.short_description = 'Food Total'
    food_spots_total_display.admin_order_field = 'food_spots_total'
    
    def food_spots_available_display(self, obj):
        available = obj.food_spots_available
        total = obj.food_spots_total
        if available == 0:
            return f"❌ 0/{total}"
        elif available == 1:
            return f"⚠️ {available}/{total}"
        else:
            return f"✅ {available}/{total}"
    food_spots_available_display.short_description = 'Food Available'
    food_spots_available_display.admin_order_field = 'food_spots_available'
    
    def food_bookings_count(self, obj):
        return obj.food_bookings
    food_bookings_count.short_description = 'Food Booked'
    
    # Total Summary
    def total_bookings_display(self, obj):
        total = obj.regular_bookings + obj.food_bookings
        return f"{total} total ({obj.regular_bookings}R + {obj.food_bookings}F)"
    total_bookings_display.short_description = 'Total Bookings'


@admin.register(BoothSlot)
class BoothSlotAdmin(admin.ModelAdmin):
    list_display = ['event', 'slot_type', 'spot_number', 'is_available']
    list_filter = ['is_available', 'slot_type', 'event']
    search_fields = ['spot_number', 'event__name']
    raw_id_fields = ['event']
    
    # Add custom action to create default slots for events
    actions = ['create_default_slots']
    
    def create_default_slots(self, request, queryset):
        """Create default 26 regular + 2 food slots for selected events"""
        created_count = 0
        for event in queryset:
            # Create 26 regular slots
            for i in range(1, 27):
                slot, created = BoothSlot.objects.get_or_create(
                    event=event,
                    spot_number=f"{i:03d}",
                    defaults={'slot_type': 'regular', 'is_available': True}
                )
                if created:
                    created_count += 1
            
            # Create 2 food slots (27 and 28)
            for i in range(27, 29):
                slot, created = BoothSlot.objects.get_or_create(
                    event=event,
                    spot_number=f"{i:03d}",
                    defaults={'slot_type': 'food', 'is_available': True}
                )
                if created:
                    created_count += 1
        
        self.message_user(
            request, 
            f"Created {created_count} new booth slots (26 regular + 2 food per event)"
        )
    create_default_slots.short_description = "Create default 26 regular + 2 food slots"


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