// components/VendorBookingForm.tsx
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { VENDOR_CONFIG, getShortDate, getFullFormattedDate } from '@/lib/marketData';
import { reserveMultiEventSpots, ReserveBoothSlotData } from '@/lib/api';

interface VendorBookingFormProps {
  selectedDates: string[];
  vendorType: 'regular';
  onBack: () => void;
}

export default function VendorBookingForm({ selectedDates, vendorType, onBack }: VendorBookingFormProps) {
  const router = useRouter();
  const config = VENDOR_CONFIG[vendorType];
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    businessName: '',
    email: '',
    phone: '',
    instagram: '',
    productsSelling: '',
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
          vendor_type: 'regular' as const,
          first_name: formData.firstName,
          last_name: formData.lastName,
          vendor_email: formData.email,
          business_name: formData.businessName,
          phone: formData.phone,
          instagram: formData.instagram || undefined,
          products_selling: formData.productsSelling,
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
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onBack}
          className="text-gray-500 hover:text-gray-700 p-2 -ml-2"
        >
          ←
        </motion.button>
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">
          Complete Your Booking
        </h2>
      </div>

      {/* Selected Dates Summary - Mobile Optimized */}
      <div className={`mb-6 sm:mb-8 p-4 sm:p-5 ${config.lightBg} border ${config.border} rounded-xl sm:rounded-2xl`}>
        <h3 className="font-semibold text-gray-700 mb-3 text-sm sm:text-base">Selected Dates:</h3>
        
        {/* Horizontal scroll for dates on mobile */}
        <div className="overflow-x-auto pb-2 -mx-1 px-1 hide-scrollbar">
          <div className="flex gap-2 min-w-min">
            {selectedDates.map(date => (
              <div
                key={date}
                className="flex-shrink-0 bg-white px-3 py-2 rounded-lg sm:rounded-full text-xs sm:text-sm shadow-sm border border-gray-100"
                title={getFullFormattedDate(date)}
              >
                <span className="font-medium text-gray-800">{getShortDate(date)}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Total Price - Prominent */}
        <div className="mt-4 pt-3 border-t border-gray-200 flex justify-between items-center">
          <span className="text-sm sm:text-base text-gray-600">Total:</span>
          <div className="text-right">
            <span className={`text-xl sm:text-2xl font-bold text-${config.color}-600`}>
              ${totalPrice}
            </span>
            <span className="text-xs text-gray-500 block sm:inline sm:ml-2 sm:text-sm">
              ({selectedDates.length} {selectedDates.length === 1 ? 'day' : 'days'} × ${config.price})
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
        {/* Name Fields - Stack on mobile, grid on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-black text-sm sm:text-base border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              placeholder="First name"
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
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm text-black sm:text-base border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Last name"
            />
          </div>
        </div>

        {/* Business Name - Full width */}
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
            Business Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.businessName}
            onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm text-black sm:text-base border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Your business name"
          />
        </div>

        {/* Contact Fields - Stack on mobile, grid on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm text-black sm:text-base border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm text-black sm:text-base border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="(555) 123-4567"
            />
          </div>
        </div>

        {/* Instagram - Optional */}
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
            Instagram Handle <span className="text-gray-400 text-xs">(optional)</span>
          </label>
          <input
            type="text"
            value={formData.instagram}
            onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm text-black sm:text-base border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="@yourbusiness"
          />
        </div>

        {/* Products - Full width */}
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
            What will you be selling? <span className="text-red-500">*</span>
          </label>
          <textarea
            required
            value={formData.productsSelling}
            onChange={(e) => setFormData({ ...formData, productsSelling: e.target.value })}
            rows={3}
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm text-black sm:text-base border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
            placeholder="Describe your products, art, crafts, etc."
          />
        </div>

        {/* Special Requests - Full width */}
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
            Special Requests or Notes <span className="text-gray-400 text-xs">(optional)</span>
          </label>
          <textarea
            value={formData.specialRequests}
            onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
            rows={2}
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm text-black sm:text-base border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
            placeholder="Any special accommodations or requests?"
          />
        </div>

        {/* How did you hear - Full width */}
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
            How did you hear about us? <span className="text-gray-400 text-xs">(optional)</span>
          </label>
          <select
            value={formData.hearAboutUs}
            onChange={(e) => setFormData({ ...formData, hearAboutUs: e.target.value })}
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm text-black sm:text-base border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
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
        <div className="pt-4">
          <motion.button
            type="submit"
            disabled={submitting}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`w-full py-3.5 sm:py-4 bg-gradient-to-r ${config.gradient} text-white font-bold text-base sm:text-lg rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing...
              </span>
            ) : (
              `Pay $${totalPrice} & Complete Booking`
            )}
          </motion.button>
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-gray-500 text-center mt-4 px-2">
          By submitting, you agree to our terms and conditions. You'll only be charged if your application is approved.
        </p>
      </form>

      {/* Hide scrollbar style */}
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