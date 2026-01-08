'use client';

import { useState, useEffect } from 'react';
import { LocationContext, getLocationContext, setLocationContext, createGPSContext, createPlaceContext, updateLocationRadius, resetLocationContext, type LocationMode } from '@/lib/locationContext';
import { getUserLocation, getCountryFromCoordinates } from '@/lib/locationHelpers';

interface LocationChipProps {
  onLocationChange?: (context: LocationContext) => void;
  className?: string;
}

const RADIUS_OPTIONS = [5, 10, 25, 50, 100, 250];

export default function LocationChip({ onLocationChange, className = '' }: LocationChipProps) {
  // Initialize with default to avoid hydration mismatch
  const [context, setContext] = useState<LocationContext>(() => {
    if (typeof window === 'undefined') {
      return {
        mode: 'anywhere',
        center: null,
        radiusMiles: 25,
        label: 'No distance priority',
        source: 'default'
      };
    }
    return getLocationContext();
  });
  const [showMenu, setShowMenu] = useState(false);
  const [isRequestingGPS, setIsRequestingGPS] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Load context from localStorage after mount to avoid hydration issues
  useEffect(() => {
    setIsMounted(true);
    const storedContext = getLocationContext();
    setContext(storedContext);
  }, []);

  const handleContextChange = (newContext: LocationContext) => {
    setContext(newContext);
    setLocationContext(newContext);
    onLocationChange?.(newContext);
    setShowMenu(false);
  };

  const handleUseMyLocation = async () => {
    setIsRequestingGPS(true);
    setLocationError(null);
    try {
      const gpsContext = await createGPSContext(context.radiusMiles);
      handleContextChange(gpsContext);
      
      // Also update legacy localStorage for backward compatibility
      if (gpsContext.center) {
        localStorage.setItem('user-location', JSON.stringify(gpsContext.center));
        const countryInfo = await getCountryFromCoordinates(gpsContext.center.lat, gpsContext.center.lng);
        if (countryInfo) {
          localStorage.setItem('user-country', JSON.stringify(countryInfo));
        }
      }
    } catch (error: any) {
      // Handle gracefully - don't trigger Next.js error overlay
      console.warn('⚠️ Location request failed (non-critical):', {
        message: error?.message || 'Unable to get location',
        code: error?.code,
        note: 'User can continue using the app without location'
      });
      const errorMessage = error?.message || 'Unable to get your location. Please check your browser permissions or try again later.';
      setLocationError(errorMessage);
      // Auto-hide error after 5 seconds
      setTimeout(() => setLocationError(null), 5000);
      // Reset to "anywhere" mode if GPS fails
      resetLocationContext();
      const anywhereContext = getLocationContext();
      handleContextChange(anywhereContext);
    } finally {
      setIsRequestingGPS(false);
    }
  };

  const handleRadiusChange = (radiusMiles: number) => {
    const updated = updateLocationRadius(context, radiusMiles);
    handleContextChange(updated);
  };

  const handleSetAnywhere = () => {
    resetLocationContext();
    const anywhereContext = getLocationContext();
    handleContextChange(anywhereContext);
  };

  // Simplified city search - in production, integrate with Google Places / Mapbox
  const handleCitySearch = () => {
    if (!searchQuery.trim()) return;
    
    // For now, just create a placeholder context
    // In production, use geocoding API to get coordinates
    alert('City search will be available soon. For now, use "Use my location" or "Anywhere".');
    setSearchQuery('');
  };

  return (
    <div className={`relative ${className}`}>
      {locationError && (
        <div className="absolute -top-12 left-0 right-0 mb-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 z-50 shadow-sm">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span className="flex-1">{locationError}</span>
            <button
              onClick={() => setLocationError(null)}
              className="ml-auto text-red-500 hover:text-red-700 font-bold text-lg leading-none"
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        </div>
      )}
      <button
        onClick={() => {
          setShowMenu(!showMenu);
          setLocationError(null); // Clear error when opening menu
        }}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-white border border-gray-200 hover:border-orange-400 hover:bg-orange-50 transition-colors"
      >
        <span className="text-gray-600">📍</span>
        <span className="text-gray-900">
          {context.mode === 'anywhere' ? 'Distance: Off' : context.label}
        </span>
        {context.mode !== 'anywhere' && context.radiusMiles !== Infinity && (
          <span className="text-gray-500">· {context.radiusMiles} mi</span>
        )}
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${showMenu ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showMenu && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />
          
          {/* Menu */}
          <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-20 p-4 space-y-4">
            {/* Mode Selection */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">
                Location Mode
              </label>
              
              <div className="space-y-1">
                <button
                  onClick={handleSetAnywhere}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    context.mode === 'anywhere'
                      ? 'bg-orange-50 text-orange-700 border border-orange-200'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  🌍 No distance priority
                </button>
                
                <button
                  onClick={handleUseMyLocation}
                  disabled={isRequestingGPS}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    context.mode === 'gps'
                      ? 'bg-orange-50 text-orange-700 border border-orange-200'
                      : 'hover:bg-gray-50 text-gray-700'
                  } ${isRequestingGPS ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isRequestingGPS ? '⏳ Getting location...' : '📍 Use my location'}
                </button>
                {locationError && (
                  <p className="px-3 py-1 text-xs text-red-600 bg-red-50 rounded-md">
                    ⚠️ {locationError}
                  </p>
                )}
                
                <div className="px-3 py-2 rounded-md text-sm text-gray-500 border border-gray-200">
                  🔍 Search city (coming soon)
                </div>
              </div>
            </div>

            {/* Radius Selector (only show if not "anywhere") */}
            {context.mode !== 'anywhere' && (
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  Radius
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {RADIUS_OPTIONS.map(radius => (
                    <button
                      key={radius}
                      onClick={() => handleRadiusChange(radius)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        context.radiusMiles === radius
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {radius} mi
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Current Location Info */}
            {context.mode === 'gps' && context.center && (
              <div className="pt-2 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  📍 Using your current location
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

