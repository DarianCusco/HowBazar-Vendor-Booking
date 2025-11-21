'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCalendarEvents, CalendarEvent } from '@/lib/api';

export default function Home() {
  const router = useRouter();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await getCalendarEvents();
      setEvents(data);
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
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
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

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const handleDateClick = (date: Date | null, event: CalendarEvent | undefined) => {
    // Only navigate if event exists and has available spots
    if (date && event && event.available_slots > 0) {
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading events...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500 text-xl">Error: {error}</div>
      </div>
    );
  }

  const days = getDaysInMonth(currentMonth);
  const currentMonthName = monthNames[currentMonth.getMonth()];
  const currentYear = currentMonth.getFullYear();

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col overflow-hidden">
      <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full p-2 sm:p-4">
        <div className="bg-white rounded-lg shadow-xl flex flex-col h-full p-3 sm:p-4">
          {/* Compact Header */}
          <div className="mb-2">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 text-center mb-1">
              Vendor Event Calendar
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 text-center mb-2">
              Click highlighted dates for booth spots
            </p>

            {/* Calendar Navigation */}
            <div className="flex justify-between items-center mb-2">
              <button
                onClick={() => navigateMonth('prev')}
                className="px-2 py-1 text-xs sm:px-3 sm:py-1.5 sm:text-sm bg-primary-600 text-white rounded hover:bg-primary-700 transition"
              >
                ← Prev
              </button>
              <h2 className="text-base sm:text-lg font-semibold text-gray-800">
                {currentMonthName} {currentYear}
              </h2>
              <button
                onClick={() => navigateMonth('next')}
                className="px-2 py-1 text-xs sm:px-3 sm:py-1.5 sm:text-sm bg-primary-600 text-white rounded hover:bg-primary-700 transition"
              >
                Next →
              </button>
            </div>
          </div>

          {/* Calendar Grid - Takes remaining space */}
          <div className="flex-1 grid grid-cols-7 gap-1 sm:gap-1.5 min-h-0">
            {/* Day Headers */}
            {dayNames.map(day => (
              <div
                key={day}
                className="text-center font-semibold text-gray-700 text-xs sm:text-sm py-1 flex items-center justify-center"
              >
                {day}
              </div>
            ))}

            {/* Calendar Days */}
            {days.map((date, index) => {
              const event = getEventForDate(date);
              const isToday = date && 
                date.toDateString() === new Date().toDateString();
              
              // Determine if event has available spots
              const hasAvailableSpots = event && event.available_slots > 0;
              const hasNoSpots = event && event.available_slots === 0;

              return (
                <div
                  key={index}
                  onClick={() => handleDateClick(date, event)}
                  className={`
                    rounded border transition-all relative flex items-center justify-center
                    ${date === null 
                      ? 'border-transparent cursor-default' 
                      : event
                      ? hasAvailableSpots
                        ? 'bg-green-100 border-green-500 hover:bg-green-200 hover:shadow-sm cursor-pointer'
                        : 'bg-red-100 border-red-500 hover:bg-red-200 hover:shadow-sm cursor-pointer'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100 cursor-default'
                    }
                    ${isToday ? 'ring-1 ring-blue-400' : ''}
                    text-xs sm:text-sm
                    p-0.5 sm:p-1
                  `}
                >
                  {date && (
                    <>
                      {/* Day number in top-left */}
                      <div className={`
                        absolute top-0.5 left-0.5 sm:top-1 sm:left-1
                        font-medium
                        ${hasAvailableSpots ? 'text-green-700' : hasNoSpots ? 'text-red-700' : 'text-gray-600'}
                        ${isToday ? 'font-bold' : ''}
                      `}>
                        {date.getDate()}
                      </div>
                      {/* Availability number centered */}
                      {event && (
                        <div className={`text-[10px] sm:text-lg font-semibold ${
                          hasAvailableSpots ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {hasAvailableSpots ? event.available_slots : 'SOLD OUT'}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Compact Legend */}
          <div className="mt-2 flex justify-center gap-3 text-[10px] sm:text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-100 border border-green-500 rounded"></div>
              <span className="text-gray-700">Available spots</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-100 border border-red-500 rounded"></div>
              <span className="text-gray-700">Sold out</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-gray-50 border border-gray-200 rounded"></div>
              <span className="text-gray-700">No events</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

