from rest_framework import viewsets, status
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
import stripe
import json
from .models import Event, BoothSlot, GeneralVendorBooking, FoodTruckBooking
from .serializers import (
    EventSerializer,
    EventListSerializer,
    BoothSlotSerializer,
    GeneralVendorBookingSerializer,
    FoodTruckBookingSerializer,
    ReserveBoothSlotSerializer
)
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
import stripe
import json
from .models import Event, BoothSlot, GeneralVendorBooking, FoodTruckBooking
from .serializers import (
    EventSerializer,
    EventListSerializer,
    BoothSlotSerializer,
    GeneralVendorBookingSerializer,
    FoodTruckBookingSerializer,
    ReserveBoothSlotSerializer
)

stripe.api_key = settings.STRIPE_SECRET_KEY


def create_booking_from_serializer(serializer, booth_slot):
    """Helper function to create the appropriate booking model based on vendor_type"""
    vendor_type = serializer.validated_data.get('vendor_type', 'regular')
    data = serializer.validated_data
    
    common_fields = {
        'booth_slot': booth_slot,
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
        'is_paid': False,
    }
    
    if vendor_type == 'food':
        # Create FoodTruckBooking
        return FoodTruckBooking.objects.create(
            **common_fields,
            cuisine_type=data.get('cuisine_type', ''),
            food_items=data.get('food_items', ''),
            setup_size=data.get('setup_size', ''),
            generator=data.get('generator', ''),
        )
    else:
        # Create GeneralVendorBooking
        return GeneralVendorBooking.objects.create(
            **common_fields,
            products_selling=data.get('products_selling', ''),
            electricity_cord=data.get('electricity_cord', ''),
        )


class EventViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Event.objects.all()
    serializer_class = EventSerializer

    def get_serializer_class(self):
        if self.action == 'list':
            return EventListSerializer
        return EventSerializer

    @action(detail=False, methods=['get'])
    def calendar(self, request):
        """Returns events with dates for calendar view"""
        events = Event.objects.all()
        calendar_data = []
        for event in events:
            # Use number_of_spots directly since that's the available count
            available_count = event.number_of_spots
            calendar_data.append({
                'id': event.id,
                'name': event.name,
                'date': event.date,
                'available_slots': available_count,
            })
        return Response(calendar_data)


@api_view(['GET'])
def booth_slot_detail(request, pk):
    """Get details of a specific booth slot"""
    booth_slot = get_object_or_404(BoothSlot, pk=pk)
    serializer = BoothSlotSerializer(booth_slot)
    return Response(serializer.data)

@api_view(['POST'])
def reserve_booth_slot(request, pk):
    """Reserve a booth slot and create Stripe checkout session"""
    booth_slot = get_object_or_404(BoothSlot, pk=pk)
    
    if not booth_slot.is_available:
        return Response(
            {'error': 'This booth slot is no longer available'},
            status=status.HTTP_400_BAD_REQUEST
        )

    serializer = ReserveBoothSlotSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # Create booking (unpaid) - uses appropriate model based on vendor_type
    booking = create_booking_from_serializer(serializer, booth_slot)

    # Get frontend URL from request origin or fallback to settings
    origin = request.headers.get('Origin')
    if origin and ('vercel.app' in origin or 'localhost' in origin or '127.0.0.1' in origin):
        frontend_url = origin.rstrip('/')
    else:
        frontend_url = settings.FRONTEND_BASE_URL.rstrip('/')
    
    print(f"DEBUG: Using frontend URL for booth slot: {frontend_url}")

    # Create Stripe Checkout Session
    try:
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'usd',
                    'product_data': {
                        'name': f'{booth_slot.event.name} - Booth Spot {booth_slot.spot_number}',
                        'description': f'Event: {booth_slot.event.name}\nDate: {booth_slot.event.date}\nLocation: {booth_slot.event.location}',
                    },
                    'unit_amount': int(booth_slot.event.price * 100),  # Convert to cents
                },
                'quantity': 1,
            }],
            allow_promotion_code = True,
            mode='payment',
            success_url=f"{frontend_url}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{frontend_url}/checkout/cancel",
            metadata={
                'booking_id': str(booking.id),
                'booth_slot_id': str(booth_slot.id),
            },
        )

        booking.stripe_payment_id = checkout_session.id
        booking.save(update_fields=['stripe_payment_id'])

        return Response({
            'checkout_url': checkout_session.url,
            'session_id': checkout_session.id,
        })

    except stripe.error.StripeError as e:
        booking.delete()  # Clean up booking if Stripe fails
        return Response(
            {'error': f'Stripe error: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
def reserve_event_spot(request, event_id):
    """Reserve any available spot for an event (auto-assigns a booth slot)"""
    event = get_object_or_404(Event, pk=event_id)
    
    # Find first available booth slot for this event
    booth_slot = BoothSlot.objects.filter(
        event=event,
        is_available=True
    ).first()
    
    if not booth_slot:
        return Response(
            {'error': 'No available spots for this event'},
            status=status.HTTP_400_BAD_REQUEST
        )

    serializer = ReserveBoothSlotSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # Get vendor type from serializer (default to 'regular' if not provided)
    vendor_type = serializer.validated_data.get('vendor_type', 'regular')
    
    # Determine price based on vendor type (hardcoded prices)
    # $35 for regular vendors, $100 for food trucks
    if vendor_type == 'food':
        price_amount = 100.00
        vendor_type_label = 'Food Truck'
    else:  # regular or default
        price_amount = 35.00
        vendor_type_label = 'General Vendor'
    
    # Create booking (unpaid) with auto-assigned slot - uses appropriate model
    booking = create_booking_from_serializer(serializer, booth_slot)
    
    # Create Stripe Checkout Session with manual capture
    if not settings.STRIPE_SECRET_KEY:
        booking.delete()
        return Response(
            {'error': 'Stripe is not configured. Please set STRIPE_SECRET_KEY.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    # Get the frontend URL from request origin or fallback to settings
    origin = request.headers.get('Origin')
    if origin and ('vercel.app' in origin or 'localhost' in origin or '127.0.0.1' in origin):
        # Use the origin from the request
        frontend_url = origin.rstrip('/')  # Remove trailing slash if present
    else:
        # Fallback to settings
        frontend_url = settings.FRONTEND_BASE_URL.rstrip('/')
    
    print(f"DEBUG: Using frontend URL for event booking: {frontend_url}")
    
    try:
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'usd',
                    'product_data': {
                        'name': f'{event.name} - {vendor_type_label} Booth Spot',
                        'description': f'Event: {event.name}\nDate: {event.date}\nLocation: {event.location}\nVendor Type: {vendor_type_label}\nPayment pending approval.',
                    },
                    'unit_amount': int(price_amount * 100),  # Convert to cents - using hardcoded price
                },
                'quantity': 1,
            }],
            mode='payment',
            payment_intent_data={
                'capture_method': 'manual',  # Requires manual capture/approval
            },
            allow_promotion_code = True,
            success_url=f"{frontend_url}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{frontend_url}/checkout/cancel",
            metadata={
                'booking_id': str(booking.id),
                'booth_slot_id': str(booth_slot.id),
            },
        )

        booking.stripe_payment_id = checkout_session.id
        booking.save(update_fields=['stripe_payment_id'])

        return Response({
            'checkout_url': checkout_session.url,
            'session_id': checkout_session.id,
        })

    except stripe.error.StripeError as e:
        booking.delete()  # Clean up booking if Stripe fails
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
        return Response({'error': 'Webhook secret not configured'}, status=500)

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, endpoint_secret
        )
    except ValueError:
        return Response({'error': 'Invalid payload'}, status=400)
    except stripe.error.SignatureVerificationError:
        return Response({'error': 'Invalid signature'}, status=400)

    # Handle the checkout.session.completed event (payment made on Stripe)
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        booking_ids_str = session['metadata'].get('booking_ids')  # For multi-date
        booking_id = session['metadata'].get('booking_id')  # For single date
        payment_intent_id = session.get('payment_intent')
        session_id = session['id']
        payment_status = session.get('payment_status', '')

        print(f"DEBUG: checkout.session.completed received - session_id={session_id}, payment_status={payment_status}, payment_intent_id={payment_intent_id}")

        # Import here to avoid circular imports
        from .google_apps_script import get_apps_script_sync

        # Handle multi-date bookings
        if booking_ids_str:
            booking_ids = booking_ids_str.split(',')
            print(f"DEBUG: Processing multi-date bookings: {booking_ids}")
            # Query both models
            general_bookings = GeneralVendorBooking.objects.filter(id__in=booking_ids)
            food_bookings = FoodTruckBooking.objects.filter(id__in=booking_ids)
            bookings = list(general_bookings) + list(food_bookings)
            
            if not bookings:
                print(f"DEBUG: WARNING - No bookings found for IDs: {booking_ids}")
            
            for booking in bookings:
                booking.stripe_payment_id = session_id
                update_fields = ['stripe_payment_id']
                if payment_intent_id:
                    booking.stripe_payment_intent_id = payment_intent_id
                    update_fields.append('stripe_payment_intent_id')
                booking.save(update_fields=update_fields)
            
            # Sync all bookings to Google Sheets (payment made, not yet captured)
            apps_script_sync = get_apps_script_sync()
            for booking in bookings:
                try:
                    print(f"DEBUG: Attempting to sync booking {booking.id} to Google Sheets...")
                    result = apps_script_sync.sync_booking(booking)
                    if result:
                        print(f"DEBUG: SUCCESS - Synced booking {booking.id} to Google Sheets after payment")
                    else:
                        print(f"DEBUG: FAILED - Failed to sync booking {booking.id} to Google Sheets (sync_booking returned False)")
                except Exception as e:
                    print(f"DEBUG: ERROR - Exception syncing booking {booking.id} to Google Sheets: {str(e)}")
                    import traceback
                    traceback.print_exc()
            
            print(f"DEBUG: Updated {len(bookings)} bookings with session {session_id}")
        
        # Handle single date booking
        elif booking_id:
            print(f"DEBUG: Processing single booking: {booking_id}")
            booking = None
            try:
                booking = GeneralVendorBooking.objects.get(id=booking_id)
                print(f"DEBUG: Found GeneralVendorBooking {booking_id}")
            except GeneralVendorBooking.DoesNotExist:
                try:
                    booking = FoodTruckBooking.objects.get(id=booking_id)
                    print(f"DEBUG: Found FoodTruckBooking {booking_id}")
                except FoodTruckBooking.DoesNotExist:
                    print(f"DEBUG: ERROR - Booking {booking_id} not found in either model")
                    return Response({'error': f'Booking {booking_id} not found'}, status=400)
            
            if booking:
                booking.stripe_payment_id = session_id
                if payment_intent_id:
                    booking.stripe_payment_intent_id = payment_intent_id
                booking.save(update_fields=['stripe_payment_id', 'stripe_payment_intent_id'])
                
                # Sync to Google Sheets (payment made, not yet captured)
                apps_script_sync = get_apps_script_sync()
                try:
                    print(f"DEBUG: Attempting to sync booking {booking.id} to Google Sheets...")
                    result = apps_script_sync.sync_booking(booking)
                    if result:
                        print(f"DEBUG: SUCCESS - Synced booking {booking.id} to Google Sheets after payment")
                    else:
                        print(f"DEBUG: FAILED - Failed to sync booking {booking.id} to Google Sheets (sync_booking returned False)")
                except Exception as e:
                    print(f"DEBUG: ERROR - Exception syncing booking {booking.id} to Google Sheets: {str(e)}")
                    import traceback
                    traceback.print_exc()
            else:
                print(f"DEBUG: ERROR - Booking {booking_id} is None")
    
    # Also handle payment_intent.requires_capture (for manual capture - payment made, awaiting capture)
    if event['type'] == 'payment_intent.requires_capture':
        payment_intent = event['data']['object']
        payment_intent_id = payment_intent['id']
        print(f"DEBUG: payment_intent.requires_capture received - payment_intent_id={payment_intent_id}")
        
        # Import here to avoid circular imports
        from .google_apps_script import get_apps_script_sync
        
        # Find bookings by payment intent ID - check both models
        bookings = []
        try:
            general_bookings = GeneralVendorBooking.objects.filter(stripe_payment_intent_id=payment_intent_id)
            food_bookings = FoodTruckBooking.objects.filter(stripe_payment_intent_id=payment_intent_id)
            bookings = list(general_bookings) + list(food_bookings)
        except Exception as e:
            print(f"DEBUG: Error finding bookings by payment_intent_id: {str(e)}")
        
        if bookings:
            print(f"DEBUG: Found {len(bookings)} bookings for payment_intent {payment_intent_id}")
            apps_script_sync = get_apps_script_sync()
            for booking in bookings:
                try:
                    print(f"DEBUG: Attempting to sync booking {booking.id} to Google Sheets (requires_capture)...")
                    result = apps_script_sync.sync_booking(booking)
                    if result:
                        print(f"DEBUG: SUCCESS - Synced booking {booking.id} to Google Sheets after payment (requires_capture)")
                    else:
                        print(f"DEBUG: FAILED - Failed to sync booking {booking.id} to Google Sheets")
                except Exception as e:
                    print(f"DEBUG: ERROR - Exception syncing booking {booking.id}: {str(e)}")
                    import traceback
                    traceback.print_exc()
        else:
            print(f"DEBUG: No bookings found for payment_intent_id {payment_intent_id}")

    # Handle the payment_intent.succeeded event (payment captured/approved)
    if event['type'] == 'payment_intent.succeeded':
        payment_intent = event['data']['object']
        payment_intent_id = payment_intent['id']

        print(f"DEBUG WEBHOOK: payment_intent.succeeded received - id={payment_intent_id}")
        
        try:
            # Find bookings by session ID (since multiple bookings share the same session)
            # Multi-date bookings have session_id in metadata
            session_id = payment_intent.get('metadata', {}).get('session_id')
            
            if session_id:
                # Find all bookings with this session ID (for multi-date bookings) - query both models
                general_bookings = GeneralVendorBooking.objects.filter(stripe_payment_id=session_id)
                food_bookings = FoodTruckBooking.objects.filter(stripe_payment_id=session_id)
                bookings = list(general_bookings) + list(food_bookings)
                
                if bookings:
                    for booking in bookings:
                        print(f"DEBUG WEBHOOK: Found booking {booking.id} for booth slot {booking.booth_slot.id}")
                        print(f"DEBUG WEBHOOK: Booth slot was available: {booking.booth_slot.is_available}")
                        
                        booking.is_paid = True
                        booking.stripe_payment_intent_id = payment_intent_id
                        booking.save(update_fields=['is_paid', 'stripe_payment_intent_id'])
                        
                        # Mark booth slot as unavailable
                        booth_slot = booking.booth_slot
                        booth_slot.is_available = False
                        booth_slot.save()
                        
                        # DECREASE THE EVENT'S number_of_spots BY 1
                        event_obj = booth_slot.event
                        if event_obj.number_of_spots > 0:
                            event_obj.number_of_spots -= 1
                            event_obj.save(update_fields=['number_of_spots'])
                        
                        print(f"DEBUG: Decreased available spots for {event_obj.name} to {event_obj.number_of_spots}")
                    
                    print(f"DEBUG: Processed {len(bookings)} bookings for multi-date payment")
                else:
                    # Try single booking lookup as fallback - check both models
                    booking = None
                    try:
                        booking = GeneralVendorBooking.objects.get(stripe_payment_intent_id=payment_intent_id)
                    except GeneralVendorBooking.DoesNotExist:
                        try:
                            booking = FoodTruckBooking.objects.get(stripe_payment_intent_id=payment_intent_id)
                        except FoodTruckBooking.DoesNotExist:
                            pass
                    
                    if booking:
                        print(f"DEBUG WEBHOOK: Found booking {booking.id} for booth slot {booking.booth_slot.id}")
                        print(f"DEBUG WEBHOOK: Booth slot was available: {booking.booth_slot.is_available}")
                        
                        booking.is_paid = True
                        booking.save(update_fields=['is_paid'])
                        
                        booth_slot = booking.booth_slot
                        booth_slot.is_available = False
                        booth_slot.save()
                        
                        # DECREASE THE EVENT'S number_of_spots BY 1
                        event_obj = booth_slot.event
                        if event_obj.number_of_spots > 0:
                            event_obj.number_of_spots -= 1
                            event_obj.save(update_fields=['number_of_spots'])
                        
                        print(f"DEBUG: Decreased available spots for {event_obj.name} to {event_obj.number_of_spots}")
                    
            else:
                # Fallback: single booking by payment intent ID - check both models
                booking = None
                try:
                    booking = GeneralVendorBooking.objects.get(stripe_payment_intent_id=payment_intent_id)
                except GeneralVendorBooking.DoesNotExist:
                    try:
                        booking = FoodTruckBooking.objects.get(stripe_payment_intent_id=payment_intent_id)
                    except FoodTruckBooking.DoesNotExist:
                        pass
                
                if booking:
                    print(f"DEBUG WEBHOOK: Found booking {booking.id} for booth slot {booking.booth_slot.id}")
                    print(f"DEBUG WEBHOOK: Booth slot was available: {booking.booth_slot.is_available}")
                    
                    booking.is_paid = True
                    booking.save(update_fields=['is_paid'])
                    
                    booth_slot = booking.booth_slot
                    booth_slot.is_available = False
                    booth_slot.save()
                    
                    # DECREASE THE EVENT'S number_of_spots BY 1
                    event_obj = booth_slot.event
                    if event_obj.number_of_spots > 0:
                        event_obj.number_of_spots -= 1
                        event_obj.save(update_fields=['number_of_spots'])
                    
                    print(f"DEBUG: Decreased available spots for {event_obj.name} to {event_obj.number_of_spots}")
                
        except (GeneralVendorBooking.DoesNotExist, FoodTruckBooking.DoesNotExist):
            # Payment intent not found in our system - might be from another source
            print(f"DEBUG: Payment intent {payment_intent_id} not found in VendorBooking")
            pass

    return Response({'status': 'success'})


@api_view(['POST'])
def reserve_multi_event_spots(request):
    """Reserve multiple dates at once"""
    reservations = request.data.get('reservations', [])
    
    if not reservations:
        return Response(
            {'error': 'No reservations provided'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    bookings = []
    total_price = 0
    vendor_type = None
    
    # First pass: validate all dates and calculate total
    for reservation in reservations:
        date_str = reservation.get('eventDate')
        if not date_str:
            return Response(
                {'error': 'Missing eventDate in reservation'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Find event for this date
        event = Event.objects.filter(date=date_str).first()
        if not event:
            return Response(
                {'error': f'No event found for date {date_str}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Find first available booth slot
        booth_slot = BoothSlot.objects.filter(
            event=event,
            is_available=True
        ).first()
        
        if not booth_slot:
            return Response(
                {'error': f'No available spots for date {date_str}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # DECREASE SPOTS IMMEDIATELY (reserve on creation)
        if event.number_of_spots > 0:
            event.number_of_spots -= 1
            event.save(update_fields=['number_of_spots'])
            print(f"DEBUG: Decreased spots for {event.date} to {event.number_of_spots}")
        
        # Parse reservation data
        serializer = ReserveBoothSlotSerializer(data=reservation.get('reservationData', {}))
        if not serializer.is_valid():
            # Rollback spot decrease if validation fails
            if event.number_of_spots >= 0:
                event.number_of_spots += 1
                event.save(update_fields=['number_of_spots'])
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # Get vendor type from serializer (first reservation sets it for all)
        if vendor_type is None:
            vendor_type = serializer.validated_data.get('vendor_type', 'regular')
        
        # Calculate price
        price_per_day = 100.00 if vendor_type == 'food' else 35.00
        total_price += price_per_day
        
        bookings.append({
            'event': event,
            'booth_slot': booth_slot,
            'reservation_data': serializer.validated_data,
            'price': price_per_day
        })
    
    # Second pass: create all bookings
    created_bookings = []
    try:
        for booking_info in bookings:
            # Create booking (unpaid) - create serializer for each to use helper function
            reservation_serializer = ReserveBoothSlotSerializer(data=booking_info['reservation_data'])
            if not reservation_serializer.is_valid():
                # Should not happen as we validated earlier, but handle gracefully
                continue
            booking = create_booking_from_serializer(reservation_serializer, booking_info['booth_slot'])
            created_bookings.append(booking)
    
    except Exception as e:
        # Clean up any created bookings if something goes wrong
        for booking in created_bookings:
            booking.delete()
        # Rollback all spot decreases
        for booking_info in bookings:
            event = booking_info['event']
            event.number_of_spots += 1
            event.save(update_fields=['number_of_spots'])
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
    
    print(f"DEBUG: Multi-date booking - {len(bookings)} dates, total: ${total_price}")
    
    # Create Stripe Checkout Session
    try:
        vendor_type_label = 'Food Truck' if vendor_type == 'food' else 'General Vendor'
        
        # Get dates for description
        dates = [b['event'].date for b in bookings]
        dates_str = ', '.join([str(d) for d in dates])
        
        line_items = [{
            'price_data': {
                'currency': 'usd',
                'product_data': {
                    'name': f'Multi-Day Market Package - {len(bookings)} Days',
                    'description': f'{vendor_type_label} Package for {len(bookings)} dates\nDates: {dates_str}\nPayment pending approval.',
                },
                'unit_amount': int(total_price * 100),  # Total in cents
            },
            'quantity': 1,
        }]
        
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=line_items,
            mode='payment',
            payment_intent_data={
                'capture_method': 'manual',  # Requires manual capture/approval
            },
            allow_promotion_code = True,
            success_url=f"{frontend_url}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{frontend_url}/checkout/cancel",
            metadata={
                'booking_ids': ','.join([str(b.id) for b in created_bookings]),
                'num_dates': str(len(bookings)),
                'vendor_type': vendor_type or 'regular',
                'total_price': str(total_price),
            },
        )
        
        # Save Stripe session ID to all bookings
        for booking in created_bookings:
            booking.stripe_payment_id = checkout_session.id
            booking.save(update_fields=['stripe_payment_id'])
        
        return Response({
            'checkout_url': checkout_session.url,
            'session_id': checkout_session.id,
            'total_price': total_price,
            'num_dates': len(bookings),
        })
        
    except stripe.error.StripeError as e:
        # Clean up bookings if Stripe fails
        for booking in created_bookings:
            booking.delete()
        return Response(
            {'error': f'Stripe error: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
def booking_status(request, session_id):
    """Get booking status by Stripe session ID"""
    # Query both models
    general_bookings = GeneralVendorBooking.objects.filter(stripe_payment_id=session_id)
    food_bookings = FoodTruckBooking.objects.filter(stripe_payment_id=session_id)
    bookings = list(general_bookings) + list(food_bookings)
    
    if not bookings:
        return Response(
            {'error': 'No bookings found for this session'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Get common info from first booking
    first_booking = bookings[0]
    
    # Try to parse additional_notes to get selected dates (if stored there)
    selected_dates = []
    try:
        if first_booking.additional_notes:
            notes_data = json.loads(first_booking.additional_notes)
            selected_dates = notes_data.get('selectedDates', [])
    except (json.JSONDecodeError, TypeError):
        pass
    
    # Calculate total from Stripe metadata if available
    total_price = 0
    try:
        # You could fetch from Stripe API to get actual amount
        session = stripe.checkout.Session.retrieve(session_id)
        total_price = session.amount_total / 100  # Convert from cents
    except stripe.error.StripeError:
        # Fallback: calculate from number of bookings
        # Count food trucks ($100) vs general vendors ($35)
        food_count = len(food_bookings)
        general_count = len(general_bookings)
        total_price = (food_count * 100) + (general_count * 35)
    
    # Serialize bookings based on their type
    bookings_data = []
    for booking in bookings:
        if isinstance(booking, GeneralVendorBooking):
            bookings_data.append(GeneralVendorBookingSerializer(booking).data)
        else:
            bookings_data.append(FoodTruckBookingSerializer(booking).data)
    
    return Response({
        'status': 'success',
        'num_dates': len(bookings),
        'total_price': total_price,
        'first_name': first_booking.first_name,
        'last_name': first_booking.last_name,
        'business_name': first_booking.business_name,
        'selected_dates': selected_dates,
        'bookings': bookings_data,
    })
stripe.api_key = settings.STRIPE_SECRET_KEY


def create_booking_from_serializer(serializer, booth_slot):
    """Helper function to create the appropriate booking model based on vendor_type"""
    vendor_type = serializer.validated_data.get('vendor_type', 'regular')
    data = serializer.validated_data
    
    common_fields = {
        'booth_slot': booth_slot,
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
        'is_paid': False,
    }
    
    if vendor_type == 'food':
        # Create FoodTruckBooking
        return FoodTruckBooking.objects.create(
            **common_fields,
            cuisine_type=data.get('cuisine_type', ''),
            food_items=data.get('food_items', ''),
            setup_size=data.get('setup_size', ''),
            generator=data.get('generator', ''),
        )
    else:
        # Create GeneralVendorBooking
        return GeneralVendorBooking.objects.create(
            **common_fields,
            products_selling=data.get('products_selling', ''),
            electricity_cord=data.get('electricity_cord', ''),
        )


class EventViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Event.objects.all()
    serializer_class = EventSerializer

    def get_serializer_class(self):
        if self.action == 'list':
            return EventListSerializer
        return EventSerializer

    @action(detail=False, methods=['get'])
    def calendar(self, request):
        """Returns events with dates for calendar view"""
        events = Event.objects.all()
        calendar_data = []
        for event in events:
            # Use number_of_spots directly since that's the available count
            available_count = event.number_of_spots
            calendar_data.append({
                'id': event.id,
                'name': event.name,
                'date': event.date,
                'available_slots': available_count,
            })
        return Response(calendar_data)


@api_view(['GET'])
def booth_slot_detail(request, pk):
    """Get details of a specific booth slot"""
    booth_slot = get_object_or_404(BoothSlot, pk=pk)
    serializer = BoothSlotSerializer(booth_slot)
    return Response(serializer.data)

@api_view(['POST'])
def reserve_booth_slot(request, pk):
    """Reserve a booth slot and create Stripe checkout session"""
    booth_slot = get_object_or_404(BoothSlot, pk=pk)
    
    if not booth_slot.is_available:
        return Response(
            {'error': 'This booth slot is no longer available'},
            status=status.HTTP_400_BAD_REQUEST
        )

    serializer = ReserveBoothSlotSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # Create booking (unpaid) - uses appropriate model based on vendor_type
    booking = create_booking_from_serializer(serializer, booth_slot)

    # Get frontend URL from request origin or fallback to settings
    origin = request.headers.get('Origin')
    if origin and ('vercel.app' in origin or 'localhost' in origin or '127.0.0.1' in origin):
        frontend_url = origin.rstrip('/')
    else:
        frontend_url = settings.FRONTEND_BASE_URL.rstrip('/')
    
    print(f"DEBUG: Using frontend URL for booth slot: {frontend_url}")

    # Create Stripe Checkout Session
    try:
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'usd',
                    'product_data': {
                        'name': f'{booth_slot.event.name} - Booth Spot {booth_slot.spot_number}',
                        'description': f'Event: {booth_slot.event.name}\nDate: {booth_slot.event.date}\nLocation: {booth_slot.event.location}',
                    },
                    'unit_amount': int(booth_slot.event.price * 100),  # Convert to cents
                },
                'quantity': 1,
            }],
            allow_promotion_code = True,
            mode='payment',
            success_url=f"{frontend_url}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{frontend_url}/checkout/cancel",
            metadata={
                'booking_id': str(booking.id),
                'booth_slot_id': str(booth_slot.id),
            },
        )

        booking.stripe_payment_id = checkout_session.id
        booking.save(update_fields=['stripe_payment_id'])

        return Response({
            'checkout_url': checkout_session.url,
            'session_id': checkout_session.id,
        })

    except stripe.error.StripeError as e:
        booking.delete()  # Clean up booking if Stripe fails
        return Response(
            {'error': f'Stripe error: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
def reserve_event_spot(request, event_id):
    """Reserve any available spot for an event (auto-assigns a booth slot)"""
    event = get_object_or_404(Event, pk=event_id)
    
    # Find first available booth slot for this event
    booth_slot = BoothSlot.objects.filter(
        event=event,
        is_available=True
    ).first()
    
    if not booth_slot:
        return Response(
            {'error': 'No available spots for this event'},
            status=status.HTTP_400_BAD_REQUEST
        )

    serializer = ReserveBoothSlotSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # Get vendor type from serializer (default to 'regular' if not provided)
    vendor_type = serializer.validated_data.get('vendor_type', 'regular')
    
    # Determine price based on vendor type (hardcoded prices)
    # $35 for regular vendors, $100 for food trucks
    if vendor_type == 'food':
        price_amount = 100.00
        vendor_type_label = 'Food Truck'
    else:  # regular or default
        price_amount = 35.00
        vendor_type_label = 'General Vendor'
    
    # Create booking (unpaid) with auto-assigned slot - uses appropriate model
    booking = create_booking_from_serializer(serializer, booth_slot)
    
    # Create Stripe Checkout Session with manual capture
    if not settings.STRIPE_SECRET_KEY:
        booking.delete()
        return Response(
            {'error': 'Stripe is not configured. Please set STRIPE_SECRET_KEY.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    # Get the frontend URL from request origin or fallback to settings
    origin = request.headers.get('Origin')
    if origin and ('vercel.app' in origin or 'localhost' in origin or '127.0.0.1' in origin):
        # Use the origin from the request
        frontend_url = origin.rstrip('/')  # Remove trailing slash if present
    else:
        # Fallback to settings
        frontend_url = settings.FRONTEND_BASE_URL.rstrip('/')
    
    print(f"DEBUG: Using frontend URL for event booking: {frontend_url}")
    
    try:
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'usd',
                    'product_data': {
                        'name': f'{event.name} - {vendor_type_label} Booth Spot',
                        'description': f'Event: {event.name}\nDate: {event.date}\nLocation: {event.location}\nVendor Type: {vendor_type_label}\nPayment pending approval.',
                    },
                    'unit_amount': int(price_amount * 100),  # Convert to cents - using hardcoded price
                },
                'quantity': 1,
            }],
            allow_promotion_code = True,
            mode='payment',
            payment_intent_data={
                'capture_method': 'manual',  # Requires manual capture/approval
            },
            success_url=f"{frontend_url}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{frontend_url}/checkout/cancel",
            metadata={
                'booking_id': str(booking.id),
                'booth_slot_id': str(booth_slot.id),
            },
        )

        booking.stripe_payment_id = checkout_session.id
        booking.save(update_fields=['stripe_payment_id'])

        return Response({
            'checkout_url': checkout_session.url,
            'session_id': checkout_session.id,
        })

    except stripe.error.StripeError as e:
        booking.delete()  # Clean up booking if Stripe fails
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
        return Response({'error': 'Webhook secret not configured'}, status=500)

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, endpoint_secret
        )
    except ValueError:
        return Response({'error': 'Invalid payload'}, status=400)
    except stripe.error.SignatureVerificationError:
        return Response({'error': 'Invalid signature'}, status=400)

    # Handle the checkout.session.completed event (payment made on Stripe)
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        booking_ids_str = session['metadata'].get('booking_ids')  # For multi-date
        booking_id = session['metadata'].get('booking_id')  # For single date
        payment_intent_id = session.get('payment_intent')
        session_id = session['id']
        payment_status = session.get('payment_status', '')

        print(f"DEBUG: checkout.session.completed received - session_id={session_id}, payment_status={payment_status}, payment_intent_id={payment_intent_id}")

        # Import here to avoid circular imports
        from .google_apps_script import get_apps_script_sync

        # Handle multi-date bookings
        if booking_ids_str:
            booking_ids = booking_ids_str.split(',')
            print(f"DEBUG: Processing multi-date bookings: {booking_ids}")
            # Query both models
            general_bookings = GeneralVendorBooking.objects.filter(id__in=booking_ids)
            food_bookings = FoodTruckBooking.objects.filter(id__in=booking_ids)
            bookings = list(general_bookings) + list(food_bookings)
            
            if not bookings:
                print(f"DEBUG: WARNING - No bookings found for IDs: {booking_ids}")
            
            for booking in bookings:
                booking.stripe_payment_id = session_id
                update_fields = ['stripe_payment_id']
                if payment_intent_id:
                    booking.stripe_payment_intent_id = payment_intent_id
                    update_fields.append('stripe_payment_intent_id')
                booking.save(update_fields=update_fields)
            
            # Sync all bookings to Google Sheets (payment made, not yet captured)
            apps_script_sync = get_apps_script_sync()
            for booking in bookings:
                try:
                    print(f"DEBUG: Attempting to sync booking {booking.id} to Google Sheets...")
                    result = apps_script_sync.sync_booking(booking)
                    if result:
                        print(f"DEBUG: SUCCESS - Synced booking {booking.id} to Google Sheets after payment")
                    else:
                        print(f"DEBUG: FAILED - Failed to sync booking {booking.id} to Google Sheets (sync_booking returned False)")
                except Exception as e:
                    print(f"DEBUG: ERROR - Exception syncing booking {booking.id} to Google Sheets: {str(e)}")
                    import traceback
                    traceback.print_exc()
            
            print(f"DEBUG: Updated {len(bookings)} bookings with session {session_id}")
        
        # Handle single date booking
        elif booking_id:
            print(f"DEBUG: Processing single booking: {booking_id}")
            booking = None
            try:
                booking = GeneralVendorBooking.objects.get(id=booking_id)
                print(f"DEBUG: Found GeneralVendorBooking {booking_id}")
            except GeneralVendorBooking.DoesNotExist:
                try:
                    booking = FoodTruckBooking.objects.get(id=booking_id)
                    print(f"DEBUG: Found FoodTruckBooking {booking_id}")
                except FoodTruckBooking.DoesNotExist:
                    print(f"DEBUG: ERROR - Booking {booking_id} not found in either model")
                    return Response({'error': f'Booking {booking_id} not found'}, status=400)
            
            if booking:
                booking.stripe_payment_id = session_id
                if payment_intent_id:
                    booking.stripe_payment_intent_id = payment_intent_id
                booking.save(update_fields=['stripe_payment_id', 'stripe_payment_intent_id'])
                
                # Sync to Google Sheets (payment made, not yet captured)
                apps_script_sync = get_apps_script_sync()
                try:
                    print(f"DEBUG: Attempting to sync booking {booking.id} to Google Sheets...")
                    result = apps_script_sync.sync_booking(booking)
                    if result:
                        print(f"DEBUG: SUCCESS - Synced booking {booking.id} to Google Sheets after payment")
                    else:
                        print(f"DEBUG: FAILED - Failed to sync booking {booking.id} to Google Sheets (sync_booking returned False)")
                except Exception as e:
                    print(f"DEBUG: ERROR - Exception syncing booking {booking.id} to Google Sheets: {str(e)}")
                    import traceback
                    traceback.print_exc()
            else:
                print(f"DEBUG: ERROR - Booking {booking_id} is None")
    
    # Also handle payment_intent.requires_capture (for manual capture - payment made, awaiting capture)
    if event['type'] == 'payment_intent.requires_capture':
        payment_intent = event['data']['object']
        payment_intent_id = payment_intent['id']
        print(f"DEBUG: payment_intent.requires_capture received - payment_intent_id={payment_intent_id}")
        
        # Import here to avoid circular imports
        from .google_apps_script import get_apps_script_sync
        
        # Find bookings by payment intent ID - check both models
        bookings = []
        try:
            general_bookings = GeneralVendorBooking.objects.filter(stripe_payment_intent_id=payment_intent_id)
            food_bookings = FoodTruckBooking.objects.filter(stripe_payment_intent_id=payment_intent_id)
            bookings = list(general_bookings) + list(food_bookings)
        except Exception as e:
            print(f"DEBUG: Error finding bookings by payment_intent_id: {str(e)}")
        
        if bookings:
            print(f"DEBUG: Found {len(bookings)} bookings for payment_intent {payment_intent_id}")
            apps_script_sync = get_apps_script_sync()
            for booking in bookings:
                try:
                    print(f"DEBUG: Attempting to sync booking {booking.id} to Google Sheets (requires_capture)...")
                    result = apps_script_sync.sync_booking(booking)
                    if result:
                        print(f"DEBUG: SUCCESS - Synced booking {booking.id} to Google Sheets after payment (requires_capture)")
                    else:
                        print(f"DEBUG: FAILED - Failed to sync booking {booking.id} to Google Sheets")
                except Exception as e:
                    print(f"DEBUG: ERROR - Exception syncing booking {booking.id}: {str(e)}")
                    import traceback
                    traceback.print_exc()
        else:
            print(f"DEBUG: No bookings found for payment_intent_id {payment_intent_id}")

    # Handle the payment_intent.succeeded event (payment captured/approved)
    if event['type'] == 'payment_intent.succeeded':
        payment_intent = event['data']['object']
        payment_intent_id = payment_intent['id']

        print(f"DEBUG WEBHOOK: payment_intent.succeeded received - id={payment_intent_id}")
        
        try:
            # Find bookings by session ID (since multiple bookings share the same session)
            # Multi-date bookings have session_id in metadata
            session_id = payment_intent.get('metadata', {}).get('session_id')
            
            if session_id:
                # Find all bookings with this session ID (for multi-date bookings) - query both models
                general_bookings = GeneralVendorBooking.objects.filter(stripe_payment_id=session_id)
                food_bookings = FoodTruckBooking.objects.filter(stripe_payment_id=session_id)
                bookings = list(general_bookings) + list(food_bookings)
                
                if bookings:
                    for booking in bookings:
                        print(f"DEBUG WEBHOOK: Found booking {booking.id} for booth slot {booking.booth_slot.id}")
                        print(f"DEBUG WEBHOOK: Booth slot was available: {booking.booth_slot.is_available}")
                        
                        booking.is_paid = True
                        booking.stripe_payment_intent_id = payment_intent_id
                        booking.save(update_fields=['is_paid', 'stripe_payment_intent_id'])
                        
                        # Mark booth slot as unavailable
                        booth_slot = booking.booth_slot
                        booth_slot.is_available = False
                        booth_slot.save()
                        
                        # DECREASE THE EVENT'S number_of_spots BY 1
                        event_obj = booth_slot.event
                        if event_obj.number_of_spots > 0:
                            event_obj.number_of_spots -= 1
                            event_obj.save(update_fields=['number_of_spots'])
                        
                        print(f"DEBUG: Decreased available spots for {event_obj.name} to {event_obj.number_of_spots}")
                    
                    print(f"DEBUG: Processed {len(bookings)} bookings for multi-date payment")
                else:
                    # Try single booking lookup as fallback - check both models
                    booking = None
                    try:
                        booking = GeneralVendorBooking.objects.get(stripe_payment_intent_id=payment_intent_id)
                    except GeneralVendorBooking.DoesNotExist:
                        try:
                            booking = FoodTruckBooking.objects.get(stripe_payment_intent_id=payment_intent_id)
                        except FoodTruckBooking.DoesNotExist:
                            pass
                    
                    if booking:
                        print(f"DEBUG WEBHOOK: Found booking {booking.id} for booth slot {booking.booth_slot.id}")
                        print(f"DEBUG WEBHOOK: Booth slot was available: {booking.booth_slot.is_available}")
                        
                        booking.is_paid = True
                        booking.save(update_fields=['is_paid'])
                        
                        booth_slot = booking.booth_slot
                        booth_slot.is_available = False
                        booth_slot.save()
                        
                        # DECREASE THE EVENT'S number_of_spots BY 1
                        event_obj = booth_slot.event
                        if event_obj.number_of_spots > 0:
                            event_obj.number_of_spots -= 1
                            event_obj.save(update_fields=['number_of_spots'])
                        
                        print(f"DEBUG: Decreased available spots for {event_obj.name} to {event_obj.number_of_spots}")
                    
            else:
                # Fallback: single booking by payment intent ID - check both models
                booking = None
                try:
                    booking = GeneralVendorBooking.objects.get(stripe_payment_intent_id=payment_intent_id)
                except GeneralVendorBooking.DoesNotExist:
                    try:
                        booking = FoodTruckBooking.objects.get(stripe_payment_intent_id=payment_intent_id)
                    except FoodTruckBooking.DoesNotExist:
                        pass
                
                if booking:
                    print(f"DEBUG WEBHOOK: Found booking {booking.id} for booth slot {booking.booth_slot.id}")
                    print(f"DEBUG WEBHOOK: Booth slot was available: {booking.booth_slot.is_available}")
                    
                    booking.is_paid = True
                    booking.save(update_fields=['is_paid'])
                    
                    booth_slot = booking.booth_slot
                    booth_slot.is_available = False
                    booth_slot.save()
                    
                    # DECREASE THE EVENT'S number_of_spots BY 1
                    event_obj = booth_slot.event
                    if event_obj.number_of_spots > 0:
                        event_obj.number_of_spots -= 1
                        event_obj.save(update_fields=['number_of_spots'])
                    
                    print(f"DEBUG: Decreased available spots for {event_obj.name} to {event_obj.number_of_spots}")
                
        except (GeneralVendorBooking.DoesNotExist, FoodTruckBooking.DoesNotExist):
            # Payment intent not found in our system - might be from another source
            print(f"DEBUG: Payment intent {payment_intent_id} not found in VendorBooking")
            pass

    return Response({'status': 'success'})


@api_view(['POST'])
def reserve_multi_event_spots(request):
    """Reserve multiple dates at once"""
    reservations = request.data.get('reservations', [])
    
    if not reservations:
        return Response(
            {'error': 'No reservations provided'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    bookings = []
    total_price = 0
    vendor_type = None
    
    # First pass: validate all dates and calculate total
    for reservation in reservations:
        date_str = reservation.get('eventDate')
        if not date_str:
            return Response(
                {'error': 'Missing eventDate in reservation'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Find event for this date
        event = Event.objects.filter(date=date_str).first()
        if not event:
            return Response(
                {'error': f'No event found for date {date_str}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Find first available booth slot
        booth_slot = BoothSlot.objects.filter(
            event=event,
            is_available=True
        ).first()
        
        if not booth_slot:
            return Response(
                {'error': f'No available spots for date {date_str}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Parse reservation data
        serializer = ReserveBoothSlotSerializer(data=reservation.get('reservationData', {}))
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # Get vendor type from serializer (first reservation sets it for all)
        if vendor_type is None:
            vendor_type = serializer.validated_data.get('vendor_type', 'regular')
        
        # Calculate price
        price_per_day = 100.00 if vendor_type == 'food' else 35.00
        total_price += price_per_day
        
        bookings.append({
            'event': event,
            'booth_slot': booth_slot,
            'reservation_data': serializer.validated_data,
            'price': price_per_day
        })
    
    # Second pass: create all bookings
    created_bookings = []
    try:
        for booking_info in bookings:
            # Create booking (unpaid) - create serializer for each to use helper function
            reservation_serializer = ReserveBoothSlotSerializer(data=booking_info['reservation_data'])
            if not reservation_serializer.is_valid():
                # Should not happen as we validated earlier, but handle gracefully
                continue
            booking = create_booking_from_serializer(reservation_serializer, booking_info['booth_slot'])
            created_bookings.append(booking)
    
    except Exception as e:
        # Clean up any created bookings if something goes wrong
        for booking in created_bookings:
            booking.delete()
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
    
    print(f"DEBUG: Multi-date booking - {len(bookings)} dates, total: ${total_price}")
    
    # Create Stripe Checkout Session
    try:
        vendor_type_label = 'Food Truck' if vendor_type == 'food' else 'General Vendor'
        
        # Get dates for description
        dates = [b['event'].date for b in bookings]
        dates_str = ', '.join([str(d) for d in dates])
        
        line_items = [{
            'price_data': {
                'currency': 'usd',
                'product_data': {
                    'name': f'Multi-Day Market Package - {len(bookings)} Days',
                    'description': f'{vendor_type_label} Package for {len(bookings)} dates\nDates: {dates_str}\nPayment pending approval.',
                },
                'unit_amount': int(total_price * 100),  # Total in cents
            },
            'quantity': 1,
        }]
        
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=line_items,
            mode='payment',
            payment_intent_data={
                'capture_method': 'manual',  # Requires manual capture/approval
            },
            allow_promotion_code = True,
            success_url=f"{frontend_url}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{frontend_url}/checkout/cancel",
            metadata={
                'booking_ids': ','.join([str(b.id) for b in created_bookings]),
                'num_dates': str(len(bookings)),
                'vendor_type': vendor_type or 'regular',
                'total_price': str(total_price),
            },
        )
        
        # Save Stripe session ID to all bookings
        for booking in created_bookings:
            booking.stripe_payment_id = checkout_session.id
            booking.save(update_fields=['stripe_payment_id'])
        
        return Response({
            'checkout_url': checkout_session.url,
            'session_id': checkout_session.id,
            'total_price': total_price,
            'num_dates': len(bookings),
        })
        
    except stripe.error.StripeError as e:
        # Clean up bookings if Stripe fails
        for booking in created_bookings:
            booking.delete()
        return Response(
            {'error': f'Stripe error: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
def booking_status(request, session_id):
    """Get booking status by Stripe session ID"""
    # Query both models
    general_bookings = GeneralVendorBooking.objects.filter(stripe_payment_id=session_id)
    food_bookings = FoodTruckBooking.objects.filter(stripe_payment_id=session_id)
    bookings = list(general_bookings) + list(food_bookings)
    
    if not bookings:
        return Response(
            {'error': 'No bookings found for this session'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Get common info from first booking
    first_booking = bookings[0]
    
    # Try to parse additional_notes to get selected dates (if stored there)
    selected_dates = []
    try:
        if first_booking.additional_notes:
            notes_data = json.loads(first_booking.additional_notes)
            selected_dates = notes_data.get('selectedDates', [])
    except (json.JSONDecodeError, TypeError):
        pass
    
    # Calculate total from Stripe metadata if available
    total_price = 0
    try:
        # You could fetch from Stripe API to get actual amount
        session = stripe.checkout.Session.retrieve(session_id)
        total_price = session.amount_total / 100  # Convert from cents
    except stripe.error.StripeError:
        # Fallback: calculate from number of bookings
        # Count food trucks ($100) vs general vendors ($35)
        food_count = len(food_bookings)
        general_count = len(general_bookings)
        total_price = (food_count * 100) + (general_count * 35)
    
    # Serialize bookings based on their type
    bookings_data = []
    for booking in bookings:
        if isinstance(booking, GeneralVendorBooking):
            bookings_data.append(GeneralVendorBookingSerializer(booking).data)
        else:
            bookings_data.append(FoodTruckBookingSerializer(booking).data)
    
    return Response({
        'status': 'success',
        'num_dates': len(bookings),
        'total_price': total_price,
        'first_name': first_booking.first_name,
        'last_name': first_booking.last_name,
        'business_name': first_booking.business_name,
        'selected_dates': selected_dates,
        'bookings': bookings_data,
    })
