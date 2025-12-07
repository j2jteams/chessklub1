'use client';

import { useState } from 'react';

export interface TournamentFilters {
  countries: string[];
  cities: string[];
  dateRange: { start: string; end: string };
  minRating: number | null;
  maxRating: number | null;
  timeControls: string[];
  tournamentLevels: string[];
  priceRange: { min: number | null; max: number | null };
  fideRatedOnly: boolean;
  hasPrizeFund: boolean;
  registrationOpen: boolean;
}

interface FilterPanelProps {
  filters: TournamentFilters;
  onFiltersChange: (filters: TournamentFilters) => void;
  availableCountries: string[];
  availableCities: string[];
  isOpen: boolean;
  onToggle: () => void;
}

const TIME_CONTROLS = ['Classical', 'Rapid', 'Blitz', 'Bullet'];
const TOURNAMENT_LEVELS = ['Local', 'Regional', 'National', 'International'];

export default function FilterPanel({
  filters,
  onFiltersChange,
  availableCountries,
  availableCities,
  isOpen,
  onToggle,
}: FilterPanelProps) {
  const [localFilters, setLocalFilters] = useState<TournamentFilters>(filters);

  const updateFilter = <K extends keyof TournamentFilters>(
    key: K,
    value: TournamentFilters[K]
  ) => {
    const updated = { ...localFilters, [key]: value };
    setLocalFilters(updated);
    onFiltersChange(updated);
  };

  const toggleArrayFilter = <K extends 'countries' | 'cities' | 'timeControls' | 'tournamentLevels'>(
    key: K,
    value: string
  ) => {
    const current = localFilters[key] as string[];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    updateFilter(key, updated as TournamentFilters[K]);
  };

  const clearAllFilters = () => {
    const cleared: TournamentFilters = {
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
    };
    setLocalFilters(cleared);
    onFiltersChange(cleared);
  };

  const activeFilterCount =
    localFilters.countries.length +
    localFilters.cities.length +
    (localFilters.dateRange.start ? 1 : 0) +
    (localFilters.dateRange.end ? 1 : 0) +
    (localFilters.minRating !== null ? 1 : 0) +
    (localFilters.maxRating !== null ? 1 : 0) +
    localFilters.timeControls.length +
    localFilters.tournamentLevels.length +
    (localFilters.priceRange.min !== null ? 1 : 0) +
    (localFilters.priceRange.max !== null ? 1 : 0) +
    (localFilters.fideRatedOnly ? 1 : 0) +
    (localFilters.hasPrizeFund ? 1 : 0) +
    (localFilters.registrationOpen ? 1 : 0);

  return (
    <>
      {/* Mobile: Bottom Sheet */}
      <div
        className={`lg:hidden fixed inset-x-0 bottom-0 bg-white rounded-t-xl shadow-2xl z-50 transition-transform duration-300 ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ maxHeight: '90vh' }}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold text-gray-900">Filters</h2>
          <div className="flex items-center gap-2">
            {activeFilterCount > 0 && (
              <span className="px-2 py-1 bg-orange-500 text-white text-xs font-semibold rounded-full">
                {activeFilterCount}
              </span>
            )}
            <button
              onClick={onToggle}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 80px)' }}>
          <FilterContent
            localFilters={localFilters}
            updateFilter={updateFilter}
            toggleArrayFilter={toggleArrayFilter}
            clearAllFilters={clearAllFilters}
            availableCountries={availableCountries}
            availableCities={availableCities}
          />
        </div>
      </div>

      {/* Desktop: Sidebar */}
      <div className="hidden lg:block w-80 flex-shrink-0">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 sticky top-24">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Filters</h2>
            {activeFilterCount > 0 && (
              <>
                <span className="px-2 py-1 bg-orange-500 text-white text-xs font-semibold rounded-full">
                  {activeFilterCount}
                </span>
                <button
                  onClick={clearAllFilters}
                  className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                >
                  Clear all
                </button>
              </>
            )}
          </div>
          <FilterContent
            localFilters={localFilters}
            updateFilter={updateFilter}
            toggleArrayFilter={toggleArrayFilter}
            clearAllFilters={clearAllFilters}
            availableCountries={availableCountries}
            availableCities={availableCities}
          />
        </div>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onToggle}
        />
      )}
    </>
  );
}

interface FilterContentProps {
  localFilters: TournamentFilters;
  updateFilter: <K extends keyof TournamentFilters>(key: K, value: TournamentFilters[K]) => void;
  toggleArrayFilter: <K extends 'countries' | 'cities' | 'timeControls' | 'tournamentLevels'>(
    key: K,
    value: string
  ) => void;
  clearAllFilters: () => void;
  availableCountries: string[];
  availableCities: string[];
}

function FilterContent({
  localFilters,
  updateFilter,
  toggleArrayFilter,
  clearAllFilters,
  availableCountries,
  availableCities,
}: FilterContentProps) {
  return (
    <div className="space-y-6">
      {/* Location Filters */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Location</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {availableCountries.length > 0 ? (
                availableCountries.map((country) => (
                  <label key={country} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={localFilters.countries.includes(country)}
                      onChange={() => toggleArrayFilter('countries', country)}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{country}</span>
                  </label>
                ))
              ) : (
                <p className="text-sm text-gray-500">No countries available</p>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
            <input
              type="text"
              placeholder="Search city..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-orange-500 focus:border-orange-500"
              value={localFilters.cities.join(', ')}
              onChange={(e) => {
                const cities = e.target.value.split(',').map((c) => c.trim()).filter(Boolean);
                updateFilter('cities', cities);
              }}
            />
          </div>
        </div>
      </div>

      {/* Date Range */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Date Range</h3>
        <div className="space-y-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={localFilters.dateRange.start}
              onChange={(e) =>
                updateFilter('dateRange', { ...localFilters.dateRange, start: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={localFilters.dateRange.end}
              onChange={(e) =>
                updateFilter('dateRange', { ...localFilters.dateRange, end: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
        </div>
      </div>

      {/* Rating Range */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Rating</h3>
        <div className="space-y-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Min Rating: {localFilters.minRating ?? 'Any'}
            </label>
            <input
              type="range"
              min="0"
              max="3000"
              step="50"
              value={localFilters.minRating ?? 0}
              onChange={(e) => updateFilter('minRating', e.target.value ? Number(e.target.value) : null)}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Rating: {localFilters.maxRating ?? 'Any'}
            </label>
            <input
              type="range"
              min="0"
              max="3000"
              step="50"
              value={localFilters.maxRating ?? 3000}
              onChange={(e) => updateFilter('maxRating', e.target.value ? Number(e.target.value) : null)}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Time Control */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Time Control</h3>
        <div className="space-y-2">
          {TIME_CONTROLS.map((control) => (
            <label key={control} className="flex items-center">
              <input
                type="checkbox"
                checked={localFilters.timeControls.includes(control)}
                onChange={() => toggleArrayFilter('timeControls', control)}
                className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
              />
              <span className="ml-2 text-sm text-gray-700">{control}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Tournament Level */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Tournament Level</h3>
        <div className="space-y-2">
          {TOURNAMENT_LEVELS.map((level) => (
            <label key={level} className="flex items-center">
              <input
                type="checkbox"
                checked={localFilters.tournamentLevels.includes(level)}
                onChange={() => toggleArrayFilter('tournamentLevels', level)}
                className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
              />
              <span className="ml-2 text-sm text-gray-700">{level}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Price Range</h3>
        <div className="space-y-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Min Price ($)</label>
            <input
              type="number"
              min="0"
              placeholder="0"
              value={localFilters.priceRange.min ?? ''}
              onChange={(e) =>
                updateFilter('priceRange', {
                  ...localFilters.priceRange,
                  min: e.target.value ? Number(e.target.value) : null,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Price ($)</label>
            <input
              type="number"
              min="0"
              placeholder="No limit"
              value={localFilters.priceRange.max ?? ''}
              onChange={(e) =>
                updateFilter('priceRange', {
                  ...localFilters.priceRange,
                  max: e.target.value ? Number(e.target.value) : null,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
        </div>
      </div>

      {/* Other Filters */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Other</h3>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={localFilters.fideRatedOnly}
              onChange={(e) => updateFilter('fideRatedOnly', e.target.checked)}
              className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
            />
            <span className="ml-2 text-sm text-gray-700">FIDE Rated Only</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={localFilters.hasPrizeFund}
              onChange={(e) => updateFilter('hasPrizeFund', e.target.checked)}
              className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
            />
            <span className="ml-2 text-sm text-gray-700">Has Prize Fund</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={localFilters.registrationOpen}
              onChange={(e) => updateFilter('registrationOpen', e.target.checked)}
              className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
            />
            <span className="ml-2 text-sm text-gray-700">Registration Open</span>
          </label>
        </div>
      </div>

      {/* Clear All Button (Mobile) */}
      <div className="lg:hidden pt-4 border-t">
        <button
          onClick={clearAllFilters}
          className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-md transition-colors"
        >
          Clear All Filters
        </button>
      </div>
    </div>
  );
}

