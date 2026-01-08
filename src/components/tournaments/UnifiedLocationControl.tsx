'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { LocationContext, getLocationContext, setLocationContext, createGPSContext, createPlaceContext, updateLocationRadius, resetLocationContext, getLocationHistory, createContextFromHistory, type LocationMode } from '@/lib/locationContext';
import { getUserLocation, getCountryFromCoordinates } from '@/lib/locationHelpers';
import { TournamentFilters } from './FilterPanel';
import { getAllChessCountries, getAllChessCities } from '@/lib/chessCountries';

interface UnifiedLocationControlProps {
  filters: TournamentFilters;
  onFiltersChange: (filters: TournamentFilters) => void;
  onLocationContextChange?: (context: LocationContext) => void;
  onClearSearch?: () => void; // Callback to clear search when "Anywhere" is selected
  availableCountries?: string[];
  availableCities?: string[];
  className?: string;
}

const RADIUS_OPTIONS = [10, 25, 50, 100, 250];

export default function UnifiedLocationControl({
  filters,
  onFiltersChange,
  onLocationContextChange,
  onClearSearch,
  availableCountries = [],
  availableCities = [],
  className = ''
}: UnifiedLocationControlProps) {
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
  const [locationError, setLocationError] = useState<string | null>(null);
  const [citySearchQuery, setCitySearchQuery] = useState('');
  const [countrySearchQuery, setCountrySearchQuery] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load context from localStorage after mount to avoid hydration issues
  useEffect(() => {
    setIsMounted(true);
    const storedContext = getLocationContext();
    setContext(storedContext);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenu]);

  // Load countries and cities if not provided
  const countries = availableCountries.length > 0 ? availableCountries : getAllChessCountries();
  const cities = availableCities.length > 0 ? availableCities : getAllChessCities();

  const handleContextChange = useCallback((newContext: LocationContext) => {
    setContext(newContext);
    setLocationContext(newContext);
    onLocationContextChange?.(newContext);
    setLocationError(null);
  }, [onLocationContextChange]);

  const handleScopeChange = (type: 'anywhere' | 'country' | 'city' | 'online', value?: string) => {
    const updatedFilters = { ...filters };
    
    if (type === 'anywhere') {
      // Clear location filters AND reset location context to 'anywhere' mode
      updatedFilters.countries = [];
      updatedFilters.cities = [];
      
      // Create explicit "anywhere" context (don't rely on getLocationContext which might return cached value)
      const anywhereContext: LocationContext = {
        mode: 'anywhere',
        center: null,
        radiusMiles: 25,
        label: 'Anywhere',
        source: 'default'
      };
      
      // Reset location context in storage
      resetLocationContext();
      setLocationContext(anywhereContext);
      
      // Update local state immediately
      setContext(anywhereContext);
      
      // Update parent component
      handleContextChange(anywhereContext);
      
      // Update filters (this triggers re-render)
      onFiltersChange(updatedFilters);
      
      // Clear search query when "Anywhere" is selected
      if (onClearSearch) {
        onClearSearch();
      }
      
      // Close menu
      setShowMenu(false);
      return; // Early return to prevent double execution
    } else if (type === 'country' && value) {
      updatedFilters.countries = [value];
      updatedFilters.cities = [];
      
      // Update location context to ensure country filter works (set mode to 'place' or keep current mode)
      // Don't reset to 'anywhere' when country is selected
      if (context.mode === 'anywhere') {
        // Create a place context for the country (without specific coordinates)
        // This ensures the location filter logic doesn't override the country filter
        const countryContext: LocationContext = {
          mode: 'place',
          center: null, // No specific center for country-only selection
          radiusMiles: context.radiusMiles || 25,
          label: value,
          source: 'search',
          countryCode: value // Store country name as countryCode for reference
        };
        setLocationContext(countryContext);
        setContext(countryContext);
        handleContextChange(countryContext);
      }
      
      // Update filters - this should trigger re-render with new filters
      onFiltersChange(updatedFilters);
      setShowMenu(false);
    } else if (type === 'city' && value) {
      updatedFilters.cities = [value];
      // Optionally set country if city is in a known country
      onFiltersChange(updatedFilters);
      setShowMenu(false);
    } else if (type === 'online') {
      // For online, we might want to filter by venueType or add a special flag
      // For now, just clear location filters
      updatedFilters.countries = [];
      updatedFilters.cities = [];
      onFiltersChange(updatedFilters);
      setShowMenu(false);
    }
  };

  const handleProximityToggle = async (enabled: boolean) => {
    if (enabled) {
      // If enabling proximity, try to use existing location or prompt for GPS
      if (context.mode === 'anywhere' || !context.center) {
        // Always request location when enabling proximity
        await handleUseMyLocation();
      } else {
        // Already have location, just enable proximity
        const updated = { ...context, mode: 'gps' as const };
        handleContextChange(updated);
      }
    } else {
      // Disable proximity - reset to anywhere
      resetLocationContext();
      const anywhereContext = getLocationContext();
      handleContextChange(anywhereContext);
    }
  };

  const handleUseMyLocation = async () => {
    setIsRequestingGPS(true);
    setLocationError(null);
    
    // Set a shorter timeout to show error if it takes too long (10 seconds)
    const timeoutId = setTimeout(() => {
      setIsRequestingGPS(false);
      setLocationError('Location request timed out. Please check your browser permissions or try again.');
      // Reset to "anywhere" mode
      resetLocationContext();
      const anywhereContext = getLocationContext();
      handleContextChange(anywhereContext);
    }, 10000);
    
    try {
      const gpsContext = await createGPSContext(context.radiusMiles || 25);
      clearTimeout(timeoutId);
      setIsRequestingGPS(false);
      handleContextChange(gpsContext);
      
      // Update legacy localStorage
      if (gpsContext.center) {
        localStorage.setItem('user-location', JSON.stringify(gpsContext.center));
        const countryInfo = await getCountryFromCoordinates(gpsContext.center.lat, gpsContext.center.lng);
        if (countryInfo) {
          localStorage.setItem('user-country', JSON.stringify(countryInfo));
          // Auto-set country filter if not already set
          if (filters.countries.length === 0) {
            handleScopeChange('country', countryInfo.name);
          }
        }
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      setIsRequestingGPS(false);
      
      // Handle error gracefully - don't let it crash the app
      console.warn('⚠️ Location request failed (non-critical):', {
        message: error?.message || 'Unable to get location',
        code: error?.code,
        note: 'User can continue using the app without location'
      });
      
      // Provide user-friendly error messages based on error code
      let errorMessage = 'Unable to get your location.';
      if (error?.code === 1 || error?.code === error?.PERMISSION_DENIED) {
        errorMessage = 'Location permission denied. Please click the lock icon in your browser address bar and allow location access, then try again.';
      } else if (error?.code === 2 || error?.code === error?.POSITION_UNAVAILABLE) {
        errorMessage = 'Location unavailable. Please check your device location settings and ensure location services are enabled.';
      } else if (error?.code === 3 || error?.code === error?.TIMEOUT) {
        errorMessage = 'Location request timed out. Please try again or check your internet connection.';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      // Always set error so user sees it
      setLocationError(errorMessage);
      console.log('📍 [LocationControl] Setting error message:', errorMessage);
      // Clear error after 8 seconds (longer so user can read it)
      setTimeout(() => setLocationError(null), 8000);
      // Reset to "anywhere" mode if GPS fails
      resetLocationContext();
      const anywhereContext = getLocationContext();
      handleContextChange(anywhereContext);
    }
  };

  const handleRadiusChange = (radiusMiles: number) => {
    if (context.mode !== 'anywhere' && context.center) {
      const updated = updateLocationRadius(context, radiusMiles);
      console.log('📍 [LocationControl] Radius changed:', radiusMiles, 'mi', 'Context:', updated);
      // Update local state first
      setContext(updated);
      // Then notify parent component (this triggers re-filtering)
      handleContextChange(updated);
    } else {
      console.warn('📍 [LocationControl] Cannot change radius - mode is anywhere or no center');
    }
  };

  // Get display text for the button
  // Use isMounted to avoid hydration mismatch - always return 'Anywhere' until mounted
  const getDisplayText = () => {
    // During SSR or before mount, always return 'Anywhere' to match server render
    if (!isMounted) {
      return 'Anywhere';
    }
    
    // Scope (location filter)
    if (filters.countries.length > 0) {
      return filters.countries.length === 1 ? filters.countries[0] : `${filters.countries.length} countries`;
    }
    if (filters.cities.length > 0) {
      return filters.cities.length === 1 ? filters.cities[0] : `${filters.cities.length} cities`;
    }
    
    // Proximity (distance sorting)
    if (context.mode !== 'anywhere' && context.center) {
      return context.label + (context.radiusMiles !== Infinity ? ` · ${context.radiusMiles} mi` : '');
    }
    
    return 'Anywhere';
  };

  // Get status text (shown below button or in dropdown)
  const getStatusText = () => {
    if (context.mode !== 'anywhere' && context.center) {
      const locationName = filters.cities.length > 0 
        ? filters.cities[0] 
        : filters.countries.length > 0 
        ? filters.countries[0]
        : 'your location';
      return `Showing tournaments within ${context.radiusMiles} mi of ${locationName}`;
    }
    return 'Showing tournaments anywhere (not sorted by distance)';
  };

  // Only compute hasActiveFilters on client to avoid hydration mismatch
  // During SSR, context.mode will be 'anywhere' (default), so we use that for initial render
  const hasActiveFilters = isMounted 
    ? (filters.countries.length > 0 || filters.cities.length > 0 || context.mode !== 'anywhere')
    : false; // Default to false during SSR to match initial client render

  // Get location history
  const [locationHistory, setLocationHistory] = useState<ReturnType<typeof getLocationHistory>>([]);
  
  useEffect(() => {
    if (isMounted) {
      setLocationHistory(getLocationHistory());
    }
  }, [isMounted, context]); // Update when context changes

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {locationError && (
        <div className="absolute -top-20 left-0 right-0 mb-2 px-4 py-3 bg-red-50 border-2 border-red-400 rounded-lg text-sm text-red-800 z-[100] shadow-xl animate-fade-in">
          <div className="flex items-start gap-2">
            <span className="text-xl flex-shrink-0">⚠️</span>
            <div className="flex-1 min-w-0">
              <p className="font-bold mb-1 text-red-900">Location Error</p>
              <p className="text-sm break-words leading-relaxed">{locationError}</p>
            </div>
            <button
              onClick={() => setLocationError(null)}
              className="ml-auto text-red-600 hover:text-red-800 font-bold text-2xl leading-none mt-0.5 flex-shrink-0 hover:bg-red-100 rounded-full w-6 h-6 flex items-center justify-center"
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
          if (showMenu) {
            // Clear search queries when closing menu
            setCountrySearchQuery('');
            setCitySearchQuery('');
          }
        }}
        className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white border rounded-full font-medium text-xs sm:text-sm text-gray-700 hover:border-orange-300 hover:bg-orange-50 transition-all ${
          hasActiveFilters ? 'border-orange-400 bg-orange-50 shadow-sm' : 'border-gray-200'
        }`}
      >
        <span className="text-gray-600">📍</span>
        <span className="whitespace-nowrap">{getDisplayText()}</span>
        <svg
          className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform flex-shrink-0 ${showMenu ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showMenu && (
        <div 
          className="absolute top-full left-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[600px] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4 space-y-4">
            {/* A) Scope Section */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">
                Scope
              </label>
              
              <div className="space-y-1">
                <button
                  onClick={() => {
                    handleScopeChange('anywhere');
                    setShowMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    filters.countries.length === 0 && filters.cities.length === 0
                      ? 'bg-orange-50 text-orange-700 border border-orange-200'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  🌍 Anywhere
                </button>

                {/* Location History - Recent Locations */}
                {locationHistory.length > 0 && (
                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <div className="px-2 mb-2">
                      <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Recent Locations</h4>
                    </div>
                    <div className="space-y-1">
                      {locationHistory.map((item, index) => (
                        <button
                          key={`${item.label}-${item.timestamp}-${index}`}
                          onClick={() => {
                            const historyContext = createContextFromHistory(item, context.radiusMiles || 25);
                            handleContextChange(historyContext);
                            setShowMenu(false);
                          }}
                          className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-gray-50 text-gray-700 transition-colors flex items-center gap-2"
                        >
                          <span className="text-gray-400">🕐</span>
                          <span className="flex-1 truncate">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Country Selection - Scrollable list */}
                <div className="border border-gray-200 rounded-md overflow-hidden max-h-48">
                  <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                    <h4 className="text-xs font-medium text-gray-600 mb-2">Country</h4>
                    <input
                      type="text"
                      placeholder="Search country..."
                      value={countrySearchQuery}
                      onChange={(e) => setCountrySearchQuery(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className="overflow-y-auto max-h-40 p-2">
                    {countries
                      .filter(country => 
                        !countrySearchQuery || 
                        country.toLowerCase().includes(countrySearchQuery.toLowerCase())
                      )
                      .map((country) => (
                        <label
                          key={country}
                          className="flex items-center px-2 py-1.5 hover:bg-gray-50 cursor-pointer rounded"
                        >
                          <input
                            type="radio"
                            name="country"
                            checked={filters.countries.includes(country)}
                            onChange={() => {
                              handleScopeChange('country', country);
                              setCountrySearchQuery('');
                              setShowMenu(false);
                            }}
                            className="w-4 h-4 text-orange-500 border-gray-300 focus:ring-orange-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">{country}</span>
                        </label>
                      ))}
                    {countrySearchQuery && countries.filter(country => 
                      country.toLowerCase().includes(countrySearchQuery.toLowerCase())
                    ).length === 0 && (
                      <div className="px-2 py-4 text-center text-xs text-gray-500">
                        No countries found matching "{countrySearchQuery}"
                      </div>
                    )}
                  </div>
                </div>

                {/* City Search */}
                <div>
                  <input
                    type="text"
                    placeholder="Search city..."
                    value={citySearchQuery}
                    onChange={(e) => setCitySearchQuery(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-orange-500 focus:border-orange-500"
                  />
                  {citySearchQuery && (
                    <div className="mt-1 max-h-32 overflow-y-auto">
                      {cities
                        .filter(city => city.toLowerCase().includes(citySearchQuery.toLowerCase()))
                        .slice(0, 5)
                        .map((city) => (
                          <button
                            key={city}
                            onClick={() => {
                              handleScopeChange('city', city);
                              setCitySearchQuery('');
                              setShowMenu(false);
                            }}
                            className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 rounded"
                          >
                            {city}
                          </button>
                        ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    handleScopeChange('online');
                    setShowMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    false // TODO: Check if online filter is active
                      ? 'bg-orange-50 text-orange-700 border border-orange-200'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  💻 Online only
                </button>
              </div>
            </div>

            {/* B) Proximity Section */}
            <div className="space-y-2 pt-2 border-t border-gray-200">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">
                Distance Priority
              </label>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Sort by distance</span>
                <button
                  onClick={async () => {
                    const willBeEnabled = context.mode === 'anywhere';
                    await handleProximityToggle(willBeEnabled);
                  }}
                  disabled={isRequestingGPS}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    context.mode !== 'anywhere' ? 'bg-orange-500' : 'bg-gray-200'
                  } ${isRequestingGPS ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  title={context.mode === 'anywhere' ? 'Enable distance sorting (will request location)' : 'Disable distance sorting'}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      context.mode !== 'anywhere' ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Always show "Use my location" button - works regardless of scope or toggle state */}
              <div className={`space-y-2 pl-2 border-l-2 ${context.mode !== 'anywhere' ? 'border-orange-200' : 'border-gray-200'}`}>
                <div className="space-y-2">
                  <button
                    onClick={async () => {
                      // If toggle is off, enable it first
                      if (context.mode === 'anywhere') {
                        // Enable proximity mode first
                        const updated = { ...context, mode: 'gps' as const, label: 'Near me', source: 'gps' as const };
                        setContext(updated);
                        setLocationContext(updated);
                        onLocationContextChange?.(updated);
                        // Small delay to let state update
                        await new Promise(resolve => setTimeout(resolve, 50));
                      }
                      // Then request location
                      await handleUseMyLocation();
                    }}
                    disabled={isRequestingGPS}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      context.mode === 'gps'
                        ? 'bg-orange-50 text-orange-700 border-2 border-orange-300'
                        : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-2 border-blue-300'
                    } ${isRequestingGPS ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-sm'}`}
                  >
                    {isRequestingGPS ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin">⏳</span>
                        <span>Getting location...</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <span>📍</span>
                        <span>Use my location</span>
                      </span>
                    )}
                  </button>
                  {isRequestingGPS && (
                    <button
                      onClick={() => {
                        setIsRequestingGPS(false);
                        setLocationError(null);
                        resetLocationContext();
                        const anywhereContext = getLocationContext();
                        handleContextChange(anywhereContext);
                      }}
                      className="w-full text-center px-3 py-1.5 rounded-md text-xs font-medium text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>

                {/* Show radius selector only when distance priority is enabled and location is available */}
                {context.mode !== 'anywhere' && context.center && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Radius (miles)</label>
                    <div className="grid grid-cols-5 gap-1">
                      {RADIUS_OPTIONS.map(radius => (
                        <button
                          key={radius}
                          onClick={() => handleRadiusChange(radius)}
                          className={`px-2 py-1.5 rounded text-xs font-medium transition-all cursor-pointer ${
                            context.radiusMiles === radius
                              ? 'bg-orange-500 text-white shadow-md scale-105'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105'
                          }`}
                          title={`Show tournaments within ${radius} miles`}
                        >
                          {radius}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {context.mode === 'anywhere' && (
                  <p className="text-xs text-gray-500 italic">
                    Click "Use my location" to enable distance sorting
                  </p>
                )}
              </div>
            </div>

            {/* C) Status Text */}
            <div className="pt-2 border-t border-gray-200">
              <p className="text-xs text-gray-500 italic">
                {getStatusText()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

