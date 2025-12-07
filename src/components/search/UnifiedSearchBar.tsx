'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';

interface UnifiedSearchBarProps {
  searchQuery?: string;
  locationQuery?: string;
  onSearch?: (search: string, location: string) => void;
  redirectOnSearch?: boolean;
  currentPath?: string;
}

export default function UnifiedSearchBar({
  searchQuery: initialSearch = '',
  locationQuery: initialLocation = '',
  onSearch,
  redirectOnSearch = false,
  currentPath
}: UnifiedSearchBarProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [locationQuery, setLocationQuery] = useState(initialLocation);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);

  const handleSearch = () => {
    const search = searchQuery.trim();
    const location = locationQuery.trim();

    if (onSearch) {
      onSearch(search, location);
    }

    // Build URL with search and location parameters
    const params = new URLSearchParams();
    if (search) {
      params.set('search', search);
    }
    if (location) {
      params.set('location', location);
    }

    const queryString = params.toString();
    const path = currentPath || '/tournaments';

    if (redirectOnSearch || (typeof window !== 'undefined' && window.location.pathname !== '/tournaments')) {
      router.push(`/tournaments${queryString ? `?${queryString}` : ''}`);
    } else {
      router.replace(`/tournaments${queryString ? `?${queryString}` : ''}`, { scroll: false });
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <>
      {/* Desktop Layout */}
      <div className="hidden md:flex items-center bg-white rounded-full shadow-md h-14 px-4 w-full max-w-3xl mx-auto">
        {/* Search Input Section */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <svg
            className="w-5 h-5 text-gray-500 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Search events"
            className="w-full outline-none bg-transparent text-gray-800 placeholder-gray-500 text-base"
          />
        </div>

        {/* Divider */}
        <div className="border-l border-gray-200 h-8 mx-4 flex-shrink-0"></div>

        {/* Location Input Section */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <svg
            className="w-5 h-5 text-gray-500 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <input
            ref={locationInputRef}
            type="text"
            value={locationQuery}
            onChange={(e) => setLocationQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Location"
            className="w-full outline-none bg-transparent text-gray-800 placeholder-gray-500 text-base"
          />
        </div>

        {/* Search Button */}
        <button
          onClick={handleSearch}
          className="ml-4 h-10 w-10 rounded-full bg-orange-500 hover:bg-orange-600 flex items-center justify-center text-white transition-colors flex-shrink-0"
          aria-label="Search"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </button>
      </div>

      {/* Mobile Layout */}
      <div className="flex flex-col gap-3 md:hidden w-full max-w-md mx-auto">
        {/* Search Input */}
        <div className="flex items-center gap-2 bg-white rounded-full shadow-md h-12 px-4">
          <svg
            className="w-5 h-5 text-gray-500 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Search events"
            className="w-full outline-none bg-transparent text-gray-800 placeholder-gray-500 text-sm"
          />
        </div>

        {/* Location Input */}
        <div className="flex items-center gap-2 bg-white rounded-full shadow-md h-12 px-4">
          <svg
            className="w-5 h-5 text-gray-500 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <input
            ref={locationInputRef}
            type="text"
            value={locationQuery}
            onChange={(e) => setLocationQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Location"
            className="w-full outline-none bg-transparent text-gray-800 placeholder-gray-500 text-sm"
          />
        </div>

        {/* Search Button */}
        <button
          onClick={handleSearch}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-full py-3 font-semibold transition-colors"
        >
          Search
        </button>
      </div>
    </>
  );
}

