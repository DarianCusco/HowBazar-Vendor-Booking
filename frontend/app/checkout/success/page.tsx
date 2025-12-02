'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

function CheckoutSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [countdown, setCountdown] = useState(5);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setRedirecting(true);
      setTimeout(() => {
        window.location.href = 'https://downtownmarketseries.org/';
      }, 500);
    }
  }, [countdown]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center px-4 py-4 sm:py-8">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-12 sm:-top-20 -left-12 sm:-left-20 w-40 sm:w-64 h-40 sm:h-64 bg-purple-200 rounded-full blur-2xl sm:blur-3xl opacity-20 sm:opacity-30 animate-pulse"></div>
        <div className="absolute top-1/4 -right-12 sm:-right-20 w-32 sm:w-48 h-32 sm:h-48 bg-pink-200 rounded-full blur-2xl sm:blur-3xl opacity-20 sm:opacity-40"></div>
        <div className="absolute bottom-1/4 left-1/4 sm:left-1/3 w-40 sm:w-56 h-40 sm:h-56 bg-blue-200 rounded-full blur-2xl sm:blur-3xl opacity-10 sm:opacity-20"></div>
      </div>

      <div className="relative z-10 bg-white/95 backdrop-blur-sm rounded-xl sm:rounded-2xl md:rounded-3xl shadow-xl sm:shadow-2xl p-4 sm:p-6 md:p-8 max-w-md w-full mx-auto my-auto">
        
        <div className="flex justify-center mb-6 sm:mb-8">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full blur-md sm:blur-lg opacity-40 sm:opacity-50 animate-ping"></div>
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
              <svg
                className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-3 sm:mb-4 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            Payment Authorized! 🎉
          </h1>
          
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 mb-4 sm:mb-6 border border-green-100">
            <p className="text-base sm:text-lg text-gray-700 mb-2 sm:mb-3">
              Your payment is <span className="font-semibold text-green-600">pending approval</span>.
            </p>
            <p className="text-sm sm:text-base text-gray-600 mb-2">
              You'll receive a confirmation email and text with booking details once approved.
            </p>
            <div className="flex items-center justify-center space-x-1.5 sm:space-x-2 mt-3 sm:mt-4">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
            </div>
          </div>

          <div className="mb-6 sm:mb-8">
            <div className="inline-flex flex-col items-center space-y-3 sm:space-y-4">
              <div className="text-center">
                <p className="text-sm sm:text-base text-gray-600 font-medium mb-2">
                  {redirecting ? 'Redirecting...' : 'Redirecting in:'}
                </p>
                {!redirecting && (
                  <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-3">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg blur opacity-30"></div>
                      <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-3xl sm:text-4xl w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18 rounded-lg flex items-center justify-center shadow-lg">
                        {countdown}
                      </div>
                    </div>
                    <span className="text-base sm:text-lg text-gray-700 font-medium">seconds</span>
                  </div>
                )}
              </div>

              {!redirecting && (
                <div className="w-full max-w-xs">
                  <div className="h-1.5 sm:h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-1000 ease-linear"
                      style={{ width: `${100 - ((countdown - 1) / 5) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <button
              onClick={() => window.location.href = 'https://downtownmarketseries.org/'}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-lg sm:rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:-translate-y-0.5 sm:hover:-translate-y-1 hover:shadow-lg sm:hover:shadow-xl font-semibold sm:font-bold text-base sm:text-lg shadow-md sm:shadow-lg flex items-center justify-center space-x-2 group active:scale-95"
            >
              {redirecting ? (
                <>
                  <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Redirecting...</span>
                </>
              ) : (
                <>
                  <span className="truncate">Continue to Downtown Market Series</span>
                  <svg 
                    className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 group-hover:translate-x-0.5 sm:group-hover:translate-x-1 transition-transform" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>

            <button
              onClick={() => router.push('/')}
              className="w-full py-2.5 sm:py-3 px-4 sm:px-6 border border-gray-300 text-gray-700 rounded-lg sm:rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium text-sm sm:text-base active:scale-95"
            >
              Back to Calendar
            </button>
          </div>
        </div>

        <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-100">
          <div className="text-center">
            <p className="text-xs sm:text-sm text-gray-500">
              Need help? Contact{' '}
              <a href="mailto:info@downtownmarketseries.org" className="text-purple-600 hover:text-purple-800 font-medium">
                info@downtownmarketseries.org
              </a>
            </p>
            <p className="text-xs text-gray-400 mt-1.5 sm:mt-2">
              Your booking details have been saved.
            </p>
          </div>
        </div>

        <div className="hidden xs:block absolute -top-6 -left-6 w-12 h-12 text-2xl opacity-15 animate-bounce">🎉</div>
        <div className="hidden xs:block absolute -top-3 -right-3 w-10 h-10 text-xl opacity-15 animate-bounce" style={{animationDelay: '0.3s'}}>✨</div>
      </div>
    </div>
  );
}

export default function CheckoutSuccess() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 border-3 sm:border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3 sm:mb-4"></div>
          <p className="text-lg sm:text-xl text-gray-700 font-medium">Loading your confirmation...</p>
        </div>
      </div>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  );
}