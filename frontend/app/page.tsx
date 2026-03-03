// app/page.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cubicBezier } from 'framer-motion';
import Image from 'next/image';
import VendorFlow from './components/VendorFlow';
import FoodTruckFlow from './components/FoodTruckFlow';

//images
import DSC_0550 from '@/app/assets/DSC_0550.jpg';

const SPRING_IMAGES = [
  DSC_0550
];

export default function SpringMarketLanding() {
  const [selectedType, setSelectedType] = useState<'vendor' | 'food' | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const customEasing = cubicBezier(0.43, 0.13, 0.23, 0.96);

  // Slower image transitions - increased to 8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setDirection(Math.random() > 0.5 ? 'left' : 'right');
      setCurrentImageIndex((prev) => (prev + 1) % SPRING_IMAGES.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // Parallax effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const { left, top, width, height } = containerRef.current.getBoundingClientRect();
        const x = (e.clientX - left) / width - 0.5;
        const y = (e.clientY - top) / height - 0.5;
        setMousePosition({ x, y });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleTypeSelect = (type: 'vendor' | 'food') => {
    setSelectedType(type);
    setShowCalendar(true);
    setTimeout(() => {
      document.getElementById('booking-flow')?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }, 100);
  };

  // Animation variants with slower timing
  const slideVariants = {
    enter: (direction: 'left' | 'right') => ({
      x: direction === 'right' ? '100%' : '-100%',
      opacity: 0,
      scale: 1.1,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        duration: 2.0,
        ease: customEasing,
      },
    },
    exit: (direction: 'left' | 'right') => ({
      x: direction === 'right' ? '-100%' : '100%',
      opacity: 0,
      scale: 0.9,
      transition: {
        duration: 1.5,
        ease: customEasing,
      },
    }),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-yellow-50 to-pink-50 overflow-x-hidden">
      {/* Static Background Image (no rotation) */}
      <div 
        ref={containerRef}
        className="fixed inset-0 overflow-hidden pointer-events-none"
        style={{
          transform: `translate(${mousePosition.x * 10}px, ${mousePosition.y * 10}px)`,
          transition: 'transform 0.3s ease-out',
        }}
      >
        {/* Single static image instead of rotating carousel */}
        <div className="absolute inset-0">
          <Image
            src={DSC_0550} // Using the first image as static background
            alt="Spring Market"
            fill
            className="object-cover"
            priority
            quality={85}
            sizes="100vw"
            placeholder="blur"
            blurDataURL={DSC_0550.blurDataURL}
          />
          
          {/* Soft gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-transparent to-black/40" />
        </div>
        
        {/* Subtle floating circles */}
        <motion.div 
          className="absolute top-20 left-10 w-64 h-64 bg-green-300 rounded-full mix-blend-overlay filter blur-xl opacity-5"
          animate={{ x: [0, 30, 0], y: [0, -30, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-20 right-10 w-80 h-80 bg-pink-300 rounded-full mix-blend-overlay filter blur-xl opacity-5"
          animate={{ x: [0, -40, 0], y: [0, 40, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Compact Header - Reduced height, no background */}
        <motion.header 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="pt-6 pb-4 px-6 sticky top-0 z-20"
        >
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              {/* Left side - Updated Title */}
              <div className="space-y-1">
                <h1 className="text-4xl md:text-4xl font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                  Downtown Market Series: Spring Edition
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-white/90 drop-shadow-md">
                  {/* New date container - matches Friday/Saturday style */}
                  <div className="bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30 text-white text-base font-medium inline-flex items-center gap-2">
                    <span className="text-green-300">🌸</span>
                    <span>March 6 - May 3 | Every Weekend</span>
                  </div>
                </div>
              </div>

              {/* Right side - Times */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <div className="bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30 text-white text-md font-medium inline-flex items-center gap-2">
                  <span className="text-green-300">🍃</span>
                  <span>Fri & Sat: 4PM-10PM</span>
                </div>
                <div className="bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30 text-white text-md font-medium inline-flex items-center gap-2">
                  <span className="text-yellow-300">🌼</span>
                  <span>Sun: 12PM-5PM</span>
                </div>
              </div>
            </div>
          </div>
        </motion.header>

        {/* Main Selection Area - Centered Cards */}
        <div className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="max-w-5xl w-full">
            {!showCalendar ? (
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="w-full"
              >
                {/* Moved "select your vendor type" above the cards */}
                <motion.p 
                  className="text-center text-white text-2xl mb-4 drop-shadow-lg font-medium tracking-wide"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  ✨ Select your vendor type to begin
                </motion.p>

                {/* Cards container - positioned at bottom third of screen */}
                <div className="flex flex-col sm:flex-row gap-6 justify-center items-center max-w-3xl mx-auto mt-[30vh] sm:mt-[35vh]">
                  {/* Vendor Card - Updated fee to $35 */}
                  <motion.div 
                    className="w-full sm:w-72 group cursor-pointer"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleTypeSelect('vendor')}
                  >
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/30 shadow-xl overflow-hidden transition-all duration-300 hover:border-green-400/60 hover:bg-white/20">
                      <div className="px-6 py-8 text-center">
                        <div className="text-5xl mb-3 transform transition-transform group-hover:scale-110">🛍️</div>
                        <h2 className="text-2xl font-bold text-white mb-1 drop-shadow-md">Vendor</h2>
                        <p className="text-white/80 text-sm mb-4">Artisans • Makers • Creators</p>
                        <div className="flex items-center justify-center gap-2 mb-3">
                          <span className="text-3xl font-bold text-white">$35</span>
                          <span className="text-white/70 text-sm">/day</span>
                        </div>
                        <div className="bg-green-500/30 backdrop-blur-sm text-white text-sm py-2 px-4 rounded-full inline-block border border-green-400/40">
                          26 spots/day
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Food Truck Card*/}
                  <motion.div 
                    className="w-full sm:w-72 group cursor-pointer"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleTypeSelect('food')}
                  >
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/30 shadow-xl overflow-hidden transition-all duration-300 hover:border-yellow-400/60 hover:bg-white/20">
                      <div className="px-6 py-8 text-center">
                        <div className="text-5xl mb-3 transform transition-transform group-hover:scale-110">🍔</div>
                        <h2 className="text-2xl font-bold text-white mb-1 drop-shadow-md">Food Truck</h2>
                        <p className="text-white/80 text-sm mb-4">Cuisine • Street Food • Treats</p>
                        <div className="flex items-center justify-center gap-2 mb-3">
                          <span className="text-3xl font-bold text-white">$75</span>
                          <span className="text-white/70 text-sm">/day</span>
                        </div>
                        <div className="bg-yellow-500/30 backdrop-blur-sm text-white text-sm py-2 px-4 rounded-full inline-block border border-yellow-400/40">
                          2 spots/day
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Removed the duplicate instruction text at the bottom */}
              </motion.div>
            ) : (
              <motion.div
                id="booking-flow"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mt-8"
              >
                {selectedType === 'vendor' ? (
                  <VendorFlow onBack={() => setShowCalendar(false)} />
                ) : (
                  <FoodTruckFlow onBack={() => setShowCalendar(false)} />
                )}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}