'use client';

import { useState, useRef, useEffect } from 'react';
import { EventData } from '@/lib/types';

interface AddToCalendarButtonProps {
  tournament: EventData;
}

// Helper function to format dates for calendar (RFC 5545 format)
function formatDateForCalendar(dateString: string | Date): string {
  const date = dateString instanceof Date ? dateString : new Date(dateString);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

// Get Google Calendar URL
function getGoogleCalendarUrl(t: EventData): string {
  const startDate = t.startDate instanceof Date ? t.startDate : new Date(t.startDate || t.date);
  const endDate = t.endDate instanceof Date ? t.endDate : new Date(t.endDate || t.date);
  
  // Add 1 hour to end date if no end date specified
  if (!t.endDate && !t.endTime) {
    endDate.setHours(endDate.getHours() + 1);
  }
  
  const start = formatDateForCalendar(startDate);
  const end = formatDateForCalendar(endDate);
  
  const base = 'https://calendar.google.com/calendar/render';
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: t.title || 'Chess Tournament',
    dates: `${start}/${end}`,
    details: t.description || '',
    location: t.venue || t.location || '',
  });
  
  return `${base}?${params.toString()}`;
}

// Download ICS file
function downloadICS(t: EventData): void {
  const startDate = t.startDate instanceof Date ? t.startDate : new Date(t.startDate || t.date);
  const endDate = t.endDate instanceof Date ? t.endDate : new Date(t.endDate || t.date);
  
  // Add 1 hour to end date if no end date specified
  if (!t.endDate && !t.endTime) {
    endDate.setHours(endDate.getHours() + 1);
  }
  
  const start = formatDateForCalendar(startDate);
  const end = formatDateForCalendar(endDate);
  
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ChessTourneys//Tournament//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `DTSTAMP:${start}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${t.title || 'Chess Tournament'}`,
    t.description ? `DESCRIPTION:${t.description.replace(/\n/g, '\\n')}` : '',
    t.venue || t.location ? `LOCATION:${t.venue || t.location}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n');
  
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = (t.title || 'tournament').replace(/[^a-z0-9]/gi, '_') + '.ics';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function AddToCalendarButton({ tournament }: AddToCalendarButtonProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        className="mt-3 w-full flex items-center justify-center gap-2 rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
        onClick={() => setOpen((prev) => !prev)}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
        Add to Calendar
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-20 mt-2 rounded-lg border border-gray-200 bg-white py-2 text-sm shadow-lg">
          <button
            className="flex w-full items-center px-3 py-2 hover:bg-gray-50 transition"
            onClick={() => {
              window.open(getGoogleCalendarUrl(tournament), '_blank');
              setOpen(false);
            }}
          >
            <svg className="w-4 h-4 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            Google Calendar
          </button>
          <button
            className="flex w-full items-center px-3 py-2 hover:bg-gray-50 transition"
            onClick={() => {
              downloadICS(tournament);
              setOpen(false);
            }}
          >
            <svg className="w-4 h-4 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download .ics
          </button>
        </div>
      )}
    </div>
  );
}

