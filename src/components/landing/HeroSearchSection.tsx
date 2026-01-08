'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface ParsedQuery {
  textQuery: string;
  locationQuery: string;
  dateQuery: string;
  timeControl: string | null;
}

export default function HeroSearchSection() {
  const router = useRouter();
  const [singleQuery, setSingleQuery] = useState('');

  // Smart parsing function
  const parseSingleQuery = (query: string): ParsedQuery => {
    const lowerQuery = query.toLowerCase().trim();
    let textQuery = query;
    let locationQuery = '';
    let dateQuery = '';
    let timeControl: string | null = null;

    // Extract time control keywords
    const timeControlKeywords = {
      blitz: 'Blitz',
      rapid: 'Rapid',
      classical: 'Classical',
      bullet: 'Bullet',
    };

    for (const [keyword, value] of Object.entries(timeControlKeywords)) {
      if (lowerQuery.includes(keyword)) {
        timeControl = value;
        textQuery = textQuery.replace(new RegExp(keyword, 'gi'), '').trim();
        break;
      }
    }

    // Extract date patterns
    const datePatterns = [
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/, // mm/dd/yyyy
      /(\d{1,2})\/(\d{1,2})/, // mm/dd
      /\b(today|tomorrow|this weekend|next weekend|weekend)\b/i,
    ];

    for (const pattern of datePatterns) {
      const match = query.match(pattern);
      if (match) {
        if (match[0].toLowerCase() === 'today') {
          dateQuery = new Date().toISOString().split('T')[0];
        } else if (match[0].toLowerCase() === 'tomorrow') {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          dateQuery = tomorrow.toISOString().split('T')[0];
        } else if (match[0].toLowerCase().includes('weekend')) {
          // Set to next Saturday
          const today = new Date();
          const dayOfWeek = today.getDay();
          const daysUntilSaturday = (6 - dayOfWeek + 7) % 7 || 7;
          const saturday = new Date(today);
          saturday.setDate(today.getDate() + daysUntilSaturday);
          dateQuery = saturday.toISOString().split('T')[0];
        } else if (match[1] && match[2]) {
          // Date format detected
          const month = parseInt(match[1]);
          const day = parseInt(match[2]);
          const year = match[3] ? parseInt(match[3]) : new Date().getFullYear();
          const parsedDate = new Date(year, month - 1, day);
          if (!isNaN(parsedDate.getTime())) {
            dateQuery = parsedDate.toISOString().split('T')[0];
          }
        }
        if (dateQuery) {
          textQuery = textQuery.replace(pattern, '').trim();
        }
        break;
      }
    }

    // If no explicit location in advanced filters, treat remaining text as search + potential location
    // Location extraction is handled by the search backend, so we keep textQuery as-is

    return { textQuery, locationQuery, dateQuery, timeControl };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const params = new URLSearchParams();

    // Parse single query
    const parsed = parseSingleQuery(singleQuery);
    
    if (parsed.textQuery.trim()) params.set('search', parsed.textQuery.trim());
    if (parsed.locationQuery.trim()) params.set('location', parsed.locationQuery.trim());
    if (parsed.dateQuery) {
      params.set('dateStart', parsed.dateQuery);
      params.set('dateEnd', parsed.dateQuery);
    }
    if (parsed.timeControl) {
      params.set('timeControl', parsed.timeControl);
    }

    const query = params.toString();
    router.push(`/tournaments${query ? `?${query}` : ''}`);
  };

  return (
    <section className="relative overflow-hidden bg-slate-950">
      {/* Checkerboard background */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(45deg, rgba(71,85,105,0.7) 25%, transparent 25%, transparent 75%, rgba(71,85,105,0.7) 75%, rgba(71,85,105,0.7)), linear-gradient(45deg, rgba(71,85,105,0.7) 25%, transparent 25%, transparent 75%, rgba(71,85,105,0.7) 75%, rgba(71,85,105,0.7))',
          backgroundSize: '80px 80px',
          backgroundPosition: '0 0, 40px 40px',
        }}
      />

      {/* Dark overlay for readability - lighter to show chessboard */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/35 to-slate-950/50" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
        <div className="max-w-3xl">
          <p className="text-xs sm:text-sm font-semibold tracking-[0.2em] text-orange-400 uppercase mb-4 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
            CHESS TOURNAMENT DISCOVERY PORTAL
          </p>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight drop-shadow-[0_4px_20px_rgba(0,0,0,1)]">
            <span className="block text-white" style={{ textShadow: '0 4px 20px rgba(0,0,0,1), 0 2px 8px rgba(0,0,0,0.8)' }}>Find Chess</span>
            <span className="block text-white" style={{ textShadow: '0 4px 20px rgba(0,0,0,1), 0 2px 8px rgba(0,0,0,0.8)' }}>Tournaments</span>
            <span className="block text-orange-500 mt-2" style={{ textShadow: '0 4px 20px rgba(0,0,0,1), 0 2px 8px rgba(0,0,0,0.8)' }}>Near You</span>
          </h1>

          <p className="mt-4 sm:mt-6 text-base sm:text-lg text-white max-w-xl font-medium" style={{ textShadow: '0 2px 12px rgba(0,0,0,1), 0 1px 4px rgba(0,0,0,0.8)' }}>
            Discover upcoming chess events, register instantly, and compete with players
            across cities and online.
          </p>

          {/* Frosted Glass Search Bar */}
          <form onSubmit={handleSubmit} className="mt-12 sm:mt-14">
            <div className="relative flex items-center gap-2 sm:gap-3 h-12 sm:h-14 bg-slate-800/98 backdrop-blur-xl border border-white/25 rounded-full px-3 sm:px-4 shadow-[0_12px_40px_rgba(0,0,0,0.6),0_2px_0_rgba(255,255,255,0.12)_inset,0_-1px_0_rgba(0,0,0,0.3)_inset]">
              {/* Search Icon */}
              <div className="flex-shrink-0">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              {/* Search Input */}
              <input
                type="text"
                value={singleQuery}
                onChange={(e) => setSingleQuery(e.target.value)}
                placeholder="Search tournaments, cities, or dates…"
                className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-slate-200 text-sm sm:text-base font-medium focus:ring-0 min-w-0"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSubmit(e as any);
                  }
                }}
              />

              {/* Search Button */}
              <button
                type="submit"
                className="h-9 sm:h-10 px-4 sm:px-6 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-full transition-colors duration-200 flex items-center justify-center flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:ring-offset-2 focus:ring-offset-slate-800 text-sm sm:text-base"
              >
                <span className="hidden sm:inline">Search</span>
                <svg className="w-4 h-4 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}


