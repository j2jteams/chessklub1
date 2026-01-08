'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { getApprovedEvents } from '@/lib/events';
import { EventData } from '@/lib/types';
import { BRAND_NAME } from '@/config/brand';

export default function Header() {
  const { user, role } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [tournamentsOpen, setTournamentsOpen] = useState(false);
  const [events, setEvents] = useState<EventData[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  const dashboardLink =
    role === 'superAdmin'
      ? { href: '/dashboard/super-admin', label: 'Dashboard' }
      : role === 'franchisee' || role === 'standaloneAdmin'
        ? { href: '/dashboard/admin', label: 'Dashboard' }
        : { href: '/dashboard', label: 'Dashboard' };

  // Fetch approved events for tournaments dropdown
  useEffect(() => {
    const fetchEvents = async () => {
      setLoadingEvents(true);
      try {
        const approvedEvents = await getApprovedEvents();
        setEvents(approvedEvents);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoadingEvents(false);
      }
    };
    fetchEvents();
  }, []);

  // Close dropdowns when route changes
  useEffect(() => {
    setTournamentsOpen(false);
    setMenuOpen(false);
    setMobileMenuOpen(false);
  }, [pathname]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Close tournaments dropdown if clicking outside
      if (tournamentsOpen) {
        const dropdown = document.querySelector('.tournaments-dropdown');
        if (dropdown && !dropdown.contains(target)) {
          setTournamentsOpen(false);
        }
      }
    };

    if (tournamentsOpen) {
      // Use a small delay to avoid closing immediately on open
      const timeoutId = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);
      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [tournamentsOpen]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Filter events: new (last 7 days) and upcoming (future dates)
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  // New tournaments/events created in the last 7 days
  const newTournaments = events.filter(event => {
    const eventDate = event.createdAt ? new Date(event.createdAt) : null;
    return eventDate && eventDate >= sevenDaysAgo;
  });

  // Upcoming events/tournaments (future dates) - includes both tournaments and events
  const upcomingEvents = events.filter(event => {
    // Try to parse the date string - handle various formats
    if (!event.date) return false;
    try {
      const eventDate = new Date(event.date);
      return !isNaN(eventDate.getTime()) && eventDate >= now;
    } catch {
      // If date parsing fails, exclude it (don't show invalid dates)
      return false;
    }
  });

  // Separate tournaments and events for better categorization
  const upcomingTournaments = upcomingEvents.filter(event => 
    event.category === 'tournament'
  );
  const upcomingEventsOnly = upcomingEvents.filter(event => 
    event.category === 'event' || !event.category // Include events and items without category
  );

  return (
    <div style={{ position: 'relative', zIndex: 1000 }}>
      {/* Main Navigation Header */}
      <nav className="sticky top-0 z-40 bg-black/90 backdrop-blur-md border-b border-white/5 shadow-lg" style={{ position: 'relative' }}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            {/* Logo/Brand */}
            <div className="flex items-center flex-shrink-0">
              <Link href="/" className="flex items-center hover:opacity-80 transition">
                <span className="text-xl sm:text-2xl font-bold text-white">
                  {BRAND_NAME}
                </span>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2.5 rounded-md text-white hover:bg-white/10 active:bg-white/20 transition min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Toggle mobile menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>

            {/* Desktop Navigation Menu */}
            <div className="hidden md:flex space-x-1 lg:space-x-2 items-center">
              {/* Home Link */}
              <Link
                href="/"
                className="px-4 py-2 transition font-medium rounded-md hover:bg-white/10 text-white/80 hover:text-white"
              >
                Home
              </Link>

              {/* Tournaments Dropdown - Emphasized */}
              <div className="relative tournaments-dropdown">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setTournamentsOpen(!tournamentsOpen);
                  }}
                  className="flex items-center gap-1 px-4 py-2 transition font-semibold rounded-md hover:bg-white/10 relative"
                  style={{ color: 'white' }}
                >
                  <span className="relative">
                    Tournaments
                    <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-orange-500"></span>
                  </span>
                  <svg
                    className={`w-4 h-4 transition-transform ${tournamentsOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {tournamentsOpen && (
                  <div className="absolute top-full left-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-[200] overflow-hidden" onClick={(e) => e.stopPropagation()} style={{ backgroundColor: 'white' }}>
                    {/* Featured Preview Cards */}
                    {upcomingEvents.length > 0 && (
                      <div className="p-4 bg-gradient-to-r from-orange-50 to-orange-100 border-b border-gray-200">
                        <p className="text-xs font-semibold text-gray-600 uppercase mb-3">Featured</p>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {upcomingEvents.slice(0, 2).map((event) => (
                            <Link
                              key={event.id}
                              href={`/events/${event.id}`}
                              onClick={() => setTournamentsOpen(false)}
                              className="w-full text-left block p-3 bg-white rounded-lg hover:shadow-md transition border border-gray-200 cursor-pointer"
                            >
                              <div className="flex gap-3">
                                {event.image && (
                                  <img 
                                    src={event.image} 
                                    alt={event.title}
                                    className="w-16 h-16 object-cover rounded flex-shrink-0 pointer-events-none"
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-sm text-gray-900 line-clamp-1 mb-1">{event.title}</h4>
                                  <p className="text-xs text-gray-600 mb-1">{event.date}</p>
                                  <p className="text-xs font-bold text-orange-600">
                                    {(() => {
                                      // Get display price - prefer sections entry fees, then base price
                                      if (event.category === 'tournament' && event.sections && event.sections.length > 0) {
                                        const sectionsWithFee = event.sections.filter((s: any) => s.entryFee !== null && s.entryFee !== undefined);
                                        if (sectionsWithFee.length > 0) {
                                          const fees = sectionsWithFee.map((s: any) => s.entryFee!);
                                          const minFee = Math.min(...fees);
                                          const maxFee = Math.max(...fees);
                                          if (minFee === maxFee) {
                                            return `$${minFee.toFixed(2)}`;
                                          } else {
                                            return `$${minFee.toFixed(2)} - $${maxFee.toFixed(2)}`;
                                          }
                                        }
                                      }
                                      // Fall back to base price
                                      if (event.price) {
                                        if (!event.price.startsWith('$') && !event.price.toLowerCase().includes('free')) {
                                          return `$${event.price}`;
                                        }
                                        return event.price;
                                      }
                                      return 'Free';
                                    })()}
                                  </p>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quick Links Section */}
                    <div className="py-2">
                      {/* Tournaments Section */}
                      <div className="px-4 py-2 border-b border-gray-100">
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                          </svg>
                          <p className="text-xs font-semibold text-gray-700 uppercase">Tournaments</p>
                        </div>
                        <Link
                          href="/tournaments?filter=new"
                          onClick={() => setTournamentsOpen(false)}
                          className="w-full flex items-center justify-between px-2 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-md transition group cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-gray-400 group-hover:text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>New Tournaments</span>
                          </div>
                          {newTournaments.length > 0 && (
                            <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                              {newTournaments.length}
                            </span>
                          )}
                        </Link>
                        <Link
                          href="/tournaments"
                          onClick={() => setTournamentsOpen(false)}
                          className="w-full flex items-center justify-between px-2 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-md transition group cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-gray-400 group-hover:text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>All Tournaments</span>
                          </div>
                        </Link>
                      </div>

                      {/* Events Section */}
                      <div className="px-4 py-2 border-b border-gray-100">
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="text-xs font-semibold text-gray-700 uppercase">Events</p>
                        </div>
                        <Link
                          href="/events"
                          onClick={(e) => {
                            e.stopPropagation();
                            setTournamentsOpen(false);
                          }}
                          className="w-full flex items-center justify-between px-2 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-md transition group cursor-pointer relative z-[2010]"
                          style={{ position: 'relative', zIndex: 2010 }}
                        >
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-gray-400 group-hover:text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>All Events</span>
                          </div>
                        </Link>
                      </div>

                      {/* View All Link */}
                      <Link
                        href="/all"
                        onClick={() => setTournamentsOpen(false)}
                        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-orange-600 hover:bg-orange-50 transition border-t border-gray-100 cursor-pointer"
                      >
                        <span>View All Tournaments & Events</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Ranking */}
              <Link
                href="/ranking"
                className="px-4 py-2 transition font-medium rounded-md hover:bg-white/10 text-white/70 hover:text-white"
              >
                Ranking
              </Link>

              {/* Results - Coming Soon */}
              <Link
                href="/tournaments"
                className="px-4 py-2 transition font-medium rounded-md hover:bg-white/10 text-white/70 hover:text-white relative group"
              >
                Results
                <span className="ml-1.5 text-xs text-orange-400 opacity-75">Coming Soon</span>
              </Link>

              {/* Locations */}
              <Link
                href="/locations"
                className="px-4 py-2 transition font-medium rounded-md hover:bg-white/10 text-white/70 hover:text-white"
              >
                Locations
              </Link>

              {/* Post a Tournament CTA */}
              <Link
                href={user ? "/admin/events/create" : "/login"}
                className="px-3 py-1.5 text-sm font-medium rounded-md border border-orange-500/70 text-orange-400 hover:border-orange-500 hover:text-white hover:bg-orange-500 transition"
              >
                Post a Tournament
              </Link>
            </div>

            {/* User Menu / Login */}
            <div className="flex items-center gap-2 sm:gap-4 relative ml-6">
              {user ? (
                <>
                  <button
                    className="flex items-center gap-1.5 sm:gap-2 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-800 px-2 sm:px-4 py-1.5 sm:py-2 rounded-full font-medium transition min-h-[44px] sm:min-h-0"
                    onClick={() => setMenuOpen((prev) => !prev)}
                  >
                    <span className="hidden lg:inline text-sm">{user.email}</span>
                    <span className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
                      {user.email?.[0]?.toUpperCase() ?? 'U'}
                    </span>
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 top-12 w-56 bg-white rounded-lg shadow-xl border border-gray-100 py-2 z-[200] user-menu-dropdown" onClick={(e) => e.stopPropagation()}>
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                      <Link
                        href={dashboardLink.href}
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition cursor-pointer block relative z-[2010]"
                        style={{ position: 'relative', zIndex: 2010 }}
                      >
                        Dashboard
                      </Link>
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          handleSignOut();
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href="/login"
                  className="font-medium transition px-4 py-2 rounded-md border border-orange-500/60 text-orange-400 hover:bg-orange-500 hover:text-white hover:border-orange-500 text-sm sm:text-base min-h-[44px] sm:min-h-0 flex items-center justify-center"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-black/95 backdrop-blur-md border-t border-white/10 shadow-lg relative z-[200]">
          <div className="px-4 py-4 space-y-2">
            {/* Home Link */}
            <Link
              href="/"
              className="block px-4 py-3 font-medium rounded-md hover:bg-white/10 transition text-white/80 hover:text-white"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>

            {/* Tournaments Dropdown */}
            <div>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setTournamentsOpen(!tournamentsOpen);
                }}
                className="w-full flex items-center justify-between px-4 py-3 text-left font-semibold rounded-md hover:bg-white/10 transition text-white relative"
              >
                <span className="relative">
                  Tournaments
                  <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-orange-500"></span>
                </span>
                <svg
                  className={`w-5 h-5 transition-transform ${tournamentsOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {tournamentsOpen && (
                <div className="mt-2 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                  {/* Featured Preview Cards */}
                  {upcomingEvents.length > 0 && (
                    <div className="p-3 bg-gradient-to-r from-orange-50 to-orange-100 border-b border-gray-200">
                      <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Featured</p>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {upcomingEvents.slice(0, 2).map((event) => (
                          <Link
                            key={event.id}
                            href={`/events/${event.id}`}
                            onClick={() => {
                              setTournamentsOpen(false);
                              setMobileMenuOpen(false);
                            }}
                            className="w-full text-left block p-2 bg-white rounded-lg hover:shadow-md transition border border-gray-200 cursor-pointer"
                          >
                            <div className="flex gap-2">
                              {event.image && (
                                <img 
                                  src={event.image} 
                                  alt={event.title}
                                  className="w-14 h-14 object-cover rounded flex-shrink-0 pointer-events-none"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-xs text-gray-900 line-clamp-1 mb-1">{event.title}</h4>
                                <p className="text-xs text-gray-600 mb-1">{event.date}</p>
                                <p className="text-xs font-bold text-orange-600">
                                  {(() => {
                                    // Get display price - prefer sections entry fees, then base price
                                    if (event.category === 'tournament' && event.sections && event.sections.length > 0) {
                                      const sectionsWithFee = event.sections.filter((s: any) => s.entryFee !== null && s.entryFee !== undefined);
                                      if (sectionsWithFee.length > 0) {
                                        const fees = sectionsWithFee.map((s: any) => s.entryFee!);
                                        const minFee = Math.min(...fees);
                                        const maxFee = Math.max(...fees);
                                        if (minFee === maxFee) {
                                          return `$${minFee.toFixed(2)}`;
                                        } else {
                                          return `$${minFee.toFixed(2)} - $${maxFee.toFixed(2)}`;
                                        }
                                      }
                                    }
                                    // Fall back to base price
                                    if (event.price) {
                                      if (!event.price.startsWith('$') && !event.price.toLowerCase().includes('free')) {
                                        return `$${event.price}`;
                                      }
                                      return event.price;
                                    }
                                    return 'Free';
                                  })()}
                                </p>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quick Links Section */}
                  <div className="py-2">
                    {/* Tournaments Section */}
                    <div className="px-3 py-2 border-b border-gray-100">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                        <p className="text-xs font-semibold text-gray-700 uppercase">Tournaments</p>
                      </div>
                      <Link
                        href="/tournaments?filter=new"
                        className="w-full flex items-center justify-between px-2 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-md transition group cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-gray-400 group-hover:text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>New Tournaments</span>
                        </div>
                        {newTournaments.length > 0 && (
                          <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                            {newTournaments.length}
                          </span>
                        )}
                      </Link>
                      <Link
                        href="/tournaments"
                        className="w-full flex items-center justify-between px-2 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-md transition group cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-gray-400 group-hover:text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>All Tournaments</span>
                        </div>
                      </Link>
                    </div>

                    {/* Events Section */}
                    <div className="px-3 py-2 border-b border-gray-100">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-xs font-semibold text-gray-700 uppercase">Events</p>
                      </div>
                      <Link
                        href="/events"
                        onClick={() => {
                          setTournamentsOpen(false);
                          setMobileMenuOpen(false);
                        }}
                        className="w-full flex items-center justify-between px-2 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-md transition group cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-gray-400 group-hover:text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>All Events</span>
                        </div>
                      </Link>
                    </div>

                    {/* View All Link */}
                    <Link
                      href="/all"
                      onClick={() => {
                        setTournamentsOpen(false);
                        setMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-3 text-sm font-semibold text-orange-600 hover:bg-orange-50 transition border-t border-gray-100 cursor-pointer"
                    >
                      <span>View All Tournaments & Events</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <Link
              href="/ranking"
              className="block px-4 py-3 font-medium rounded-md hover:bg-white/10 transition text-white/70 hover:text-white"
              onClick={() => setMobileMenuOpen(false)}
            >
              Ranking
            </Link>

            <Link
              href="/tournaments"
              className="block px-4 py-3 font-medium rounded-md hover:bg-white/10 transition text-white/70 hover:text-white relative group"
              onClick={() => setMobileMenuOpen(false)}
            >
              Results
              <span className="ml-1.5 text-xs text-orange-400 opacity-75">Coming Soon</span>
            </Link>

            <Link
              href="/locations"
              className="block px-4 py-3 font-medium rounded-md hover:bg-white/10 transition text-white/70 hover:text-white"
              onClick={() => setMobileMenuOpen(false)}
            >
              Locations
            </Link>

            <Link
              href={user ? "/admin/events/create" : "/login"}
              className="block px-3 py-2 text-sm font-medium rounded-md border border-orange-500/70 text-orange-400 hover:border-orange-500 hover:text-white hover:bg-orange-500 transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              Post a Tournament
            </Link>

            {user && (
              <div className="pt-4 border-t border-gray-200">
                <Link
                  href={dashboardLink.href}
                  className="block px-4 py-3 font-medium rounded-md hover:bg-orange-50 transition"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ color: 'var(--color-accent)' }}
                >
                  Dashboard
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleSignOut();
                  }}
                  className="w-full text-left px-4 py-3 font-medium rounded-md hover:bg-red-50 transition text-red-600"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Click outside handler - REMOVED to prevent blocking navigation */}
    </div>
  );
}
