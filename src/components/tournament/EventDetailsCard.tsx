'use client';

import { EventData } from '@/lib/types';
import LocationMap from '@/components/events/LocationMap';

interface EventDetailsCardProps {
  event: EventData;
}

export default function EventDetailsCard({ event }: EventDetailsCardProps) {
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch {
      return dateStr;
    }
  };

  const getDateDisplay = () => {
    if (event.category === 'tournament' && event.startDate && event.endDate) {
      const startDate = event.startDate instanceof Date ? event.startDate : new Date(event.startDate);
      const endDate = event.endDate instanceof Date ? event.endDate : new Date(event.endDate);
      const startStr = startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      const endStr = endDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      return startStr === endStr ? startStr : `${startStr} - ${endStr}`;
    }
    return formatDate(event.date);
  };

  const getTimeRange = () => {
    if (event.startTime && event.endTime) {
      return `${event.startTime} - ${event.endTime}`;
    }
    return event.time || 'TBA';
  };

  const venue = event.category === 'tournament' && event.venue ? event.venue : event.location;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Date & Time */}
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-[#FF7A00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Date & Time
          </h3>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-[#6A6A6A] mb-1">Date</p>
              <p className="text-base font-medium text-gray-900">{getDateDisplay()}</p>
            </div>

            <div>
              <p className="text-sm text-[#6A6A6A] mb-1">Time Range</p>
              <p className="text-base font-medium text-gray-900">{getTimeRange()}</p>
            </div>

            {event.timeControl && (
              <div>
                <p className="text-sm text-[#6A6A6A] mb-1">Time Control</p>
                <p className="text-base font-medium text-gray-900">{event.timeControl}</p>
              </div>
            )}

            {/* Rounds - can be added to EventData if needed */}
            {event.sections && event.sections.length > 0 && (
              <div>
                <p className="text-sm text-[#6A6A6A] mb-1">Sections</p>
                <p className="text-base font-medium text-gray-900">{event.sections.length} {event.sections.length === 1 ? 'section' : 'sections'}</p>
              </div>
            )}

            {/* Equipment Requirements - placeholder */}
            <div>
              <p className="text-sm text-[#6A6A6A] mb-1">Equipment Requirements</p>
              <p className="text-base font-medium text-gray-900">Chess sets and clocks provided</p>
            </div>
          </div>
        </div>

        {/* Right Column - Location */}
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-[#FF7A00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Location
          </h3>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-[#6A6A6A] mb-1">Venue</p>
              <p className="text-base font-medium text-gray-900">{venue}</p>
            </div>

            {/* Map */}
            <div className="rounded-lg overflow-hidden border border-[#E2E2E2]">
              <LocationMap
                location={event.location}
                venue={event.venue}
                coordinates={event.coordinates}
              />
            </div>

            {/* Google Maps Link */}
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm text-[#FF7A00] hover:text-[#E46800] transition"
            >
              Open in Google Maps →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

