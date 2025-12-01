'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { reserveMultiEventSpots, ReserveBoothSlotData } from '@/lib/api';

const THEME_CONFIG = {
  "THE OPENING WEEKEND": { 
    color: 'from-purple-500 to-pink-500', 
    light: 'bg-purple-50',
    dark: 'bg-purple-900',
    border: 'border-purple-200',
    icon: '🎪',
    text: 'text-purple-600'
  },
  "CARS": { 
    color: 'from-blue-500 to-cyan-500', 
    light: 'bg-blue-50',
    dark: 'bg-blue-900',
    border: 'border-blue-200',
    icon: '🚗',
    text: 'text-blue-600'
  },
  "COMMUNITY SUPPORT": { 
    color: 'from-green-500 to-emerald-500', 
    light: 'bg-green-50',
    dark: 'bg-green-900',
    border: 'border-green-200',
    icon: '🤝',
    text: 'text-green-600'
  },
  "CIRCUS": { 
    color: 'from-red-500 to-orange-500', 
    light: 'bg-red-50',
    dark: 'bg-red-900',
    border: 'border-red-200',
    icon: '🎭',
    text: 'text-red-600'
  },
  "WELLNESS": { 
    color: 'from-teal-500 to-blue-500', 
    light: 'bg-teal-50',
    dark: 'bg-teal-900',
    border: 'border-teal-200',
    icon: '🧘',
    text: 'text-teal-600'
  },
  "MUSIC SHOWCASE": { 
    color: 'from-yellow-500 to-red-500', 
    light: 'bg-yellow-50',
    dark: 'bg-yellow-900',
    border: 'border-yellow-200',
    icon: '🎵',
    text: 'text-yellow-600'
  },
  "MEDIEVAL": { 
    color: 'from-amber-700 to-yellow-600', 
    light: 'bg-amber-50',
    dark: 'bg-amber-900',
    border: 'border-amber-200',
    icon: '⚔️',
    text: 'text-amber-600'
  },
  "GENERAL MARKET": { 
    color: 'from-gray-500 to-gray-700', 
    light: 'bg-gray-50',
    dark: 'bg-gray-900',
    border: 'border-gray-200',
    icon: '🏪',
    text: 'text-gray-600'
  }
};

type VendorType = 'regular' | 'food' | null;

type DateInfo = {
  date: string;
  formattedDate: string;
  dayOfWeek: string;
  theme: string;
  themeConfig: any;
  marketType: string;
  time: string;
};

export default function MultiDateBookingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showVendorTypeModal, setShowVendorTypeModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedVendorType, setSelectedVendorType] = useState<VendorType>(null);
  const [selectedDates, setSelectedDates] = useState<DateInfo[]>([]);
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
    priceRange: '',
    electricityCord: '',
    
    // Food truck specific
    cuisineType: '',
    foodItems: '',
    setupSize: '',
    generator: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Parse selected dates from URL
    const sessionData = searchParams.get('session');
    if (sessionData) {
      try {
        const decoded = atob(sessionData);
        const data = JSON.parse(decoded);
        const dates = data.dates || [];
        
        // Process dates into DateInfo objects
        const processedDates = dates.map((dateStr: string) => {
          const date = new Date(dateStr + 'T00:00:00Z');
          const themeInfo = getThemeForDate(date);
          const themeConfig = themeInfo ? THEME_CONFIG[themeInfo.theme as keyof typeof THEME_CONFIG] : THEME_CONFIG["THE OPENING WEEKEND"];
          
          return {
            date: dateStr,
            formattedDate: getFormattedDate(dateStr),
            dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' }),
            theme: themeInfo?.theme || 'General Market',
            themeConfig,
            marketType: getMarketType(dateStr),
            time: getEventTime(dateStr)
          };
        });
        
        setSelectedDates(processedDates);
        setLoading(false);
      } catch (err) {
        setError('Invalid booking session data');
        setLoading(false);
      }
    } else {
      setError('No booking session found');
      setLoading(false);
    }
  }, [searchParams]);

  // Helper functions from single page
  const getEventTime = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00Z');
    const dayOfWeek = date.getUTCDay();
    return dayOfWeek === 0 ? '12:00 PM - 5:00 PM' : '4:00 PM - 10:00 PM';
  };

  const getMarketType = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00Z');
    const dayOfWeek = date.getUTCDay();
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });
    
    if (dayOfWeek === 0) return `${dayName} Day Market`;
    if (dayOfWeek === 5) return `${dayName} Night Market`;
    if (dayOfWeek === 6) return `${dayName} Night Market`;
    return `${dayName} Market`;
  };

  const getFormattedDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00Z');
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC'
    });
  };

  const getDaySuffix = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00Z');
    const day = date.getUTCDate();
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1: return "st";
      case 2: return "nd";
      case 3: return "rd";
      default: return "th";
    }
  };

  const getFullFormattedDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00Z');
    const month = date.toLocaleDateString('en-US', { month: 'long', timeZone: 'UTC' });
    const day = date.getUTCDate();
    const suffix = getDaySuffix(dateString);
    const year = date.getUTCFullYear();
    const weekday = date.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });
    return `${weekday}, ${month} ${day}${suffix}, ${year}`;
  };

  const getThemeForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    
    // Mock theme data - in production, this would come from your API
    const MARKET_SERIES = [
      { theme: "THE OPENING WEEKEND", dates: ['2025-12-12', '2025-12-13', '2025-12-14'] },
      { theme: "CARS", dates: ['2025-12-19', '2025-12-20', '2025-12-21'] },
      { theme: "COMMUNITY SUPPORT", dates: ['2025-12-26', '2025-12-27', '2025-12-28'] },
      { theme: "CIRCUS", dates: ['2026-01-02', '2026-01-03', '2026-01-04'] },
      { theme: "WELLNESS", dates: ['2026-01-09', '2026-01-10', '2026-01-11'] },
      { theme: "MUSIC SHOWCASE", dates: ['2026-01-16', '2026-01-17', '2026-01-18'] },
      { theme: "MEDIEVAL", dates: ['2026-01-23', '2026-01-24', '2026-01-25'] }
    ];
    
    for (const weekend of MARKET_SERIES) {
      if (weekend.dates.includes(dateStr)) {
        return weekend;
      }
    }
    return null;
  };

  // Group dates by theme
  const groupDatesByTheme = () => {
    const grouped: Record<string, DateInfo[]> = {};
    
    selectedDates.forEach(dateInfo => {
      const theme = dateInfo.theme;
      if (!grouped[theme]) {
        grouped[theme] = [];
      }
      grouped[theme].push(dateInfo);
    });
    
    return grouped;
  };

  // Calculate totals
  const calculateTotalPrice = () => {
    const pricePerDay = selectedVendorType === 'regular' ? 35 : 100;
    return pricePerDay * selectedDates.length;
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
    
    // Create reservation data for each date
    const reservations = selectedDates.map(dateInfo => ({
      eventDate: dateInfo.date,
      reservationData: {
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
          selectedDates: selectedDates.map(d => d.date),
          multiBooking: true, // Flag to indicate multi-date booking
        }),
      }
    }));

    // Call multi-date reservation API
    const result = await reserveMultiEventSpots(reservations);
    
    // Redirect to Stripe checkout
    window.location.href = result.checkout_url;
    
  } catch (err) {
    console.error('Reservation error:', err);
    const errorMessage = err instanceof Error ? err.message : 'Failed to reserve spots';
    alert(`Error: ${errorMessage}`);
    setSubmitting(false);
  }
};

  const getEarliestDate = () => {
    return selectedDates.length > 0 ? selectedDates[0].date : '';
  };

  const getLatestDate = () => {
    return selectedDates.length > 0 ? selectedDates[selectedDates.length - 1].date : '';
  };

  const getDateRangeText = () => {
    if (selectedDates.length === 0) return '';
    
    const earliest = new Date(getEarliestDate());
    const latest = new Date(getLatestDate());
    
    const formatMonthDay = (date: Date) => {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        timeZone: 'UTC'
      });
    };
    
    return `${formatMonthDay(earliest)} - ${formatMonthDay(latest)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-xl text-gray-700 font-medium">Loading your selection...</div>
        </div>
      </div>
    );
  }

  if (error || selectedDates.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-5xl mb-4">😞</div>
          <div className="text-red-500 text-xl font-semibold mb-2">
            {error || 'No dates selected'}
          </div>
          <p className="text-gray-600 mb-6">Please go back and select dates to book.</p>
          <button
            onClick={() => router.push('/')}
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all transform hover:-translate-y-0.5 font-semibold"
          >
            ← Back to Calendar
          </button>
        </div>
      </div>
    );
  }

  const groupedDates = groupDatesByTheme();
  const dateRangeText = getDateRangeText();
  const primaryTheme = selectedDates[0]?.theme || 'THE OPENING WEEKEND';
  const primaryThemeConfig = THEME_CONFIG[primaryTheme as keyof typeof THEME_CONFIG] || THEME_CONFIG["THE OPENING WEEKEND"];
  const totalPrice = calculateTotalPrice();

  return (
    <div className={`min-h-screen bg-gradient-to-br ${primaryThemeConfig.light.replace('bg-', 'from-')} to-white`}>
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-10 -left-10 w-20 h-20 bg-purple-200 rounded-full blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute top-1/4 -right-10 w-16 h-16 bg-pink-200 rounded-full blur-xl opacity-40"></div>
        <div className="absolute bottom-1/3 left-1/4 w-24 h-24 bg-blue-200 rounded-full blur-xl opacity-20"></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className={`${primaryThemeConfig.dark} text-white px-4 py-3 sm:px-6 sm:py-4 shadow-lg`}>
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
              <button
                onClick={() => router.push('/')}
                className="group flex items-center space-x-2 text-white/90 hover:text-white transition-all duration-300 flex-shrink-0"
              >
                <span className="text-xl sm:text-2xl transition-transform group-hover:-translate-x-1">←</span>
                <span className="text-sm sm:text-base font-medium hidden sm:inline">Back to Calendar</span>
                <span className="text-sm font-medium sm:hidden">Back</span>
              </button>
              
              <div className="flex flex-col items-center text-center mx-4 flex-1 min-w-0">
                <p className="text-sm sm:text-base font-semibold text-white truncate w-full">Multi-Day Booking</p>
                <p className="text-xs sm:text-sm text-white/80 font-medium truncate w-full">{dateRangeText}</p>
              </div>
              
              <div className="w-20 sm:w-24 text-right flex-shrink-0">
                <div className="text-2xl sm:text-3xl">{primaryThemeConfig.icon}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="py-4 sm:py-8 px-4 sm:px-6 max-w-6xl mx-auto">
          {/* Hero Card */}
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden transform transition-all duration-300 hover:shadow-2xl mb-6 sm:mb-8">
            {/* Theme Header */}
            <div className={`bg-gradient-to-r ${primaryThemeConfig.color} p-6 sm:p-8 md:p-10 text-white relative overflow-hidden`}>
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="relative z-10">
                <div className="text-center mb-6 sm:mb-8">
                  <div className="flex flex-col items-center mb-6 sm:mb-8">
                    <div className="text-4xl sm:text-5xl md:text-6xl mb-4">{primaryThemeConfig.icon}</div>
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 drop-shadow-lg">
                      Multi-Day Market Package
                    </h1>
                    <div className="text-lg sm:text-xl md:text-2xl font-bold text-white/90">
                      {selectedDates.length} Day{selectedDates.length > 1 ? 's' : ''} Selected
                    </div>
                  </div>
                  
                  {/* Quick Stats */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-2xl mx-auto">
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4">
                      <div className="text-xs sm:text-sm text-white/80 font-medium mb-1">DATES</div>
                      <div className="text-base sm:text-lg md:text-xl font-semibold">
                        {selectedDates.length}
                      </div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4">
                      <div className="text-xs sm:text-sm text-white/80 font-medium mb-1">THEMES</div>
                      <div className="text-base sm:text-lg md:text-xl font-semibold">
                        {Object.keys(groupedDates).length}
                      </div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4">
                      <div className="text-xs sm:text-sm text-white/80 font-medium mb-1">WEEKS</div>
                      <div className="text-base sm:text-lg md:text-xl font-semibold">
                        {Math.ceil(selectedDates.length / 3)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Area */}
            <div className="p-6 sm:p-8 md:p-10">
              {/* Selected Dates Timeline */}
              <div className="mb-8 sm:mb-10">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 text-center">
                  Selected Dates
                </h2>
                
                {/* Mobile Timeline */}
                <div className="sm:hidden">
                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-300 to-pink-300"></div>
                    <div className="space-y-4">
                      {selectedDates.map((dateInfo, index) => (
                        <div key={index} className="relative pl-8">
                          <div className={`absolute left-4 w-3 h-3 ${primaryThemeConfig.text.replace('text-', 'bg-')} rounded-full transform -translate-x-1/2`}></div>
                          <div className={`${dateInfo.themeConfig.light} border ${dateInfo.themeConfig.border} rounded-xl p-4`}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <span className="text-lg">{dateInfo.themeConfig.icon}</span>
                                <div>
                                  <div className="font-semibold text-gray-800">{dateInfo.dayOfWeek}</div>
                                  <div className="text-xs text-gray-600">{dateInfo.time}</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-gray-800">{dateInfo.formattedDate}</div>
                                <div className="text-xs text-gray-500">{dateInfo.marketType}</div>
                              </div>
                            </div>
                            <div className="text-xs font-medium text-gray-700">{dateInfo.theme}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Desktop Timeline */}
                <div className="hidden sm:block">
                <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-gradient-to-r from-purple-300 via-pink-300 to-blue-300"></div>
                    <div 
                    id="timeline-container"
                    className="relative flex space-x-8 overflow-x-auto pb-6 px-8"
                    style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 transparent' }}
                    >
                    {selectedDates.map((dateInfo, index) => (
                        <div key={index} className="relative flex-shrink-0">
                        {/* Timeline dot */}
                        <div className={`absolute top-1/2 left-1/2 w-4 h-4 ${primaryThemeConfig.text.replace('text-', 'bg-')} rounded-full transform -translate-x-1/2 -translate-y-1/2 z-10`}></div>
                        
                        {/* Date card */}
                        <div className={`mt-8 ${dateInfo.themeConfig.light} border ${dateInfo.themeConfig.border} rounded-xl p-4 w-56 transform transition-all duration-300 hover:scale-105 hover:shadow-lg`}>
                            <div className="text-center">
                            <div className="text-2xl mb-2">{dateInfo.themeConfig.icon}</div>
                            <div className="font-bold text-gray-800 mb-1">{dateInfo.formattedDate}</div>
                            <div className="text-xs text-gray-600 mb-2">{dateInfo.dayOfWeek}</div>
                            <div className="text-sm font-medium text-gray-700 truncate" title={dateInfo.theme}>
                                {dateInfo.theme}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">{dateInfo.marketType}</div>
                            <div className="text-xs text-gray-500 mt-1">{dateInfo.time}</div>
                            </div>
                        </div>
                        </div>
                    ))}
                    </div>
                    {/* Scroll indicator */}
                    {selectedDates.length > 4 && (
                    <div className="text-center mt-2">
                        <p className="text-xs text-gray-500">
                            drag to scroll through all {selectedDates.length} dates
                        </p>
                    </div>
                    )}
                </div>
                </div>
              </div>

              {/* Themes Summary */}
              <div className="mb-8 sm:mb-10">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 text-center">
                  Themes Included
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {Object.entries(groupedDates).map(([theme, dates]) => {
                    const config = THEME_CONFIG[theme as keyof typeof THEME_CONFIG] || THEME_CONFIG["THE OPENING WEEKEND"];
                    return (
                      <div 
                        key={theme}
                        className={`${config.light} border ${config.border} rounded-xl p-4 transform transition-all duration-300 hover:scale-105 hover:shadow-lg`}
                      >
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="text-2xl">{config.icon}</div>
                          <div>
                            <div className="font-bold text-gray-800 text-sm truncate">{theme}</div>
                            <div className="text-xs text-gray-600">{dates.length} day{dates.length > 1 ? 's' : ''}</div>
                          </div>
                        </div>
                        <div className="space-y-1">
                          {dates.map((dateInfo, index) => (
                            <div key={index} className="flex items-center justify-between text-xs">
                              <span className="text-gray-700">{dateInfo.formattedDate}</span>
                              <span className="text-gray-500">{dateInfo.time.split(' ')[0]}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Pricing & Booking Section */}
              <div className={`${primaryThemeConfig.light} border ${primaryThemeConfig.border} rounded-2xl sm:rounded-3xl p-6 sm:p-8 transform transition-all duration-300`}>
                <div className="flex flex-col lg:flex-row justify-between items-center space-y-6 lg:space-y-0">
                  {/* Pricing Info */}
                  <div className="text-center lg:text-left">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6 mb-4">
                      <div className="text-4xl sm:text-5xl">{primaryThemeConfig.icon}</div>
                      <div>
                        <p className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
                          Book All {selectedDates.length} Days
                        </p>
                        <p className="text-gray-600 text-lg">
                          Select vendor type and fill one application for all dates
                        </p>
                      </div>
                    </div>
                    
                    {/* Mobile Price Display */}
                    <div className="sm:hidden grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center bg-blue-50 rounded-xl p-4 border border-blue-200">
                        <div className="text-sm font-bold text-blue-700 mb-1">VENDOR PACKAGE</div>
                        <div className="text-xl font-bold text-blue-800">${35 * selectedDates.length}</div>
                        <div className="text-xs text-blue-600 mt-1">$35 × {selectedDates.length} days</div>
                        <div className="text-xs text-blue-500 mt-1">26 spots/day</div>
                      </div>
                      <div className="text-center bg-orange-50 rounded-xl p-4 border border-orange-200">
                        <div className="text-sm font-bold text-orange-700 mb-1">FOOD TRUCK PACKAGE</div>
                        <div className="text-xl font-bold text-orange-800">${100 * selectedDates.length}</div>
                        <div className="text-xs text-orange-600 mt-1">$100 × {selectedDates.length} days</div>
                        <div className="text-xs text-orange-500 mt-1">2 spots/day</div>
                      </div>
                    </div>
                  </div>

                  {/* Desktop Price Display */}
                  <div className="hidden sm:block text-center lg:text-right">
                    <div className="space-y-4">
                      <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl p-5 border border-blue-200">
                        <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                          Vendor Package: ${35 * selectedDates.length}
                        </p>
                        <p className="text-sm text-blue-600 mt-1">$35/day × {selectedDates.length} days</p>
                        <p className="text-xs text-blue-500 mt-1">26 regular vendor spots per day</p>
                      </div>
                      <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-2xl p-5 border border-orange-200">
                        <p className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                          Food Truck Package: ${100 * selectedDates.length}
                        </p>
                        <p className="text-sm text-orange-600 mt-1">$100/day × {selectedDates.length} days</p>
                        <p className="text-xs text-orange-500 mt-1">2 food truck spots per day</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={handleBookSpot}
                  className={`w-full mt-6 sm:mt-8 bg-gradient-to-r ${primaryThemeConfig.color} text-white py-4 sm:py-5 rounded-xl hover:opacity-90 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl font-bold text-lg sm:text-xl shadow-lg`}
                >
                  ✨ Select Vendor Type & Continue
                </button>
                
                <div className="mt-4 text-center">
                  <p className="text-xs sm:text-sm text-gray-500">
                    💡 One application covers all {selectedDates.length} selected dates
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Info Cards - Mobile Only */}
          <div className="sm:hidden grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="text-xs text-gray-500 font-medium mb-1">TOTAL DAYS</div>
              <div className="text-lg font-bold text-gray-800">{selectedDates.length}</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="text-xs text-gray-500 font-medium mb-1">DATE RANGE</div>
              <div className="text-sm font-semibold text-gray-800 truncate">{dateRangeText}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Vendor Type Selection Modal */}
      {showVendorTypeModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 overflow-y-auto backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full my-8 transform transition-all duration-300 animate-in fade-in-90 zoom-in-95">
            <div className="p-6 sm:p-8">
              <div className="text-center mb-6">
                <div className="text-4xl mb-4">{primaryThemeConfig.icon}</div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
                  Select Vendor Type
                </h2>
                <p className="text-gray-600 text-sm sm:text-base">
                  Your choice applies to all {selectedDates.length} selected dates
                </p>
              </div>
              
              <div className="space-y-4">
                {/* Regular Vendor Option */}
                <button
                  onClick={() => handleVendorTypeSelect('regular')}
                  className="w-full p-6 border-2 border-blue-200 bg-blue-50 rounded-2xl hover:border-blue-400 hover:bg-blue-100 transition-all duration-300 transform hover:scale-105 group"
                >
                  <div className="text-center">
                    <div className="text-3xl mb-2">🛍️</div>
                    <h3 className="text-lg sm:text-xl font-bold text-blue-800 mb-1">Vendor Package</h3>
                    <p className="text-blue-600 text-xs sm:text-sm mb-2">8x8 booth for all {selectedDates.length} days</p>
                    <div className="text-xl sm:text-2xl font-bold text-blue-700">
                      ${35 * selectedDates.length}
                    </div>
                    <p className="text-blue-500 text-xs mt-1">$35/day × {selectedDates.length} days</p>
                  </div>
                </button>

                {/* Food Truck Option */}
                <button
                  onClick={() => handleVendorTypeSelect('food')}
                  className="w-full p-6 border-2 border-orange-200 bg-orange-50 rounded-2xl hover:border-orange-400 hover:bg-orange-100 transition-all duration-300 transform hover:scale-105 group"
                >
                  <div className="text-center">
                    <div className="text-3xl mb-2">🍔</div>
                    <h3 className="text-lg sm:text-xl font-bold text-orange-800 mb-1">Food Truck Package</h3>
                    <p className="text-orange-600 text-xs sm:text-sm mb-2">Premium space for all {selectedDates.length} days</p>
                    <div className="text-xl sm:text-2xl font-bold text-orange-700">
                      ${100 * selectedDates.length}
                    </div>
                    <p className="text-orange-500 text-xs mt-1">$100/day × {selectedDates.length} days</p>
                  </div>
                </button>
              </div>

              <button
                onClick={() => setShowVendorTypeModal(false)}
                className="w-full mt-6 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-semibold text-sm sm:text-base"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Booking Modal for Multi-Date */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 overflow-y-auto backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full my-8 flex flex-col max-h-[90vh] transform transition-all duration-300 animate-in fade-in-90 zoom-in-95">
            {/* Modal Header with Back Button */}
            <div className={`p-6 sm:p-8 flex-shrink-0 border-b border-gray-100 ${primaryThemeConfig.light}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleBackToVendorType}
                    className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors group"
                  >
                    <span className="text-xl group-hover:-translate-x-1 transition-transform font-bold">←</span>
                  </button>
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl sm:text-3xl">
                      {selectedVendorType === 'regular' ? '🛍️' : '🍔'}
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">
                        Multi-Day {selectedVendorType === 'regular' ? 'Vendor' : 'Food Truck'} Application
                      </h2>
                      <p className="text-gray-600 text-xs sm:text-sm">{selectedDates.length} days selected</p>
                    </div>
                  </div>
                </div>
                <div className="text-right hidden sm:block">
                  <p className={`text-lg font-bold bg-clip-text text-transparent ${
                    selectedVendorType === 'regular' 
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600' 
                      : 'bg-gradient-to-r from-orange-600 to-red-600'
                  }`}>
                    ${totalPrice}
                  </p>
                  <p className="text-sm font-bold text-gray-500">Total for {selectedDates.length} days</p>
                </div>
              </div>
              
              {/* Mobile Price */}
              <div className="sm:hidden flex justify-between items-center mt-4">
                <div className="text-left">
                  <p className={`text-lg font-bold bg-clip-text text-transparent ${
                    selectedVendorType === 'regular' 
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600' 
                      : 'bg-gradient-to-r from-orange-600 to-red-600'
                  }`}>
                    ${totalPrice}
                  </p>
                  <p className="text-xs text-gray-500">{selectedDates.length} days total</p>
                </div>
                <div className={`text-sm font-semibold px-3 py-1 text-white rounded-lg ${
                  selectedVendorType === 'regular' 
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600' 
                    : 'bg-gradient-to-r from-orange-600 to-red-600'
                }`}>
                  Multi-Day {selectedVendorType === 'regular' ? 'Vendor' : 'Food Truck'}
                </div>
              </div>
              
              {/* Selected Dates Summary */}
              <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700">Selected Dates:</span>
                  <span className="text-xs text-gray-500">{selectedDates.length} days</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {selectedDates.map((dateInfo, index) => (
                    <span 
                      key={index}
                      className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                    >
                      {dateInfo.formattedDate}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="px-4 sm:px-6 md:px-8 pb-6 overflow-y-auto flex-1 space-y-6">
                {/* Important Note */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                  <div className="flex items-start space-x-3">
                    <div className="text-blue-600 text-xl">💡</div>
                    <div>
                      <h4 className="font-semibold text-blue-800 mb-1 text-sm sm:text-base">
                        One Application for All Dates
                      </h4>
                      <p className="text-blue-700 text-xs sm:text-sm">
                        This application will apply to all {selectedDates.length} selected dates. You'll only need to fill this out once!
                      </p>
                    </div>
                  </div>
                </div>

                {/* Common Fields - Same as single page */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500 text-sm sm:text-base"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500 text-sm sm:text-base"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500 text-sm sm:text-base"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500 text-sm sm:text-base"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500 text-sm sm:text-base"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500 text-sm sm:text-base"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500 text-sm sm:text-base"
                    placeholder="@yourhandle"
                  />
                </div>

                {/* Vendor Specific Fields */}
                {selectedVendorType === 'regular' && (
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      What will you be selling? <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      value={formData.productsSelling}
                      onChange={(e) => setFormData({ ...formData, productsSelling: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500 text-sm sm:text-base"
                      placeholder="A short list of the types of items/products you plan to offer"
                    />
                  </div>
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
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500 text-sm sm:text-base"
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
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500 text-sm sm:text-base"
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500 text-sm sm:text-base"
                        placeholder="A short list of the types of food/products you plan to offer"
                      />
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500 text-sm sm:text-base"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-900 bg-white text-sm sm:text-base"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-900 bg-white text-sm sm:text-base"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-900 bg-white text-sm sm:text-base"
                  >
                    <option value="" className="text-gray-500">Select option</option>
                    <option value="no-preference" className="text-gray-900">No preference</option>
                    <option value="yes" className="text-gray-900">Yes, I am noise-sensitive</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Are you sharing a booth with another vendor? (applies to all dates)
                  </label>
                  <select
                    value={formData.sharingBooth}
                    onChange={(e) => setFormData({ ...formData, sharingBooth: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-900 bg-white text-sm sm:text-base mb-2"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500 text-sm sm:text-base"
                      placeholder="Partner's Instagram handle (@username)"
                    />
                  )}
                </div>

                {/* Electricity Policy */}
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 border border-yellow-200">
                  <h4 className="font-semibold text-yellow-800 mb-2 text-sm sm:text-base">
                    {selectedVendorType === 'regular' ? 'Electricity Policy' : 'Generator Policy'}
                  </h4>
                  <p className="text-yellow-700 text-xs sm:text-sm mb-3">
                    {selectedVendorType === 'regular'
                      ? "We'll provide access to power, but you must bring your own reliable extension cords. We recommend 25 ft, 3-prong cords."
                      : "You must bring your own QUIET generator for electricity."
                    }
                  </p>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-yellow-800">
                      {selectedVendorType === 'regular'
                        ? "Can you bring your own cord(s) for all dates?"
                        : "Can you bring your own quiet generator(s) for all dates?"
                      }
                    </label>
                    <select
                      value={selectedVendorType === 'regular' ? formData.electricityCord : formData.generator}
                      onChange={(e) => selectedVendorType === 'regular' 
                        ? setFormData({ ...formData, electricityCord: e.target.value })
                        : setFormData({ ...formData, generator: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-yellow-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200 text-gray-900 bg-white text-sm sm:text-base"
                    >
                      <option value="" className="text-gray-500">Select option</option>
                      <option value="yes" className="text-gray-900">Yes</option>
                      <option value="no" className="text-gray-900">No</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Anything else you'd like us to know? (applies to all dates)
                  </label>
                  <textarea
                    value={formData.additionalNotes}
                    onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500 text-sm sm:text-base"
                    placeholder="Additional information or special requests for all dates..."
                  />
                </div>

                {/* Indemnification Agreement */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
                  <h4 className="font-semibold text-purple-800 mb-2 text-sm sm:text-base">Indemnification Agreement</h4>
                  <p className="text-purple-700 text-xs sm:text-sm">
                    By submitting this form, you agree to indemnify and hold harmless the City, its representatives, and event organizers from any claims, damages, or liabilities arising from your participation as a vendor at the market for all selected dates.
                  </p>
                  <p className="text-purple-600 text-xs mt-2">
                    (If you'd like to read the full indemnification clause, click here)
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex gap-3 sm:gap-4 pt-6 px-4 sm:px-6 md:px-8 pb-6 sm:pb-8 flex-shrink-0 border-t border-gray-100 bg-gray-50 rounded-b-3xl">
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
                      priceRange: '',
                      electricityCord: '',
                      cuisineType: '',
                      foodItems: '',
                      setupSize: '',
                      generator: '',
                    });
                  }}
                  className="flex-1 px-4 sm:px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-all duration-200 transform hover:scale-105 font-semibold text-sm sm:text-base"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`flex-1 px-4 sm:px-6 py-3 bg-gradient-to-r ${primaryThemeConfig.color} text-white rounded-xl hover:opacity-90 transition-all duration-200 transform hover:scale-105 font-semibold text-sm sm:text-base disabled:opacity-50 disabled:transform-none`}
                >
                  {submitting ? (
                    <span className="flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Processing...
                    </span>
                  ) : (
                    `Pay $${totalPrice} for ${selectedDates.length} Days`
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