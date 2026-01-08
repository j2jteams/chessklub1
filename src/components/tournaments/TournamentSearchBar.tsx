'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { EventData } from '@/lib/types';
import { getAllChessCountries, getAllChessCities } from '@/lib/chessCountries';

interface TournamentSearchBarProps {
  onSearch?: (query: string) => void;
  redirectOnSearch?: boolean;
  currentPath?: string;
  initialQuery?: string;
  compact?: boolean; // For header placement
  tournaments?: EventData[]; // For generating search suggestions
}

interface SearchSuggestion {
  text: string;
  type: 'country' | 'city' | 'tournament' | 'timeControl' | 'ratingType';
  icon?: string;
}

export default function TournamentSearchBar({ 
  onSearch, 
  redirectOnSearch = false, 
  currentPath,
  initialQuery = '',
  compact = false,
  tournaments = []
}: TournamentSearchBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const actualPathname = currentPath || pathname;
  
  const [query, setQuery] = useState(initialQuery);
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize from URL params
  useEffect(() => {
    if (typeof window !== 'undefined' && !initialQuery) {
      const params = new URLSearchParams(window.location.search);
      const searchParam = params.get('search');
      if (searchParam) {
        setQuery(searchParam);
      }
    }
  }, []);
  
  // Update query when initialQuery changes (e.g., when cleared externally)
  // Use a ref to track previous initialQuery to only update when it actually changes
  const prevInitialQueryRef = useRef(initialQuery);
  useEffect(() => {
    // Only update if initialQuery actually changed (not just on every render)
    if (prevInitialQueryRef.current !== initialQuery) {
      prevInitialQueryRef.current = initialQuery;
      // Only update query if it's different and user isn't actively typing
      // Check if input is not focused to avoid interrupting typing
      if (initialQuery !== query && !isFocused) {
        setQuery(initialQuery);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]); // Only depend on initialQuery, not query or isFocused

  // Generate search suggestions based on query
  const generateSuggestions = useCallback((searchQuery: string): SearchSuggestion[] => {
    if (!searchQuery.trim() || searchQuery.length < 2) return [];
    
    const queryLower = searchQuery.toLowerCase().trim();
    const suggestions: SearchSuggestion[] = [];
    
    // Country suggestions
    const countries = getAllChessCountries();
    const matchingCountries = countries
      .filter(country => country.toLowerCase().includes(queryLower))
      .slice(0, 3)
      .map(country => ({
        text: country,
        type: 'country' as const,
        icon: '🌍'
      }));
    suggestions.push(...matchingCountries);
    
    // City suggestions
    const cities = getAllChessCities();
    const matchingCities = cities
      .filter(city => city.toLowerCase().includes(queryLower))
      .slice(0, 3)
      .map(city => ({
        text: city,
        type: 'city' as const,
        icon: '🏙️'
      }));
    suggestions.push(...matchingCities);
    
    // Tournament title suggestions
    if (tournaments.length > 0) {
      const matchingTournaments = tournaments
        .filter(t => {
          const title = (t.title || t.name || '').toLowerCase();
          return title.includes(queryLower);
        })
        .slice(0, 3)
        .map(t => ({
          text: t.title || t.name || '',
          type: 'tournament' as const,
          icon: '♟️'
        }));
      suggestions.push(...matchingTournaments);
    }
    
    // Time control suggestions
    const timeControls = ['Classical', 'Rapid', 'Blitz', 'Bullet'];
    const matchingTimeControls = timeControls
      .filter(tc => tc.toLowerCase().includes(queryLower))
      .slice(0, 2)
      .map(tc => ({
        text: `${tc} tournaments`,
        type: 'timeControl' as const,
        icon: '⏱️'
      }));
    suggestions.push(...matchingTimeControls);
    
    // Rating type suggestions
    const ratingTypes = ['FIDE', 'USCF', 'Club'];
    const matchingRatings = ratingTypes
      .filter(rt => rt.toLowerCase().includes(queryLower))
      .slice(0, 2)
      .map(rt => ({
        text: `${rt} Rated`,
        type: 'ratingType' as const,
        icon: '⭐'
      }));
    suggestions.push(...matchingRatings);
    
    return suggestions.slice(0, 8); // Limit to 8 suggestions
  }, [tournaments]);

  // Update suggestions as user types
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    if (query.trim().length >= 2 && isFocused) {
      debounceTimeoutRef.current = setTimeout(() => {
        const newSuggestions = generateSuggestions(query);
        setSuggestions(newSuggestions);
        setShowSuggestions(newSuggestions.length > 0);
        setSelectedIndex(-1);
      }, 200); // 200ms debounce
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
    
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, isFocused]); // Removed generateSuggestions from deps to prevent infinite loop

  // Handle search submission - use useCallback to prevent infinite loops
  const handleSearch = useCallback((searchQuery?: string) => {
    const queryToSearch = searchQuery || query.trim();
    
    // Prevent duplicate calls with the same query
    if (queryToSearch === initialQuery && queryToSearch === query) {
      return;
    }
    
    // Update local state
    setQuery(queryToSearch);
    setShowSuggestions(false);
    setIsFocused(false);
    
    // Call onSearch callback FIRST to update parent state
    if (onSearch) {
      onSearch(queryToSearch);
    }

    // Build URL with search parameter only (location handled by filters)
    const params = new URLSearchParams();
    if (queryToSearch) {
      params.set('search', queryToSearch);
    }
    
    const queryString = params.toString();
    
    if (redirectOnSearch || actualPathname !== '/tournaments') {
      // Redirect to tournaments page with search params
      router.push(`/tournaments${queryString ? `?${queryString}` : ''}`);
    } else {
      // Update URL in place
      router.replace(`/tournaments${queryString ? `?${queryString}` : ''}`, { scroll: false });
    }
  }, [query, onSearch, redirectOnSearch, actualPathname, router]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        // Use selected suggestion
        const selectedSuggestion = suggestions[selectedIndex];
        handleSearch(selectedSuggestion.text);
      } else {
        handleSearch();
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (showSuggestions && suggestions.length > 0) {
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedIndex(-1);
      searchInputRef.current?.blur();
    }
  };

  // Clear search
  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    if (onSearch) {
      onSearch('');
    }
    if (typeof window !== 'undefined' && actualPathname === '/tournaments') {
      const params = new URLSearchParams(window.location.search);
      params.delete('search');
      router.replace(`/tournaments${params.toString() ? `?${params.toString()}` : ''}`, { scroll: false });
    }
    searchInputRef.current?.focus();
  };

  // Handle suggestion click - use onMouseDown to fire before blur
  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    handleSearch(suggestion.text);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(target) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(target)
      ) {
        setShowSuggestions(false);
        setIsFocused(false);
      }
    };

    if (showSuggestions) {
      // Use mousedown to catch clicks before blur
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showSuggestions]);

  return (
    <div className={`w-full ${compact ? 'max-w-5xl' : 'max-w-6xl'} mx-auto relative`}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSearch();
        }}
        className="flex items-center gap-2 sm:gap-3 h-12 sm:h-14 bg-white border border-gray-200 rounded-full px-3 sm:px-4 shadow-sm hover:shadow-md transition-shadow"
      >
        {/* Search Icon */}
        <div className="flex-shrink-0">
          <svg 
            className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Search Input */}
        <input
          ref={searchInputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            // Show suggestions when typing
            if (e.target.value.trim().length >= 2) {
              setIsFocused(true);
            }
          }}
          onFocus={() => {
            setIsFocused(true);
            // Regenerate suggestions when focused
            if (query.trim().length >= 2) {
              const newSuggestions = generateSuggestions(query);
              setSuggestions(newSuggestions);
              setShowSuggestions(newSuggestions.length > 0);
            }
          }}
          onBlur={(e) => {
            // Don't close if clicking on suggestions or search button
            const relatedTarget = e.relatedTarget as HTMLElement;
            const isClickingSuggestion = relatedTarget?.closest('[data-suggestion]');
            const isClickingSearchButton = relatedTarget?.closest('button[type="button"]');
            
            if (!isClickingSuggestion && !isClickingSearchButton) {
              // Delay to allow suggestion clicks
              setTimeout(() => {
                if (document.activeElement !== searchInputRef.current) {
                  setShowSuggestions(false);
                  setIsFocused(false);
                }
              }, 200);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search tournaments, cities, or organizers…"
          className="flex-1 bg-transparent border-none outline-none text-gray-900 placeholder:text-gray-400 text-sm sm:text-base font-medium focus:ring-0 min-w-0"
        />

        {/* Clear button (show when there's text) */}
        {query && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleClear();
            }}
            className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Clear search"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Search Button */}
        <button
          type="submit"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleSearch();
          }}
          className="h-9 sm:h-10 px-4 sm:px-6 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-full transition-colors duration-200 flex items-center justify-center flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:ring-offset-2 focus:ring-offset-white text-sm sm:text-base cursor-pointer"
        >
          <span className="hidden sm:inline">Search</span>
          <svg className="w-4 h-4 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </form>

      {/* Search Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.type}-${suggestion.text}-${index}`}
              type="button"
              data-suggestion
              onMouseDown={(e) => {
                e.preventDefault(); // Prevent input blur
                e.stopPropagation();
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSuggestionClick(suggestion);
              }}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-orange-50 transition-colors cursor-pointer ${
                index === selectedIndex ? 'bg-orange-50' : ''
              } ${index > 0 ? 'border-t border-gray-100' : ''}`}
            >
              <span className="text-lg flex-shrink-0">{suggestion.icon || '🔍'}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {suggestion.text}
                </div>
                <div className="text-xs text-gray-500 capitalize">
                  {suggestion.type === 'country' && 'Country'}
                  {suggestion.type === 'city' && 'City'}
                  {suggestion.type === 'tournament' && 'Tournament'}
                  {suggestion.type === 'timeControl' && 'Time Control'}
                  {suggestion.type === 'ratingType' && 'Rating Type'}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

