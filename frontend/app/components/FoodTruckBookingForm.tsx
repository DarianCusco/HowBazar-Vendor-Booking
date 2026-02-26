// components/FoodTruckBookingForm.tsx
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { VENDOR_CONFIG, getShortDate } from '@/lib/marketData';
import { reserveMultiEventSpots, ReserveBoothSlotData } from '@/lib/api';

interface FoodTruckBookingFormProps {
  selectedDates: string[];
  vendorType: 'food';
  onBack: () => void;
}

export default function FoodTruckBookingForm({ selectedDates, vendorType, onBack }: FoodTruckBookingFormProps) {
  const router = useRouter();
  const config = VENDOR_CONFIG[vendorType];
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    businessName: '',
    email: '',
    phone: '',
    instagram: '',
    cuisineType: '',
    menuHighlights: '',
    setupSize: '',
    generator: '',
    healthPermit: '',
    specialRequests: '',
    hearAboutUs: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const totalPrice = config.price * selectedDates.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const reservations = selectedDates.map(date => ({
        eventDate: date,
        reservationData: {
          vendor_type: 'food' as const,
          first_name: formData.firstName,
          last_name: formData.lastName,
          vendor_email: formData.email,
          business_name: formData.businessName,
          phone: formData.phone,
          instagram: formData.instagram || undefined,
          cuisine_type: formData.cuisineType,
          food_items: formData.menuHighlights,
          setup_size: formData.setupSize,
          generator: formData.generator as 'yes' | 'no' | 'battery' | undefined,
          health_permit: formData.healthPermit || undefined,
          additional_notes: JSON.stringify({
            specialRequests: formData.specialRequests,
            hearAboutUs: formData.hearAboutUs,
          }),
        } as ReserveBoothSlotData,
      }));

      const result = await reserveMultiEventSpots(reservations);
      window.location.href = result.checkout_url;
    } catch (error) {
      console.error('Booking error:', error);
      alert('Something went wrong. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-6 md:p-8 mx-2 sm:mx-0"
    >
      {/* Header with Back Button */}
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onBack}
          className="text-gray-500 hover:text-gray-700 p-1"
          aria-label="Go back"
        >
          <span className="text-xl sm:text-2xl">←</span>
        </motion.button>
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">
          Food Truck Application
        </h2>
      </div>

      {/* Selected Dates Summary - Fixed visibility */}
      <div className={`mb-6 sm:mb-8 p-4 sm:p-5 ${config.lightBg} border-2 ${config.border} rounded-xl sm:rounded-2xl shadow-sm`}>
        <h3 className="font-semibold text-gray-800 text-base sm:text-lg mb-3">Selected Dates:</h3>
        
        {/* Mobile: Horizontal scroll for dates */}
        <div className="overflow-x-auto pb-2 mb-3 -mx-1 px-1 hide-scrollbar">
          <div className="flex gap-2 min-w-min">
            {selectedDates.map(date => {
              const displayDate = new Date(date + 'T00:00:00Z').toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                timeZone: 'UTC'
              });
              const fullDate = new Date(date + 'T00:00:00Z').toLocaleDateString('en-US', { 
                weekday: 'short',
                month: 'short', 
                day: 'numeric',
                timeZone: 'UTC'
              });
              return (
                <div
                  key={date}
                  className="flex-shrink-0 bg-white px-3 py-2 rounded-lg border-2 border-gray-200 shadow-sm"
                  title={fullDate}
                >
                  <span className="text-sm font-medium text-gray-800">{displayDate}</span>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Desktop: Wrap for dates */}
        <div className="hidden sm:flex sm:flex-wrap gap-2 mb-4">
          {selectedDates.map(date => {
            const fullDate = new Date(date + 'T00:00:00Z').toLocaleDateString('en-US', { 
              weekday: 'short',
              month: 'short', 
              day: 'numeric',
              timeZone: 'UTC'
            });
            return (
              <span key={date} className="bg-white px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 shadow-sm">
                {fullDate}
              </span>
            );
          })}
        </div>
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pt-2 border-t-2 border-gray-200">
          <span className="text-sm sm:text-base font-medium text-gray-600">Total for {selectedDates.length} {selectedDates.length === 1 ? 'day' : 'days'}:</span>
          <span className={`text-xl sm:text-2xl font-bold text-${config.color}-600 bg-white px-4 py-1.5 rounded-lg border-2 ${config.border}`}>
            ${totalPrice}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
        {/* Name Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm sm:text-base"
              placeholder="Your first name"
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm sm:text-base"
              placeholder="Your last name"
            />
          </div>
        </div>

        {/* Business Name */}
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
            Business Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.businessName}
            onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm sm:text-base"
            placeholder="Your food truck name"
          />
        </div>

        {/* Email & Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm sm:text-base"
              placeholder="your@email.com"
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Phone <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm sm:text-base"
              placeholder="(555) 123-4567"
            />
          </div>
        </div>

        {/* Instagram */}
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
            Instagram Handle
          </label>
          <input
            type="text"
            value={formData.instagram}
            onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm sm:text-base"
            placeholder="@yourfoodtruck"
          />
        </div>

        {/* Cuisine Type & Setup Size */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Cuisine Type <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.cuisineType}
              onChange={(e) => setFormData({ ...formData, cuisineType: e.target.value })}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm sm:text-base"
              placeholder="Mexican, BBQ, Italian, etc."
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Setup Size <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.setupSize}
              onChange={(e) => setFormData({ ...formData, setupSize: e.target.value })}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm sm:text-base"
              placeholder="e.g., 16ft truck, 10x10 tent"
            />
          </div>
        </div>

        {/* Menu Highlights */}
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
            Menu Highlights <span className="text-red-500">*</span>
          </label>
          <textarea
            required
            value={formData.menuHighlights}
            onChange={(e) => setFormData({ ...formData, menuHighlights: e.target.value })}
            rows={3}
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm sm:text-base"
            placeholder="Describe your menu and specialties"
          />
        </div>

        {/* Generator */}
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
            Do you have a generator? <span className="text-red-500">*</span>
          </label>
          <select
            required
            value={formData.generator}
            onChange={(e) => setFormData({ ...formData, generator: e.target.value })}
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm sm:text-base bg-white"
          >
            <option value="">Select an option</option>
            <option value="yes">Yes, I have a quiet generator</option>
            <option value="no">No, I need power hookup</option>
            <option value="battery">I use battery/solar power</option>
          </select>
        </div>

        {/* Health Permit */}
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
            Health Permit Number (if available)
          </label>
          <input
            type="text"
            value={formData.healthPermit}
            onChange={(e) => setFormData({ ...formData, healthPermit: e.target.value })}
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm sm:text-base"
            placeholder="Your health permit number"
          />
        </div>

        {/* Special Requests */}
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
            Special Requests or Notes
          </label>
          <textarea
            value={formData.specialRequests}
            onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
            rows={2}
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm sm:text-base"
            placeholder="Any special accommodations or requests?"
          />
        </div>

        {/* How did you hear about us */}
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
            How did you hear about us?
          </label>
          <select
            value={formData.hearAboutUs}
            onChange={(e) => setFormData({ ...formData, hearAboutUs: e.target.value })}
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm sm:text-base bg-white"
          >
            <option value="">Select an option</option>
            <option value="social">Social Media</option>
            <option value="friend">Friend/Word of Mouth</option>
            <option value="previous">Previous Vendor</option>
            <option value="website">Website</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Submit Button */}
        <motion.button
          type="submit"
          disabled={submitting}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`w-full py-3.5 sm:py-4 bg-gradient-to-r ${config.gradient} text-white font-bold text-base sm:text-lg rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 mt-4 sm:mt-6`}
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Processing...
            </span>
          ) : (
            `Pay $${totalPrice} & Submit Application`
          )}
        </motion.button>

        <p className="text-[10px] sm:text-xs text-gray-500 text-center mt-3 sm:mt-4 px-2">
          By submitting, you agree to our terms and conditions. You'll only be charged if your application is approved.
        </p>
      </form>

      {/* Hide scrollbar but keep functionality */}
      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </motion.div>
  );
}