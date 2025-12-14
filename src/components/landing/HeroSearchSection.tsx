'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function HeroSearchSection() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (location) params.set('location', location);
    if (date) {
      // Try to parse date and set dateStart/dateEnd if it's a range
      const dateParts = date.split(' - ');
      if (dateParts.length === 2) {
        params.set('dateStart', dateParts[0].trim());
        params.set('dateEnd', dateParts[1].trim());
      } else {
        params.set('dateStart', date.trim());
      }
    }
    router.push(`/tournaments?${params.toString()}`);
  };

  return (
    <section 
      className="relative overflow-hidden py-20 md:py-28"
      style={{
        background: 'linear-gradient(to bottom right, #020617, #0f172a, #020617)'
      }}
    >
      {/* Uniform Premium Chessboard Pattern */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(45deg, rgba(255,255,255,0.1) 25%, transparent 25%),
            linear-gradient(-45deg, rgba(255,255,255,0.1) 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.1) 75%),
            linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.1) 75%)
          `,
          backgroundSize: '100px 100px',
          backgroundPosition: '0 0, 0 50px, 50px -50px, -50px 0px',
          opacity: 1
        }}
      />
      
      {/* Additional subtle diagonal texture overlay - uniform across entire section */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
          opacity: 1
        }}
      />

      {/* Visible Glow Effects */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" style={{ opacity: 1 }}></div>
      <div className="absolute bottom-1/4 left-1/4 w-72 h-72 bg-orange-400/10 rounded-full blur-3xl" style={{ opacity: 1 }}></div>
      
      {/* Fine-grained Chess Pieces - Uniform Premium Design */}
      {/* Left Side - Subtle and consistent */}
      <div className="absolute left-8 top-1/4 w-14 h-14" style={{ opacity: 0.12, fill: 'rgba(255,255,255,0.12)' }}>
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path d="M50 10 L60 20 L55 25 L50 20 L45 25 L40 20 Z M50 20 L50 30 L45 35 L55 35 L50 30 Z M45 35 L45 50 L55 50 L55 35 Z M40 50 L60 50 L65 60 L35 60 Z" />
        </svg>
      </div>
      <div className="absolute left-12 top-1/2 w-10 h-10" style={{ opacity: 0.1, fill: 'rgba(255,255,255,0.1)' }}>
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="50" cy="20" r="8" />
          <path d="M50 28 L45 40 L55 40 Z M40 40 L60 40 L65 50 L35 50 Z" />
        </svg>
      </div>
      <div className="absolute left-16 bottom-1/3 w-12 h-12" style={{ opacity: 0.11, fill: 'rgba(255,255,255,0.11)' }}>
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="50" cy="30" r="12" />
          <path d="M40 42 L60 42 L65 60 L35 60 Z" />
        </svg>
      </div>
      <div className="absolute left-6 top-3/4 w-9 h-9" style={{ opacity: 0.09, fill: 'rgba(255,255,255,0.09)' }}>
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <rect x="45" y="20" width="10" height="25" rx="2" />
          <rect x="43" y="20" width="14" height="4" rx="1" />
        </svg>
      </div>
      
      {/* Right Side - Subtle and consistent */}
      <div className="absolute right-8 top-1/3 w-14 h-14" style={{ opacity: 0.12, fill: 'rgba(255,255,255,0.12)' }}>
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path d="M50 10 L60 20 L55 25 L50 20 L45 25 L40 20 Z M50 20 L50 30 L45 35 L55 35 L50 30 Z M45 35 L45 50 L55 50 L55 35 Z M40 50 L60 50 L65 60 L35 60 Z" />
        </svg>
      </div>
      <div className="absolute right-12 top-2/3 w-10 h-10" style={{ opacity: 0.1, fill: 'rgba(255,255,255,0.1)' }}>
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path d="M50 15 L55 20 L52 25 L48 25 L45 20 Z M50 25 L50 35 L48 40 L52 40 Z M48 40 L48 50 L52 50 L52 40 Z M45 50 L55 50 L58 58 L42 58 Z" />
        </svg>
      </div>
      <div className="absolute right-16 bottom-1/4 w-12 h-12" style={{ opacity: 0.11, fill: 'rgba(255,255,255,0.11)' }}>
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="50" cy="30" r="12" />
          <path d="M40 42 L60 42 L65 60 L35 60 Z" />
        </svg>
      </div>
      <div className="absolute right-6 top-1/5 w-9 h-9" style={{ opacity: 0.09, fill: 'rgba(255,255,255,0.09)' }}>
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <rect x="45" y="20" width="10" height="25" rx="2" />
          <rect x="43" y="20" width="14" height="4" rx="1" />
        </svg>
      </div>
      <div className="absolute right-10 bottom-1/3 w-10 h-10" style={{ opacity: 0.1, fill: 'rgba(255,255,255,0.1)' }}>
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="50" cy="20" r="6" />
          <path d="M50 26 L45 35 L55 35 Z M40 35 L60 35 L65 45 L35 45 Z" />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Tagline */}
          <p className="mb-6 text-sm font-semibold text-orange-400 uppercase tracking-widest" style={{ color: '#fb923c' }}>
            Chess Tournament Discovery Portal
          </p>

          {/* Main Headline */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight" style={{ color: '#ffffff' }}>
            Find Chess Tournaments
            <span className="block mt-3" style={{ color: '#f97316' }}>Near You</span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl mb-12 max-w-2xl mx-auto leading-relaxed" style={{ color: '#d1d5db' }}>
            Discover upcoming chess events, register instantly, and compete with players of all levels.
          </p>

          {/* Enhanced Search Bar */}
          <form onSubmit={handleSearch} className="mb-8">
            <div className="bg-white rounded-2xl shadow-2xl p-2 flex flex-col md:flex-row gap-2 border border-gray-200/50" style={{ backgroundColor: '#ffffff' }}>
              {/* Search Input */}
              <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl">
                <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search tournaments"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 w-full bg-transparent border-none outline-none text-gray-900 placeholder-gray-500 text-base font-medium"
                />
              </div>
              
              {/* Location Input */}
              <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl">
                <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="flex-1 w-full bg-transparent border-none outline-none text-gray-900 placeholder-gray-500 text-base font-medium"
                />
              </div>
              
              {/* Date Input */}
              <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl">
                <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <input
                  type="text"
                  placeholder="Any date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="flex-1 w-full bg-transparent border-none outline-none text-gray-900 placeholder-gray-500 text-base font-medium"
                />
              </div>

              {/* Search Button */}
              <button
                type="submit"
                className="px-8 py-3 font-bold rounded-xl hover:bg-orange-600 transition-all shadow-lg hover:shadow-xl text-base whitespace-nowrap"
                style={{ backgroundColor: '#f97316', color: '#ffffff' }}
              >
                Search
              </button>
            </div>
          </form>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/tournaments"
              className="w-full sm:w-auto px-8 py-4 font-bold rounded-xl hover:bg-orange-600 transition-all shadow-lg hover:shadow-xl text-base text-center"
              style={{ backgroundColor: '#f97316', color: '#ffffff' }}
            >
              Browse All Tournaments
            </Link>
            <button
              disabled
              className="w-full sm:w-auto px-8 py-4 bg-transparent border-2 font-semibold rounded-xl cursor-not-allowed text-base"
              style={{ borderColor: '#4b5563', color: '#9ca3af' }}
            >
              View Results <span className="text-xs ml-1 opacity-75">(Coming Soon)</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
