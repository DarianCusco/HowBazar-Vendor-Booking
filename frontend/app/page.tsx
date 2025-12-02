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
    theme: "MEDIEVAL",
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
  "MEDIEVAL": { 
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
  const [currentMonth, setCurrentMonth] = useState(new Date('2025-12-01')); // Start with December
  const [error, setError] = useState<string | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);

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
      
      if (newYear === 2025 && newMonth === 11) return newDate; // December 2025
      if (newYear === 2026 && newMonth === 0) return newDate;  // January 2026
      
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
    const themeInfo = getThemeForDate(date);
    if (date && themeInfo && event) {
      router.push(`/event/${event.id}`);
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
  const currentMonthName = monthNames[currentMonth.getMonth()];
  const currentYear = currentMonth.getFullYear();

  // Calculate available slots for market series dates
  const getAvailableSlotsForDate = (date: Date | null) => {
    if (!date) return 0;
    const event = getEventForDate(date);
    return event ? event.available_slots : 26;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
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
          {/* Calendar Navigation */}
          <div className="mb-4 sm:mb-6">
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
              
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent text-center">
                {currentMonthName} {currentYear}
              </h2>
              
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
            
            {/* Swipe instruction for mobile */}
            <div className="sm:hidden text-center">
              <p className="text-xs text-gray-500">Swipe left/right to navigate months</p>
            </div>
          </div>

          {/* Calendar Grid */}
          <div 
            className="flex-1 grid grid-cols-7 gap-1 sm:gap-2 min-h-0"
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
              
              const availableSlots = getAvailableSlotsForDate(date);
              const hasAvailableSpots = availableSlots > 0;
              const isEventDay = themeInfo !== null;

              return (
                <div
                  key={index}
                  onClick={() => handleDateClick(date, event)}
                  className={`
                    rounded-lg sm:rounded-xl border-2 transition-all relative flex flex-col items-center justify-start p-1 sm:p-2 min-h-[60px] sm:min-h-[80px]
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
                  `}
                >
                  {date && (
                    <>
                      {/* Day number */}
                      <div className={`text-xs sm:text-sm font-semibold mb-1 ${
                        isEventDay 
                          ? hasAvailableSpots ? 'text-gray-800' : 'text-gray-500'
                          : 'text-gray-600'
                      } ${isToday ? 'font-bold text-blue-600' : ''}`}>
                        {date.getDate()}
                      </div>

                      {/* Theme Icon */}
                      {themeConfig && (
                        <div className="text-base sm:text-lg mb-0.5 sm:mb-1">{themeConfig.icon}</div>
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

                      {isEventDay && (
                        <div className="hidden sm:flex mt-1 justify-center space-x-1">
                          <span className="text-[10px] bg-blue-100 text-blue-700 px-1 rounded">26 Vendors</span>
                          <span className="text-[10px] bg-orange-100 text-orange-700 px-1 rounded">2 Food</span>
                        </div>
                      )}
                      
                      {isEventDay && (
                        <div className="sm:hidden flex justify-center space-x-1 mt-0.5">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" title="26 Vendor spots"></div>
                          <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" title="2 Food truck spots"></div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>

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

          {/* Quick Info section bottom */}
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
                <div className="text-xl sm:text-2xl font-bold text-purple-600">21 Days</div>
                <div className="text-xs text-gray-600">Dec 12 - Jan 25</div>
              </div>
            </div>
          </div>
          
          {/* Mobile only */}
          <div className="sm:hidden mt-4 text-center">
            <p className="text-xs text-gray-500">
              💡 Tap event dates to book • Colored dots show vendor types
            </p>
          </div>
        </div>
      </div>

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
      `}</style>
    </div>
  );
}