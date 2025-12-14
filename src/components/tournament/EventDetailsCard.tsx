'use client';

import { EventData, TimeControl } from '@/lib/types';
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

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    // If it's already formatted (e.g., "9:56 PM"), return as is
    if (timeStr.includes('AM') || timeStr.includes('PM')) return timeStr;
    // Otherwise try to format it
    try {
      const [hours, minutes] = timeStr.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes || '00'} ${ampm}`;
    } catch {
      return timeStr;
    }
  };

  const getDateDisplay = () => {
    if (event.category === 'tournament' && event.startDate) {
      const startDate = event.startDate instanceof Date ? event.startDate : new Date(event.startDate);
      return formatDate(startDate.toISOString());
    }
    return formatDate(event.date);
  };

  const getTimeRange = () => {
    if (event.startTime && event.endTime) {
      return `${formatTime(event.startTime)} – ${formatTime(event.endTime)}`;
    }
    if (event.time) {
      return event.time;
    }
    return 'TBA';
  };

  const venue = event.category === 'tournament' && event.venue ? event.venue : event.location;
  // Default to In-person if coordinates or venue exists, otherwise Online
  const hasLocation = event.coordinates || event.venue || (event.location && !event.location.toLowerCase().includes('online'));
  const venueType = event.venueType || (hasLocation ? 'In-person' : 'Online');
  const isOnline = venueType === 'Online' || !hasLocation;

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

            {(() => {
              // Compute time control label with priority: customLabel > format > category
              const tc = event.timeControl;
              const timeControlLabel = (() => {
                if (tc) {
                  if (typeof tc === 'object' && 'category' in tc) {
                    // New format: TimeControl object
                    const timeControl = tc as TimeControl;
                    return timeControl.customLabel?.trim() || 
                           timeControl.format?.trim() || 
                           timeControl.category || 
                           null;
                  } else if (typeof tc === 'string') {
                    // Legacy format: string
                    return tc;
                  }
                }
                return null;
              })();
              
              return timeControlLabel ? (
                <div>
                  <p className="text-sm text-[#6A6A6A] mb-1">Time Control</p>
                  <p className="text-base font-medium text-gray-900">{timeControlLabel}</p>
                </div>
              ) : null;
            })()}

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
            {isOnline ? (
              <>
                <div>
                  <p className="text-sm text-[#6A6A6A] mb-1">Mode of Play</p>
                  <p className="text-base font-medium text-gray-900">Online Event</p>
                </div>
                {venue && (
                  <div>
                    <p className="text-sm text-[#6A6A6A] mb-1">Platform/Details</p>
                    <p className="text-base font-medium text-gray-900">{venue}</p>
                  </div>
                )}
              </>
            ) : (
              <>
                <div>
                  <p className="text-sm text-[#6A6A6A] mb-1">Mode of Play</p>
                  <p className="text-base font-medium text-gray-900">In-person</p>
                </div>

                {venue && (
                  <div>
                    <p className="text-sm text-[#6A6A6A] mb-1">Venue/Location</p>
                    <p className="text-base font-medium text-gray-900">{venue}</p>
                  </div>
                )}

                {/* Map - Show for in-person events if we have location data (coordinates or venue/location) */}
                {/* Note: LocationMap component already includes "Open in Google Maps" link */}
                {(event.coordinates || venue || event.location || event.address) && (
                  <div className="rounded-lg overflow-hidden border border-[#E2E2E2]">
                    <LocationMap
                      location={event.address || event.location || ''}
                      venue={event.venue}
                      coordinates={event.coordinates}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

