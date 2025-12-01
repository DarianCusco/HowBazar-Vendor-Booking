from rest_framework import viewsets, status
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
import stripe
from .models import Event, BoothSlot, VendorBooking
from .serializers import (
    EventSerializer,
    EventListSerializer,
    BoothSlotSerializer,
    VendorBookingSerializer,
    ReserveBoothSlotSerializer
)

stripe.api_key = settings.STRIPE_SECRET_KEY


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
            available_count = event.booth_slots.filter(is_available=True).count()
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

    # Create booking (unpaid)
    booking = VendorBooking.objects.create(
        booth_slot=booth_slot,
        vendor_name=serializer.validated_data['vendor_name'],
        vendor_email=serializer.validated_data['vendor_email'],
        business_name=serializer.validated_data.get('business_name', ''),
        phone=serializer.validated_data['phone'],
        notes=serializer.validated_data.get('notes', ''),
        is_paid=False
    )

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
            mode='payment',
            success_url=f"{settings.FRONTEND_BASE_URL}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{settings.FRONTEND_BASE_URL}/checkout/cancel",
            metadata={
                'booking_id': str(booking.id),
                'booth_slot_id': str(booth_slot.id),
            },
        )

        booking.stripe_payment_id = checkout_session.id
        booking.save()

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

    # Create booking (unpaid) with auto-assigned slot
    booking = VendorBooking.objects.create(
        booth_slot=booth_slot,
        vendor_name=serializer.validated_data['vendor_name'],
        vendor_email=serializer.validated_data['vendor_email'],
        business_name=serializer.validated_data.get('business_name', ''),
        phone=serializer.validated_data['phone'],
        notes=serializer.validated_data.get('notes', ''),
        is_paid=False
    )

    # Create Stripe Checkout Session with manual capture
    try:
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'usd',
                    'product_data': {
                        'name': f'{event.name} - Vendor Booth Spot',
                        'description': f'Event: {event.name}\nDate: {event.date}\nLocation: {event.location}\nPayment pending approval.',
                    },
                    'unit_amount': int(event.price * 100),  # Convert to cents
                },
                'quantity': 1,
            }],
            mode='payment',
            payment_intent_data={
                'capture_method': 'manual',  # Requires manual capture/approval
            },
            success_url=f"{settings.FRONTEND_BASE_URL}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{settings.FRONTEND_BASE_URL}/checkout/cancel",
            metadata={
                'booking_id': str(booking.id),
                'booth_slot_id': str(booth_slot.id),
            },
        )

        booking.stripe_payment_id = checkout_session.id
        booking.save()

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

    # Handle the checkout.session.completed event (payment authorized but not captured yet)
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        booking_id = session['metadata'].get('booking_id')
        booth_slot_id = session['metadata'].get('booth_slot_id')
        payment_intent_id = session.get('payment_intent')

        try:
            booking = VendorBooking.objects.get(id=booking_id)
            booking.stripe_payment_id = session['id']
            if payment_intent_id:
                booking.stripe_payment_intent_id = payment_intent_id
            # Don't mark as paid yet - payment is only authorized, not captured
            booking.save()

            # Don't mark slot as unavailable yet - wait for payment capture

        except VendorBooking.DoesNotExist as e:
            return Response({'error': f'Booking not found: {str(e)}'}, status=400)

    # Handle the payment_intent.succeeded event (payment captured/approved)
    if event['type'] == 'payment_intent.succeeded':
        payment_intent = event['data']['object']
        payment_intent_id = payment_intent['id']

        try:
            # Find booking by payment intent ID
            booking = VendorBooking.objects.get(stripe_payment_intent_id=payment_intent_id)
            booking.is_paid = True
            booking.save()

            # Now mark booth slot as unavailable
            booth_slot = booking.booth_slot
            booth_slot.is_available = False
            booth_slot.save()

            # TODO: Send confirmation email to vendor
            # You can use Django's email functionality here

        except VendorBooking.DoesNotExist:
            # Payment intent not found in our system - might be from another source
            pass

    return Response({'status': 'success'})

