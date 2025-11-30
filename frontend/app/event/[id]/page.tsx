'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getEvent, Event, reserveEventSpot, ReserveBoothSlotData } from '@/lib/api';

export default function EventPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = parseInt(params.id as string);
  
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<ReserveBoothSlotData>({
    vendor_name: '',
    vendor_email: '',
    business_name: '',
    phone: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadEvent();
  }, [eventId]);

  const loadEvent = async () => {
    try {
      setLoading(true);
      const data = await getEvent(eventId);
      console.log('Event data:', data); // Debug log
      setEvent(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  const handleBookSpot = () => {
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      const result = await reserveEventSpot(eventId, formData);
      // Redirect to Stripe Checkout
      window.location.href = result.checkout_url;
    } catch (err) {
      console.error('Reservation error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to reserve spot';
      alert(`Error: ${errorMessage}\n\nPlease check:\n1. Backend is running\n2. Stripe keys are configured\n3. Database migrations are applied`);
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading event...</div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500 text-xl">Error: {error || 'Event not found'}</div>
      </div>
    );
  }

  const availableSlots = event.booth_slots?.filter(slot => slot.is_available) || [];
  const price = event.price ? parseFloat(String(event.price)) : 0;
  const displayPrice = isNaN(price) ? 0 : price;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.push('/')}
          className="mb-4 text-primary-600 hover:text-primary-700 font-medium"
        >
          ← Back to Calendar
        </button>

        {/* Event Details Card */}
        <div className="bg-white rounded-lg shadow-xl p-8 mb-6">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">{event.name}</h1>
          <div className="space-y-2 text-gray-600 mb-6">
            <p className="text-lg">
              <span className="font-semibold">Date:</span> {formatDate(event.date)}
            </p>
            <p className="text-lg">
              <span className="font-semibold">Location:</span> {event.location}
            </p>
            {event.description && (
              <p className="mt-4 text-gray-700">{event.description}</p>
            )}
          </div>
          
          {availableSlots.length === 0 ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <p className="text-red-800 font-semibold text-xl">
                SOLD OUT
              </p>
              <p className="text-red-600 mt-2">All spots have been booked for this event.</p>
            </div>
          ) : (
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <p className="text-primary-800 font-semibold text-lg">
                    {availableSlots.length} spot{availableSlots.length !== 1 ? 's' : ''} available
                  </p>
                  <p className="text-primary-600 text-sm mt-1">
                    A spot will be assigned to you after payment
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-primary-700">
                    ${displayPrice.toFixed(2)}
                  </p>
                  <p className="text-sm text-primary-600">per spot</p>
                </div>
              </div>
              <button
                onClick={handleBookSpot}
                className="w-full bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 transition font-semibold text-lg"
              >
                Book a Spot
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Reservation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full my-8 flex flex-col max-h-[90vh]">
            <div className="p-6 flex-shrink-0">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Book a Vendor Spot
              </h2>
              <p className="text-gray-600 mb-6">
                Price: <span className="font-bold text-xl">${displayPrice.toFixed(2)}</span>
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Your spot number will be assigned after payment is confirmed.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="px-6 pb-4 overflow-y-auto flex-1 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vendor Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.vendor_name}
                  onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.vendor_email}
                  onChange={(e) => setFormData({ ...formData, vendor_email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Name
                </label>
                <input
                  type="text"
                  value={formData.business_name}
                  onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              </div>

              <div className="flex gap-3 pt-4 px-6 pb-6 flex-shrink-0 border-t border-gray-200 bg-gray-50">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setFormData({
                      vendor_name: '',
                      vendor_email: '',
                      business_name: '',
                      phone: '',
                      notes: '',
                    });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
                >
                  {submitting ? 'Processing...' : 'Continue to Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

