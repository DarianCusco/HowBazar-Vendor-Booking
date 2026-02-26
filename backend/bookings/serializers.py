from rest_framework import serializers
from .models import Event, BoothSlot, GeneralVendorBooking, FoodTruckBooking


class BoothSlotSerializer(serializers.ModelSerializer):
    class Meta:
        model = BoothSlot
        fields = ['id', 'event', 'spot_number', 'slot_type', 'is_available']


class EventSerializer(serializers.ModelSerializer):
    booth_slots = BoothSlotSerializer(many=True, read_only=True)
    
    class Meta:
        model = Event
        fields = [
            'id', 'name', 'date', 'location', 'description',
            'regular_spots_total', 'regular_spots_available',
            'food_spots_total', 'food_spots_available',
            'regular_price', 'food_price',
            'booth_slots', 'has_regular_spots', 'has_food_spots',
            'total_spots_available'
        ]


class EventListSerializer(serializers.ModelSerializer):
    """Simplified serializer for list views"""
    class Meta:
        model = Event
        fields = [
            'id', 'name', 'date', 'location', 
            'regular_spots_available', 'food_spots_available',
            'regular_price', 'food_price'
        ]


class CalendarEventSerializer(serializers.Serializer):
    """Serializer for calendar view"""
    id = serializers.IntegerField()
    name = serializers.CharField()
    date = serializers.DateField()
    regular_spots_available = serializers.IntegerField()
    food_spots_available = serializers.IntegerField()
    regular_spots_total = serializers.IntegerField()
    food_spots_total = serializers.IntegerField()
    status = serializers.CharField(default='available')


class GeneralVendorBookingSerializer(serializers.ModelSerializer):
    class Meta:
        model = GeneralVendorBooking
        fields = '__all__'
        read_only_fields = ['id', 'payment_status', 'is_paid', 'timestamp', 'updated_at']


class FoodTruckBookingSerializer(serializers.ModelSerializer):
    class Meta:
        model = FoodTruckBooking
        fields = '__all__'
        read_only_fields = ['id', 'payment_status', 'is_paid', 'timestamp', 'updated_at']


class ReserveBoothSlotSerializer(serializers.Serializer):
    """Serializer for booking requests - handles both vendor types"""
    vendor_type = serializers.ChoiceField(
        choices=[('regular', 'Regular Vendor'), ('food', 'Food Truck')],
        required=True,
        help_text="Type of vendor: 'regular' or 'food'"
    )
    
    # Common required fields
    first_name = serializers.CharField(max_length=100)
    last_name = serializers.CharField(max_length=100)
    vendor_email = serializers.EmailField()
    business_name = serializers.CharField(max_length=200, required=False, allow_blank=True)
    phone = serializers.CharField(max_length=20)
    
    # Personal information (optional)
    preferred_name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    pronouns = serializers.CharField(max_length=50, required=False, allow_blank=True)
    instagram = serializers.CharField(max_length=100, required=False, allow_blank=True)
    
    # Consents
    social_media_consent = serializers.ChoiceField(
        choices=['yes', 'no'], required=False, allow_blank=True
    )
    photo_consent = serializers.ChoiceField(
        choices=['yes', 'no'], required=False, allow_blank=True
    )
    noise_sensitive = serializers.ChoiceField(
        choices=['yes', 'no', 'no-preference'], required=False, allow_blank=True
    )
    
    # Booth sharing
    sharing_booth = serializers.ChoiceField(
        choices=['yes', 'no'], required=False, allow_blank=True
    )
    booth_partner_instagram = serializers.CharField(max_length=100, required=False, allow_blank=True)
    
    # Additional
    price_range = serializers.CharField(max_length=100, required=False, allow_blank=True)
    additional_notes = serializers.CharField(required=False, allow_blank=True)
    
    # Regular vendor specific
    products_selling = serializers.CharField(required=False, allow_blank=True)
    electricity_cord = serializers.ChoiceField(
        choices=['yes', 'no'], required=False, allow_blank=True
    )
    
    # Food truck specific
    cuisine_type = serializers.CharField(max_length=100, required=False, allow_blank=True)
    food_items = serializers.CharField(required=False, allow_blank=True)
    setup_size = serializers.CharField(max_length=100, required=False, allow_blank=True)
    generator = serializers.ChoiceField(
        choices=['yes', 'no', 'battery'], required=False, allow_blank=True
    )
    health_permit = serializers.CharField(max_length=100, required=False, allow_blank=True)
    
    # Multi-date support
    multi_date_group_id = serializers.CharField(max_length=100, required=False, allow_null=True)
    
    def validate(self, data):
        """Validate based on vendor type"""
        vendor_type = data.get('vendor_type')
        
        if vendor_type == 'regular':
            if not data.get('products_selling'):
                raise serializers.ValidationError({
                    'products_selling': 'This field is required for regular vendors'
                })
        elif vendor_type == 'food':
            if not data.get('cuisine_type'):
                raise serializers.ValidationError({
                    'cuisine_type': 'This field is required for food trucks'
                })
            if not data.get('food_items'):
                raise serializers.ValidationError({
                    'food_items': 'This field is required for food trucks'
                })
        
        return data


class MultiDateReservationSerializer(serializers.Serializer):
    """Serializer for multi-date reservations"""
    reservations = serializers.ListField(
        child=serializers.DictField(),
        min_length=1
    )
    booking_type = serializers.CharField(required=False, default='multi_date')
    total_dates = serializers.IntegerField(read_only=True)


class PaymentStatusSerializer(serializers.Serializer):
    """Serializer for payment status response"""
    status = serializers.ChoiceField(choices=['pending', 'completed', 'failed'])
    num_dates = serializers.IntegerField()
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2)
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    business_name = serializers.CharField()
    selected_dates = serializers.ListField(child=serializers.DateField())
    bookings = serializers.ListField()