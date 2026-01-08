'use client';

import { EventData } from '@/lib/types';
import Link from 'next/link';
import TournamentCard from '@/components/TournamentCard';
import TournamentCardSkeleton from '@/components/TournamentCardSkeleton';

interface UpcomingTournamentsGridProps {
  tournaments: EventData[];
  loading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
}

export default function UpcomingTournamentsGrid({ tournaments, loading, error, onRetry }: UpcomingTournamentsGridProps) {
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <TournamentCardSkeleton key={index} />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16 px-4">
            <div className="max-w-md mx-auto">
              <div className="mb-4">
                <svg className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Couldn't load tournaments
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                {error.message || 'Something went wrong while fetching tournaments. Please try again.'}
              </p>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="inline-flex items-center px-6 py-3 bg-orange-500 text-white font-semibold rounded-full hover:bg-orange-600 transition-all shadow-lg hover:shadow-xl"
                >
                  Retry
                </button>
              )}
            </div>
          </div>
        ) : gridTournaments.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="max-w-md mx-auto">
              <div className="mb-4">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No tournaments found
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Try adjusting filters or check back soon.
              </p>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="inline-flex items-center px-6 py-3 bg-orange-500 text-white font-semibold rounded-full hover:bg-orange-600 transition-all shadow-lg hover:shadow-xl"
                >
                  Refresh
                </button>
              )}
            </div>
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

