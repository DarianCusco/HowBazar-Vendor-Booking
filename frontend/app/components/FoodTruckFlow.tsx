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
    if (dates.length > 0) {
      setStep('form');
    } else {
      setStep('calendar');
    }
  };

  const handleBackToCalendar = () => {
    setStep('calendar');
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Bar - Updated colors */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
            className="text-white/90 hover:text-white flex items-center gap-2 drop-shadow-md"
          >
            <span className="text-xl">←</span>
            <span className="text-sm font-medium">Back</span>
          </motion.button>
          <div className="text-sm text-white/80 font-medium drop-shadow-md">
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
          >
            <div className="text-center mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 drop-shadow-lg">
                Select Your Dates
              </h2>
              <p className="text-white/90 text-lg drop-shadow-md">
                Choose the days for your food truck this spring
              </p>
              {selectedDates.length > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="mt-4 inline-block"
                >
                  <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-4 py-2 rounded-full shadow-lg font-medium">
                    {selectedDates.length} day{selectedDates.length > 1 ? 's' : ''} selected
                  </div>
                </motion.div>
              )}
            </div>

            <SpringCalendar
              vendorType="food"
              onDatesSelected={handleDatesSelected}
              selectedDates={selectedDates}
            />

            {selectedDates.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 text-center"
              >
                <p className="text-white/80 text-sm mb-4 drop-shadow">
                  ✨ Continue to complete your booking for {selectedDates.length} day{selectedDates.length > 1 ? 's' : ''}
                </p>
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
    </div>
  );
}