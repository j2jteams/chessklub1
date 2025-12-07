'use client';

import { EventData } from '@/lib/types';

interface TournamentOverviewCardProps {
  event: EventData;
}

export default function TournamentOverviewCard({ event }: TournamentOverviewCardProps) {
  const format = event.timeControl || 'Not specified';
  const sections = event.sections?.length || 0;
  const ratingRange = event.minRating || event.maxRating
    ? `${event.minRating ? `U${event.minRating}` : 'Open'}${event.minRating && event.maxRating ? ' - ' : ''}${event.maxRating ? `U${event.maxRating}` : ''}`
    : 'Open';
  const organizer = event.createdByEmail || 'Not specified';
  const ageLimit = 'All ages'; // Can be added to EventData if needed
  const equipmentProvided = 'Chess sets provided'; // Can be added to EventData if needed

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      {/* Title */}
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-6 h-6 text-[#FF7A00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
        <h2 className="text-2xl font-semibold text-gray-900">Tournament Overview</h2>
      </div>

      {/* Divider */}
      <div className="border-b border-[#E2E2E2] mb-4"></div>

      {/* Summary Text */}
      {event.description && (
        <p className="text-base text-gray-600 mb-6 line-clamp-2">
          {event.description.substring(0, 150)}...
        </p>
      )}

      {/* Quick Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Format */}
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-[#FF7A00] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm text-[#6A6A6A] mb-1">Format</p>
            <p className="text-base font-medium text-gray-900">{format}</p>
          </div>
        </div>

        {/* Sections */}
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-[#FF7A00] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <div>
            <p className="text-sm text-[#6A6A6A] mb-1">Sections</p>
            <p className="text-base font-medium text-gray-900">{sections} {sections === 1 ? 'section' : 'sections'}</p>
          </div>
        </div>

        {/* Rating Range */}
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-[#FF7A00] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <div>
            <p className="text-sm text-[#6A6A6A] mb-1">Rating Range</p>
            <p className="text-base font-medium text-gray-900">{ratingRange}</p>
          </div>
        </div>

        {/* Organizer */}
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-[#FF7A00] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <div>
            <p className="text-sm text-[#6A6A6A] mb-1">Organizer</p>
            <p className="text-base font-medium text-gray-900">{organizer}</p>
          </div>
        </div>

        {/* Age Limit */}
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-[#FF7A00] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <div>
            <p className="text-sm text-[#6A6A6A] mb-1">Age Limit</p>
            <p className="text-base font-medium text-gray-900">{ageLimit}</p>
          </div>
        </div>

        {/* Equipment Provided */}
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-[#FF7A00] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <div>
            <p className="text-sm text-[#6A6A6A] mb-1">Equipment Provided</p>
            <p className="text-base font-medium text-gray-900">{equipmentProvided}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

