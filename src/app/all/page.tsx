'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getApprovedEvents, getAllEvents, deleteEvent } from '@/lib/events';
import { EventData } from '@/lib/types';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';

function AllContent() {
  const searchParams = useSearchParams();
  const filter = searchParams.get('filter') || 'all';
  const { user, role } = useAuth();
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const isOwner = role === 'owner';

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        // Owners can see all events (including pending), others see only approved
        const fetchedEvents = isOwner ? await getAllEvents() : await getApprovedEvents();
        setEvents(fetchedEvents);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [isOwner]);

  // Filter - show BOTH tournaments AND events together
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const filteredItems = events.filter((item) => {
    // Show both tournaments and events (exclude workshops, simuls, other unless specified)
    const isRelevant = item.category === 'tournament' || item.category === 'event' || !item.category;
    
    if (!isRelevant) return false;
    
    if (filter === 'new') {
      const createdDate = item.createdAt ? new Date(item.createdAt) : null;
      return createdDate && createdDate >= sevenDaysAgo;
    } else if (filter === 'upcoming') {
      try {
        const eventDate = new Date(item.date);
        return !isNaN(eventDate.getTime()) && eventDate >= now;
      } catch {
        return true; // Include if date parsing fails
      }
    }
    return true; // 'all'
  });

  // Separate tournaments and events for display
  const tournaments = filteredItems.filter(item => item.category === 'tournament' || (!item.category && item.title.toLowerCase().includes('tournament')));
  const eventsOnly = filteredItems.filter(item => item.category === 'event' || (!item.category && !item.title.toLowerCase().includes('tournament')));

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

        {/* Filter Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex space-x-4 mb-8 border-b border-gray-200">
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
                      <div
                        key={tournament.id}
                        className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow flex flex-col"
                      >
                        {/* Tournament Image */}
                        {tournament.image ? (
                          <div className="w-full h-48 overflow-hidden">
                            <img 
                              src={tournament.image} 
                              alt={tournament.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </div>
                        ) : (
                          <div className="w-full h-48 bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                            <span className="text-white text-xl font-bold text-center px-4">{tournament.title}</span>
                          </div>
                        )}
                        
                        <div className="p-6 flex-grow flex flex-col">
                          <h3 className="text-xl font-bold text-slate-900 mb-2">{tournament.title}</h3>
                          <div className="space-y-2 mb-4">
                            <p className="text-gray-600 flex items-center">
                              <svg className="w-5 h-5 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {tournament.date}
                            </p>
                            <p className="text-gray-600 flex items-center">
                              <svg className="w-5 h-5 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              {tournament.location}
                            </p>
                            <p className="text-gray-600 flex items-center">
                              <svg className="w-5 h-5 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {tournament.price && !tournament.price.startsWith('$') && !tournament.price.toLowerCase().includes('free') 
                                ? `$${tournament.price}` 
                                : tournament.price}
                            </p>
                          </div>
                          {tournament.description && (
                            <p className="text-gray-700 text-sm mb-4 line-clamp-3">{tournament.description}</p>
                          )}
                          <div className="mt-auto flex flex-col gap-2">
                            <Link
                              href={`/events/${tournament.id}`}
                              className="inline-flex items-center text-orange-500 font-semibold hover:text-orange-600 transition"
                            >
                              Learn More →
                            </Link>
                            {isOwner && tournament.id && (
                              <div className="flex gap-2 pt-2 border-t border-gray-200">
                                <Link
                                  href={`/admin/events/edit/${tournament.id}`}
                                  className="flex-1 text-center px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded transition"
                                >
                                  Edit
                                </Link>
                                <button
                                  onClick={async () => {
                                    if (!confirm(`Are you sure you want to delete "${tournament.title}"?`)) return;
                                    try {
                                      await deleteEvent(tournament.id!);
                                      setEvents(prev => prev.filter(e => e.id !== tournament.id));
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
                </div>
              )}

              {/* Events Section */}
              {eventsOnly.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-6">Events</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {eventsOnly.map((event) => (
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
                            {isOwner && event.id && (
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

