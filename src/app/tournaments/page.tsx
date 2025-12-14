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
import { filterTournaments, getUniqueCountries, getUniqueCities } from '@/lib/tournamentSearch';
import { getAllChessCountries, getAllChessCities } from '@/lib/chessCountries';
import TournamentCard from '@/components/tournament/TournamentCard';
import { getTournamentStartDate, getTournamentCreatedDate, getTournamentPrice } from '@/lib/tournamentHelpers';
import { getUserLocation, getCountryFromCoordinates, filterByDistance, filterByCountry } from '@/lib/locationHelpers';

function TournamentsContent() {
  const searchParams = useSearchParams();
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
        setEvents(fetchedEvents);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [isSuperAdmin]);

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
          console.error('Error getting user location:', error);
          setLocationError(error.message || 'Unable to get your location. Please enable location permissions.');
        })
        .finally(() => {
          setLocationLoading(false);
        });
    }
  }, [filter, userLocation, locationLoading, locationError]);

  // Use only real events from database (no demo/featured tournaments)
  const allTournaments = events;

  // Filter to only tournaments
  const tournamentsOnly = useMemo(() => {
    return allTournaments.filter((tournament) => {
      return tournament.category === 'tournament' || 
             (!tournament.category && tournament.title.toLowerCase().includes('tournament'));
    });
  }, [allTournaments]);

  // Get countries and cities from comprehensive lists (all major chess-playing nations and their cities)
  const availableCountries = useMemo(() => getAllChessCountries(), []);
  const availableCities = useMemo(() => getAllChessCities(), []);

  // Apply basic filter tabs (new, upcoming, all)
  const now = new Date();
  now.setHours(0, 0, 0, 0); // Set to start of day for accurate date comparison
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const basicFiltered = useMemo(() => {
    return tournamentsOnly.filter((tournament) => {
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
  }, [tournamentsOnly, filter, now, sevenDaysAgo]);

  // Apply location-based filtering for "Near Me"
  const locationFiltered = useMemo(() => {
    if (filter !== 'nearme') {
      return basicFiltered;
    }

    // If we have user location, filter by distance and country
    if (userLocation) {
      // Get nearby tournaments (within 100 miles = ~160km)
      const nearbyTournaments = filterByDistance(basicFiltered, userLocation.lat, userLocation.lng, 160);
      
      // Get all tournaments in user's country using improved filter
      const countryTournaments = userCountry 
        ? filterByCountry(basicFiltered, userCountry.code, userCountry.name)
        : [];

      // Combine nearby and country tournaments, removing duplicates
      const combined = [...nearbyTournaments];
      countryTournaments.forEach((tournament) => {
        if (!combined.find((t) => t.id === tournament.id)) {
          combined.push(tournament);
        }
      });

      console.log('Location filter results:', {
        totalBasic: basicFiltered.length,
        nearby: nearbyTournaments.length,
        country: countryTournaments.length,
        combined: combined.length,
        userCountry: userCountry?.name || userCountry?.code,
        userLocation
      });

      return combined;
    }

    // If location not yet loaded, return all tournaments (will filter once location is available)
    return basicFiltered;
  }, [basicFiltered, filter, userLocation, userCountry]);

  // Apply search and advanced filters
  const filteredTournaments = useMemo(() => {
    return filterTournaments(locationFiltered, searchQueryState, filters);
  }, [locationFiltered, searchQueryState, filters]);

  // Apply sorting
  const sortedTournaments = useMemo(() => {
    const sorted = [...filteredTournaments];
    
    switch (sortBy) {
      case 'soonest':
        sorted.sort((a, b) => {
          const dateA = getTournamentStartDate(a);
          const dateB = getTournamentStartDate(b);
          if (!dateA && !dateB) return 0;
          if (!dateA) return 1;
          if (!dateB) return -1;
          return dateA.getTime() - dateB.getTime();
        });
        break;
      case 'newest':
        sorted.sort((a, b) => {
          const dateA = getTournamentCreatedDate(a);
          const dateB = getTournamentCreatedDate(b);
          if (!dateA && !dateB) return 0;
          if (!dateA) return 1;
          if (!dateB) return -1;
          return dateB.getTime() - dateA.getTime();
        });
        break;
      case 'price-low':
        sorted.sort((a, b) => {
          const priceA = getTournamentPrice(a) ?? 0;
          const priceB = getTournamentPrice(b) ?? 0;
          return priceA - priceB;
        });
        break;
      case 'price-high':
        sorted.sort((a, b) => {
          const priceA = getTournamentPrice(a) ?? 0;
          const priceB = getTournamentPrice(b) ?? 0;
          return priceB - priceA;
        });
        break;
    }
    
    return sorted;
  }, [filteredTournaments, sortBy]);

  return (
    <>
      <Header />
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Tournament Search Bar */}
          <div className="mb-6">
            <TournamentSearchBar
              redirectOnSearch={false}
              currentPath="/tournaments"
              initialQuery={searchQuery}
              onSearch={setSearchQueryState}
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

          {/* Dropdown Filters Bar */}
          <div className="mb-6">
            <TournamentFilters
              filters={filters}
              onFiltersChange={setFilters}
              availableCountries={availableCountries}
              availableCities={availableCities}
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex space-x-4 mb-6 border-b border-gray-200">
            <Link
              href="/tournaments?filter=all"
              className={`pb-4 px-4 font-medium transition ${
                filter === 'all'
                  ? 'text-orange-500 border-b-2 border-orange-500'
                  : 'text-gray-600 hover:text-orange-500'
              }`}
            >
              All Tournaments
            </Link>
            <Link
              href="/tournaments?filter=new"
              className={`pb-4 px-4 font-medium transition ${
                filter === 'new'
                  ? 'text-orange-500 border-b-2 border-orange-500'
                  : 'text-gray-600 hover:text-orange-500'
              }`}
            >
              New Tournaments
            </Link>
            <Link
              href="/tournaments?filter=upcoming"
              className={`pb-4 px-4 font-medium transition ${
                filter === 'upcoming'
                  ? 'text-orange-500 border-b-2 border-orange-500'
                  : 'text-gray-600 hover:text-orange-500'
              }`}
            >
              Upcoming Events
            </Link>
          </div>

          {/* Results Count and Sort */}
          <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
            <p className="text-gray-600">
              {loading ? (
                'Loading tournaments...'
              ) : (
                <>
                  <span className="font-semibold text-gray-900">{sortedTournaments.length}</span>{' '}
                  tournament{sortedTournaments.length !== 1 ? 's' : ''} found
                </>
              )}
            </p>
            {!loading && sortedTournaments.length > 0 && (
              <div className="flex items-center gap-2">
                <label htmlFor="sort-select" className="text-sm text-gray-600">
                  Sort by:
                </label>
                <select
                  id="sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none bg-white"
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
                <p className="text-gray-600 mb-6">
                  {searchQueryState || Object.values(filters).some(v => 
                    Array.isArray(v) ? v.length > 0 : v !== null && v !== '' && JSON.stringify(v) !== '{}'
                  )
                    ? 'Try adjusting your filters or search terms.'
                    : 'There are no tournaments available at the moment. Check back soon!'}
                </p>
                {(searchQueryState || Object.values(filters).some(v => 
                  Array.isArray(v) ? v.length > 0 : v !== null && v !== '' && JSON.stringify(v) !== '{}'
                )) && (
                  <Link
                    href="/tournaments"
                    className="inline-flex items-center px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition"
                  >
                    Clear filters
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-6">
              {sortedTournaments.map((tournament) => (
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

