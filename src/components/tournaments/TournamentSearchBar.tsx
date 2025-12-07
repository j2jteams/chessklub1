'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface TournamentSearchBarProps {
  onSearch?: (query: string) => void;
  redirectOnSearch?: boolean;
  currentPath?: string;
  initialQuery?: string;
  initialLocation?: string;
  compact?: boolean; // For header placement
}

export default function TournamentSearchBar({ 
  onSearch, 
  redirectOnSearch = false, 
  currentPath,
  initialQuery = '',
  initialLocation = '',
  compact = false
}: TournamentSearchBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const actualPathname = currentPath || pathname;
  
  const [query, setQuery] = useState(initialQuery);
  const [location, setLocation] = useState(initialLocation);
  const [isFocused, setIsFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);

  // Initialize from URL params
  useEffect(() => {
    if (typeof window !== 'undefined' && !initialQuery) {
      const params = new URLSearchParams(window.location.search);
      const searchParam = params.get('search');
      const locationParam = params.get('location');
      if (searchParam) {
        setQuery(searchParam);
      }
      if (locationParam) {
        setLocation(locationParam);
      }
    }
  }, []);

  // Handle search submission
  const handleSearch = () => {
    const searchQuery = query.trim();
    const locationQuery = location.trim();
    
    if (onSearch) {
      onSearch(searchQuery);
    }

    // Build URL with search and location parameters
    const params = new URLSearchParams();
    if (searchQuery) {
      params.set('search', searchQuery);
    }
    if (locationQuery) {
      params.set('location', locationQuery);
    }
    
    const queryString = params.toString();
    
    if (redirectOnSearch || actualPathname !== '/tournaments') {
      // Redirect to tournaments page with search params
      router.push(`/tournaments${queryString ? `?${queryString}` : ''}`);
    } else {
      // Update URL in place
      router.replace(`/tournaments${queryString ? `?${queryString}` : ''}`, { scroll: false });
    }
  };

  // Handle Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Clear search
  const handleClear = () => {
    setQuery('');
    setLocation('');
    if (onSearch) {
      onSearch('');
    }
    if (typeof window !== 'undefined' && actualPathname === '/tournaments') {
      const params = new URLSearchParams(window.location.search);
      params.delete('search');
      params.delete('location');
      router.replace(`/tournaments${params.toString() ? `?${params.toString()}` : ''}`, { scroll: false });
    }
    searchInputRef.current?.focus();
  };

  return (
    <div className={`w-full ${compact ? 'max-w-5xl' : 'max-w-6xl'} mx-auto`}>
      <div className="flex items-center bg-white rounded-lg shadow-lg border border-gray-300 hover:border-gray-400 focus-within:border-[#FF7A00] focus-within:ring-2 focus-within:ring-[#FF7A00]/20 transition-all duration-200 overflow-hidden">
        {/* Search Input Section */}
        <div className="flex-1 flex items-center border-r border-gray-300">
          <div className="pl-4 pr-3 flex-shrink-0">
            <svg 
              className="w-5 h-5 text-gray-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyPress={handleKeyPress}
            placeholder="Search events"
            className={`flex-1 ${compact ? 'py-3' : 'py-4'} bg-transparent border-0 focus:outline-none focus:ring-0 text-gray-900 placeholder-gray-500 text-base`}
          />
        </div>

        {/* Location Input Section */}
        <div className="flex items-center border-r border-gray-300 min-w-[200px]">
          <div className="pl-4 pr-3 flex-shrink-0">
            <svg 
              className="w-5 h-5 text-gray-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <input
            ref={locationInputRef}
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyPress={handleKeyPress}
            placeholder="Location"
            className={`flex-1 ${compact ? 'py-3' : 'py-4'} bg-transparent border-0 focus:outline-none focus:ring-0 text-gray-900 placeholder-gray-500 text-base`}
          />
        </div>

        {/* Search Button */}
        <button
          onClick={handleSearch}
          className={`${compact ? 'px-6 py-3' : 'px-8 py-4'} bg-[#FF7A00] hover:bg-[#E46800] text-white font-semibold transition-colors duration-200 flex items-center justify-center`}
        >
          <svg 
            className="w-5 h-5" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

