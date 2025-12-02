# Generated manually

from django.db import migrations, models
import json


def migrate_vendor_type_from_notes(apps, schema_editor):
    """Migrate vendor_type from notes JSON to the new field"""
    VendorBooking = apps.get_model('bookings', 'VendorBooking')
    
    for booking in VendorBooking.objects.all():
        vendor_type = 'regular'  # Default
        
        # Try to parse vendor_type from notes JSON
        try:
            if booking.notes:
                notes_data = json.loads(booking.notes)
                vendor_type_from_notes = notes_data.get('vendorType')
                if vendor_type_from_notes in ['regular', 'food']:
                    vendor_type = vendor_type_from_notes
        except (json.JSONDecodeError, TypeError, AttributeError):
            pass
        
        booking.vendor_type = vendor_type
        booking.save()


def reverse_migrate_vendor_type(apps, schema_editor):
    """Reverse migration - add vendor_type back to notes JSON"""
    VendorBooking = apps.get_model('bookings', 'VendorBooking')
    
    for booking in VendorBooking.objects.all():
        try:
            if booking.notes:
                notes_data = json.loads(booking.notes)
            else:
                notes_data = {}
            
            # Add vendor_type to notes
            notes_data['vendorType'] = booking.vendor_type
            booking.notes = json.dumps(notes_data)
            booking.save()
        except (json.JSONDecodeError, TypeError, AttributeError):
            pass


class Migration(migrations.Migration):

    dependencies = [
        ('bookings', '0004_remove_vendorbooking_vendor_name_and_more'),
    ]

    operations = [
        # Add vendor_type field with default
        migrations.AddField(
            model_name='vendorbooking',
            name='vendor_type',
            field=models.CharField(
                choices=[('regular', 'General Vendor'), ('food', 'Food Truck Vendor')],
                default='regular',
                help_text="Type of vendor: General Vendor or Food Truck Vendor",
                max_length=20
            ),
        ),
        # Migrate data from notes
        migrations.RunPython(migrate_vendor_type_from_notes, reverse_migrate_vendor_type),
    ]

