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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center px-4 py-8">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-purple-200 rounded-full blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute top-1/3 -right-20 w-48 h-48 bg-pink-200 rounded-full blur-3xl opacity-40"></div>
        <div className="absolute bottom-1/4 left-1/3 w-56 h-56 bg-blue-200 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute bottom-10 right-1/4 w-32 h-32 bg-green-200 rounded-full blur-3xl opacity-30"></div>
      </div>

      <div className="relative z-10 bg-white/90 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 md:p-12 max-w-lg w-full transform transition-all duration-500 hover:scale-105 hover:shadow-3xl">
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full blur-lg opacity-50 animate-ping"></div>
            <div className="relative w-24 h-24 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
              <svg
                className="w-12 h-12 text-white"
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

        {/* Main Content */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            Payment Authorized Successfully! 🎉
          </h1>
          
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 sm:p-6 mb-6 border border-green-100">
            <p className="text-lg text-gray-700 mb-3">
              Your payment has been authorized and is <span className="font-semibold text-green-600">pending approval</span>.
            </p>
            <p className="text-gray-600 mb-2">
              You will receive a confirmation email and a text with all booking details once your payment is approved.
            </p>
            <div className="flex items-center justify-center space-x-2 mt-4">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
            </div>
          </div>

          {/* Countdown Timer */}
          <div className="mb-8">
            <div className="inline-flex flex-col items-center space-y-4">
              <div className="text-center">
                <p className="text-gray-600 text-sm font-medium mb-2">
                  {redirecting ? 'Redirecting...' : 'You will be redirected in:'}
                </p>
                {!redirecting && (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg blur opacity-30"></div>
                      <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-2xl sm:text-3xl w-16 h-16 rounded-lg flex items-center justify-center shadow-lg">
                        {countdown}
                      </div>
                    </div>
                    <span className="text-gray-700 font-medium">seconds</span>
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              {!redirecting && (
                <div className="w-full max-w-xs">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-1000 ease-linear"
                      style={{ width: `${100 - ((countdown - 1) / 5) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Button */}
          <div className="space-y-4">
            <button
              onClick={() => window.location.href = 'https://downtownmarketseries.org/'}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 px-6 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl font-bold text-lg shadow-lg flex items-center justify-center space-x-2 group"
            >
              {redirecting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Redirecting...</span>
                </>
              ) : (
                <>
                  <span>Continue to Downtown Market Series</span>
                  <svg 
                    className="w-5 h-5 group-hover:translate-x-1 transition-transform" 
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
              className="w-full py-3 px-6 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
            >
              Back to Calendar
            </button>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100">
          <div className="text-center">
            <p className="text-sm text-gray-500">
              Need help? Contact us at{' '}
              <a href="mailto:info@downtownmarketseries.org" className="text-purple-600 hover:text-purple-800 font-medium">
                info@downtownmarketseries.org
              </a>
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Your booking details have been saved and will be processed shortly.
            </p>
          </div>
        </div>

        <div className="absolute -top-10 -left-10 w-20 h-20 text-4xl opacity-20 animate-bounce">🎉</div>
        <div className="absolute -top-5 -right-5 w-16 h-16 text-3xl opacity-20 animate-bounce" style={{animationDelay: '0.3s'}}>✨</div>
        <div className="absolute -bottom-8 left-1/4 w-12 h-12 text-2xl opacity-20 animate-bounce" style={{animationDelay: '0.6s'}}>⭐</div>
      </div>

      <div className="sm:hidden mt-4 text-center">
        <p className="text-xs text-gray-400">
          You're all set! Check your email for updates.
        </p>
      </div>
    </div>
  );
}

export default function CheckoutSuccess() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl text-gray-700 font-medium">Loading your confirmation...</p>
        </div>
      </div>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  );
}