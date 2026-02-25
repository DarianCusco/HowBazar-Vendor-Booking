// app/event/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { getEvent, Event, reserveEventSpot } from '@/lib/api';
import { SPRING_MARKET_DATES, getEventTime, formatDate, VENDOR_CONFIG } from '@/lib/marketData';

export default function SpringEventPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = parseInt(params.id as string);
  
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [vendorType, setVendorType] = useState<'regular' | 'food'>('regular');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    businessName: '',
    email: '',
    phone: '',
    instagram: '',
    productsSelling: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadEvent();
  }, [eventId]);

  const loadEvent = async () => {
    try {
      const data = await getEvent(eventId);
      setEvent(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  const marketInfo = event ? SPRING_MARKET_DATES.find(d => d.date === event.date) : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">🌸</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Event Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'This event may no longer be available'}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-xl font-semibold"
          >
            ← Back to Spring Market
          </button>
        </div>
      </div>
    );
  }

  const isTentative = marketInfo?.status === 'tentative';
  const isFestival = marketInfo?.status === 'big_festival';
  const availableSlots = event.available_slots_count || 0;
  const foodSlots = event.number_of_spots || 0;
  const hasVendorSpots = availableSlots > 0;
  const hasFoodSpots = foodSlots > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-yellow-50 to-pink-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-green-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <span>←</span>
            <span>Back to Spring Market</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl overflow-hidden"
        >
          {/* Hero Section */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-8 text-white">
            <div className="text-center">
              <div className="text-5xl mb-4">🌸</div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-2">
                {formatDate(event.date)}
              </h1>
              <p className="text-xl text-green-100 mb-4">
                {getEventTime(event.date)}
              </p>
              <div className="inline-block bg-white/20 backdrop-blur-sm px-6 py-3 rounded-xl">
                <p className="text-lg">📍 {event.location || 'Downtown Gainesville'}</p>
              </div>
            </div>
          </div>

          {/* Event Info */}
          <div className="p-6 sm:p-8">
            {isTentative && (
              <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
                <p className="text-yellow-800 font-semibold">
                  ⏳ This date is tentative. Join the waitlist to be notified when confirmed!
                </p>
              </div>
            )}

            {isFestival && (
              <div className="mb-6 bg-purple-50 border border-purple-200 rounded-xl p-4 text-center">
                <p className="text-purple-800 font-semibold">
                  🎉 This is part of our BIG Festival Weekend! Join the celebration!
                </p>
              </div>
            )}

            {event.description && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-3">About This Market</h2>
                <p className="text-gray-600 leading-relaxed">{event.description}</p>
              </div>
            )}

            {/* Availability */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className={`p-6 rounded-xl border-2 cursor-pointer ${
                  hasVendorSpots && !isTentative
                    ? 'border-green-200 bg-green-50 hover:border-green-400'
                    : 'border-gray-200 bg-gray-50 opacity-60'
                }`}
                onClick={() => {
                  if (hasVendorSpots && !isTentative) {
                    setVendorType('regular');
                    setShowVendorModal(true);
                  }
                }}
              >
                <div className="text-center">
                  <div className="text-3xl mb-2">🛍️</div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Vendor</h3>
                  <div className="text-2xl font-bold text-green-600 mb-2">$35</div>
                  <p className="text-sm text-gray-600 mb-2">30 vendor spots available</p>
                  {hasVendorSpots ? (
                    <span className="inline-block bg-green-500 text-white px-4 py-2 rounded-full text-sm">
                      {availableSlots} spots left
                    </span>
                  ) : (
                    <span className="inline-block bg-gray-400 text-white px-4 py-2 rounded-full text-sm">
                      Sold Out
                    </span>
                  )}
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className={`p-6 rounded-xl border-2 cursor-pointer ${
                  hasFoodSpots && !isTentative
                    ? 'border-yellow-200 bg-yellow-50 hover:border-yellow-400'
                    : 'border-gray-200 bg-gray-50 opacity-60'
                }`}
                onClick={() => {
                  if (hasFoodSpots && !isTentative) {
                    setVendorType('food');
                    setShowVendorModal(true);
                  }
                }}
              >
                <div className="text-center">
                  <div className="text-3xl mb-2">🍔</div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Food Truck</h3>
                  <div className="text-2xl font-bold text-yellow-600 mb-2">$50</div>
                  <p className="text-sm text-gray-600 mb-2">4 food truck spots available</p>
                  {hasFoodSpots ? (
                    <span className="inline-block bg-yellow-500 text-white px-4 py-2 rounded-full text-sm">
                      {foodSlots} spots left
                    </span>
                  ) : (
                    <span className="inline-block bg-gray-400 text-white px-4 py-2 rounded-full text-sm">
                      Sold Out
                    </span>
                  )}
                </div>
              </motion.div>
            </div>

            <div className="text-center text-sm text-gray-500">
              <p>✨ You'll only be charged if your application is approved</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Simple Booking Modal */}
      {showVendorModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {vendorType === 'regular' ? 'Vendor' : 'Food Truck'} Application
            </h2>
            <p className="text-gray-600 mb-6">{formatDate(event.date)}</p>

            <form onSubmit={async (e) => {
              e.preventDefault();
              setSubmitting(true);
              try {
                await reserveEventSpot(eventId, {
                  vendor_type: vendorType,
                  first_name: formData.firstName,
                  last_name: formData.lastName,
                  vendor_email: formData.email,
                  business_name: formData.businessName,
                  phone: formData.phone,
                  instagram: formData.instagram,
                  products_selling: formData.productsSelling,
                });
                alert('Application submitted! You will receive an email with next steps.');
                setShowVendorModal(false);
              } catch (error) {
                alert('Something went wrong. Please try again.');
              } finally {
                setSubmitting(false);
              }
            }} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="First Name"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500"
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500"
                />
              </div>

              <input
                type="text"
                placeholder="Business Name"
                required
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500"
              />

              <input
                type="email"
                placeholder="Email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500"
              />

              <input
                type="tel"
                placeholder="Phone"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500"
              />

              <input
                type="text"
                placeholder="Instagram (optional)"
                value={formData.instagram}
                onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500"
              />

              <textarea
                placeholder={vendorType === 'regular' ? "What will you be selling?" : "What type of food?"}
                required
                value={formData.productsSelling}
                onChange={(e) => setFormData({ ...formData, productsSelling: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500"
              />

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowVendorModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`flex-1 px-4 py-3 bg-gradient-to-r ${
                    vendorType === 'regular' 
                      ? 'from-green-500 to-emerald-500' 
                      : 'from-yellow-500 to-orange-500'
                  } text-white rounded-xl font-semibold disabled:opacity-50`}
                >
                  {submitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}