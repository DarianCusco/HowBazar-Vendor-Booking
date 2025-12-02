'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCalendarEvents, CalendarEvent } from '@/lib/api';

const MARKET_SERIES = [
  {
    theme: "THE FIRST TASTE",
    subtheme: "cars, circus, wellness, music",
    dates: ['2025-12-12', '2025-12-13', '2025-12-14']
  },
  {
    theme: "CARS",
    subtheme: "Automotive showcase",
    dates: ['2025-12-19', '2025-12-20', '2025-12-21']
  },
  {
    theme: "COMMUNITY SUPPORT",
    subtheme: "donations for Gainesville + Alachua orgs",
    dates: ['2025-12-26', '2025-12-27', '2025-12-28']
  },
  {
    theme: "CIRCUS",
    subtheme: "Big top entertainment",
    dates: ['2026-01-02', '2026-01-03', '2026-01-04']
  },
  {
    theme: "WELLNESS",
    subtheme: "Health & mindfulness",
    dates: ['2026-01-09', '2026-01-10', '2026-01-11']
  },
  {
    theme: "MUSIC SHOWCASE",
    subtheme: "Big 2026 themed",
    dates: ['2026-01-16', '2026-01-17', '2026-01-18']
  },
  {
    theme: "THE FINALE",
    subtheme: "Knights & fantasy",
    dates: ['2026-01-23', '2026-01-24', '2026-01-25']
  }
];

// Theme colors and icons mapping
const THEME_CONFIG = {
  "THE FIRST TASTE": { 
    color: 'from-purple-500 to-pink-500', 
    border: 'border-purple-300',
    bg: 'bg-purple-50',
    icon: '🎪'
  },
  "CARS": { 
    color: 'from-blue-500 to-cyan-500', 
    border: 'border-blue-300',
    bg: 'bg-blue-50',
    icon: '🚗'
  },
  "COMMUNITY SUPPORT": { 
    color: 'from-green-500 to-emerald-500', 
    border: 'border-green-300',
    bg: 'bg-green-50',
    icon: '🤝'
  },
  "CIRCUS": { 
    color: 'from-red-500 to-orange-500', 
    border: 'border-red-300',
    bg: 'bg-red-50',
    icon: '🎭'
  },
  "WELLNESS": { 
    color: 'from-teal-500 to-blue-500', 
    border: 'border-teal-300',
    bg: 'bg-teal-50',
    icon: '🧘'
  },
  "MUSIC SHOWCASE": { 
    color: 'from-yellow-500 to-red-500', 
    border: 'border-yellow-300',
    bg: 'bg-yellow-50',
    icon: '🎵'
  },
  "THE FINALE": { 
    color: 'from-amber-700 to-yellow-600', 
    border: 'border-amber-400',
    bg: 'bg-amber-50',
    icon: '⚔️'
  }
};

export default function Home() {
  const router = useRouter();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(() => {
    return new Date(2025, 11, 1); // December 2025
  });
  const [error, setError] = useState<string | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  
  // Multi-selection state
  const [selectionMode, setSelectionMode] = useState<'single' | 'multi'>('single');
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [showMobileSummary, setShowMobileSummary] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await getCalendarEvents();
      // Filter out any events outside our market series dates
      const filteredEvents = data.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate >= new Date('2025-12-12') && eventDate <= new Date('2026-01-25');
      });
      setEvents(filteredEvents);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const getEventForDate = (date: Date | null): CalendarEvent | undefined => {
    if (!date) return undefined;
    const dateStr = date.toISOString().split('T')[0];
    return events.find(event => event.date === dateStr);
  };

  const getThemeForDate = (date: Date | null) => {
    if (!date) return null;
    const dateStr = date.toISOString().split('T')[0];
    
    for (const weekend of MARKET_SERIES) {
      if (weekend.dates.includes(dateStr)) {
        return weekend;
      }
    }
    return null;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      
      const newYear = newDate.getFullYear();
      const newMonth = newDate.getMonth();
      
      // Only allow December 2025 and January 2026
      const isDecember2025 = newYear === 2025 && newMonth === 11;
      const isJanuary2026 = newYear === 2026 && newMonth === 0;
      
      if (isDecember2025 || isJanuary2026) {
        return newDate;
      }
      
      return prev;
    });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;
    
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        navigateMonth('next');
      } else {
        navigateMonth('prev');
      }
    }
    
    setTouchStart(null);
  };

  const handleDateClick = (date: Date | null, event: CalendarEvent | undefined) => {
    if (!date || !event) return;
    
    const dateStr = date.toISOString().split('T')[0];
    const themeInfo = getThemeForDate(date);
    
    if (!themeInfo || event.available_slots <= 0) return;

    if (selectionMode === 'single') {
      // Original behavior - go to single event page
      router.push(`/event/${event.id}`);
    } else {
      // Multi-select behavior
      setSelectedDates(prev => {
        if (prev.includes(dateStr)) {
          // Deselect
          return prev.filter(d => d !== dateStr);
        } else {
          // Select (no limit)
          return [...prev, dateStr];
        }
      });
    }
  };

  const handleProceedToBooking = () => {
    if (selectedDates.length === 0) return;
    
    // Sort dates chronologically
    const sortedDates = [...selectedDates].sort();
    
    // Create a booking session with all selected dates
    const sessionData = {
      dates: sortedDates,
      count: sortedDates.length,
      // For now, we'll pass as query params. In production, create a session in backend
    };
    
    // Encode the data for URL
    const encodedData = btoa(JSON.stringify(sessionData));
    router.push(`/booking/multi?session=${encodedData}`);
  };

  const clearAllSelections = () => {
    setSelectedDates([]);
  };

  const removeDateFromSelection = (dateStr: string) => {
    setSelectedDates(prev => prev.filter(d => d !== dateStr));
  };

  // Calculate totals
  const calculateTotalPrice = (vendorType: 'regular' | 'food') => {
    const pricePerDay = vendorType === 'regular' ? 35 : 100;
    return pricePerDay * selectedDates.length;
  };

  // Group selected dates by theme
  const groupSelectedDatesByTheme = () => {
    const grouped: Record<string, string[]> = {};
    
    selectedDates.forEach(dateStr => {
      const date = new Date(dateStr);
      const themeInfo = getThemeForDate(date);
      const theme = themeInfo?.theme || 'Other';
      
      if (!grouped[theme]) {
        grouped[theme] = [];
      }
      grouped[theme].push(dateStr);
    });
    
    return grouped;
  };

  const getAvailableSlotsForDate = (date: Date | null) => {
    if (!date) return 0;
    const event = getEventForDate(date);
    return event ? event.available_slots : 26;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-xl">Loading events...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-red-500 text-xl">Error: {error}</div>
      </div>
    );
  }

  const days = getDaysInMonth(currentMonth);
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const currentMonthName = monthNames[currentMonth.getMonth()];
  const currentYear = currentMonth.getFullYear();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const groupedDates = groupSelectedDatesByTheme();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col pb-20 sm:pb-6">
      {/* Header */}
      <div className="relative py-4 sm:py-6 shadow-lg overflow-hidden bg-gray-900">
        <div className="absolute inset-0 overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat animate-pan"
            style={{
              backgroundImage: 'url(https://thehowbazar.com/cdn/shop/files/Screen_Shot_2024-06-24_at_2.00.43_PM.png?v=1719252060&width=3840)',
            }}
          >
            <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]"></div>
          </div>
        </div>
        
        <div className="relative max-w-5xl mx-auto px-4 text-center">
          <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-2">
            Downtown Winter Market Series
          </h1>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/90 font-semibold">
            Dec 12, 2025 - Jan 25, 2026
          </p>
          <div className="glass-card inline-flex flex-col sm:flex-row gap-2 sm:gap-4 px-6 py-3 rounded-xl border border-white/20">
            <span className="text-white/80 font-bold text-xs sm:text-sm">🎪 Friday & Saturday: 4PM-10PM</span>
            <span className="text-white/80 font-bold text-xs sm:text-sm">🌞 Sunday: 12PM-5PM</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full p-3 sm:p-4 md:p-6">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl flex flex-col h-full p-3 sm:p-4 md:p-6">
          {/* Calendar Navigation & Mode Selection */}
          <div className="mb-4 sm:mb-6">
            {/* Mobile Mode Toggle (Top on mobile) */}
            <div className="sm:hidden mb-4">
              <div className="flex flex-col gap-3">
                <div className="text-center">
                  <span className="text-sm font-medium text-gray-600">Select the dates you'd like to vend</span>
                </div>
                <div className="flex justify-center">
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => {
                        setSelectionMode('single');
                        setSelectedDates([]);
                      }}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                        selectionMode === 'single' 
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow' 
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Single Day
                    </button>
                    <button
                      onClick={() => setSelectionMode('multi')}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                        selectionMode === 'multi' 
                          ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow' 
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Multiple Days
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Month Navigation */}
            <div className="sm:hidden mb-4">
              <div className="flex justify-between items-center">
                <button
                  onClick={() => navigateMonth('prev')}
                  className="px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Previous month"
                  disabled={currentMonth.getMonth() === 11 && currentMonth.getFullYear() === 2025}
                >
                  <span className="text-lg">←</span>
                </button>
                
                <div className="flex flex-col items-center">
                  <h2 className="text-lg font-bold text-gray-800 bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent text-center">
                    {currentMonthName} {currentYear}
                  </h2>
                </div>
                
                <button
                  onClick={() => navigateMonth('next')}
                  className="px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Next month"
                  disabled={currentMonth.getMonth() === 0 && currentMonth.getFullYear() === 2026}
                >
                  <span className="text-lg">→</span>
                </button>
              </div>
            </div>

            {/* Desktop Navigation with centered mode toggle */}
            <div className="hidden sm:block">
              <div className="flex justify-between items-center mb-4">
                <button
                  onClick={() => navigateMonth('prev')}
                  className="sm:px-4 sm:py-2 p-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Previous month"
                  disabled={currentMonth.getMonth() === 11 && currentMonth.getFullYear() === 2025}
                >
                  <span className="hidden sm:inline">← Previous</span>
                  <span className="sm:hidden text-lg">←</span>
                </button>
                
                <div className="flex flex-col items-center">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-800 bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent text-center">
                    {currentMonthName} {currentYear}
                  </h2>
                  
                  {/* Desktop Mode Toggle - Centered under month */}
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-sm text-gray-600 font-medium">Booking Mode:</span>
                    <div className="flex bg-gray-100 rounded-lg p-1">
                      <button
                        onClick={() => {
                          setSelectionMode('single');
                          setSelectedDates([]);
                        }}
                        className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                          selectionMode === 'single' 
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow' 
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        Single Day
                      </button>
                      <button
                        onClick={() => setSelectionMode('multi')}
                        className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                          selectionMode === 'multi' 
                            ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow' 
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        Multiple Days
                      </button>
                    </div>
                    
                    {/* Selection counter badge */}
                    {selectionMode === 'multi' && selectedDates.length > 0 && (
                      <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                        {selectedDates.length} selected
                      </div>
                    )}
                  </div>
                </div>
                
                <button
                  onClick={() => navigateMonth('next')}
                  className="sm:px-4 sm:py-2 p-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Next month"
                  disabled={currentMonth.getMonth() === 0 && currentMonth.getFullYear() === 2026}
                >
                  <span className="hidden sm:inline">Next →</span>
                  <span className="sm:hidden text-lg">→</span>
                </button>
              </div>
            </div>
            
            {/* Instructions */}
            <div className="text-center mt-3">
              <p className="text-xs text-gray-500">
                {selectionMode === 'multi' 
                  ? '💡 Tap dates to select multiple days • Swipe left/right to navigate months'
                  : '💡 Tap a date to book • Swipe left/right to navigate months'}
              </p>
            </div>
          </div>

          {/* Calendar Grid */}
          <div 
            className="flex-1 grid grid-cols-7 gap-1 sm:gap-2 min-h-0 mb-4"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Day Headers */}
            {dayNames.map(day => (
              <div
                key={day}
                className="text-center font-bold text-gray-600 text-xs sm:text-sm py-2 sm:py-3 bg-gradient-to-b from-gray-50 to-gray-100 rounded-lg shadow-sm"
              >
                {day}
              </div>
            ))}

            {/* Calendar Days */}
            {days.map((date, index) => {
              const event = getEventForDate(date);
              const themeInfo = getThemeForDate(date);
              const themeConfig = themeInfo ? THEME_CONFIG[themeInfo.theme as keyof typeof THEME_CONFIG] : null;
              const isToday = date && date.toDateString() === new Date().toDateString();
              const dateStr = date ? date.toISOString().split('T')[0] : '';
              const isSelected = date ? selectedDates.includes(dateStr) : false;
              
              const availableSlots = getAvailableSlotsForDate(date);
              const hasAvailableSpots = availableSlots > 0;
              const isEventDay = themeInfo !== null;

              return (
                <div
                  key={index}
                  onClick={() => handleDateClick(date, event)}
                  className={`
                    rounded-lg sm:rounded-xl border-2 transition-all relative flex flex-col items-center justify-start p-1 sm:p-2 min-h-[70px] sm:min-h-[90px]
                    ${date === null 
                      ? 'border-transparent cursor-default' 
                      : isEventDay
                      ? hasAvailableSpots
                        ? `${themeConfig?.border} ${themeConfig?.bg} hover:shadow-lg cursor-pointer transform hover:scale-105`
                        : `${themeConfig?.border} ${themeConfig?.bg} opacity-60 cursor-not-allowed`
                      : 'border-gray-200 bg-gray-50 cursor-default'
                    }
                    ${isToday ? 'ring-2 ring-blue-400 ring-offset-1 sm:ring-offset-2' : ''}
                    ${isEventDay && hasAvailableSpots ? 'shadow-md hover:shadow-lg' : 'shadow-sm'}
                    ${isSelected ? 'ring-4 ring-blue-500 ring-offset-1 sm:ring-offset-2 scale-105 z-10' : ''}
                  `}
                >
                  {date && (
                    <>
                      {/* Selection indicator */}
                      {isSelected && (
                        <div className="absolute -top-1 -right-1 sm:top-1 sm:right-1 w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg z-20">
                          <span className="text-white text-xs font-bold">
                            {selectedDates.findIndex(d => d === dateStr) + 1}
                          </span>
                        </div>
                      )}

                      {/* Day number */}
                      <div className={`text-xs sm:text-sm font-semibold mt-1 ${
                        isEventDay 
                          ? hasAvailableSpots ? 'text-gray-800' : 'text-gray-500'
                          : 'text-gray-600'
                      } ${isToday ? 'font-bold text-blue-600' : ''} ${isSelected ? 'font-bold' : ''}`}>
                        {date.getDate()}
                      </div>

                      {/* Theme Icon */}
                      {themeConfig && (
                        <div className="text-lg sm:text-xl mb-0.5 sm:mb-1">{themeConfig.icon}</div>
                      )}

                      {/* Availability */}
                      {isEventDay && (
                        <div className={`text-[10px] sm:text-xs font-bold text-center ${
                          hasAvailableSpots 
                            ? themeConfig 
                              ? `bg-gradient-to-r ${themeConfig.color} bg-clip-text text-transparent`
                              : 'text-green-600'
                            : 'text-red-500'
                        }`}>
                          {hasAvailableSpots ? (
                            <>
                              <span className="sm:hidden">{availableSlots}</span>
                              <span className="hidden sm:inline">{availableSlots} spots</span>
                            </>
                          ) : (
                            <span className="text-[9px] sm:text-xs">SOLD OUT</span>
                          )}
                        </div>
                      )}

                      {/* Vendor type indicators */}
                      {isEventDay && (
                        <>
                          <div className="hidden sm:flex mt-1 justify-center space-x-1">
                            <span className="text-[10px] bg-blue-100 text-blue-700 px-1 rounded">26 Vendors</span>
                            <span className="text-[10px] bg-orange-100 text-orange-700 px-1 rounded">2 Food</span>
                          </div>
                          
                          <div className="sm:hidden flex justify-center space-x-1 mt-0.5">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" title="26 Vendor spots"></div>
                            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" title="2 Food truck spots"></div>
                          </div>
                        </>
                      )}
                      
                      {/* Multi-select hint */}
                      {selectionMode === 'multi' && isEventDay && hasAvailableSpots && !isSelected && (
                        <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Multi-Selection Summary (Desktop) - Stacked Layout */}
          {selectionMode === 'multi' && selectedDates.length > 0 && (
            <div className="hidden sm:block mt-6">
              <div className="flex flex-col items-center gap-6 max-w-3xl mx-auto">
                {/* Pricing Summary Box */}
                <div className="w-full bg-white p-6 rounded-xl border border-blue-200 shadow-lg">
                  <h4 className="font-bold text-gray-800 mb-4 text-center text-lg">Pricing Summary</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                        <div className="flex justify-between items-center mb-2">
                          <div>
                            <div className="text-sm font-semibold text-gray-700">Regular Vendor</div>
                            <div className="text-xs text-gray-500">$35/day × {selectedDates.length} days</div>
                          </div>
                          <div className="text-xl font-bold text-blue-600">
                            ${calculateTotalPrice('regular')}
                          </div>
                        </div>
                        <div className="text-xs text-gray-600">
                          26 vendor spots available per day
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                        <div className="flex justify-between items-center mb-2">
                          <div>
                            <div className="text-sm font-semibold text-gray-700">Food Vendor</div>
                            <div className="text-xs text-gray-500">$100/day × {selectedDates.length} days</div>
                          </div>
                          <div className="text-xl font-bold text-orange-600">
                            ${calculateTotalPrice('food')}
                          </div>
                        </div>
                        <div className="text-xs text-gray-600">
                          2 food truck spots available per day
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t text-center">
                    <div className="text-sm text-gray-600 mb-3">
                      Select vendor type on the next page
                    </div>
                    <div className="flex justify-center gap-4">
                      <button
                        onClick={clearAllSelections}
                        className="px-6 py-3 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                      >
                        Clear All Selections
                      </button>
                      <button
                        onClick={handleProceedToBooking}
                        className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-lg hover:from-green-600 hover:to-emerald-600 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
                      >
                        Book {selectedDates.length} Day{selectedDates.length > 1 ? 's' : ''} →
                      </button>
                    </div>
                  </div>
                </div>

                {/* Selected Dates & Grouping - Smaller Stacked Layout */}
                <div className="w-full">
                  <div className="mb-4">
                    <h3 className="font-bold text-gray-600 text-center mb-3">
                      Selected Dates ({selectedDates.length})
                    </h3>
                    
                    {/* Selected dates chips - smaller */}
                    <div className="flex flex-wrap justify-center gap-2 mb-4">
                      {selectedDates.map(dateStr => {
                        const date = new Date(dateStr);
                        const themeInfo = getThemeForDate(date);
                        const config = themeInfo ? THEME_CONFIG[themeInfo.theme as keyof typeof THEME_CONFIG] : null;
                        
                        return (
                          <div 
                            key={dateStr}
                            className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow text-xs"
                          >
                            <span className="text-sm">{config?.icon}</span>
                            <div>
                              <div className="font-medium text-black">
                                {date.toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric' 
                                })}
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeDateFromSelection(dateStr);
                              }}
                              className="ml-1 text-gray-400 hover:text-red-500 hover:bg-red-50 w-5 h-5 rounded-full flex items-center justify-center text-xs"
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Grouped by theme - smaller */}
                    {selectedDates.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2 text-center">Grouped by Theme:</h4>
                        <div className="flex flex-wrap justify-center gap-2">
                          {Object.entries(groupedDates).map(([theme, dates]) => {
                            const config = THEME_CONFIG[theme as keyof typeof THEME_CONFIG];
                            return (
                              <div key={theme} className="bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm flex items-center gap-2 text-xs">
                                <span className="text-sm">{config?.icon}</span>
                                <div>
                                  <div className="font-medium text-gray-800">{theme}</div>
                                  <div className="text-gray-600">
                                    {dates.length} day{dates.length > 1 ? 's' : ''}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Theme Legend */}
          <div className="mt-4 sm:mt-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 sm:mb-3 text-center">Event Themes</h3>
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
              {MARKET_SERIES.map((weekend, index) => {
                const config = THEME_CONFIG[weekend.theme as keyof typeof THEME_CONFIG];
                const startDate = new Date(weekend.dates[0]);
                const formattedDate = startDate.toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                });
                
                return (
                  <div 
                    key={index} 
                    className={`flex items-center space-x-2 p-2 rounded-lg ${config.bg} ${config.border} border`}
                  >
                    <span className="text-base sm:text-lg">{config.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-gray-800 truncate leading-tight">
                        {weekend.theme}
                      </div>
                      <div className="text-[10px] text-gray-600 truncate">
                        {formattedDate}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Info section */}
          <div className="mt-4 sm:mt-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-3 sm:p-4 border border-blue-200">
            <div className="grid grid-cols-1 xs:grid-cols-3 gap-3 sm:gap-4 text-center">
              <div>
                <div className="font-semibold text-gray-800 text-sm sm:text-base">Vendor</div>
                <div className="text-xl sm:text-2xl font-bold text-blue-600">$35</div>
                <div className="text-xs text-gray-600">26 spots/day</div>
              </div>
              <div>
                <div className="font-semibold text-gray-800 text-sm sm:text-base">Food Truck</div>
                <div className="text-xl sm:text-2xl font-bold text-orange-600">$100</div>
                <div className="text-xs text-gray-600">2 spots/day</div>
              </div>
              <div>
                <div className="font-semibold text-gray-800 text-sm sm:text-base">Total Events</div>
                <div className="text-xl sm:text-2xl font-bold text-purple-600">21</div>
                <div className="text-xs text-gray-600">Dec 12 - Jan 25</div>
              </div>
            </div>
          </div>
          
          <div className="sm:hidden mt-4 text-center">
            <p className="text-xs text-gray-500">
              {selectionMode === 'multi' 
                ? '💡 Tap dates to select • Blue number shows selection order'
                : '💡 Tap event dates to book • Colored dots show vendor types'}
            </p>
          </div>
        </div>
      </div>

      {selectionMode === 'multi' && selectedDates.length > 0 && (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-2xl rounded-t-2xl p-4 z-50 animate-slide-up">
          <div className="flex justify-between items-center mb-3">
            <div>
              <div className="font-bold text-gray-800">
                {selectedDates.length} day{selectedDates.length > 1 ? 's' : ''} selected
              </div>
              <div className="text-sm text-gray-600">
                Regular: ${calculateTotalPrice('regular')} • Food: ${calculateTotalPrice('food')}
              </div>
            </div>
            <button
              onClick={() => setShowMobileSummary(!showMobileSummary)}
              className="text-gray-500"
            >
              {showMobileSummary ? '▲' : '▼'}
            </button>
          </div>
          
          {showMobileSummary && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto mb-3">
                {selectedDates.map(dateStr => {
                  const date = new Date(dateStr);
                  const themeInfo = getThemeForDate(date);
                  const config = themeInfo ? THEME_CONFIG[themeInfo.theme as keyof typeof THEME_CONFIG] : null;
                  
                  return (
                    <div 
                      key={dateStr}
                      className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border"
                    >
                      <span className="text-base">{config?.icon}</span>
                      <div>
                        <div className="text-xs font-semibold text-black">
                          {date.toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeDateFromSelection(dateStr);
                        }}
                        className="ml-1 text-gray-400 hover:text-red-500"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
              
              <div className="text-xs text-gray-600 mb-3">
                {Object.keys(groupedDates).length} theme{Object.keys(groupedDates).length > 1 ? 's' : ''}
              </div>
            </div>
          )}
          
          <div className="flex gap-3">
            <button
              onClick={clearAllSelections}
              className="flex-1 px-4 py-3 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Clear
            </button>
            <button
              onClick={handleProceedToBooking}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-lg hover:from-green-600 hover:to-emerald-600 shadow-lg"
            >
              Book Now →
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes pan {
          0% {
            background-position: 0% center;
          }
          100% {
            background-position: 100% center;
          }
        }
        .animate-pan {
          animation: pan 60s linear infinite;
          background-size: 200% auto;
        }
        
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}