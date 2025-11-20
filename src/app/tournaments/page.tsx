'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getApprovedEvents } from '@/lib/events';
import { EventData } from '@/lib/types';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

function TournamentsContent() {
  const searchParams = useSearchParams();
  const filter = searchParams.get('filter') || 'all';
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const approvedEvents = await getApprovedEvents();
        setEvents(approvedEvents);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  // Demo tournaments for now
  const demoTournaments: EventData[] = [
    {
      id: 'demo-1',
      title: '2024 SC State Championship',
      date: 'March 15-17, 2024',
      location: 'Columbia, SC',
      price: '$150',
      description: 'Join us for the prestigious SC State Championship featuring multiple categories including K-3, K-5, and Middle School divisions.',
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
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Chess Tournaments</h1>
            <p className="text-xl text-gray-300">
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
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow"
                >
                  <div className="p-6">
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
                        {tournament.price}
                      </p>
                    </div>
                    {tournament.description && (
                      <p className="text-gray-700 text-sm mb-4 line-clamp-3">{tournament.description}</p>
                    )}
                    <button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 rounded-md transition">
                      Register Now
                    </button>
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

