'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface SearchBarProps {
  onSearch: (query: string) => void;
  initialQuery?: string;
  redirectOnSearch?: boolean; // If true, redirects to /tournaments on search
  currentPath?: string; // Current pathname to determine if we should update URL
}

export default function SearchBar({ onSearch, initialQuery = '', redirectOnSearch = false, currentPath }: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const [isFocused, setIsFocused] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const actualPathname = currentPath || pathname;
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Initialize query from URL on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && initialQuery) {
      setQuery(initialQuery);
      onSearch(initialQuery);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      onSearch(query);
      
      // Handle redirect to tournaments page if on homepage
      if (redirectOnSearch && query.trim()) {
        router.push(`/tournaments?search=${encodeURIComponent(query.trim())}`);
        return;
      }
      
      // Update URL without page reload (only if on tournaments page)
      if (typeof window !== 'undefined' && actualPathname === '/tournaments') {
        const params = new URLSearchParams(window.location.search);
        if (query.trim()) {
          params.set('search', query.trim());
        } else {
          params.delete('search');
        }
        const newUrl = `${actualPathname}${params.toString() ? `?${params.toString()}` : ''}`;
        router.replace(newUrl, { scroll: false });
      }
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query, actualPathname, router, onSearch, redirectOnSearch]);

  const handleClear = () => {
    setQuery('');
    onSearch('');
    if (typeof window !== 'undefined' && actualPathname === '/tournaments') {
      const params = new URLSearchParams(window.location.search);
      params.delete('search');
      const newUrl = `${actualPathname}${params.toString() ? `?${params.toString()}` : ''}`;
      router.replace(newUrl, { scroll: false });
    }
    inputRef.current?.focus();
  };

  return (
    <div className="relative w-full">
      <div
        className={`relative flex items-center bg-white rounded-lg shadow-md border-2 transition-all ${
          isFocused ? 'border-orange-500 shadow-lg' : 'border-gray-200'
        }`}
      >
        <div className="absolute left-4 flex items-center pointer-events-none">
          <svg
            className="w-5 h-5 text-gray-400"
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
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Search tournaments by name, location, or organizer..."
          className="w-full pl-12 pr-12 py-4 text-gray-900 placeholder-gray-500 bg-transparent border-0 focus:outline-none focus:ring-0 text-lg"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-4 flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Clear search"
          >
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

