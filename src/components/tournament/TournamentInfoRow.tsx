'use client';

import ReactCountryFlag from "react-country-flag";

interface TournamentInfoRowProps {
  date?: string;
  location?: string;
  format?: string;
  price: string;
  isOnline?: boolean;
  countryFlag?: string;
  countryCode?: string; // Add countryCode prop as fallback
}

export default function TournamentInfoRow({ date, location, format, price, isOnline = false, countryFlag, countryCode }: TournamentInfoRowProps) {
  const isFree = price === 'Free' || price === '$0';
  
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
      {date && (
        <div className="flex items-center gap-1.5">
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="truncate">{date}</span>
        </div>
      )}
      {location && (
        <div className="flex items-center gap-1.5">
          {isOnline ? (
            <svg className="w-4 h-4 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )}
          <span className="truncate max-w-[120px]">{location}</span>
        </div>
      )}
      {format && (
        <div className="flex items-center gap-1.5">
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{format}</span>
        </div>
      )}
      <div className={`flex items-center gap-1.5 ${isFree ? 'text-green-700' : 'text-orange-700'}`}>
        {!isOnline && countryCode && (
          <ReactCountryFlag
            countryCode={countryCode}
            svg
            style={{
              width: '1.3em',
              height: '1.3em',
              marginRight: '0.25rem',
            }}
            title={countryCode}
          />
        )}
        <span className="text-sm">💰</span>
        <span className={`font-medium ${isFree ? 'text-green-700' : 'text-orange-700'}`}>{price}</span>
      </div>
    </div>
  );
}

