'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getEvent, Event, reserveEventSpot, ReserveBoothSlotData } from '@/lib/api';

const THEME_CONFIG = {
  "THE FIRST TASTE": { 
    color: 'from-purple-500 to-pink-500', 
    light: 'bg-purple-50',
    border: 'border-purple-200',
    icon: '🎪'
  },
  "CARS": { 
    color: 'from-blue-500 to-cyan-500', 
    light: 'bg-blue-50',
    border: 'border-blue-200',
    icon: '🚗'
  },
  "COMMUNITY SUPPORT": { 
    color: 'from-green-500 to-emerald-500', 
    light: 'bg-green-50',
    border: 'border-green-200',
    icon: '🤝'
  },
  "CIRCUS": { 
    color: 'from-red-500 to-orange-500', 
    light: 'bg-red-50',
    border: 'border-red-200',
    icon: '🎭'
  },
  "WELLNESS": { 
    color: 'from-teal-500 to-blue-500', 
    light: 'bg-teal-50',
    border: 'border-teal-200',
    icon: '🧘'
  },
  "MUSIC SHOWCASE": { 
    color: 'from-yellow-500 to-red-500', 
    light: 'bg-yellow-50',
    border: 'border-yellow-200',
    icon: '🎵'
  },
  "MEDIEVAL": { 
    color: 'from-amber-700 to-yellow-600', 
    light: 'bg-amber-50',
    border: 'border-amber-200',
    icon: '⚔️'
  }
};

type VendorType = 'regular' | 'food' | null;

export default function EventPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = parseInt(params.id as string);
  
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showVendorTypeModal, setShowVendorTypeModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedVendorType, setSelectedVendorType] = useState<VendorType>(null);
  const [formData, setFormData] = useState({
    // Common fields
    fullName: '',
    preferredName: '',
    pronouns: '',
    businessName: '',
    phone: '',
    email: '',
    instagram: '',
    socialMediaConsent: '',
    photoConsent: '',
    noiseSensitive: '',
    sharingBooth: '',
    boothPartnerInstagram: '',
    additionalNotes: '',
    
    // Regular vendor specific
    productsSelling: '',
    productPhotos: [] as File[],
    priceRange: '',
    electricityCord: '',
    
    // Food truck specific
    cuisineType: '',
    foodItems: '',
    setupPhotos: [] as File[],
    setupSize: '',
    generator: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadEvent();
  }, [eventId]);

  const loadEvent = async () => {
    try {
      setLoading(true);
      const data = await getEvent(eventId);
      console.log('Event data:', data);
      setEvent(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  const handleBookSpot = () => {
    setShowVendorTypeModal(true);
  };

  const handleVendorTypeSelect = (type: VendorType) => {
    setSelectedVendorType(type);
    setShowVendorTypeModal(false);
    setShowBookingModal(true);
  };

  const handleBackToVendorType = () => {
    setShowBookingModal(false);
    setShowVendorTypeModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      
      const reservationData: ReserveBoothSlotData = {
        vendor_name: formData.fullName,
        vendor_email: formData.email,
        business_name: formData.businessName,
        phone: formData.phone,
        notes: JSON.stringify({
          vendorType: selectedVendorType,
          preferredName: formData.preferredName,
          pronouns: formData.pronouns,
          instagram: formData.instagram,
          productsSelling: formData.productsSelling,
          cuisineType: formData.cuisineType,
          foodItems: formData.foodItems,
          priceRange: formData.priceRange,
          socialMediaConsent: formData.socialMediaConsent,
          photoConsent: formData.photoConsent,
          noiseSensitive: formData.noiseSensitive,
          sharingBooth: formData.sharingBooth,
          boothPartnerInstagram: formData.boothPartnerInstagram,
          electricityCord: formData.electricityCord,
          generator: formData.generator,
          setupSize: formData.setupSize,
          additionalNotes: formData.additionalNotes,
        }),
      };

      const result = await reserveEventSpot(eventId, reservationData);
      window.location.href = result.checkout_url;
    } catch (err) {
      console.error('Reservation error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to reserve spot';
      alert(`Error: ${errorMessage}\n\nPlease check:\n1. Backend is running\n2. Stripe keys are configured\n3. Database migrations are applied`);
      setSubmitting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const files = Array.from(e.target.files || []);
    setFormData(prev => ({
      ...prev,
      [field]: files
    }));
  };

const getEventTime = (dateString: string) => {
  const date = new Date(dateString + 'T00:00:00Z');
  const dayOfWeek = date.getUTCDay();
  return dayOfWeek === 0 ? '12:00 PM - 5:00 PM' : '4:00 PM - 10:00 PM';
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString + 'T00:00:00Z');
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC'
  });
};

  const getEventTheme = (eventName: string) => {
    const theme = Object.keys(THEME_CONFIG).find(theme => 
      eventName.toLowerCase().includes(theme.toLowerCase())
    );
    return theme ? THEME_CONFIG[theme as keyof typeof THEME_CONFIG] : THEME_CONFIG["THE FIRST TASTE"];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-xl animate-pulse">Loading event...</div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-red-500 text-xl">Error: {error || 'Event not found'}</div>
      </div>
    );
  }

  const availableSlots = event.booth_slots?.filter(slot => slot.is_available) || [];
  const price = event.price ? parseFloat(String(event.price)) : 0;
  const displayPrice = isNaN(price) ? 0 : price;
  const themeConfig = getEventTheme(event.name);
  const eventTime = getEventTime(event.date);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-10 -left-10 w-20 h-20 bg-purple-200 rounded-full blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute top-1/4 -right-10 w-16 h-16 bg-pink-200 rounded-full blur-xl opacity-40"></div>
        <div className="absolute bottom-1/3 left-1/4 w-24 h-24 bg-blue-200 rounded-full blur-xl opacity-20"></div>
      </div>
      <div className="max-w-4xl mx-auto relative z-10">
        {/* Back Button */}
        <button
          onClick={() => router.push('/')}
          className="mb-6 group flex items-center space-x-2 text-gray-600 hover:text-gray-800 font-medium transition-all duration-300 hover:translate-x-1"
        >
          <span className="text-xl transition-transform group-hover:-translate-x-1">←</span>
          <span>Back to Calendar</span>
        </button>

        {/* Event Details Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300 hover:shadow-3xl">
          {/* Theme Header */}
          <div className={`bg-gradient-to-r ${themeConfig.color} p-8 text-white relative overflow-hidden`}>
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center space-x-4">
                  <div className="text-4xl">{themeConfig.icon}</div>
                  <div>
                    <h1 className="text-4xl font-bold mb-2 drop-shadow-lg">{event.name}</h1>
                    <p className="text-white/90 text-lg font-light">
                      {formatDate(event.date)}
                    </p>
                  </div>
                </div>
                <div className="text-left">
                  <div className="text-2xl font-bold drop-shadow-lg">{eventTime}</div>
                  <div className="text-white/80 font-light">Downtown Winter Market</div>
                </div>
              </div>
            </div>
          </div>

          {/* Event Content */}
          <div className="p-8">
            <div className="space-y-4 text-gray-600 mb-8">
              <div className="flex items-center space-x-3 text-lg">
                <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>
                <p>
                  <span className="font-semibold text-gray-800">Location:</span> {event.location}
                </p>
              </div>
              {event.description && (
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
                  <p className="text-gray-700 leading-relaxed">{event.description}</p>
                </div>
              )}
            </div>
            
            {/* Availability Section */}
            {availableSlots.length === 0 ? (
              <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-2xl p-8 text-center transform transition-all duration-300 hover:scale-105">
                <div className="text-6xl mb-4">😢</div>
                <p className="text-red-800 font-bold text-2xl mb-2">
                  SOLD OUT
                </p>
                <p className="text-red-600 text-lg">All spots have been booked for this event.</p>
                <button
                  onClick={() => router.push('/')}
                  className="mt-4 bg-gradient-to-r from-gray-500 to-gray-700 text-white px-6 py-3 rounded-lg hover:from-gray-600 hover:to-gray-800 transition-all transform hover:-translate-y-0.5"
                >
                  Check Other Dates
                </button>
              </div>
            ) : (
              <div className={`${themeConfig.light} border ${themeConfig.border} rounded-2xl p-8 transform transition-all duration-300 hover:scale-105`}>
                <div className="flex flex-col lg:flex-row justify-between items-center space-y-6 lg:space-y-0">
                  <div className="text-center lg:text-left">
                    <div className="flex items-center justify-center lg:justify-start space-x-3 mb-3">
                      <div className="text-3xl">{themeConfig.icon}</div>
                      <div>
                        <p className="text-2xl font-bold text-gray-800">
                          {availableSlots.length} spot{availableSlots.length !== 1 ? 's' : ''} available
                        </p>
                        <p className="text-gray-600 mt-1">
                          Choose between Vendor or food truck
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-center lg:text-right">
                    <div className="space-y-2">
                      <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                        $35 - Vendor
                      </p>
                      <p className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                        $100 - Food Truck
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleBookSpot}
                  className="w-full mt-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl font-bold text-lg shadow-lg"
                >
                  ✨ Book Your Spot Now
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Vendor Type Selection Modal */}
      {showVendorTypeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 overflow-y-auto backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full my-8 transform transition-all duration-300 animate-in fade-in-90 zoom-in-95">
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">
                Choose Your Vendor Type
              </h2>
              <p className="text-gray-600 text-center mb-6">
                Select the type of vendor spot you need
              </p>
              
              <div className="space-y-4">
                {/* Regular Vendor Option */}
                <button
                  onClick={() => handleVendorTypeSelect('regular')}
                  className="w-full p-6 border-2 border-blue-200 bg-blue-50 rounded-2xl hover:border-blue-400 hover:bg-blue-100 transition-all duration-300 transform hover:scale-105 group"
                >
                  <div className="text-center">
                    <div className="text-3xl mb-2">🛍️</div>
                    <h3 className="text-xl font-bold text-blue-800 mb-1">Vendor</h3>
                    <p className="text-blue-600 text-sm mb-2">8x8 booth with shelving & table</p>
                    <div className="text-2xl font-bold text-blue-700">$35</div>
                    <p className="text-blue-500 text-xs mt-1">26 spots available per day</p>
                  </div>
                </button>

                {/* Food Truck Option */}
                <button
                  onClick={() => handleVendorTypeSelect('food')}
                  className="w-full p-6 border-2 border-orange-200 bg-orange-50 rounded-2xl hover:border-orange-400 hover:bg-orange-100 transition-all duration-300 transform hover:scale-105 group"
                >
                  <div className="text-center">
                    <div className="text-3xl mb-2">🍔</div>
                    <h3 className="text-xl font-bold text-orange-800 mb-1">Food Truck</h3>
                    <p className="text-orange-600 text-sm mb-2">Food vendor with generator</p>
                    <div className="text-2xl font-bold text-orange-700">$100</div>
                    <p className="text-orange-500 text-xs mt-1">2 spots available per day</p>
                  </div>
                </button>
              </div>

              <button
                onClick={() => setShowVendorTypeModal(false)}
                className="w-full mt-6 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 overflow-y-auto backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full my-8 flex flex-col max-h-[90vh] transform transition-all duration-300 animate-in fade-in-90 zoom-in-95">
            {/* Modal Header with Back Button */}
            <div className="p-8 flex-shrink-0 border-b border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleBackToVendorType}
                    className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors group"
                  >
                    <span className="text-xl group-hover:-translate-x-1 transition-transform font-bold">←</span>
                  </button>
                  <div className="flex items-center space-x-3">
                    <div className="text-3xl">
                      {selectedVendorType === 'regular' ? '🛍️' : '🍔'}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800">
                        {selectedVendorType === 'regular' ? 'Vendor' : 'Food Truck'} Application
                      </h2>
                      <p className="text-gray-600 text-sm">{formatDate(event.date)}</p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    ${selectedVendorType === 'regular' ? '35' : '100'}
                  </p>
                  <p className="text-sm font-bold text-gray-500">{availableSlots.length} left</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="px-8 pb-6 overflow-y-auto flex-1 space-y-6">
                {/* Common Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
                      placeholder="Legal name for internal use"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Preferred Name
                    </label>
                    <input
                      type="text"
                      value={formData.preferredName}
                      onChange={(e) => setFormData({ ...formData, preferredName: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
                      placeholder="Name for communication"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Pronouns
                    </label>
                    <input
                      type="text"
                      value={formData.pronouns}
                      onChange={(e) => setFormData({ ...formData, pronouns: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
                      placeholder="she/her, he/him, they/them"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Business Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.businessName}
                      onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
                      placeholder="For promotional material"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Phone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
                      placeholder="(555) 123-4567"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
                      placeholder="your.email@example.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Instagram Handle (for promo)
                  </label>
                  <input
                    type="text"
                    value={formData.instagram}
                    onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
                    placeholder="@yourhandle"
                  />
                </div>

                {/* Vendor Specific Fields */}
                {selectedVendorType === 'regular' && (
                  <>
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        What will you be selling? <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        required
                        value={formData.productsSelling}
                        onChange={(e) => setFormData({ ...formData, productsSelling: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
                        placeholder="A short list of the types of items/products you plan to offer"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Upload photos of your products (2-4 images)
                      </label>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'productPhotos')}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                      />
                      <p className="text-sm text-gray-500">For promo and curation purposes</p>
                    </div>
                  </>
                )}

                {selectedVendorType === 'food' && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">
                          What is your cuisine? <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.cuisineType}
                          onChange={(e) => setFormData({ ...formData, cuisineType: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
                          placeholder="Mexican, Italian, BBQ, etc."
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">
                          What size is your setup?
                        </label>
                        <input
                          type="text"
                          value={formData.setupSize}
                          onChange={(e) => setFormData({ ...formData, setupSize: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
                          placeholder="Truck size or dimensions"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        What type of food will you be selling? <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        required
                        value={formData.foodItems}
                        onChange={(e) => setFormData({ ...formData, foodItems: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
                        placeholder="A short list of the types of food/products you plan to offer"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Upload photos of your setup (2-4 images)
                      </label>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'setupPhotos')}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                      />
                      <p className="text-sm text-gray-500">For promo and curation purposes</p>
                    </div>
                  </>
                )}

                {/* Common Additional Fields */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    What are your general price points?
                  </label>
                  <input
                    type="text"
                    value={formData.priceRange}
                    onChange={(e) => setFormData({ ...formData, priceRange: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
                    placeholder="Example: $5–$45 range"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Do you consent to being included in a social media highlight?
                    </label>
                    <select
                      value={formData.socialMediaConsent}
                      onChange={(e) => setFormData({ ...formData, socialMediaConsent: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-900 bg-white"
                    >
                      <option value="" className="text-gray-500">Select option</option>
                      <option value="yes" className="text-gray-900">Yes</option>
                      <option value="no" className="text-gray-900">No</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Photo/Video Consent
                    </label>
                    <select
                      value={formData.photoConsent}
                      onChange={(e) => setFormData({ ...formData, photoConsent: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-900 bg-white"
                    >
                      <option value="" className="text-gray-500">Select option</option>
                      <option value="yes" className="text-gray-900">Yes</option>
                      <option value="no" className="text-gray-900">No</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Do you need to be placed away from music or loud areas?
                  </label>
                  <select
                    value={formData.noiseSensitive}
                    onChange={(e) => setFormData({ ...formData, noiseSensitive: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-900 bg-white"
                  >
                    <option value="" className="text-gray-500">Select option</option>
                    <option value="no-preference" className="text-gray-900">No preference</option>
                    <option value="yes" className="text-gray-900">Yes, I am noise-sensitive</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Are you sharing a booth with another vendor?
                  </label>
                  <select
                    value={formData.sharingBooth}
                    onChange={(e) => setFormData({ ...formData, sharingBooth: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-900 bg-white mb-2"
                  >
                    <option value="" className="text-gray-500">Select option</option>
                    <option value="yes" className="text-gray-900">Yes</option>
                    <option value="no" className="text-gray-900">No</option>
                  </select>
                  {formData.sharingBooth === 'yes' && (
                    <input
                      type="text"
                      value={formData.boothPartnerInstagram}
                      onChange={(e) => setFormData({ ...formData, boothPartnerInstagram: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
                      placeholder="Partner's Instagram handle (@username)"
                    />
                  )}
                </div>

                {/* Electricity Policy */}
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 border border-yellow-200">
                  <h4 className="font-semibold text-yellow-800 mb-2">
                    {selectedVendorType === 'regular' ? 'Electricity Policy' : 'Generator Policy'}
                  </h4>
                  <p className="text-yellow-700 text-sm mb-3">
                    {selectedVendorType === 'regular'
                      ? "We'll provide access to power, but you must bring your own reliable extension cords. We recommend 25 ft, 3-prong cords."
                      : "You must bring your own QUIET generator for electricity."
                    }
                  </p>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-yellow-800">
                      {selectedVendorType === 'regular'
                        ? "Can you bring your own cord(s)?"
                        : "Can you bring your own quiet generator(s)?"
                      }
                    </label>
                    <select
                      value={selectedVendorType === 'regular' ? formData.electricityCord : formData.generator}
                      onChange={(e) => selectedVendorType === 'regular' 
                        ? setFormData({ ...formData, electricityCord: e.target.value })
                        : setFormData({ ...formData, generator: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-yellow-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200 text-gray-900 bg-white"
                    >
                      <option value="" className="text-gray-500">Select option</option>
                      <option value="yes" className="text-gray-900">Yes</option>
                      <option value="no" className="text-gray-900">No</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Anything else you'd like us to know?
                  </label>
                  <textarea
                    value={formData.additionalNotes}
                    onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
                    placeholder="Additional information or special requests..."
                  />
                </div>

                {/* Indemnification Agreement */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
                  <h4 className="font-semibold text-purple-800 mb-2">Indemnification Agreement</h4>
                  <p className="text-purple-700 text-sm">
                    By submitting this form, you agree to indemnify and hold harmless the City, its representatives, and event organizers from any claims, damages, or liabilities arising from your participation as a vendor at the market.
                  </p>
                  <p className="text-purple-600 text-xs mt-2">
                    (If you'd like to read the full indemnification clause, click here)
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex gap-4 pt-6 px-8 pb-8 flex-shrink-0 border-t border-gray-100 bg-gray-50 rounded-b-3xl">
                <button
                  type="button"
                  onClick={() => {
                    setShowBookingModal(false);
                    setSelectedVendorType(null);
                    setFormData({
                      fullName: '',
                      preferredName: '',
                      pronouns: '',
                      businessName: '',
                      phone: '',
                      email: '',
                      instagram: '',
                      socialMediaConsent: '',
                      photoConsent: '',
                      noiseSensitive: '',
                      sharingBooth: '',
                      boothPartnerInstagram: '',
                      additionalNotes: '',
                      productsSelling: '',
                      productPhotos: [],
                      priceRange: '',
                      electricityCord: '',
                      cuisineType: '',
                      foodItems: '',
                      setupPhotos: [],
                      setupSize: '',
                      generator: '',
                    });
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-all duration-200 transform hover:scale-105 font-semibold"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-200 transform hover:scale-105 font-semibold disabled:opacity-50 disabled:transform-none"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Processing...
                    </span>
                  ) : (
                    'Continue to Payment'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}