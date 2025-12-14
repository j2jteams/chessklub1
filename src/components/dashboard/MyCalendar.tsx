'use client';

import { useState, useMemo } from 'react';
import { EventData } from '@/lib/types';
import Link from 'next/link';

interface MyCalendarProps {
  events: EventData[];
}

export default function MyCalendar({ events }: MyCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get first day of month and number of days
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  // Group events by date
  const eventsByDate = useMemo(() => {
    const grouped: Record<string, EventData[]> = {};
    
    events.forEach((event) => {
      let eventDate: Date;
      
      if (event.category === 'tournament' && event.startDate) {
        eventDate = event.startDate instanceof Date 
          ? event.startDate 
          : new Date(event.startDate);
      } else {
        eventDate = new Date(event.date);
      }
      
      const dateKey = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, '0')}-${String(eventDate.getDate()).padStart(2, '0')}`;
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(event);
    });
    
    return grouped;
  }, [events]);

  // Get events for a specific date
  const getEventsForDate = (day: number): EventData[] => {
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return eventsByDate[dateKey] || [];
  };

  // Navigate months
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Check if date is today
  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };

  // Check if date is in the past
  const isPastDate = (day: number) => {
    const date = new Date(year, month, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-900">My Calendar</h2>
        <p className="text-sm text-gray-500 mt-1">View your registered events</p>
      </div>

      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={goToPreviousMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
          aria-label="Previous month"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-slate-900">
            {monthNames[month]} {year}
          </h3>
          <button
            onClick={goToToday}
            className="px-3 py-1 text-sm text-[#FF7A00] hover:bg-orange-50 rounded-lg transition"
          >
            Today
          </button>
        </div>
        
        <button
          onClick={goToNextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
          aria-label="Next month"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {/* Day Headers */}
        {dayNames.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-semibold text-gray-500 py-2"
          >
            {day}
          </div>
        ))}

        {/* Empty cells for days before month starts */}
        {Array.from({ length: startingDayOfWeek }).map((_, index) => (
          <div key={`empty-${index}`} className="aspect-square" />
        ))}

        {/* Calendar Days */}
        {Array.from({ length: daysInMonth }).map((_, index) => {
          const day = index + 1;
          const dayEvents = getEventsForDate(day);
          const hasEvents = dayEvents.length > 0;
          const today = isToday(day);
          const past = isPastDate(day);

          return (
            <div
              key={day}
              className={`aspect-square border border-gray-200 rounded-lg p-1 transition ${
                today
                  ? 'bg-[#FF7A00] text-white border-[#FF7A00]'
                  : hasEvents
                  ? 'bg-orange-50 border-orange-300 hover:bg-orange-100'
                  : past
                  ? 'bg-gray-50 text-gray-400'
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex flex-col h-full">
                <div className={`text-xs font-medium ${today ? 'text-white' : 'text-gray-700'}`}>
                  {day}
                </div>
                {hasEvents && (
                  <div className="mt-auto">
                    <div className="flex items-center gap-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        today ? 'bg-white' : 'bg-[#FF7A00]'
                      }`} />
                      <span className={`text-[10px] font-semibold ${
                        today ? 'text-white' : 'text-[#FF7A00]'
                      }`}>
                        {dayEvents.length}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Events List for Selected Month */}
      {events.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">
            Events in {monthNames[month]}
          </h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {events
              .filter((event) => {
                let eventDate: Date;
                if (event.category === 'tournament' && event.startDate) {
                  eventDate = event.startDate instanceof Date 
                    ? event.startDate 
                    : new Date(event.startDate);
                } else {
                  eventDate = new Date(event.date);
                }
                return eventDate.getMonth() === month && eventDate.getFullYear() === year;
              })
              .sort((a, b) => {
                const dateA = a.startDate instanceof Date ? a.startDate : new Date(a.startDate || a.date);
                const dateB = b.startDate instanceof Date ? b.startDate : new Date(b.startDate || b.date);
                return dateA.getTime() - dateB.getTime();
              })
              .map((event) => {
                const eventDate = event.startDate instanceof Date 
                  ? event.startDate 
                  : new Date(event.startDate || event.date);
                const dateStr = eventDate.toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                });
                
                return (
                  <Link
                    key={event.id}
                    href={`/events/${event.id}`}
                    className="block p-3 border border-gray-200 rounded-lg hover:border-[#FF7A00] hover:bg-orange-50 transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-1">{dateStr}</p>
                        <h5 className="text-sm font-semibold text-slate-900">{event.title}</h5>
                        {event.venue || event.location ? (
                          <p className="text-xs text-gray-500 mt-1">
                            📍 {event.venue || event.location}
                          </p>
                        ) : null}
                      </div>
                      <span className="text-xs font-semibold text-[#FF7A00] ml-2">
                        {event.price || 'Free'}
                      </span>
                    </div>
                  </Link>
                );
              })}
          </div>
        </div>
      )}

      {events.length === 0 && (
        <div className="text-center py-8 text-gray-500 text-sm">
          No registered events this month
        </div>
      )}
    </div>
  );
}




