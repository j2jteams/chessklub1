'use client';

import { useState, useEffect } from 'react';

interface LocationPermissionPromptProps {
  onAllow: () => void;
  onDeny: () => void;
}

export default function LocationPermissionPrompt({ onAllow, onDeny }: LocationPermissionPromptProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') {
      console.log('LocationPermissionPrompt: window is undefined, skipping');
      return;
    }
    
    console.log('LocationPermissionPrompt component mounted and checking localStorage...');
    
    // Check if user has already been asked
    const hasBeenAsked = localStorage.getItem('location-permission-asked');
    const hasBeenDenied = localStorage.getItem('location-permission-denied');
    
    // Get all location-related keys for debugging
    const allLocationKeys = Object.keys(localStorage).filter(k => k.toLowerCase().includes('location'));
    const allLocationData = allLocationKeys.reduce((acc, key) => {
      acc[key] = localStorage.getItem(key);
      return acc;
    }, {} as Record<string, string | null>);
    
    console.log('LocationPermissionPrompt check:', { 
      hasBeenAsked, 
      hasBeenDenied,
      hasBeenAskedType: typeof hasBeenAsked,
      hasBeenDeniedType: typeof hasBeenDenied,
      allLocationKeys,
      allLocationData
    });
    
    // Check explicitly for null (localStorage.getItem returns null if key doesn't exist)
    const shouldShow = hasBeenAsked === null && hasBeenDenied === null;
    console.log('Should show prompt?', shouldShow, { hasBeenAsked, hasBeenDenied });
    
    if (shouldShow) {
      // Show prompt after a short delay for better UX
      console.log('Setting timer to show prompt in 1 second...');
      const timer = setTimeout(() => {
        console.log('Timer fired - showing location prompt now');
        setIsVisible(true);
      }, 1000);
      return () => {
        console.log('Cleaning up timer');
        clearTimeout(timer);
      };
    } else {
      console.log('Prompt not shown - already asked or denied', { hasBeenAsked, hasBeenDenied });
      console.log('To reset and show prompt again, run in console:');
      console.log('localStorage.removeItem("location-permission-asked"); localStorage.removeItem("location-permission-denied"); window.location.reload();');
    }
  }, []); // Run only once on mount

  const handleAllow = () => {
    localStorage.setItem('location-permission-asked', 'true');
    setIsVisible(false);
    onAllow();
  };

  const handleDeny = () => {
    localStorage.setItem('location-permission-asked', 'true');
    localStorage.setItem('location-permission-denied', 'true');
    setIsVisible(false);
    onDeny();
  };

  if (!isVisible) {
    return null;
  }
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all duration-200 scale-100 opacity-100">
        <div className="flex items-start gap-4 mb-4">
          <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Find tournaments near you
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              We can show you tournaments sorted by distance from your location, expanding the search radius automatically to find the best matches. 
              Your location is only used to personalize your experience.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleAllow}
            className="flex-1 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors"
          >
            Allow Location
          </button>
          <button
            onClick={handleDeny}
            className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
          >
            Not Now
          </button>
        </div>
      </div>
    </div>
  );
}

