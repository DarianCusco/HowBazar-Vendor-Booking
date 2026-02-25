// components/VendorBookingForm.tsx
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { VENDOR_CONFIG, getShortDate } from '@/lib/marketData';
import { reserveMultiEventSpots } from '@/lib/api';

interface VendorBookingFormProps {
  selectedDates: string[];
  vendorType: 'regular' | 'food';
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
        vendor_type: 'regular' as const,  // Use const assertion
        first_name: formData.firstName,
        last_name: formData.lastName,
        vendor_email: formData.email,
        business_name: formData.businessName,
        phone: formData.phone,
        instagram: formData.instagram,
        products_selling: formData.productsSelling,
        notes: JSON.stringify({
          specialRequests: formData.specialRequests,
          hearAboutUs: formData.hearAboutUs,
          selectedDates,
        }),
      },
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
      className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl p-6 sm:p-8"
    >
      <div className="flex items-center gap-3 mb-6">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onBack}
          className="text-gray-500 hover:text-gray-700"
        >
          ←
        </motion.button>
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
          Complete Your Booking
        </h2>
      </div>

      {/* Selected Dates Summary */}
      <div className={`mb-8 p-4 ${config.lightBg} border ${config.border} rounded-xl`}>
        <h3 className="font-semibold text-gray-700 mb-3">Selected Dates:</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {selectedDates.map(date => (
            <span key={date} className="bg-white px-3 py-1 rounded-full text-sm shadow-sm">
              {getShortDate(date)}
            </span>
          ))}
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">Total:</span>
          <span className={`text-xl font-bold text-${config.color}-600`}>
            ${totalPrice}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Your first name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Your last name"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Business Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.businessName}
            onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Your business name"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="your@email.com"
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
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="(555) 123-4567"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Instagram Handle
          </label>
          <input
            type="text"
            value={formData.instagram}
            onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="@yourbusiness"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            What will you be selling? <span className="text-red-500">*</span>
          </label>
          <textarea
            required
            value={formData.productsSelling}
            onChange={(e) => setFormData({ ...formData, productsSelling: e.target.value })}
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Describe your products, art, crafts, etc."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Special Requests or Notes
          </label>
          <textarea
            value={formData.specialRequests}
            onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
            rows={2}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Any special accommodations or requests?"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            How did you hear about us?
          </label>
          <select
            value={formData.hearAboutUs}
            onChange={(e) => setFormData({ ...formData, hearAboutUs: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">Select an option</option>
            <option value="social">Social Media</option>
            <option value="friend">Friend/Word of Mouth</option>
            <option value="previous">Previous Vendor</option>
            <option value="website">Website</option>
            <option value="other">Other</option>
          </select>
        </div>

        <motion.button
          type="submit"
          disabled={submitting}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`w-full py-4 bg-gradient-to-r ${config.gradient} text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50`}
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

        <p className="text-xs text-gray-500 text-center mt-4">
          By submitting, you agree to our terms and conditions. You'll only be charged if your application is approved.
        </p>
      </form>
    </motion.div>
  );
}