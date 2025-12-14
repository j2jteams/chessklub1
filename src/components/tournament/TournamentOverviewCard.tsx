'use client';

import { EventData, TimeControl } from '@/lib/types';

interface TournamentOverviewCardProps {
  event: EventData;
}

export default function TournamentOverviewCard({ event }: TournamentOverviewCardProps) {
  // Compute time control label with priority: customLabel > format > category
  const tc = event.timeControl;
  const format = (() => {
    if (tc) {
      if (typeof tc === 'object' && 'category' in tc) {
        // New format: TimeControl object
        const timeControl = tc as TimeControl;
        return timeControl.customLabel?.trim() || 
               timeControl.format?.trim() || 
               timeControl.category || 
               'Not specified';
      } else if (typeof tc === 'string') {
        // Legacy format: string
        return tc;
      }
    }
    return 'Not specified';
  })();
  const sections = event.sections?.length || 0;
  const ratingRange = event.minRating || event.maxRating
    ? `${event.minRating ? `U${event.minRating}` : 'Open'}${event.minRating && event.maxRating ? ' - ' : ''}${event.maxRating ? `U${event.maxRating}` : ''}`
    : 'Open';
  const organizer = event.createdByEmail || event.contactEmail;
  const ageLimit = 'All ages'; // Default as per requirements
  const equipmentProvided = 'All chess sets provided'; // Default as per requirements

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
      {event.description && event.description.length > 10 && (
        <p className="text-base text-gray-600 mb-6 line-clamp-2">
          {event.description.substring(0, 150)}...
        </p>
      )}

      {/* Quick Info Grid - Grouped logically */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Column 1 */}
        <div className="space-y-4">
          {/* Format */}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Format</p>
            <p className="text-base font-semibold text-gray-900">{format}</p>
          </div>

          {/* Rating Range */}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Rating Range</p>
            <p className="text-base font-semibold text-gray-900">{ratingRange}</p>
          </div>

          {/* Age Limit */}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Age Limit</p>
            <p className="text-base font-semibold text-gray-900">{ageLimit}</p>
          </div>
        </div>

        {/* Column 2 */}
        <div className="space-y-4">
          {/* Sections */}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Sections</p>
            <p className="text-base font-semibold text-gray-900">
              {sections > 0 ? `${sections} ${sections === 1 ? 'section' : 'sections'}` : 'Will be announced soon'}
            </p>
          </div>

          {/* Organizer */}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Organizer</p>
            {organizer ? (
              <a
                href={`mailto:${organizer}`}
                className="text-base font-semibold text-[#FF7A00] hover:text-[#E46800] transition"
              >
                {organizer}
              </a>
            ) : (
              <p className="text-base font-semibold text-gray-900">Not specified</p>
            )}
          </div>

          {/* Equipment Provided */}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Equipment Provided</p>
            <p className="text-base font-semibold text-gray-900">{equipmentProvided}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

