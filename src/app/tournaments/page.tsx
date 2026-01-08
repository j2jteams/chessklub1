'use client';

import { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getApprovedEvents, getAllEvents, deleteEvent } from '@/lib/events';
import { EventData } from '@/lib/types';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';
import TournamentSearchBar from '@/components/tournaments/TournamentSearchBar';
import TournamentFilters from '@/components/tournaments/TournamentFilters';
import { TournamentFilters as FilterType } from '@/components/tournaments/FilterPanel';
import { getUniqueCountries, getUniqueCities } from '@/lib/tournamentSearch';
import { filterTournamentsUnified } from '@/lib/unifiedTournamentFilter';
import { getAllChessCountries, getAllChessCities } from '@/lib/chessCountries';
import TournamentCard from '@/components/tournament/TournamentCard';
import { getTournamentStartDate, getTournamentCreatedDate, getTournamentPrice } from '@/lib/tournamentHelpers';
import { getUserLocation, getCountryFromCoordinates } from '@/lib/locationHelpers';
import { getLocationContext, resetLocationContext, type LocationContext } from '@/lib/locationContext';
import LocationPermissionPrompt from '@/components/tournaments/LocationPermissionPrompt';
import UnifiedLocationControl from '@/components/tournaments/UnifiedLocationControl';

function TournamentsContent() {
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const filter = searchParams.get('filter') || 'all';
  const searchQuery = searchParams.get('search') || '';
  const locationParam = searchParams.get('location') || '';
  const dateStartParam = searchParams.get('dateStart') || '';
  const dateEndParam = searchParams.get('dateEnd') || '';
  const { user, role } = useAuth();
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQueryState, setSearchQueryState] = useState(searchQuery);
  const [sortBy, setSortBy] = useState<'soonest' | 'newest' | 'price-low' | 'price-high'>('soonest');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [userCountry, setUserCountry] = useState<{ code: string; name: string } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [autoLocationRequested, setAutoLocationRequested] = useState(false);
  const [locationContext, setLocationContext] = useState<LocationContext | null>(null);
  const [radiusExpansionInfo, setRadiusExpansionInfo] = useState<{ expanded: boolean; message?: string } | null>(null);

  const [filters, setFilters] = useState<FilterType>({
    countries: [],
    cities: locationParam ? [locationParam] : [],
    dateRange: { 
      start: dateStartParam || '', 
      end: dateEndParam || '' 
    },
    minRating: null,
    maxRating: null,
    ratingTypes: [],
    timeControls: [],
    tournamentLevels: [],
    priceRange: { min: null, max: null },
    fideRatedOnly: false,
    hasPrizeFund: false,
    registrationOpen: false,
  });
  const isSuperAdmin = role === 'superAdmin';

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        // Super admins can see all events (including pending), others see only approved
        const fetchedEvents = isSuperAdmin ? await getAllEvents() : await getApprovedEvents();
        // Events fetched successfully
        setEvents(fetchedEvents);
      } catch (error) {
        console.error('❌ Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [isSuperAdmin]);

  // No need to manage prompt visibility here - component handles it

  // Check for stored location data from landing page (load immediately on mount)
  // Load location context and stored location data on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Load LocationContext (new system)
    const context = getLocationContext();
    setLocationContext(context);
    
    // Also load legacy location data for backward compatibility
    const storedLocation = localStorage.getItem('user-location');
    const storedCountry = localStorage.getItem('user-country');
    
    if (storedLocation) {
      try {
        const location = JSON.parse(storedLocation);
        setUserLocation(location);
        // If context is "anywhere" but we have GPS location, update context
        if (context.mode === 'anywhere' && location) {
          const updatedContext = {
            ...context,
            mode: 'gps' as const,
            center: location,
            label: 'Near me',
            source: 'gps' as const
          };
          setLocationContext(updatedContext);
        }
      } catch (e) {
        console.error('Error parsing stored location:', e);
      }
    }
    
    if (storedCountry) {
      try {
        const country = JSON.parse(storedCountry);
        setUserCountry(country);
      } catch (e) {
        console.error('Error parsing stored country:', e);
      }
    }
  }, []);

  // Auto-request location if user allowed but we don't have it yet (fallback)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const shouldAutoRequest = localStorage.getItem('location-auto-request') === 'true';
    const hasBeenDenied = localStorage.getItem('location-permission-denied') === 'true';
    
    // Only request if user allowed, not denied, and we don't have location yet
    if (shouldAutoRequest && !hasBeenDenied && !userLocation && !locationLoading && !locationError) {
      // Check if we have stored location first
      const storedLocation = localStorage.getItem('user-location');
      if (storedLocation) {
        // Already loaded in previous useEffect, skip
        return;
      }
      
      setLocationLoading(true);
      getUserLocation()
        .then(async (location) => {
          // Location auto-requested on tournaments page
          setUserLocation(location);
          localStorage.setItem('user-location', JSON.stringify(location));
          const countryInfo = await getCountryFromCoordinates(location.lat, location.lng);
          if (countryInfo) {
            setUserCountry(countryInfo);
            localStorage.setItem('user-country', JSON.stringify(countryInfo));
          }
          setLocationError(null);
        })
        .catch((error) => {
          // Handle gracefully - don't trigger Next.js error overlay
          console.warn('⚠️ Location request failed (non-critical):', {
            message: error?.message || 'Unable to get location',
            note: 'App will continue to work without location'
          });
          setLocationError(null); // Don't show error for auto-request
        })
        .finally(() => {
          setLocationLoading(false);
        });
    }
  }, [userLocation, locationLoading, locationError]);

  // Get user location when "Near Me" filter is selected
  useEffect(() => {
    if (filter === 'nearme' && !userLocation && !locationLoading && !locationError) {
      setLocationLoading(true);
      getUserLocation()
        .then(async (location) => {
          setUserLocation(location);
          // Get country from coordinates (returns both code and name)
          const countryInfo = await getCountryFromCoordinates(location.lat, location.lng);
          if (countryInfo) {
            setUserCountry(countryInfo);
          }
          setLocationError(null);
        })
        .catch((error) => {
          // Handle gracefully - don't trigger Next.js error overlay
          console.warn('⚠️ Location request failed (non-critical):', {
            message: error?.message || 'Unable to get location',
            note: 'App will continue to work without location'
          });
          setLocationError(error?.message || 'Unable to get your location. Please enable location permissions.');
        })
        .finally(() => {
          setLocationLoading(false);
        });
    }
  }, [filter, userLocation, locationLoading, locationError]);

  const handleLocationAllow = () => {
    localStorage.setItem('location-auto-request', 'true');
    setAutoLocationRequested(true);
    // Location will be requested automatically via the useEffect above
    // LocationPermissionPrompt component manages its own visibility
  };

  const handleLocationDeny = () => {
    setAutoLocationRequested(true);
    // LocationPermissionPrompt component manages its own visibility
  };

  // Use only real events from database (no demo/featured tournaments)
  const allTournaments = events;

  // Use all events (both tournaments and events) for location filtering
  // Location should work for all event types, not just tournaments
  const allEvents = allTournaments;

  // Get countries and cities from comprehensive lists (all major chess-playing nations and their cities)
  const availableCountries = useMemo(() => getAllChessCountries(), []);
  const availableCities = useMemo(() => getAllChessCities(), []);

  // Apply basic filter tabs (new, upcoming, all)
  const now = new Date();
  now.setHours(0, 0, 0, 0); // Set to start of day for accurate date comparison
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const basicFiltered = useMemo(() => {
    const filtered = allEvents.filter((tournament) => {
      // Always exclude demo/featured tournaments (they're just examples)
      if (tournament.id && tournament.id.startsWith('featured-')) {
        return false;
      }
      
      // Get tournament start date
      let eventDate: Date | null = null;
      try {
        if (tournament.startDate) {
          eventDate = tournament.startDate instanceof Date 
            ? tournament.startDate 
            : new Date(tournament.startDate);
        } else if (tournament.date) {
          // tournament.date is typed as string, so always convert to Date
          eventDate = new Date(tournament.date);
        }
        
        if (eventDate) {
          eventDate.setHours(0, 0, 0, 0); // Set to start of day for comparison
        }
      } catch {
        eventDate = null;
      }
      
      // Check if event is finished (end date or start date is in the past)
      const isFinished = eventDate && !isNaN(eventDate.getTime()) && eventDate < now;
      
      if (filter === 'new') {
        const createdDate = tournament.createdAt ? new Date(tournament.createdAt) : null;
        if (createdDate) {
          createdDate.setHours(0, 0, 0, 0);
        }
        // New tournaments created in last 7 days AND not finished
        return createdDate && createdDate >= sevenDaysAgo && !isFinished;
      } else if (filter === 'upcoming') {
        // Upcoming: future events only
        return eventDate && !isNaN(eventDate.getTime()) && eventDate >= now;
      }
      
      // 'all' filter: show upcoming events only (exclude finished)
      return !isFinished;
    });
    return filtered;
  }, [allEvents, filter, now, sevenDaysAgo]);

  // Handle location context change (wrapped in useCallback to prevent infinite re-renders)
  const handleLocationChange = useCallback((newContext: LocationContext) => {
    setLocationContext(newContext);
    // Update legacy state for backward compatibility
    if (newContext.center) {
      setUserLocation(newContext.center);
    }
    if (newContext.countryCode) {
      setUserCountry({ code: newContext.countryCode, name: newContext.countryCode });
    }
    
    // When "Anywhere" is selected, clear the search query
    if (newContext.mode === 'anywhere' && searchQueryState) {
      setSearchQueryState('');
      // Also clear from URL
      const params = new URLSearchParams(window.location.search);
      params.delete('search');
      const newUrl = `/tournaments${params.toString() ? `?${params.toString()}` : ''}`;
      window.history.replaceState({}, '', newUrl);
    }
  }, [searchQueryState]);

  // Memoize filter properties to prevent infinite loops (objects are compared by reference)
  const filterCountries = useMemo(() => filters.countries, [filters.countries.join(',')]);
  const filterCities = useMemo(() => filters.cities, [filters.cities.join(',')]);
  const filterDateRange = useMemo(() => filters.dateRange, [filters.dateRange.start, filters.dateRange.end]);
  const filterMinRating = filters.minRating;
  const filterMaxRating = filters.maxRating;
  const filterRatingTypes = useMemo(() => filters.ratingTypes, [filters.ratingTypes.join(',')]);
  const filterTimeControls = useMemo(() => filters.timeControls, [filters.timeControls.join(',')]);
  const filterTournamentLevels = useMemo(() => filters.tournamentLevels, [filters.tournamentLevels.join(',')]);
  const filterPriceRange = useMemo(() => filters.priceRange, [filters.priceRange.min, filters.priceRange.max]);
  const filterFideRatedOnly = filters.fideRatedOnly;
  const filterHasPrizeFund = filters.hasPrizeFund;
  const filterRegistrationOpen = filters.registrationOpen;
  
  // Memoize location context properties
  const locationMode = locationContext?.mode;
  const locationCenter = locationContext?.center;
  const locationRadius = locationContext?.radiusMiles;
  const locationLabel = locationContext?.label;
  const locationCountryCode = locationContext?.countryCode;
  
  // Create stable filter object for unified filter
  const stableFilters = useMemo(() => ({
    countries: filterCountries,
    cities: filterCities,
    dateRange: filterDateRange,
    minRating: filterMinRating,
    maxRating: filterMaxRating,
    ratingTypes: filterRatingTypes,
    timeControls: filterTimeControls,
    tournamentLevels: filterTournamentLevels,
    priceRange: filterPriceRange,
    fideRatedOnly: filterFideRatedOnly,
    hasPrizeFund: filterHasPrizeFund,
    registrationOpen: filterRegistrationOpen,
  }), [
    filterCountries,
    filterCities,
    filterDateRange,
    filterMinRating,
    filterMaxRating,
    filterRatingTypes,
    filterTimeControls,
    filterTournamentLevels,
    filterPriceRange,
    filterFideRatedOnly,
    filterHasPrizeFund,
    filterRegistrationOpen,
  ]);
  
  // Create stable location context for unified filter
  const stableLocationContext = useMemo(() => {
    if (!locationContext) return null;
    return {
      mode: locationMode,
      center: locationCenter,
      radiusMiles: locationRadius,
      label: locationLabel,
      countryCode: locationCountryCode,
      source: locationContext.source,
    };
  }, [locationMode, locationCenter?.lat, locationCenter?.lng, locationRadius, locationLabel, locationCountryCode, locationContext?.source]);

  // Unified filtering pipeline - single source of truth for all filtering
  const filterResult = useMemo(() => {
    // Determine effective search query
    // Only ignore search query if "Anywhere" mode AND no country/city filters AND search is not a country/city name
    const hasGeographicFilters = stableFilters.countries.length > 0 || stableFilters.cities.length > 0;
    const isAnywhereMode = stableLocationContext?.mode === 'anywhere' && !hasGeographicFilters;
    
    // Always allow search query - don't clear it even in "Anywhere" mode
    // The search query can be for countries, cities, or tournament names
    const effectiveSearchQuery = searchQueryState;
    
    // Apply unified filtering
    return filterTournamentsUnified(basicFiltered, {
      searchQuery: effectiveSearchQuery,
      filters: stableFilters,
      locationContext: stableLocationContext
    });
  }, [basicFiltered, searchQueryState, stableFilters, stableLocationContext]);

  const filteredTournaments = filterResult.tournaments;

  // Update radius expansion info - use primitive values in dependency array to prevent infinite loops
  const distanceInfoExpanded = filterResult.distanceInfo?.expanded;
  const distanceInfoMessage = filterResult.distanceInfo?.message;
  const distanceInfoRadius = filterResult.distanceInfo?.finalRadiusMiles;
  
  useEffect(() => {
    if (distanceInfoExpanded && distanceInfoMessage) {
      setRadiusExpansionInfo({
        expanded: distanceInfoExpanded,
        message: distanceInfoMessage,
        finalRadiusMiles: distanceInfoRadius
      });
    } else {
      setRadiusExpansionInfo(null);
    }
  }, [distanceInfoExpanded, distanceInfoMessage, distanceInfoRadius]);

  // Apply sorting - use distance when location context is active, otherwise use selected sort
  const sortedTournaments = useMemo(() => {
    const sorted = [...filteredTournaments];
    const hasLocationContext = locationContext && locationContext.mode !== 'anywhere' && locationContext.center;
    
    // Sort function that considers distance when location context is active
    const sortWithDistance = (a: any, b: any, primarySort: (a: any, b: any) => number) => {
      // If location context is active, sort by distance first (closest first)
      if (hasLocationContext) {
        const distanceA = a._distanceMiles;
        const distanceB = b._distanceMiles;
        
        // Both have distance - sort by distance first
        if (distanceA !== null && distanceB !== null) {
          if (distanceA !== distanceB) {
            return distanceA - distanceB;
          }
          // Same distance - use primary sort
          return primarySort(a, b);
        }
        
        // One has distance, one doesn't - prioritize the one with distance
        if (distanceA !== null && distanceB === null) return -1;
        if (distanceA === null && distanceB !== null) return 1;
        
        // Neither has distance - use primary sort
        return primarySort(a, b);
      }
      
      // No location context - just use primary sort
      return primarySort(a, b);
    };
    
    switch (sortBy) {
      case 'soonest':
        sorted.sort((a, b) => sortWithDistance(a, b, (a, b) => {
          const dateA = getTournamentStartDate(a);
          const dateB = getTournamentStartDate(b);
          if (!dateA && !dateB) return 0;
          if (!dateA) return 1;
          if (!dateB) return -1;
          return dateA.getTime() - dateB.getTime();
        }));
        break;
      case 'newest':
        sorted.sort((a, b) => sortWithDistance(a, b, (a, b) => {
          const dateA = getTournamentCreatedDate(a);
          const dateB = getTournamentCreatedDate(b);
          if (!dateA && !dateB) return 0;
          if (!dateA) return 1;
          if (!dateB) return -1;
          return dateB.getTime() - dateA.getTime();
        }));
        break;
      case 'price-low':
        sorted.sort((a, b) => sortWithDistance(a, b, (a, b) => {
          const priceA = getTournamentPrice(a) ?? 0;
          const priceB = getTournamentPrice(b) ?? 0;
          return priceA - priceB;
        }));
        break;
      case 'price-high':
        sorted.sort((a, b) => sortWithDistance(a, b, (a, b) => {
          const priceA = getTournamentPrice(a) ?? 0;
          const priceB = getTournamentPrice(b) ?? 0;
          return priceB - priceA;
        }));
        break;
    }
    
    return sorted;
  }, [filteredTournaments, sortBy, locationContext]);

  return (
    <>
      <Header />
      {/* Location Permission Prompt - component manages its own visibility */}
      <LocationPermissionPrompt
        onAllow={handleLocationAllow}
        onDeny={handleLocationDeny}
      />
      <div className="min-h-screen bg-gray-50 chess-themed-bg">
        {/* Hero Section */}
        <div 
          className="text-white py-12"
          style={{ 
            backgroundColor: 'var(--color-dark)',
            paddingTop: 'var(--space-md)',
            paddingBottom: 'var(--space-md)'
          }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 
              className="mb-4 font-bold"
              style={{ 
                fontSize: 'var(--font-size-h2)',
                color: 'var(--color-light)',
                fontFamily: 'var(--font-heading)'
              }}
            >
              Chess Tournaments
            </h1>
            <p 
              className="text-lg"
              style={{ 
                color: 'rgba(255, 255, 255, 0.9)',
                fontFamily: 'var(--font-body)'
              }}
            >
              Compete, learn, and grow with our exciting tournament schedule
            </p>
          </div>
        </div>

        {/* Search and Filters Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Tournament Search Bar */}
          <div className="mb-4 sm:mb-6">
            <TournamentSearchBar
              redirectOnSearch={false}
              currentPath="/tournaments"
              initialQuery={searchQueryState || searchQuery}
              onSearch={setSearchQueryState}
              tournaments={events} // Pass events for search suggestions
            />
          </div>

          {/* Location Status for "Near Me" filter */}
          {filter === 'nearme' && (
            <div className="mb-4">
              {locationLoading && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  <p className="text-sm text-blue-800">Getting your location...</p>
                </div>
              )}
              {locationError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800">{locationError}</p>
                  <p className="text-xs text-red-600 mt-1">Please enable location permissions in your browser settings.</p>
                </div>
              )}
              {userLocation && userCountry && !locationLoading && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800">
                    Showing tournaments within 100 miles of your location and all tournaments in {userCountry.name || userCountry.code}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Unified Filters Bar (Location + Time Control + Date + Rating) */}
          <div className="mb-4 sm:mb-6">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {/* Unified Location Control (replaces both Location Chip and Worldwide filter) */}
              <UnifiedLocationControl
                filters={filters}
                onFiltersChange={setFilters}
                onLocationContextChange={handleLocationChange}
                onClearSearch={() => {
                  setSearchQueryState('');
                  // Clear from URL
                  if (typeof window !== 'undefined') {
                    const params = new URLSearchParams(window.location.search);
                    params.delete('search');
                    const newUrl = `/tournaments${params.toString() ? `?${params.toString()}` : ''}`;
                    window.history.replaceState({}, '', newUrl);
                  }
                }}
                availableCountries={availableCountries}
                availableCities={availableCities}
              />
              
              {/* Other filters (Time Control, Date, Rating) - Location filter hidden */}
              <TournamentFilters
                filters={filters}
                onFiltersChange={setFilters}
                availableCountries={availableCountries}
                availableCities={availableCities}
                hideLocationFilter={true}
              />
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-2 mb-4 sm:mb-6">
            <Link
              href="/tournaments?filter=all"
              className={`px-3 sm:px-4 py-2 rounded-full font-medium text-xs sm:text-sm transition-all whitespace-nowrap ${
                filter === 'all'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Tournaments
            </Link>
            <Link
              href="/tournaments?filter=new"
              className={`px-3 sm:px-4 py-2 rounded-full font-medium text-xs sm:text-sm transition-all whitespace-nowrap ${
                filter === 'new'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              New Tournaments
            </Link>
            <Link
              href="/tournaments?filter=upcoming"
              className={`px-3 sm:px-4 py-2 rounded-full font-medium text-xs sm:text-sm transition-all whitespace-nowrap ${
                filter === 'upcoming'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Upcoming Events
            </Link>
          </div>

          {/* Location Status Banner - Show only when LocationContext is active AND not "anywhere" */}
          {(() => {
            const hasNoLocationFilters = filters.countries.length === 0 && filters.cities.length === 0;
            const isAnywhereMode = locationContext?.mode === 'anywhere' || hasNoLocationFilters;
            
            // Show distance banner only if NOT in "anywhere" mode AND location context is active
            if (!isAnywhereMode && locationContext && locationContext.mode !== 'anywhere' && locationContext.center) {
              return (
            <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-center gap-2">
              <svg className="w-5 h-5 text-orange-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div className="flex-1">
                <span className="text-sm font-semibold text-orange-900">
                  {radiusExpansionInfo?.expanded && radiusExpansionInfo.message ? (
                    radiusExpansionInfo.message
                  ) : (
                    `Showing tournaments within ${locationContext.radiusMiles} miles`
                  )}
                </span>
                {locationContext.label && (
                  <span className="text-xs text-orange-700 ml-2">
                    ({locationContext.label})
                  </span>
                )}
              </div>
            </div>
              );
            }
            
            // Show "anywhere" banner if in anywhere mode
            if (isAnywhereMode) {
              return (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <span className="text-sm font-semibold text-blue-900">
                      Showing tournaments from anywhere (not filtered by distance)
                    </span>
                  </div>
                </div>
              );
            }
            
            return null;
          })()}

          {/* Results Context Row */}
          <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-600">
              {loading ? (
                <span>Loading tournaments...</span>
              ) : (
                <>
                  <span className="font-semibold text-gray-900">
                    Showing {sortedTournaments.length} tournament{sortedTournaments.length !== 1 ? 's' : ''}
                  </span>
                  {locationContext && locationContext.mode !== 'anywhere' && locationContext.center && (
                    <>
                      <span className="text-gray-400 hidden sm:inline">·</span>
                      <span className="text-orange-600 font-medium">
                        Sorted by distance
                      </span>
                    </>
                  )}
                  <span className="text-gray-400 hidden sm:inline">·</span>
                  <span className="break-words">
                    {filters.countries.length > 0 
                      ? filters.countries.length === 1 
                        ? filters.countries[0] 
                        : `${filters.countries.length} countries`
                      : filters.cities.length > 0
                        ? filters.cities.length === 1
                          ? filters.cities[0]
                          : `${filters.cities.length} cities`
                        : userCountry
                          ? userCountry.name
                          : 'Worldwide'}
                  </span>
                  <span className="text-gray-400 hidden sm:inline">·</span>
                  <span className="break-words">
                    {filters.dateRange.start || filters.dateRange.end
                      ? filters.dateRange.start && filters.dateRange.end
                        ? `${filters.dateRange.start} - ${filters.dateRange.end}`
                        : filters.dateRange.start
                          ? `From ${filters.dateRange.start}`
                          : `Until ${filters.dateRange.end}`
                      : 'All dates'}
                  </span>
                </>
              )}
            </div>
            {!loading && sortedTournaments.length > 0 && (
              <div className="flex items-center gap-2 flex-shrink-0">
                <label htmlFor="sort-select" className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">
                  Sort by:
                </label>
                <select
                  id="sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none bg-white hover:border-gray-300 transition-colors"
                >
                  <option value="soonest">Soonest</option>
                  <option value="newest">Newest</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
              </div>
            )}
          </div>

          {/* Tournaments Grid */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading tournaments...</p>
            </div>
          ) : sortedTournaments.length === 0 ? (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <div className="text-6xl mb-4">😕</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No tournaments found</h3>
                
                {/* Improved empty state messages with helpful suggestions */}
                <div className="text-gray-600 mb-6 space-y-2">
                  {searchQueryState ? (
                    <>
                      <p>No tournaments found for <strong>"{searchQueryState}"</strong></p>
                      <div className="text-sm space-y-1 pt-2">
                        <p className="font-medium text-gray-700">Suggestions:</p>
                        <ul className="list-disc list-inside text-left space-y-1 text-gray-600">
                          {searchQueryState.toLowerCase() === 'india' || searchQueryState.toLowerCase() === 'indai' ? (
                            <li>Try searching for a specific city like "Mumbai" or "Delhi"</li>
                          ) : searchQueryState.length < 3 ? (
                            <li>Try a longer search term (at least 3 characters)</li>
                          ) : (
                            <li>Check your spelling or try a different search term</li>
                          )}
                          <li>Clear location filters to see all tournaments</li>
                          <li>Expand search radius if using "Near me"</li>
                        </ul>
                      </div>
                    </>
                  ) : filters.countries.length > 0 ? (
                    <>
                      <p>No tournaments found in <strong>{filters.countries[0]}</strong></p>
                      <div className="text-sm space-y-1 pt-2">
                        <p className="font-medium text-gray-700">Suggestions:</p>
                        <ul className="list-disc list-inside text-left space-y-1 text-gray-600">
                          <li>Try selecting a different country</li>
                          <li>Clear location filters to see all tournaments</li>
                          <li>Check if tournaments exist in nearby cities</li>
                        </ul>
                      </div>
                    </>
                  ) : locationContext && locationContext.mode !== 'anywhere' && locationContext.center ? (
                    <>
                      <p>No tournaments found within <strong>{locationContext.radiusMiles} miles</strong></p>
                      <div className="text-sm space-y-1 pt-2">
                        <p className="font-medium text-gray-700">Suggestions:</p>
                        <ul className="list-disc list-inside text-left space-y-1 text-gray-600">
                          <li>Expand search radius to see more tournaments</li>
                          <li>Try selecting a specific country or city</li>
                          <li>Clear location filters to see all tournaments</li>
                        </ul>
                      </div>
                    </>
                  ) : (
                    <p>There are no tournaments available at the moment. Check back soon!</p>
                  )}
                </div>
                
                {/* Clear filters button */}
                {(searchQueryState || Object.values(filters).some(v => 
                  Array.isArray(v) ? v.length > 0 : v !== null && v !== '' && JSON.stringify(v) !== '{}'
                ) || (locationContext && locationContext.mode !== 'anywhere')) && (
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      onClick={() => {
                        setSearchQueryState('');
                        setFilters({
                          countries: [],
                          cities: [],
                          dateRange: { start: '', end: '' },
                          minRating: null,
                          maxRating: null,
                          ratingTypes: [],
                          timeControls: [],
                          tournamentLevels: [],
                          priceRange: { min: null, max: null },
                          fideRatedOnly: false,
                          hasPrizeFund: false,
                          registrationOpen: false,
                        });
                        if (locationContext && locationContext.mode !== 'anywhere') {
                          resetLocationContext();
                          const anywhereContext = getLocationContext();
                          setLocationContext(anywhereContext);
                        }
                        router.push('/tournaments');
                      }}
                      className="inline-flex items-center justify-center px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition"
                    >
                      Clear all filters
                    </button>
                    <Link
                      href="/tournaments"
                      className="inline-flex items-center justify-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition"
                    >
                      View all tournaments
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-6">
              {sortedTournaments.map((tournament) => {
                const distanceMiles = (tournament as any)._distanceMiles;
                const { _distanceMiles, _finalRadius, ...cleanTournament } = tournament as any;
                
                return (
                  <div key={tournament.id} className="relative">
                    {distanceMiles !== null && distanceMiles !== undefined && (
                      <div className="absolute -top-2 -right-2 z-10">
                        {distanceMiles <= 25 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-500 text-white shadow-sm">
                            📍 {Math.round(distanceMiles)} mi
                          </span>
                        )}
                        {/* Enhanced distance badges with visual hierarchy */}
                        {distanceMiles !== null && distanceMiles !== undefined && (
                          <>
                            {distanceMiles <= 5 && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-500 text-white shadow-sm">
                                📍 {Math.round(distanceMiles)} mi away
                              </span>
                            )}
                            {distanceMiles > 5 && distanceMiles <= 25 && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500 text-white shadow-sm">
                                🏙️ {Math.round(distanceMiles)} mi away
                              </span>
                            )}
                            {distanceMiles > 25 && distanceMiles <= 100 && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-500 text-white shadow-sm">
                                🌆 {Math.round(distanceMiles)} mi away
                              </span>
                            )}
                            {distanceMiles > 100 && userCountry && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-500 text-white shadow-sm">
                                {userCountry.name === 'United States' ? '🇺🇸' : 
                                 userCountry.code === 'GB' || userCountry.code === 'UK' ? '🇬🇧' :
                                 userCountry.code === 'CA' ? '🇨🇦' :
                                 userCountry.code === 'AU' ? '🇦🇺' :
                                 userCountry.code === 'IN' ? '🇮🇳' :
                                 userCountry.code === 'DE' ? '🇩🇪' :
                                 userCountry.code === 'FR' ? '🇫🇷' :
                                 userCountry.code === 'ES' ? '🇪🇸' :
                                 userCountry.code === 'IT' ? '🇮🇹' :
                                 userCountry.code === 'BR' ? '🇧🇷' :
                                 userCountry.code === 'MX' ? '🇲🇽' :
                                 userCountry.code === 'JP' ? '🇯🇵' :
                                 userCountry.code === 'CN' ? '🇨🇳' :
                                 userCountry.code === 'RU' ? '🇷🇺' :
                                 '🌍'} In {userCountry.name}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    )}
                    <TournamentCard
                      tournament={cleanTournament as EventData}
                      isSuperAdmin={isSuperAdmin}
                      onDelete={async (id) => {
                        try {
                          await deleteEvent(id);
                          setEvents(prev => prev.filter(e => e.id !== id));
                          alert('Event deleted successfully');
                        } catch (error: any) {
                          console.error('Error deleting event:', error);
                          alert('Failed to delete event: ' + (error.message || 'Unknown error'));
                        }
                      }}
                      registrationCount={tournament.registeredUsers?.length}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}

export default function TournamentsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading tournaments...</p>
        </div>
      </div>
    }>
      <TournamentsContent />
    </Suspense>
  );
}

