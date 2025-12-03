from rest_framework import serializers
from .models import Event, GeneralVendorBooking, FoodTruckBooking


class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = ['id', 'name', 'date', 'location', 'description', 'price', 'number_of_spots']


class EventListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = ['id', 'name', 'date', 'location', 'description', 'price', 'number_of_spots']


class GeneralVendorBookingSerializer(serializers.ModelSerializer):
    class Meta:
        model = GeneralVendorBooking
        fields = '__all__'
        read_only_fields = ['id', 'is_paid', 'timestamp']


class FoodTruckBookingSerializer(serializers.ModelSerializer):
    class Meta:
        model = FoodTruckBooking
        fields = '__all__'
        read_only_fields = ['id', 'is_paid', 'timestamp']


class ReserveBoothSlotSerializer(serializers.Serializer):
    """Serializer for booking requests - handles both vendor types"""
    vendor_type = serializers.ChoiceField(
        choices=[('regular', 'General Vendor'), ('food', 'Food Truck Vendor')],
        required=True,
        help_text="Type of vendor: 'regular' for General Vendor, 'food' for Food Truck Vendor"
    )
    
    # Common fields
    first_name = serializers.CharField(max_length=100)
    last_name = serializers.CharField(max_length=100)
    vendor_email = serializers.EmailField()
    business_name = serializers.CharField(max_length=200, required=False, allow_blank=True)
    phone = serializers.CharField(max_length=20)
    
    # Personal information
    preferred_name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    pronouns = serializers.CharField(max_length=50, required=False, allow_blank=True)
    instagram = serializers.CharField(max_length=100, required=False, allow_blank=True)
    
    # Consents
    social_media_consent = serializers.CharField(max_length=10, required=False, allow_blank=True)
    photo_consent = serializers.CharField(max_length=10, required=False, allow_blank=True)
    noise_sensitive = serializers.CharField(max_length=15, required=False, allow_blank=True)
    
    # Booth sharing
    sharing_booth = serializers.CharField(max_length=10, required=False, allow_blank=True)
    booth_partner_instagram = serializers.CharField(max_length=100, required=False, allow_blank=True)
    
    # Additional
    price_range = serializers.CharField(max_length=100, required=False, allow_blank=True)
    additional_notes = serializers.CharField(required=False, allow_blank=True)
    
    # General vendor specific
    products_selling = serializers.CharField(required=False, allow_blank=True)
    electricity_cord = serializers.CharField(max_length=10, required=False, allow_blank=True)
    
    # Food truck specific
    cuisine_type = serializers.CharField(max_length=100, required=False, allow_blank=True)
    food_items = serializers.CharField(required=False, allow_blank=True)
    setup_size = serializers.CharField(max_length=100, required=False, allow_blank=True)
    generator = serializers.CharField(max_length=10, required=False, allow_blank=True)
    
    # Legacy notes field (for backward compatibility)
    notes = serializers.CharField(required=False, allow_blank=True)

