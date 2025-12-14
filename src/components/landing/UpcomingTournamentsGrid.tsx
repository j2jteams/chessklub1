'use client';

import { EventData } from '@/lib/types';
import Link from 'next/link';
import TournamentCard from '@/components/TournamentCard';

interface UpcomingTournamentsGridProps {
  tournaments: EventData[];
  loading?: boolean;
}

export default function UpcomingTournamentsGrid({ tournaments, loading }: UpcomingTournamentsGridProps) {
  // Show ALL tournaments in the grid
  // Featured carousel highlights the first 6, but users should see all tournaments here
  const gridTournaments = tournaments;

  return (
    <section className="bg-white py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Clean Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3">
            All Upcoming Tournaments
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
            Browse tournaments happening soon in your area and online.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading tournaments...</p>
          </div>
        ) : gridTournaments.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p className="text-lg">No additional tournaments available.</p>
            <p className="text-sm mt-2">Check back soon for more events!</p>
          </div>
        ) : (
          <>
            {/* Clean Grid - Shows 6-12 cards visible at once */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
              {gridTournaments.map((tournament) => (
                <TournamentCard 
                  key={tournament.id || `${tournament.title}-${tournament.date}`} 
                  tournament={tournament} 
                />
              ))}
            </div>

            {/* CTA Button - Only show if there are many tournaments */}
            {gridTournaments.length >= 12 && (
              <div className="text-center">
                <Link
                  href="/tournaments"
                  className="inline-flex items-center px-8 py-3.5 bg-orange-500 text-white font-semibold rounded-full hover:bg-orange-600 transition-all shadow-lg hover:shadow-xl text-base"
                >
                  View All Tournaments
                  <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

