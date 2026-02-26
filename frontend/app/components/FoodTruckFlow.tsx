// components/FoodTruckFlow.tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SpringCalendar from './SpringCalendar';
import FoodTruckBookingForm from './FoodTruckBookingForm';
import { VENDOR_CONFIG } from '@/lib/marketData';

interface FoodTruckFlowProps {
  onBack: () => void;
}

export default function FoodTruckFlow({ onBack }: FoodTruckFlowProps) {
  const [step, setStep] = useState<'calendar' | 'form'>('calendar');
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const config = VENDOR_CONFIG.food;

  const handleDatesSelected = (dates: string[]) => {
    setSelectedDates(dates);
    // Don't auto-advance to form - wait for confirm button
  };

  const handleConfirmSelection = () => {
    if (selectedDates.length > 0) {
      setStep('form');
    }
  };

  const handleBackToCalendar = () => {
    setStep('calendar');
  };

  const clearAllSelections = () => {
    setSelectedDates([]);
  };

  const removeDate = (dateToRemove: string) => {
    setSelectedDates(selectedDates.filter(d => d !== dateToRemove));
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4">
      {/* Progress Bar */}
      <div className="mb-6 sm:mb-8">
        <div className="flex justify-between items-center mb-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
            className="text-white/90 hover:text-white flex items-center gap-1 sm:gap-2 drop-shadow-md text-sm sm:text-base"
          >
            <span className="text-lg sm:text-xl">←</span>
            <span className="text-sm font-medium">Back</span>
          </motion.button>
          <div className="text-xs sm:text-sm text-white/80 font-medium drop-shadow-md">
            Step {step === 'calendar' ? '1' : '2'} of 2
          </div>
        </div>
        <div className="h-2 bg-white/30 backdrop-blur-sm rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-yellow-400 to-orange-400"
            initial={{ width: '0%' }}
            animate={{ width: step === 'calendar' ? '50%' : '100%' }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 'calendar' ? (
          <motion.div
            key="calendar"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="px-0"
          >
            <div className="text-center mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2 drop-shadow-lg px-2">
                Select Your Dates
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-white/90 drop-shadow-md px-2">
                Choose the days for your food truck this spring
              </p>
            </div>

            <SpringCalendar
              vendorType="food"
              onDatesSelected={handleDatesSelected}
              selectedDates={selectedDates}
            />

            {/* Selected Dates Summary - Mobile Friendly */}
            {selectedDates.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 sm:mt-6 bg-white/20 backdrop-blur-md rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/30"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-3 py-1 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap">
                      {selectedDates.length} {selectedDates.length === 1 ? 'day' : 'days'}
                    </div>
                    <span className="text-white/80 text-xs sm:text-sm">selected</span>
                  </div>
                  
                  {/* Mobile: Horizontal scroll for selected dates */}
                  <div className="flex-1 overflow-x-auto pb-1 hide-scrollbar">
                    <div className="flex gap-1 sm:gap-2 min-w-min">
                      {selectedDates.map(date => {
                        const displayDate = new Date(date + 'T00:00:00Z').toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          timeZone: 'UTC'
                        });
                        return (
                          <div
                            key={date}
                            className="flex items-center gap-1 bg-white/30 backdrop-blur-sm px-2 py-1 rounded-full border border-white/40 whitespace-nowrap"
                          >
                            <span className="text-white text-xs font-medium">{displayDate}</span>
                            <button
                              onClick={() => removeDate(date)}
                              className="w-4 h-4 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white text-xs transition-colors"
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Clear all button */}
                  <button
                    onClick={clearAllSelections}
                    className="text-white/70 hover:text-white text-xs sm:text-sm transition-colors underline underline-offset-2 sm:ml-2"
                  >
                    Clear all
                  </button>
                </div>

                {/* Confirm Button - Prominent and centered */}
                <div className="mt-4 flex justify-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleConfirmSelection}
                    className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold text-base sm:text-lg rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                  >
                    <span>Confirm Selection</span>
                    <span className="text-lg sm:text-xl">→</span>
                  </motion.button>
                </div>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <FoodTruckBookingForm
              selectedDates={selectedDates}
              vendorType="food"
              onBack={handleBackToCalendar}
            />
          </motion.div>
        )}
      </AnimatePresence>

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
    </div>
  );
}