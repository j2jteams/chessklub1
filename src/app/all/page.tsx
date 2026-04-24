'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
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
import { filterByRadius, calculateDistanceMiles } from '@/lib/locationHelpers';
import { getLocationContext, type LocationContext } from '@/lib/locationContext';
import LocationPermissionPrompt from '@/components/tournaments/LocationPermissionPrompt';
import UnifiedLocationControl from '@/components/tournaments/UnifiedLocationControl';
import TournamentCard from '@/components/tournament/TournamentCard';
import { useCallback } from 'react';
import { isOngoingOrFutureForPublicBrowse } from '@/lib/tournamentHelpers';

function AllContent() {
  const searchParams = useSearchParams();
  const filter = searchParams.get('filter') || 'all';
  const searchQuery = searchParams.get('search') || '';
  const { user, role } = useAuth();
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQueryState, setSearchQueryState] = useState(searchQuery);
  const [filters, setFilters] = useState<FilterType>({
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
  const [locationContext, setLocationContext] = useState<LocationContext | null>(null);
  const [radiusExpansionInfo, setRadiusExpansionInfo] = useState<{ expanded: boolean; message?: string } | null>(null);
  const isSuperAdmin = role === 'superAdmin';

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        // Super admins can see all events (including pending), others see only approved
        const fetchedEvents = isSuperAdmin ? await getAllEvents() : await getApprovedEvents();
        console.log(`📥 [All Page] Fetched ${fetchedEvents.length} events`);
        setEvents(fetchedEvents);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [isSuperAdmin]);

  // Filter - show BOTH tournaments AND events together
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Get all relevant items (tournaments and events)
  const allItems = useMemo(() => {
    return events.filter((item) => {
      // Show both tournaments and events (exclude workshops, simuls, other unless specified)
      const isRelevant = item.category === 'tournament' || item.category === 'event' || !item.category;
      return isRelevant;
    });
  }, [events]);

  // Get countries and cities from comprehensive lists (all major chess-playing nations and their cities)
  const availableCountries = useMemo(() => getAllChessCountries(), []);
  const availableCities = useMemo(() => getAllChessCities(), []);

  // Load location context on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const context = getLocationContext();
      setLocationContext(context);
    }
  }, []);

  // Handle location context change
  const handleLocationChange = useCallback((newContext: LocationContext) => {
    setLocationContext(newContext);
  }, []);

  // Handle location permission
  const handleLocationAllow = () => {
    // Location will be requested when user clicks "Use my location" in UnifiedLocationControl
  };

  const handleLocationDeny = () => {
    // User denied location permission
  };

  // Apply basic filter tabs (new, upcoming, all)
  const basicFiltered = useMemo(() => {
    const filtered = allItems.filter((item) => {
      if (filter === 'new') {
        const createdDate = item.createdAt ? new Date(item.createdAt) : null;
        const isNew = createdDate && createdDate >= sevenDaysAgo;
        return !!isNew && isOngoingOrFutureForPublicBrowse(item, now);
      } else if (filter === 'upcoming') {
        try {
          const eventDate = item.startDate 
            ? new Date(item.startDate)
            : item.date 
            ? new Date(item.date)
            : null;
          return eventDate && !isNaN(eventDate.getTime()) && eventDate >= now;
        } catch {
          return false;
        }
      }
      return isOngoingOrFutureForPublicBrowse(item, now);
    });
    console.log(`📊 [All Page] Basic filter "${filter}": ${allItems.length} → ${filtered.length} items`);
    return filtered;
  }, [allItems, filter, now, sevenDaysAgo]);

  // Apply location-based filtering - respect the user's selected radius exactly
  // BUT: Skip distance filtering if country/city filters are active (let unified filter handle it)
  const locationFiltered = useMemo(() => {
    // If country or city filters are active, skip distance filtering
    // The unified filter will handle geographic filtering
    if (filters.countries.length > 0 || filters.cities.length > 0) {
      return { items: basicFiltered.map(t => ({ ...t, _distanceMiles: null })), expansionResult: null };
    }
    
    const activeContext = locationContext && locationContext.mode !== 'anywhere' 
      ? locationContext 
      : null;

    if (!activeContext || !activeContext.center) {
      // No location context - return all items
      return { items: basicFiltered.map(t => ({ ...t, _distanceMiles: null })), expansionResult: null };
    }

    // Filter tournaments within the exact radius (no automatic expansion - respect user's choice)
    const radiusMiles = activeContext.radiusMiles || 25;
    console.log(`📍 [All Page] Filtering with radius: ${radiusMiles}mi around ${activeContext.center.lat},${activeContext.center.lng}`);
    
    // Separate tournaments with and without coordinates
    const tournamentsWithCoords: any[] = [];
    const tournamentsWithoutCoords: any[] = [];
    
    basicFiltered.forEach((item: any) => {
      const coords = item.structuredLocation?.geo
        ? { lat: item.structuredLocation.geo.latitude, lng: item.structuredLocation.geo.longitude }
        : item.coordinates;
      
      if (coords && typeof coords.lat === 'number' && typeof coords.lng === 'number') {
        tournamentsWithCoords.push(item);
      } else {
        tournamentsWithoutCoords.push(item);
      }
    });
    
    // Filter tournaments with coordinates by distance
    const filteredWithCoords = filterByRadius(
      tournamentsWithCoords,
      activeContext.center,
      radiusMiles
    );
    
    // For tournaments without coordinates, include them if they're in the same country
    // This is a fallback to ensure tournaments without coordinates still show up
    let filteredWithoutCoords: any[] = [];
    if (activeContext.countryCode) {
      const { filterByCountry } = require('@/lib/locationHelpers');
      filteredWithoutCoords = filterByCountry(tournamentsWithoutCoords, activeContext.countryCode);
    }
    
    // Combine both sets
    const filteredItems = [...filteredWithCoords, ...filteredWithoutCoords];
    
    console.log(`📍 [All Page] Found ${filteredItems.length} tournaments within ${radiusMiles}mi:`);
    console.log(`  - ${filteredWithCoords.length} with coordinates (distance filtered)`);
    console.log(`  - ${filteredWithoutCoords.length} without coordinates (country matched: ${activeContext.countryCode || 'N/A'})`);
    console.log(`  - Total before filtering: ${basicFiltered.length} (${tournamentsWithCoords.length} with coords, ${tournamentsWithoutCoords.length} without coords)`);

    // Calculate distance for each item and add metadata
    const items = filteredItems.map((item: any) => {
      const coords = item.structuredLocation?.geo
        ? { lat: item.structuredLocation.geo.latitude, lng: item.structuredLocation.geo.longitude }
        : (item as any).coordinates;
      
      let distanceMiles: number | null = null;
      if (coords) {
        distanceMiles = calculateDistanceMiles(
          activeContext.center!.lat,
          activeContext.center!.lng,
          coords.lat,
          coords.lng
        );
      }

      return {
        ...item,
        _distanceMiles: distanceMiles,
        _finalRadius: radiusMiles
      };
    });

    // No expansion result since we're using exact radius
    return { items, expansionResult: null };
  }, [basicFiltered, locationContext, filters.countries, filters.cities]);

  // Clear expansion info (no longer using progressive expansion)
  // Use stable dependencies to avoid React warnings
  const locationFilteredItemsLength = locationFiltered.items?.length ?? 0;
  const locationContextRadius = locationContext?.radiusMiles;
  
  useEffect(() => {
    setRadiusExpansionInfo(null);
  }, [locationFilteredItemsLength, locationContextRadius]);

  // Apply search and advanced filters using unified filter
  const filteredItems = useMemo(() => {
    const items = locationFiltered.items || locationFiltered;
    const itemsArray = Array.isArray(items) ? items : [];
    console.log(`🔍 [All Page] Before search/filter: ${itemsArray.length} items`);
    console.log(`🔍 [All Page] Search query: "${searchQueryState}"`);
    console.log(`🔍 [All Page] Active filters:`, {
      countries: filters.countries,
      cities: filters.cities,
      dateRange: filters.dateRange,
      minRating: filters.minRating,
      maxRating: filters.maxRating,
      ratingTypes: filters.ratingTypes,
      timeControls: filters.timeControls,
      tournamentLevels: filters.tournamentLevels,
      priceRange: filters.priceRange,
      fideRatedOnly: filters.fideRatedOnly,
      hasPrizeFund: filters.hasPrizeFund,
      registrationOpen: filters.registrationOpen,
    });
    
    // Use unified filter (same as tournaments page)
    // Note: We skip location filtering here since it's already done in locationFiltered
    // But we need to pass locationContext as null to skip distance filtering in unified filter
    const filterResult = filterTournamentsUnified(itemsArray, {
      searchQuery: searchQueryState,
      filters: filters,
      locationContext: null // Location filtering already done above
    });
    const filtered = filterResult.tournaments;
    console.log(`🔍 [All Page] After search/filter: ${filtered.length} items`);
    
    // Sort by distance if location context is active
    if (locationContext && locationContext.mode !== 'anywhere' && locationContext.center) {
      return [...filtered].sort((a: any, b: any) => {
        const distanceA = a._distanceMiles;
        const distanceB = b._distanceMiles;
        
        // Both have distance - sort by distance first
        if (distanceA !== null && distanceB !== null) {
          return distanceA - distanceB;
        }
        
        // One has distance, one doesn't - prioritize the one with distance
        if (distanceA !== null && distanceB === null) return -1;
        if (distanceA === null && distanceB !== null) return 1;
        
        // Neither has distance - maintain original order
        return 0;
      });
    }
    
    return filtered;
  }, [locationFiltered, searchQueryState, filters, locationContext]);

  // Separate tournaments and events for display
  const tournaments = filteredItems.filter(item => item.category === 'tournament' || (!item.category && item.title.toLowerCase().includes('tournament')));
  const eventsOnly = filteredItems.filter(item => item.category === 'event' || (!item.category && !item.title.toLowerCase().includes('tournament')));

  return (
    <>
      <Header />
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
              All Tournaments & Events
            </h1>
            <p 
              className="text-lg"
              style={{ 
                color: 'rgba(255, 255, 255, 0.9)',
                fontFamily: 'var(--font-body)'
              }}
            >
              Browse all upcoming tournaments and events in one place
            </p>
          </div>
        </div>

        {/* Search and Filters Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Tournament Search Bar */}
          <div className="mb-6">
            <TournamentSearchBar
              redirectOnSearch={false}
              currentPath="/all"
              initialQuery={searchQuery}
              onSearch={setSearchQueryState}
            />
          </div>

          {/* Location Status Banner */}
          {locationContext && locationContext.mode !== 'anywhere' && locationContext.center && (
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
          )}

          {/* Unified Filters Bar (Location + Time Control + Date + Rating) */}
          <div className="mb-6">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {/* Unified Location Control */}
              <UnifiedLocationControl
                filters={filters}
                onFiltersChange={setFilters}
                onLocationContextChange={handleLocationChange}
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
          <div className="flex space-x-4 mb-6 border-b border-gray-200">
            <Link
              href="/all?filter=all"
              className={`pb-4 px-4 font-medium transition ${
                filter === 'all'
                  ? 'text-orange-500 border-b-2 border-orange-500'
                  : 'text-gray-600 hover:text-orange-500'
              }`}
            >
              All
            </Link>
            <Link
              href="/all?filter=new"
              className={`pb-4 px-4 font-medium transition ${
                filter === 'new'
                  ? 'text-orange-500 border-b-2 border-orange-500'
                  : 'text-gray-600 hover:text-orange-500'
              }`}
            >
              New
            </Link>
            <Link
              href="/all?filter=upcoming"
              className={`pb-4 px-4 font-medium transition ${
                filter === 'upcoming'
                  ? 'text-orange-500 border-b-2 border-orange-500'
                  : 'text-gray-600 hover:text-orange-500'
              }`}
            >
              Upcoming
            </Link>
          </div>

          {/* Results Count */}
          <div className="mb-6 flex items-center justify-between">
            <p className="text-gray-600">
              {loading ? (
                'Loading...'
              ) : (
                <>
                  <span className="font-semibold text-gray-900">{filteredItems.length}</span>{' '}
                  {filteredItems.length === 1 ? 'item' : 'items'} found
                </>
              )}
            </p>
          </div>

          {/* Content */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">No tournaments or events found for this filter.</p>
            </div>
          ) : (
            <div className="space-y-12">
              {/* Tournaments Section */}
              {tournaments.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-6">Tournaments</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tournaments.map((tournament) => (
                      <TournamentCard
                        key={tournament.id}
                        tournament={tournament}
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
                    ))}
                  </div>
                </div>
              )}

              {/* Events Section */}
              {eventsOnly.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-6">Events</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {eventsOnly.map((event) => (
                      <TournamentCard
                        key={event.id}
                        tournament={event}
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
                        registrationCount={event.registeredUsers?.length}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}

export default function AllPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <AllContent />
    </Suspense>
  );
}

