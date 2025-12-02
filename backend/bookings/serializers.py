from rest_framework import serializers
from .models import Event, BoothSlot, VendorBooking


class BoothSlotSerializer(serializers.ModelSerializer):
    class Meta:
        model = BoothSlot
        fields = ['id', 'event', 'spot_number', 'is_available']


class EventSerializer(serializers.ModelSerializer):
    booth_slots = BoothSlotSerializer(many=True, read_only=True)
    available_slots_count = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = ['id', 'name', 'date', 'location', 'description', 'price', 'number_of_spots', 'booth_slots', 'available_slots_count']

    def get_available_slots_count(self, obj):
        return obj.booth_slots.filter(is_available=True).count()


class EventListSerializer(serializers.ModelSerializer):
    available_slots_count = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = ['id', 'name', 'date', 'location', 'description', 'price', 'number_of_spots', 'available_slots_count']

    def get_available_slots_count(self, obj):
        return obj.booth_slots.filter(is_available=True).count()


class VendorBookingSerializer(serializers.ModelSerializer):
    class Meta:
        model = VendorBooking
        fields = ['id', 'booth_slot', 'vendor_type', 'first_name', 'last_name', 'vendor_email', 'business_name', 'phone', 'notes', 'is_paid', 'timestamp']
        read_only_fields = ['id', 'is_paid', 'timestamp']


class ReserveBoothSlotSerializer(serializers.Serializer):
    vendor_type = serializers.ChoiceField(
        choices=[('regular', 'General Vendor'), ('food', 'Food Truck Vendor')],
        default='regular',
        required=False,
        help_text="Type of vendor: 'regular' for General Vendor, 'food' for Food Truck Vendor"
    )
    first_name = serializers.CharField(max_length=100)
    last_name = serializers.CharField(max_length=100)
    vendor_email = serializers.EmailField()
    business_name = serializers.CharField(max_length=200, required=False, allow_blank=True)
    phone = serializers.CharField(max_length=20)
    notes = serializers.CharField(required=False, allow_blank=True)

