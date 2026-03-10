from rest_framework import viewsets, status
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.db import transaction
from django.db.models import F
from datetime import datetime
import stripe
import json
import uuid
from .models import Event, BoothSlot, GeneralVendorBooking, FoodTruckBooking
from .serializers import (
    EventSerializer,
    EventListSerializer,
    CalendarEventSerializer,
    BoothSlotSerializer,
    GeneralVendorBookingSerializer,
    FoodTruckBookingSerializer,
    ReserveBoothSlotSerializer,
    MultiDateReservationSerializer,
    PaymentStatusSerializer
)

stripe.api_key = settings.STRIPE_SECRET_KEY


def get_price_for_vendor_type(vendor_type, event=None):
    """Get price based on vendor type"""
    if vendor_type == 'food':
        return 75.00  # Food truck price
    return 35.00  # Regular vendor price


def check_availability(event, vendor_type, quantity=1):
    """Check if spots are available for the given vendor type"""
    if vendor_type == 'food':
        return event.food_spots_available >= quantity
    return event.regular_spots_available >= quantity


def create_booking_from_data(event, data, multi_date_group_id=None):
    """Helper function to create the appropriate booking model"""
    vendor_type = data.get('vendor_type', 'regular')
    
    common_fields = {
        'event': event,
        'first_name': data['first_name'],
        'last_name': data['last_name'],
        'vendor_email': data['vendor_email'],
        'business_name': data.get('business_name', ''),
        'phone': data['phone'],
        'preferred_name': data.get('preferred_name', ''),
        'pronouns': data.get('pronouns', ''),
        'instagram': data.get('instagram', ''),
        'social_media_consent': data.get('social_media_consent', ''),
        'photo_consent': data.get('photo_consent', ''),
        'noise_sensitive': data.get('noise_sensitive', ''),
        'sharing_booth': data.get('sharing_booth', ''),
        'booth_partner_instagram': data.get('booth_partner_instagram', ''),
        'price_range': data.get('price_range', ''),
        'additional_notes': data.get('additional_notes', ''),
        'payment_status': 'pending',
        'is_paid': False,
        'amount_paid': 0,
        'is_multi_date': multi_date_group_id is not None,
        'multi_date_group_id': multi_date_group_id,
    }
    
    # Try to find an available booth slot of the correct type
    booth_slot = BoothSlot.objects.filter(
        event=event,
        slot_type=vendor_type,
        is_available=True
    ).first()
    
    if not booth_slot:
        # Find the next available spot number across ALL slots for this event
        # (since spot_number must be unique per event, not per slot_type)
        existing_slots = BoothSlot.objects.filter(event=event).order_by('-spot_number')
        
        if existing_slots.exists():
            # Get the highest spot number and increment
            last_spot = existing_slots.first().spot_number
            try:
                last_number = int(last_spot)
                next_number = last_number + 1
            except ValueError:
                # Fallback if spot_number isn't a simple integer string
                next_number = existing_slots.count() + 1
        else:
            next_number = 1
        
        # Create a new booth slot with the next available number
        booth_slot = BoothSlot.objects.create(
            event=event,
            spot_number=f"{next_number:03d}",
            slot_type=vendor_type,
            is_available=True
        )
    
    common_fields['booth_slot'] = booth_slot
    
    if vendor_type == 'food':
        return FoodTruckBooking.objects.create(
            **common_fields,
            cuisine_type=data.get('cuisine_type', ''),
            food_items=data.get('food_items', ''),
            setup_size=data.get('setup_size', ''),
            generator=data.get('generator', ''),
            health_permit=data.get('health_permit', ''),
        )
    else:
        return GeneralVendorBooking.objects.create(
            **common_fields,
            products_selling=data.get('products_selling', ''),
            electricity_cord=data.get('electricity_cord', ''),
        )


class EventViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing events"""
    queryset = Event.objects.all().order_by('date')
    serializer_class = EventSerializer

    def get_serializer_class(self):
        if self.action == 'list':
            return EventListSerializer
        return EventSerializer

    @action(detail=False, methods=['get'])
    def calendar(self, request):
        """Returns events with availability for calendar view"""
        events = Event.objects.all().order_by('date')
        
        # Get market status from query params (optional)
        market_status = request.query_params.get('status', {})
        
        calendar_data = []
        for event in events:
            status = market_status.get(str(event.date), 'available')
            calendar_data.append({
                'id': event.id,
                'name': event.name,
                'date': event.date,
                'regular_spots_available': event.regular_spots_available,
                'food_spots_available': event.food_spots_available,
                'regular_spots_total': event.regular_spots_total,
                'food_spots_total': event.food_spots_total,
                'status': status,
            })
        
        serializer = CalendarEventSerializer(calendar_data, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def availability(self, request, pk=None):
        """Get detailed availability for an event"""
        event = self.get_object()
        return Response({
            'date': event.date,
            'regular': {
                'available': event.regular_spots_available,
                'total': event.regular_spots_total,
                'price': float(event.regular_price)
            },
            'food': {
                'available': event.food_spots_available,
                'total': event.food_spots_total,
                'price': float(event.food_price)
            }
        })


@api_view(['GET'])
def booth_slot_detail(request, pk):
    """Get details of a specific booth slot"""
    booth_slot = get_object_or_404(BoothSlot, pk=pk)
    serializer = BoothSlotSerializer(booth_slot)
    return Response(serializer.data)


@api_view(['POST'])
def reserve_event_spot(request, event_id):
    """Reserve a spot for a single event"""
    event = get_object_or_404(Event, pk=event_id)
    
    serializer = ReserveBoothSlotSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    vendor_type = serializer.validated_data.get('vendor_type')
    
    # Check availability
    if not check_availability(event, vendor_type):
        return Response(
            {'error': f'No {vendor_type} spots available for this event'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Get price
    price_amount = get_price_for_vendor_type(vendor_type)
    
    # Create booking (unpaid)
    booking = create_booking_from_data(event, serializer.validated_data)
    
    # Get frontend URL
    origin = request.headers.get('Origin')
    if origin and ('vercel.app' in origin or 'localhost' in origin or '127.0.0.1' in origin):
        frontend_url = origin.rstrip('/')
    else:
        frontend_url = settings.FRONTEND_BASE_URL.rstrip('/')
    
    # Create Stripe Checkout Session
    try:
        vendor_type_label = 'Food Truck' if vendor_type == 'food' else 'Vendor'
        
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'usd',
                    'product_data': {
                        'name': f'{event.name} - {vendor_type_label} Spot',
                        'description': (
                            f'Event: {event.name}\n'
                            f'Date: {event.date}\n'
                            f'Vendor Type: {vendor_type_label}\n'
                            f'Booking ID: {booking.id}'
                        ),
                    },
                    'unit_amount': int(price_amount * 100),  # Convert to cents
                },
                'quantity': 1,
            }],
            mode='payment',
            payment_intent_data={
                'capture_method': 'manual',  # Requires manual approval
                'metadata': {
                    'booking_id': str(booking.id),
                    'vendor_type': vendor_type,
                }
            },
            allow_promotion_codes=True,
            success_url=f"{frontend_url}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{frontend_url}/checkout/cancel",
            metadata={
                'booking_id': str(booking.id),
                'vendor_type': vendor_type,
                'event_date': str(event.date),
                'is_multi_date': 'false',
            },
        )

        # Update booking with Stripe session ID
        booking.stripe_payment_id = checkout_session.id
        booking.payment_status = 'authorized'
        booking.amount_paid = price_amount
        booking.save(update_fields=['stripe_payment_id', 'payment_status', 'amount_paid'])

        return Response({
            'checkout_url': checkout_session.url,
            'session_id': checkout_session.id,
            'booking_id': booking.id,
        })

    except stripe.error.StripeError as e:
        # Clean up booking if Stripe fails
        booking.delete()
        return Response(
            {'error': f'Stripe error: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
def reserve_multi_event_spots(request):
    """Reserve multiple dates at once"""
    serializer = MultiDateReservationSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    reservations = serializer.validated_data.get('reservations', [])
    
    if not reservations:
        return Response(
            {'error': 'No reservations provided'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Generate a group ID for this multi-date booking
    multi_date_group_id = str(uuid.uuid4())
    
    bookings = []
    total_price = 0
    vendor_type = None
    events_to_update = []
    
    # Validate all dates first
    for reservation in reservations:
        date_str = reservation.get('eventDate')
        if not date_str:
            return Response(
                {'error': 'Missing eventDate in reservation'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Find event for this date
        try:
            event = Event.objects.get(date=date_str)
        except Event.DoesNotExist:
            return Response(
                {'error': f'No event found for date {date_str}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate reservation data
        data = reservation.get('reservationData', {})
        data_serializer = ReserveBoothSlotSerializer(data=data)
        if not data_serializer.is_valid():
            return Response(
                {'errors': {date_str: data_serializer.errors}},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Set vendor type from first reservation
        if vendor_type is None:
            vendor_type = data_serializer.validated_data.get('vendor_type')
        
        # Check availability
        if not check_availability(event, vendor_type):
            return Response(
                {'error': f'No {vendor_type} spots available for {date_str}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Calculate price
        price = get_price_for_vendor_type(vendor_type)
        total_price += price
        
        # Store for later
        events_to_update.append({
            'event': event,
            'data': data_serializer.validated_data,
            'price': price,
        })
    
    # Create all bookings
    try:
        with transaction.atomic():
            for item in events_to_update:
                booking = create_booking_from_data(
                    item['event'], 
                    item['data'],
                    multi_date_group_id=multi_date_group_id
                )
                bookings.append(booking)
                
                # Don't decrease spots yet - wait for payment
    except Exception as e:
        return Response(
            {'error': f'Failed to create bookings: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    # Get frontend URL
    origin = request.headers.get('Origin')
    if origin and ('vercel.app' in origin or 'localhost' in origin or '127.0.0.1' in origin):
        frontend_url = origin.rstrip('/')
    else:
        frontend_url = settings.FRONTEND_BASE_URL.rstrip('/')
    
    # Create Stripe Checkout Session
    try:
        vendor_type_label = 'Food Truck' if vendor_type == 'food' else 'Vendor'
        dates = [b.event.date.strftime('%Y-%m-%d') for b in bookings]
        dates_str = ', '.join(dates)
        
        line_items = [{
            'price_data': {
                'currency': 'usd',
                'product_data': {
                    'name': f'Multi-Day Market Package - {len(bookings)} Days',
                    'description': (
                        f'{vendor_type_label} Package\n'
                        f'Dates: {dates_str}\n'
                        f'Booking IDs: {",".join([str(b.id) for b in bookings])}'
                    ),
                },
                'unit_amount': int(total_price * 100),
            },
            'quantity': 1,
        }]
        
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=line_items,
            mode='payment',
            payment_intent_data={
                'capture_method': 'manual',
                'metadata': {
                    'multi_date_group_id': multi_date_group_id,
                    'num_bookings': str(len(bookings)),
                    'vendor_type': vendor_type,
                }
            },
            allow_promotion_codes=True,
            success_url=f"{frontend_url}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{frontend_url}/checkout/cancel",
            metadata={
                'booking_ids': ','.join([str(b.id) for b in bookings]),
                'multi_date_group_id': multi_date_group_id,
                'num_dates': str(len(bookings)),
                'vendor_type': vendor_type,
                'total_price': str(total_price),
                'is_multi_date': 'true',
            },
        )
        
        # Update all bookings with Stripe session ID
        for booking in bookings:
            booking.stripe_payment_id = checkout_session.id
            booking.payment_status = 'authorized'
            booking.amount_paid = get_price_for_vendor_type(vendor_type)
            booking.save(update_fields=['stripe_payment_id', 'payment_status', 'amount_paid'])
        
        return Response({
            'checkout_url': checkout_session.url,
            'session_id': checkout_session.id,
            'total_price': total_price,
            'num_dates': len(bookings),
            'booking_ids': [b.id for b in bookings],
        })
        
    except stripe.error.StripeError as e:
        # Clean up bookings if Stripe fails
        for booking in bookings:
            booking.delete()
        return Response(
            {'error': f'Stripe error: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@csrf_exempt
@api_view(['POST'])
def stripe_webhook(request):
    """Handle Stripe webhook events"""
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
    endpoint_secret = settings.STRIPE_WEBHOOK_SECRET

    if not endpoint_secret:
        print("ERROR: Webhook secret not configured")
        return Response({'error': 'Webhook secret not configured'}, status=500)

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, endpoint_secret
        )
    except ValueError as e:
        print(f"ERROR: Invalid payload: {e}")
        return Response({'error': 'Invalid payload'}, status=400)
    except stripe.error.SignatureVerificationError as e:
        print(f"ERROR: Invalid signature: {e}")
        return Response({'error': 'Invalid signature'}, status=400)

    if event['type'] == 'payment_intent.succeeded':
        payment_intent = event['data']['object']
        payment_intent_id = payment_intent['id']
        
        print(f"WEBHOOK: payment_intent.succeeded - id={payment_intent_id}")
        
        # Try to get metadata from the payment intent
        metadata = payment_intent.get('metadata', {})
        multi_date_group_id = metadata.get('multi_date_group_id')
        
        with transaction.atomic():
            if multi_date_group_id:
                # Multi-date booking
                general_bookings = GeneralVendorBooking.objects.filter(
                    multi_date_group_id=multi_date_group_id,
                    payment_status='authorized'
                )
                food_bookings = FoodTruckBooking.objects.filter(
                    multi_date_group_id=multi_date_group_id,
                    payment_status='authorized'
                )
                
                # Update all bookings
                for booking in list(general_bookings) + list(food_bookings):
                    booking.payment_status = 'approved'
                    booking.is_paid = True
                    booking.stripe_payment_intent_id = payment_intent_id
                    booking.save(update_fields=['payment_status', 'is_paid', 'stripe_payment_intent_id'])
                    
                    # Decrease available spots
                    event = booking.event
                    if booking.__class__.__name__ == 'FoodTruckBooking':
                        if event.food_spots_available > 0:
                            event.food_spots_available = F('food_spots_available') - 1
                            event.save(update_fields=['food_spots_available'])
                            # Refresh from DB to get the new value
                            event.refresh_from_db()
                            print(f"WEBHOOK: Decreased food spots for {event.date} to {event.food_spots_available}")
                    else:
                        if event.regular_spots_available > 0:
                            event.regular_spots_available = F('regular_spots_available') - 1
                            event.save(update_fields=['regular_spots_available'])
                            # Refresh from DB to get the new value
                            event.refresh_from_db()
                            print(f"WEBHOOK: Decreased regular spots for {event.date} to {event.regular_spots_available}")
                    
                    # Mark booth slot as unavailable
                    if booking.booth_slot:
                        booking.booth_slot.is_available = False
                        booking.booth_slot.save(update_fields=['is_available'])
                    
                    print(f"WEBHOOK: Approved booking {booking.id} for {event.date}")
            else:
                # Single booking - find by payment intent ID in bookings
                booking = GeneralVendorBooking.objects.filter(
                    stripe_payment_intent_id=payment_intent_id,
                    payment_status='authorized'
                ).first()
                if not booking:
                    booking = FoodTruckBooking.objects.filter(
                        stripe_payment_intent_id=payment_intent_id,
                        payment_status='authorized'
                    ).first()
                
                if booking:
                    booking.payment_status = 'approved'
                    booking.is_paid = True
                    booking.stripe_payment_intent_id = payment_intent_id
                    booking.save(update_fields=['payment_status', 'is_paid', 'stripe_payment_intent_id'])
                    
                    # Decrease available spots
                    event = booking.event
                    if booking.__class__.__name__ == 'FoodTruckBooking':
                        if event.food_spots_available > 0:
                            event.food_spots_available = F('food_spots_available') - 1
                            event.save(update_fields=['food_spots_available'])
                            event.refresh_from_db()
                            print(f"WEBHOOK: Decreased food spots for {event.date} to {event.food_spots_available}")
                    else:
                        if event.regular_spots_available > 0:
                            event.regular_spots_available = F('regular_spots_available') - 1
                            event.save(update_fields=['regular_spots_available'])
                            event.refresh_from_db()
                            print(f"WEBHOOK: Decreased regular spots for {event.date} to {event.regular_spots_available}")
                    
                    # Mark booth slot as unavailable
                    if booking.booth_slot:
                        booking.booth_slot.is_available = False
                        booking.booth_slot.save(update_fields=['is_available'])
                    
                    print(f"WEBHOOK: Approved single booking {booking.id} for {event.date}")

    # Handle payment_intent.payment_failed
    if event['type'] == 'payment_intent.payment_failed':
        payment_intent = event['data']['object']
        print(f"WEBHOOK: payment_intent.payment_failed - id={payment_intent['id']}")
        # Could mark bookings as failed, but we'll let them expire

    return Response({'status': 'success'})


@api_view(['GET'])
def booking_status(request, session_id):
    """Get booking status by Stripe session ID"""
    # Find all bookings with this session ID
    general_bookings = GeneralVendorBooking.objects.filter(stripe_payment_id=session_id)
    food_bookings = FoodTruckBooking.objects.filter(stripe_payment_id=session_id)
    
    bookings = list(general_bookings) + list(food_bookings)
    
    if not bookings:
        return Response(
            {'error': 'No bookings found for this session'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    first_booking = bookings[0]
    
    # Parse additional_notes to get selected dates if stored
    selected_dates = []
    try:
        if first_booking.additional_notes:
            notes_data = json.loads(first_booking.additional_notes)
            selected_dates = notes_data.get('selectedDates', [])
    except (json.JSONDecodeError, TypeError):
        pass
    
    # Calculate total price
    total_price = sum([float(b.amount_paid) for b in bookings])
    
    # Serialize bookings
    bookings_data = []
    for booking in bookings:
        if isinstance(booking, GeneralVendorBooking):
            serializer = GeneralVendorBookingSerializer(booking)
        else:
            serializer = FoodTruckBookingSerializer(booking)
        bookings_data.append(serializer.data)
    
    return Response({
        'status': 'success',
        'payment_status': first_booking.payment_status,
        'is_paid': first_booking.is_paid,
        'num_dates': len(bookings),
        'total_price': total_price,
        'first_name': first_booking.first_name,
        'last_name': first_booking.last_name,
        'business_name': first_booking.business_name,
        'selected_dates': selected_dates or [b.event.date.strftime('%Y-%m-%d') for b in bookings],
        'bookings': bookings_data,
    })


@api_view(['GET'])
def event_availability(request, date):
    """Get availability for a specific date"""
    try:
        event = Event.objects.get(date=date)
    except Event.DoesNotExist:
        return Response(
            {'error': f'No event found for date {date}'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    return Response({
        'date': event.date,
        'regular': {
            'available': event.regular_spots_available,
            'total': event.regular_spots_total,
            'price': float(event.regular_price)
        },
        'food': {
            'available': event.food_spots_available,
            'total': event.food_spots_total,
            'price': float(event.food_price)
        }
    })