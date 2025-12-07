'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getApprovedEvents, getAllEvents, deleteEvent } from '@/lib/events';
import { EventData } from '@/lib/types';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';

function TournamentsContent() {
  const searchParams = useSearchParams();
  const filter = searchParams.get('filter') || 'all';
  const { user, role } = useAuth();
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
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

  // Demo tournaments for now
  const demoTournaments: EventData[] = [
    {
      id: 'demo-1',
      title: '2024 SC State Championship',
      date: 'March 15-17, 2024',
      location: 'Columbia, SC',
      price: '$150',
      description: 'Join us for the prestigious SC State Championship featuring multiple categories including K-3, K-5, and Middle School divisions.',
      category: 'tournament',
      status: 'approved',
      createdBy: 'system',
      createdByEmail: 'admin@chessklub.com',
      registeredUsers: [],
      savedByUsers: [],
      createdAt: new Date('2024-03-01'),
      updatedAt: new Date('2024-03-01'),
    },
    {
      id: 'demo-2',
      title: 'NC State Championship - Under 1200',
      date: 'April 20-21, 2024',
      location: 'Raleigh, NC',
      price: '$125',
      description: 'Competitive tournament for players rated under 1200. Multiple age categories available.',
      category: 'tournament',
      status: 'approved',
      createdBy: 'system',
      createdByEmail: 'admin@chessklub.com',
      registeredUsers: [],
      savedByUsers: [],
      createdAt: new Date('2024-03-10'),
      updatedAt: new Date('2024-03-10'),
    },
    {
      id: 'demo-3',
      title: 'Ballantyne Chess Open',
      date: 'May 10, 2024',
      location: 'Ballantyne, Charlotte, NC',
      price: '$75',
      description: 'Local open tournament for all skill levels. Great for beginners and experienced players alike.',
      category: 'tournament',
      status: 'approved',
      createdBy: 'system',
      createdByEmail: 'admin@chessklub.com',
      registeredUsers: [],
      savedByUsers: [],
      createdAt: new Date('2024-04-15'),
      updatedAt: new Date('2024-04-15'),
    },
    {
      id: 'demo-4',
      title: 'Summer Blitz Championship',
      date: 'June 22, 2024',
      location: 'Fort Mill, SC',
      price: '$50',
      description: 'Fast-paced blitz tournament with 5-minute time controls. Exciting and action-packed!',
      category: 'tournament',
      status: 'approved',
      createdBy: 'system',
      createdByEmail: 'admin@chessklub.com',
      registeredUsers: [],
      savedByUsers: [],
      createdAt: new Date('2024-05-01'),
      updatedAt: new Date('2024-05-01'),
    },
    {
      id: 'demo-5',
      title: 'National Qualifier Tournament',
      date: 'July 15-16, 2024',
      location: 'Charlotte, NC',
      price: '$200',
      description: 'Qualifying tournament for national championships. High-level competition for serious players.',
      category: 'tournament',
      status: 'approved',
      createdBy: 'system',
      createdByEmail: 'admin@chessklub.com',
      registeredUsers: [],
      savedByUsers: [],
      createdAt: new Date('2024-06-01'),
      updatedAt: new Date('2024-06-01'),
    },
  ];

  // Combine real events with demo tournaments
  const allTournaments = [...events, ...demoTournaments];

  // Filter tournaments
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const filteredTournaments = allTournaments.filter((tournament) => {
    // Tournaments page shows ONLY tournaments (not events)
    const isTournament = tournament.category === 'tournament' || (!tournament.category && tournament.title.toLowerCase().includes('tournament'));
    
    if (!isTournament) return false; // Only show tournaments on tournaments page
    
    if (filter === 'new') {
      const createdDate = tournament.createdAt ? new Date(tournament.createdAt) : null;
      return createdDate && createdDate >= sevenDaysAgo;
    } else if (filter === 'upcoming') {
      try {
        const eventDate = new Date(tournament.date);
        return !isNaN(eventDate.getTime()) && eventDate >= now;
      } catch {
        return true; // Include if date parsing fails
      }
    }
    return true; // 'all'
  });

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

        {/* Filter Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex space-x-4 mb-8 border-b border-gray-200">
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

          {/* Tournaments Grid */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading tournaments...</p>
            </div>
          ) : filteredTournaments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">No tournaments found for this filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTournaments.map((tournament) => (
                <div
                  key={tournament.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow flex flex-col"
                >
                  {/* Tournament Image - Clickable */}
                  <Link href={`/events/${tournament.id}`} className="block w-full h-48 overflow-hidden">
                    {tournament.image ? (
                      <img 
                        src={tournament.image} 
                        alt={tournament.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center hover:opacity-90 transition-opacity cursor-pointer">
                        <span className="text-white text-xl font-bold text-center px-4">{tournament.title}</span>
                      </div>
                    )}
                  </Link>
                  
                  <div className="p-6 flex-grow flex flex-col">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-xl font-bold text-slate-900">{tournament.title || tournament.name}</h3>
                      {/* Event Type Badge */}
                      {(tournament.type || tournament.category) && (
                        <span className="ml-2 px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
                          {tournament.type === 'tournament' || tournament.category === 'tournament' ? 'Tournament' :
                           tournament.type === 'camp' ? 'Camp' :
                           tournament.type === 'class' ? 'Class' :
                           tournament.type === 'simul' ? 'Simul' :
                           tournament.type === 'clubNight' ? 'Club Night' :
                           tournament.type === 'other' ? 'Event' : 'Event'}
                        </span>
                      )}
                    </div>
                    <div className="space-y-2 mb-4">
                      {/* Date display - prefer startDate/endDate for tournaments, fallback to date */}
                      <p className="text-gray-600 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {tournament.category === 'tournament' && tournament.startDate && tournament.endDate ? (
                          (() => {
                            const startDate = tournament.startDate instanceof Date ? tournament.startDate : new Date(tournament.startDate);
                            const endDate = tournament.endDate instanceof Date ? tournament.endDate : new Date(tournament.endDate);
                            const startStr = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                            const endStr = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                            return startStr === endStr ? startStr : `${startStr} - ${endStr}`;
                          })()
                        ) : tournament.date}
                      </p>
                      {/* Venue/Location display - prefer venue for tournaments */}
                      <p className="text-gray-600 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {tournament.category === 'tournament' && tournament.venue ? tournament.venue : tournament.location}
                      </p>
                      {/* Time Control for tournaments */}
                      {tournament.category === 'tournament' && tournament.timeControl && (
                        <p className="text-gray-600 flex items-center">
                          <svg className="w-5 h-5 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {tournament.timeControl}
                        </p>
                      )}
                      <p className="text-gray-600 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {(() => {
                          // Get display price - prefer sections entry fees, then base price
                          if (tournament.category === 'tournament' && tournament.sections && tournament.sections.length > 0) {
                            const sectionsWithFee = tournament.sections.filter((s: any) => s.entryFee !== null && s.entryFee !== undefined);
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
                          if (tournament.price) {
                            if (!tournament.price.startsWith('$') && !tournament.price.toLowerCase().includes('free')) {
                              return `$${tournament.price}`;
                            }
                            return tournament.price;
                          }
                          return 'Free';
                        })()}
                        {/* Show sections summary if available */}
                        {tournament.category === 'tournament' && tournament.sections && tournament.sections.length > 0 && (
                          <span className="ml-2 text-xs text-gray-500">
                            ({tournament.sections.length} section{tournament.sections.length !== 1 ? 's' : ''})
                          </span>
                        )}
                        {/* Show add-ons indicator if available */}
                        {tournament.addOns && tournament.addOns.length > 0 && (
                          <span className="ml-2 text-xs text-orange-600 font-medium">
                            + {tournament.addOns.length} add-on{tournament.addOns.length !== 1 ? 's' : ''} available
                          </span>
                        )}
                      </p>
                    </div>
                    {tournament.description && (
                      <p className="text-gray-700 text-sm mb-4 line-clamp-3">{tournament.description}</p>
                    )}
                    <div className="mt-auto flex flex-col gap-3">
                      <div className="flex gap-3">
                        <Link
                          href={`/events/${tournament.id}`}
                          className="flex-1 inline-flex items-center justify-center text-orange-500 font-semibold hover:text-orange-600 transition border-2 border-orange-500 hover:bg-orange-50 py-2 rounded-md"
                        >
                          Learn More →
                        </Link>
                        <Link
                          href={`/events/${tournament.id}`}
                          className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 rounded-md transition text-center"
                        >
                          Register
                        </Link>
                      </div>
                      {isSuperAdmin && tournament.id && !tournament.id.startsWith('demo-') && (
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

