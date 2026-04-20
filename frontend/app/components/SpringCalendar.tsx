// components/SpringCalendar.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { SPRING_MARKET_DATES, getShortDate, VENDOR_CONFIG } from '@/lib/marketData';
import { getCalendarEvents, CalendarEvent } from '@/lib/api';

import big from '@/app/assets/big.webp';
import bigTwo from '@/app/assets/bigTwo.png';

interface SpringCalendarProps {
  vendorType: 'regular' | 'food';
  onDatesSelected: (dates: string[]) => void;
  selectedDates: string[];
  refreshTrigger?: number;
}

export default function SpringCalendar({ vendorType, onDatesSelected, selectedDates, refreshTrigger = 0 }: SpringCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => new Date(2026, 3, 1));
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  
  const config = VENDOR_CONFIG[vendorType];

  // Dates that are sold out (April 10, 11, 12, 2026)
  const SOLD_OUT_DATES = ['2026-04-10', '2026-04-11', '2026-04-12'];

  useEffect(() => {
    loadEvents();
  }, [refreshTrigger]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await getCalendarEvents();
      setEvents(data);
      console.log('Calendar events refreshed:', data);
    } catch (err) {
      console.error('Failed to load events:', err);
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
    for (let i = 0; i < startingDayOfWeek; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    return days;
  };

  const getMarketDateInfo = (date: Date | null) => {
    if (!date) return null;
    const dateStr = date.toISOString().split('T')[0];
    return SPRING_MARKET_DATES.find(d => d.date === dateStr);
  };

  const getEventForDate = (date: Date | null) => {
    if (!date) return null;
    const dateStr = date.toISOString().split('T')[0];
    return events.find(e => e.date === dateStr);
  };

  const getAvailableSlots = (date: Date | null) => {
    const event = getEventForDate(date);
    if (!event) return 0;
    
    if (vendorType === 'regular') {
      return event.regular_spots_available ?? event.available_slots_count ?? 0;
    } else {
      return event.food_spots_available ?? event.available_food_truck_spots ?? event.available_slots_count ?? 0;
    }
  };

  const isDateSoldOut = (date: Date | null) => {
    if (!date) return false;
    const dateStr = date.toISOString().split('T')[0];
    return SOLD_OUT_DATES.includes(dateStr);
  };

  const handleDateClick = (date: Date | null) => {
    if (!date) return;
    const dateStr = date.toISOString().split('T')[0];
    const marketInfo = getMarketDateInfo(date);
    
    if (!marketInfo) return;
    
    // Make big_festival dates unclickable
    if (marketInfo.status === 'big_festival') {
      return;
    }
    
    if (marketInfo.status === 'tentative') {
      return;
    }
    
    // Check if date is sold out
    if (isDateSoldOut(date)) {
      return;
    }
    
    const availableSlots = getAvailableSlots(date);
    if (availableSlots <= 0) return;

    onDatesSelected(
      selectedDates.includes(dateStr)
        ? selectedDates.filter(d => d !== dateStr)
        : [...selectedDates, dateStr]
    );
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      
      const year = newDate.getFullYear();
      const month = newDate.getMonth();
      if (year === 2026 && month >= 3 && month <= 4) return newDate;
      return prev;
    });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) navigateMonth(diff > 0 ? 'next' : 'prev');
    setTouchStart(null);
  };

  const days = getDaysInMonth(currentMonth);
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getStatusBadge = (status: string, notes: string) => {
    switch(status) {
      case 'big_festival':
        return (
          <div className="absolute -top-2 -right-2">
            <Image 
              src={big} 
              alt="BIG Festival" 
              width={24} 
              height={24} 
              className="opacity-80"
            />
          </div>
        );
      case 'tentative':
        return (
          <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-amber-400 text-white text-[10px] px-2 py-1 rounded-full shadow-lg font-bold">
            TBD
          </div>
        );
      default:
        return null;
    }
  };

  const formatDisplayDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00Z');
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC'
    });
  };

  if (loading && events.length === 0) {
    return (
      <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl p-4 sm:p-6 border border-white/50">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl p-4 sm:p-6 border border-white/50">
      <div className="flex justify-between items-center mb-6">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigateMonth('prev')}
          className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl shadow-md disabled:opacity-50"
          disabled={currentMonth.getMonth() === 3 && currentMonth.getFullYear() === 2026}
        >
          ←
        </motion.button>
        
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h2>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigateMonth('next')}
          className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl shadow-md disabled:opacity-50"
          disabled={currentMonth.getMonth() === 4 && currentMonth.getFullYear() === 2026}
        >
          →
        </motion.button>
      </div>

      <div 
        className="grid grid-cols-7 gap-1 sm:gap-2"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {dayNames.map(day => (
          <div key={day} className="text-center font-semibold text-gray-700 text-xs sm:text-sm py-2">
            {day}
          </div>
        ))}

        {days.map((date, index) => {
          const marketInfo = getMarketDateInfo(date);
          const dateStr = date ? date.toISOString().split('T')[0] : '';
          const isSelected = selectedDates.includes(dateStr);
          const availableSlots = getAvailableSlots(date);
          const event = getEventForDate(date);
          const isSoldOut = isDateSoldOut(date);
          const isBigFestival = marketInfo?.status === 'big_festival';

          let dayClass = "rounded-lg border-2 transition-all relative flex flex-col items-center p-1 sm:p-2 min-h-[70px] sm:min-h-[90px] ";
          
          if (!date || !marketInfo) {
            dayClass += "border-gray-200 bg-gray-100 text-gray-400";
          } else if (marketInfo.status === 'tentative') {
            dayClass += "border-yellow-300 bg-yellow-50/80 cursor-default";
          } else if (isBigFestival) {
            dayClass += "border-purple-300 bg-purple-50/80 cursor-not-allowed opacity-75";
          } else if (isSoldOut) {
            dayClass += "border-red-300 bg-red-50/80 opacity-60 cursor-not-allowed";
          } else if (availableSlots > 0) {
            dayClass += `${config.border} ${config.lightBg} cursor-pointer hover:shadow-lg transform hover:scale-105`;
          } else {
            dayClass += "border-gray-300 bg-gray-100 opacity-60";
          }

          if (isSelected) {
            dayClass += ` ring-4 ring-${config.color}-500 ring-offset-2 scale-105 z-10`;
          }

          return (
            <motion.div
              key={index}
              whileHover={date && marketInfo && marketInfo.status !== 'tentative' && !isSoldOut && !isBigFestival ? { scale: 1.05 } : {}}
              whileTap={date && marketInfo && marketInfo.status !== 'tentative' && !isSoldOut && !isBigFestival ? { scale: 0.95 } : {}}
              onClick={() => handleDateClick(date)}
              className={dayClass}
            >
              {date && marketInfo && (
                <>
                  {getStatusBadge(marketInfo.status, marketInfo.notes)}
                  
                  {/* Sold Out Ribbon */}
                  {isSoldOut && (
                    <div className="absolute -top-1 -right-1 z-20">
                      <div className="relative">
                        <div className="absolute top-0 right-0 w-0 h-0 border-t-[35px] border-r-[35px] border-t-red-500 border-r-red-500"></div>
                        <div className="absolute top-1 right-1 transform rotate-45 text-white font-bold text-[8px] sm:text-[10px] whitespace-nowrap">
                          SOLD
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {isSelected && (
                    <div className={`absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r ${config.gradient} rounded-full flex items-center justify-center shadow-lg z-20`}>
                      <span className="text-black text-xs font-bold">
                        {selectedDates.findIndex(d => d === dateStr) + 1}
                      </span>
                    </div>
                  )}

                  <div className="text-sm sm:text-base font-bold text-gray-800 mt-1">
                    {date.getDate()}
                  </div>

                  {marketInfo.status === 'available' && !isSoldOut && (
                    <div className={`text-[10px] sm:text-xs font-semibold mt-1 ${
                      availableSlots > 0 ? `text-${config.color}-700` : 'text-red-600'
                    }`}>
                      {availableSlots > 0 ? (
                        <>
                          <span className="sm:hidden">{availableSlots}</span>
                          <span className="hidden sm:inline text-gray-600">{availableSlots} {vendorType === 'regular' ? 'vendor' : 'food'} spots</span>
                        </>
                      ) : (
                        <span className="text-red-600 font-bold">SOLD</span>
                      )}
                    </div>
                  )}

                  {isBigFestival && (
                    <div className="text-[10px] sm:text-xs font-bold text-purple-700 mt-1 text-center">
                      <span className="hidden sm:inline">Big: Culture & Arts Festival</span>
                      <span className="sm:hidden">🎪</span>
                    </div>
                  )}

                  {marketInfo.status === 'tentative' && (
                    <div className="text-[10px] sm:text-xs font-medium text-yellow-700 mt-1 text-center">
                      <span>Tentative</span>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          );
        })}
      </div>

      <div className="mt-6 flex flex-wrap gap-4 justify-center text-xs">
        <div className="flex items-center gap-2">
          <div className={`w-4 h-4 ${config.lightBg} border-2 ${config.border} rounded`}></div>
          <span className="text-gray-700 font-medium">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-purple-100 border-2 border-purple-300 rounded"></div>
          <span className="text-gray-700 font-medium">Big: Culture & Arts Festival</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-100 border-2 border-red-400 rounded"></div>
          <span className="text-gray-700 font-medium">Sold Out</span>
        </div>
      </div>
    </div>
  );
}