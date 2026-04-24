'use client';

import { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
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
import { filterTournaments } from '@/lib/tournamentSearch';
import { getAllChessCountries, getAllChessCities } from '@/lib/chessCountries';
import { progressiveRadiusExpansion, calculateDistanceMiles } from '@/lib/locationHelpers';
import { isOngoingOrFutureForPublicBrowse } from '@/lib/tournamentHelpers';
import { getLocationContext, type LocationContext } from '@/lib/locationContext';
import LocationPermissionPrompt from '@/components/tournaments/LocationPermissionPrompt';
import UnifiedLocationControl from '@/components/tournaments/UnifiedLocationControl';

function EventsContent() {
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
        setEvents(fetchedEvents);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [isSuperAdmin]);

  // Get countries and cities from comprehensive lists
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

  // Filter events - show ONLY events (category === 'event')
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Apply basic filter tabs (new, upcoming, all)
  const basicFiltered = useMemo(() => {
    return events.filter((event) => {
      // Events page shows ONLY events (not tournaments)
      const isEvent = event.category === 'event' || (!event.category && !event.title.toLowerCase().includes('tournament'));
      
      if (!isEvent) return false; // Only show events on events page
      
      if (filter === 'new') {
        const createdDate = event.createdAt ? new Date(event.createdAt) : null;
        if (createdDate) {
          createdDate.setHours(0, 0, 0, 0);
        }
        return (
          !!createdDate &&
          createdDate >= sevenDaysAgo &&
          isOngoingOrFutureForPublicBrowse(event, now)
        );
      } else if (filter === 'upcoming') {
        try {
          const eventDate = event.startDate 
            ? new Date(event.startDate)
            : event.date 
            ? new Date(event.date)
            : null;
          if (eventDate) {
            eventDate.setHours(0, 0, 0, 0);
          }
          return eventDate && !isNaN(eventDate.getTime()) && eventDate >= now;
        } catch {
          return false;
        }
      }
      // 'all' — hide past events on public browse (admins use /dashboard/admin for full history)
      return isOngoingOrFutureForPublicBrowse(event, now);
    });
  }, [events, filter, now, sevenDaysAgo]);

  // Apply location-based filtering with progressive radius expansion
  const locationFiltered = useMemo(() => {
    const activeContext = locationContext && locationContext.mode !== 'anywhere' 
      ? locationContext 
      : null;

    if (!activeContext || !activeContext.center) {
      // No location context - return all items
      return { items: basicFiltered.map(t => ({ ...t, _distanceMiles: null })), expansionResult: null };
    }

    // Use progressive radius expansion
    const expansionResult = progressiveRadiusExpansion(
      basicFiltered,
      activeContext.center,
      activeContext.radiusMiles,
      20, // minResults
      activeContext.countryCode
    );

    // Calculate distance for each item and add metadata
    const items = expansionResult.tournaments.map((item: any) => {
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
        _finalRadius: expansionResult.finalRadiusMiles
      };
    });

    return { items, expansionResult };
  }, [basicFiltered, locationContext]);

  // Update expansion info
  useEffect(() => {
    const expansionResult = locationFiltered.expansionResult;
    if (expansionResult?.expanded && expansionResult?.expansionMessage) {
      setRadiusExpansionInfo({
        expanded: true,
        message: expansionResult.expansionMessage
      });
    } else {
      setRadiusExpansionInfo(null);
    }
  }, [
    locationFiltered.expansionResult?.expanded,
    locationFiltered.expansionResult?.expansionMessage,
    locationFiltered.expansionResult?.finalRadiusMiles
  ]);

  // Apply search and advanced filters
  const filteredEvents = useMemo(() => {
    const items = locationFiltered.items || locationFiltered;
    const filtered = filterTournaments(Array.isArray(items) ? items : [], searchQueryState, filters);
    
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
              Chess Events
            </h1>
            <p 
              className="text-lg"
              style={{ 
                color: 'rgba(255, 255, 255, 0.9)',
                fontFamily: 'var(--font-body)'
              }}
            >
              Discover workshops, simuls, and special chess events
            </p>
          </div>
        </div>

        {/* Search and Filters Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Tournament Search Bar */}
          <div className="mb-6">
            <TournamentSearchBar
              redirectOnSearch={false}
              currentPath="/events"
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
                    `Showing events within ${locationContext.radiusMiles} miles`
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
          <div className="flex space-x-4 mb-8 border-b border-gray-200">
            <Link
              href="/events?filter=all"
              className={`pb-4 px-4 font-medium transition ${
                filter === 'all'
                  ? 'text-orange-500 border-b-2 border-orange-500'
                  : 'text-gray-600 hover:text-orange-500'
              }`}
            >
              All Events
            </Link>
            <Link
              href="/events?filter=new"
              className={`pb-4 px-4 font-medium transition ${
                filter === 'new'
                  ? 'text-orange-500 border-b-2 border-orange-500'
                  : 'text-gray-600 hover:text-orange-500'
              }`}
            >
              New Events
            </Link>
            <Link
              href="/events?filter=upcoming"
              className={`pb-4 px-4 font-medium transition ${
                filter === 'upcoming'
                  ? 'text-orange-500 border-b-2 border-orange-500'
                  : 'text-gray-600 hover:text-orange-500'
              }`}
            >
              Upcoming Events
            </Link>
          </div>

          {/* Events Grid */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading events...</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">No events found for this filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => (
                <div
                  key={event.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow flex flex-col"
                >
                  {/* Event Image */}
                  {event.image ? (
                    <div className="w-full h-48 overflow-hidden">
                      <img 
                        src={event.image} 
                        alt={event.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                      <span className="text-white text-xl font-bold text-center px-4">{event.title}</span>
                    </div>
                  )}
                  
                  <div className="p-6 flex-grow flex flex-col">
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{event.title}</h3>
                    <div className="space-y-2 mb-4">
                      <p className="text-gray-600 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {event.date}
                      </p>
                      <p className="text-gray-600 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {event.location}
                      </p>
                      <p className="text-gray-600 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {event.price && !event.price.startsWith('$') && !event.price.toLowerCase().includes('free') 
                          ? `$${event.price}` 
                          : event.price}
                      </p>
                    </div>
                    {event.description && (
                      <p className="text-gray-700 text-sm mb-4 line-clamp-3">{event.description}</p>
                    )}
                    <div className="mt-auto flex flex-col gap-2">
                      <Link
                        href={`/events/${event.id}`}
                        className="inline-flex items-center text-orange-500 font-semibold hover:text-orange-600 transition"
                      >
                        Learn More →
                      </Link>
                      {isSuperAdmin && event.id && (
                        <div className="flex gap-2 pt-2 border-t border-gray-200">
                          <Link
                            href={`/admin/events/edit/${event.id}`}
                            className="flex-1 text-center px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded transition"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={async () => {
                              if (!confirm(`Are you sure you want to delete "${event.title}"?`)) return;
                              try {
                                await deleteEvent(event.id!);
                                setEvents(prev => prev.filter(e => e.id !== event.id));
                                alert('Event deleted successfully');
                              } catch (error: any) {
                                console.error('Error deleting event:', error);
                                alert('Failed to delete event: ' + (error.message || 'Unknown error'));
                              }
                            }}
                            className="flex-1 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded transition"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}

export default function EventsPage() {
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
      <EventsContent />
    </Suspense>
  );
}

