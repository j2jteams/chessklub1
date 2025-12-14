'use client';

import { useState, useRef, useEffect } from 'react';
import { TournamentFilters as FilterType } from './FilterPanel';

interface TournamentFiltersProps {
  filters: FilterType;
  onFiltersChange: (filters: FilterType) => void;
  availableCountries: string[];
  availableCities: string[];
}

const TIME_CONTROLS = ['Classical', 'Rapid', 'Blitz', 'Bullet'];
const TOURNAMENT_LEVELS = ['Local', 'Regional', 'National', 'International'];

export default function TournamentFilters({
  filters,
  onFiltersChange,
  availableCountries,
  availableCities,
}: TournamentFiltersProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRefs = {
    type: useRef<HTMLDivElement>(null),
    location: useRef<HTMLDivElement>(null),
    timeControl: useRef<HTMLDivElement>(null),
    level: useRef<HTMLDivElement>(null),
    date: useRef<HTMLDivElement>(null),
    rating: useRef<HTMLDivElement>(null),
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      let clickedOutside = true;
      Object.values(dropdownRefs).forEach((ref) => {
        if (ref.current && ref.current.contains(event.target as Node)) {
          clickedOutside = false;
        }
      });
      if (clickedOutside && openDropdown) {
        setOpenDropdown(null);
      }
    };

    if (openDropdown) {
      // Use setTimeout to avoid closing immediately when opening
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 0);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdown]);

  const toggleDropdown = (name: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setOpenDropdown(openDropdown === name ? null : name);
  };

  const updateFilter = <K extends keyof FilterType>(key: K, value: FilterType[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleArrayFilter = <K extends 'countries' | 'cities' | 'timeControls' | 'tournamentLevels'>(
    key: K,
    value: string
  ) => {
    const current = filters[key] as string[];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    updateFilter(key, updated as FilterType[K]);
  };

  const clearAllFilters = () => {
    onFiltersChange({
      countries: [],
      cities: [],
      dateRange: { start: '', end: '' },
      minRating: null,
      maxRating: null,
      timeControls: [],
      tournamentLevels: [],
      priceRange: { min: null, max: null },
      fideRatedOnly: false,
      hasPrizeFund: false,
      registrationOpen: false,
    });
  };

  const activeFilterCount =
    filters.countries.length +
    filters.cities.length +
    (filters.dateRange.start ? 1 : 0) +
    (filters.dateRange.end ? 1 : 0) +
    filters.timeControls.length +
    filters.tournamentLevels.length +
    (filters.minRating !== null ? 1 : 0) +
    (filters.maxRating !== null ? 1 : 0) +
    (filters.priceRange.min !== null ? 1 : 0) +
    (filters.priceRange.max !== null ? 1 : 0) +
    (filters.fideRatedOnly ? 1 : 0) +
    (filters.hasPrizeFund ? 1 : 0) +
    (filters.registrationOpen ? 1 : 0);

  const getDisplayText = (type: string) => {
    switch (type) {
      case 'type':
        return filters.tournamentLevels.length > 0
          ? filters.tournamentLevels.length === 1
            ? filters.tournamentLevels[0]
            : `${filters.tournamentLevels.length} selected`
          : 'All types';
      case 'location':
        if (filters.countries.length > 0) {
          return filters.countries.length === 1 ? filters.countries[0] : `${filters.countries.length} countries`;
        }
        if (filters.cities.length > 0) {
          return filters.cities.length === 1 ? filters.cities[0] : `${filters.cities.length} cities`;
        }
        return 'Worldwide';
      case 'timeControl':
        return filters.timeControls.length > 0
          ? filters.timeControls.length === 1
            ? filters.timeControls[0]
            : `${filters.timeControls.length} selected`
          : 'All controls';
      case 'level':
        return filters.tournamentLevels.length > 0
          ? filters.tournamentLevels.length === 1
            ? filters.tournamentLevels[0]
            : `${filters.tournamentLevels.length} selected`
          : 'All levels';
      case 'date':
        if (filters.dateRange.start && filters.dateRange.end) {
          return `${filters.dateRange.start} - ${filters.dateRange.end}`;
        }
        if (filters.dateRange.start) return `From ${filters.dateRange.start}`;
        if (filters.dateRange.end) return `Until ${filters.dateRange.end}`;
        return 'All dates';
      case 'rating':
        const parts = [];
        if (filters.ratingTypes && filters.ratingTypes.length > 0) {
          parts.push(...filters.ratingTypes);
        }
        if (filters.fideRatedOnly && !parts.includes('FIDE')) parts.push('FIDE'); // Legacy support
        if (parts.length === 0) return 'All ratings';
        return parts.join(', ');
      default:
        return '';
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Tournament Type/Level Dropdown */}
      <div className="relative" ref={dropdownRefs.level}>
        <button
          onClick={(e) => toggleDropdown('level', e)}
          className={`flex items-center gap-2 px-4 py-2.5 bg-white border-2 rounded-lg font-medium text-gray-700 hover:border-orange-400 transition-colors ${
            filters.tournamentLevels.length > 0 ? 'border-orange-500 bg-orange-50' : 'border-gray-200'
          }`}
        >
          <span>{getDisplayText('level')}</span>
          <svg
            className={`w-4 h-4 transition-transform ${openDropdown === 'level' ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {openDropdown === 'level' && (
          <div 
            className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-50 py-2 max-h-64 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {TOURNAMENT_LEVELS.map((level) => (
              <label
                key={level}
                className="flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={filters.tournamentLevels.includes(level)}
                  onChange={() => toggleArrayFilter('tournamentLevels', level)}
                  className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                />
                <span className="ml-3 text-sm text-gray-700">{level}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Location Dropdown */}
      <div className="relative" ref={dropdownRefs.location}>
        <button
          onClick={(e) => toggleDropdown('location', e)}
          className={`flex items-center gap-2 px-4 py-2.5 bg-white border-2 rounded-lg font-medium text-gray-700 hover:border-orange-400 transition-colors ${
            filters.countries.length > 0 || filters.cities.length > 0
              ? 'border-orange-500 bg-orange-50'
              : 'border-gray-200'
          }`}
        >
          <span>{getDisplayText('location')}</span>
          <svg
            className={`w-4 h-4 transition-transform ${openDropdown === 'location' ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {openDropdown === 'location' && (
          <div 
            className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50 py-2 max-h-96 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-2 border-b border-gray-200">
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Country</h3>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {availableCountries.length > 0 ? (
                  availableCountries.map((country) => (
                    <label
                      key={country}
                      className="flex items-center px-2 py-1.5 hover:bg-gray-50 cursor-pointer rounded"
                    >
                      <input
                        type="checkbox"
                        checked={filters.countries.includes(country)}
                        onChange={() => toggleArrayFilter('countries', country)}
                        className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{country}</span>
                    </label>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 px-2">No countries available</p>
                )}
              </div>
            </div>
            <div className="px-4 py-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">City</h3>
              <input
                type="text"
                placeholder="Search city..."
                value={filters.cities.join(', ')}
                onChange={(e) => {
                  const cities = e.target.value.split(',').map((c) => c.trim()).filter(Boolean);
                  updateFilter('cities', cities);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Time Control Dropdown */}
      <div className="relative" ref={dropdownRefs.timeControl}>
        <button
          onClick={(e) => toggleDropdown('timeControl', e)}
          className={`flex items-center gap-2 px-4 py-2.5 bg-white border-2 rounded-lg font-medium text-gray-700 hover:border-orange-400 transition-colors ${
            filters.timeControls.length > 0 ? 'border-orange-500 bg-orange-50' : 'border-gray-200'
          }`}
        >
          <span>{getDisplayText('timeControl')}</span>
          <svg
            className={`w-4 h-4 transition-transform ${openDropdown === 'timeControl' ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {openDropdown === 'timeControl' && (
          <div 
            className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-50 py-2 max-h-64 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {TIME_CONTROLS.map((control) => (
              <label
                key={control}
                className="flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={filters.timeControls.includes(control)}
                  onChange={() => toggleArrayFilter('timeControls', control)}
                  className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                />
                <span className="ml-3 text-sm text-gray-700">{control}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Date Range Dropdown with Calendar */}
      <div className="relative" ref={dropdownRefs.date}>
        <button
          onClick={(e) => toggleDropdown('date', e)}
          className={`flex items-center gap-2 px-4 py-2.5 bg-white border-2 rounded-lg font-medium text-gray-700 hover:border-orange-400 transition-colors ${
            filters.dateRange.start || filters.dateRange.end
              ? 'border-orange-500 bg-orange-50'
              : 'border-gray-200'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{getDisplayText('date')}</span>
          <svg
            className={`w-4 h-4 transition-transform ${openDropdown === 'date' ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {openDropdown === 'date' && (
          <div 
            className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 z-50 p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Start Date Calendar */}
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-700 mb-2 text-center">
                  Select Start Date
                </label>
                <input
                  type="date"
                  value={filters.dateRange.start}
                  onChange={(e) =>
                    updateFilter('dateRange', { ...filters.dateRange, start: e.target.value })
                  }
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all cursor-pointer"
                />
              </div>
              
              {/* Arrow Separator */}
              {(filters.dateRange.start || filters.dateRange.end) && (
                <div className="flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              )}

              {/* End Date Calendar */}
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-700 mb-2 text-center">
                  Select End Date
                </label>
                <input
                  type="date"
                  value={filters.dateRange.end}
                  onChange={(e) =>
                    updateFilter('dateRange', { ...filters.dateRange, end: e.target.value })
                  }
                  min={filters.dateRange.start || undefined}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all cursor-pointer"
                />
              </div>
            </div>
            
            {/* Quick Date Options */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    const today = new Date();
                    const nextWeek = new Date(today);
                    nextWeek.setDate(today.getDate() + 7);
                    updateFilter('dateRange', {
                      start: today.toISOString().split('T')[0],
                      end: nextWeek.toISOString().split('T')[0],
                    });
                  }}
                  className="px-3 py-1.5 text-xs font-medium bg-gray-100 hover:bg-orange-100 text-gray-700 rounded-md transition-colors"
                >
                  Next 7 days
                </button>
                <button
                  onClick={() => {
                    const today = new Date();
                    const nextMonth = new Date(today);
                    nextMonth.setMonth(today.getMonth() + 1);
                    updateFilter('dateRange', {
                      start: today.toISOString().split('T')[0],
                      end: nextMonth.toISOString().split('T')[0],
                    });
                  }}
                  className="px-3 py-1.5 text-xs font-medium bg-gray-100 hover:bg-orange-100 text-gray-700 rounded-md transition-colors"
                >
                  Next 30 days
                </button>
                <button
                  onClick={() => {
                    const today = new Date();
                    const next3Months = new Date(today);
                    next3Months.setMonth(today.getMonth() + 3);
                    updateFilter('dateRange', {
                      start: today.toISOString().split('T')[0],
                      end: next3Months.toISOString().split('T')[0],
                    });
                  }}
                  className="px-3 py-1.5 text-xs font-medium bg-gray-100 hover:bg-orange-100 text-gray-700 rounded-md transition-colors"
                >
                  Next 3 months
                </button>
                <button
                  onClick={() => {
                    updateFilter('dateRange', { start: '', end: '' });
                  }}
                  className="px-3 py-1.5 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
                >
                  Clear dates
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Rating Filter Dropdown */}
      <div className="relative" ref={dropdownRefs.rating}>
        <button
          onClick={(e) => toggleDropdown('rating', e)}
          className={`flex items-center gap-2 px-4 py-2.5 bg-white border-2 rounded-lg font-medium text-gray-700 hover:border-orange-400 transition-colors ${
            (filters.ratingTypes && filters.ratingTypes.length > 0) || filters.fideRatedOnly
              ? 'border-orange-500 bg-orange-50'
              : 'border-gray-200'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
          <span>{getDisplayText('rating')}</span>
          <svg
            className={`w-4 h-4 transition-transform ${openDropdown === 'rating' ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {openDropdown === 'rating' && (
          <div 
            className="absolute top-full left-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-4">
              {/* Rating Type Checkboxes */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Rating Type</h3>
                <div className="space-y-2">
                  {['FIDE', 'USCF', 'Club'].map((ratingType) => (
                    <label key={ratingType} className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer rounded">
                      <input
                        type="checkbox"
                        checked={filters.ratingTypes?.includes(ratingType) || false}
                        onChange={(e) => {
                          const currentTypes = filters.ratingTypes || [];
                          const updated = e.target.checked
                            ? [...currentTypes, ratingType]
                            : currentTypes.filter(t => t !== ratingType);
                          updateFilter('ratingTypes', updated);
                        }}
                        className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      />
                      <span className="ml-3 text-sm text-gray-700 font-medium">{ratingType} Rated</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Clear Button */}
              <div className="pt-3 border-t border-gray-200">
                <button
                  onClick={() => {
                    updateFilter('ratingTypes', []);
                    // Also clear legacy fields
                    updateFilter('fideRatedOnly', false);
                  }}
                  className="w-full px-3 py-1.5 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Clear Filters Button */}
      {activeFilterCount > 0 && (
        <button
          onClick={clearAllFilters}
          className="flex items-center gap-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 border-2 border-gray-200 rounded-lg font-medium text-gray-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span>Clear ({activeFilterCount})</span>
        </button>
      )}
    </div>
  );
}

