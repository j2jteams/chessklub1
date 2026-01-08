/**
 * Unified Tournament Filtering System
 * 
 * This module provides a clean, single-source-of-truth filtering pipeline
 * that handles all tournament filtering logic in the correct order.
 * 
 * Filter Priority Order:
 * 1. Country/City filters (highest priority - geographic scope)
 * 2. Search query (text search within scope)
 * 3. Location/Distance (if no country filter, apply distance-based filtering)
 * 4. Other filters (date, rating, time control, etc.)
 * 
 * This ensures consistent behavior across the entire application.
 */

import { EventData } from './types';
import { TournamentFilters } from '@/components/tournaments/FilterPanel';
import { LocationContext } from './locationContext';
import { normalizeCountryCode } from './locationNormalizer';
import { calculateDistanceMiles } from './locationHelpers';

export interface FilterResult {
  tournaments: EventData[];
  distanceInfo?: {
    expanded: boolean;
    message?: string;
    finalRadiusMiles?: number;
  };
}

/**
 * Country name to ISO-2 code mapping
 * Used consistently across the application
 */
const COUNTRY_NAME_TO_CODE: { [key: string]: string } = {
  'india': 'IN',
  'united states': 'US',
  'united states of america': 'US',
  'usa': 'US',
  'us': 'US',
  'united kingdom': 'GB',
  'uk': 'GB',
  'great britain': 'GB',
  'britain': 'GB',
  'england': 'GB',
  'canada': 'CA',
  'australia': 'AU',
  'germany': 'DE',
  'france': 'FR',
  'spain': 'ES',
  'italy': 'IT',
  'brazil': 'BR',
  'mexico': 'MX',
  'japan': 'JP',
  'china': 'CN',
  'russia': 'RU',
  'south korea': 'KR',
  'korea': 'KR',
  'netherlands': 'NL',
  'holland': 'NL',
  'poland': 'PL',
  'ukraine': 'UA',
  'argentina': 'AR',
  'chile': 'CL',
  'colombia': 'CO',
  'peru': 'PE',
  'philippines': 'PH',
  'indonesia': 'ID',
  'vietnam': 'VN',
  'thailand': 'TH',
  'malaysia': 'MY',
  'singapore': 'SG',
  'bangladesh': 'BD',
  'pakistan': 'PK',
  'egypt': 'EG',
  'south africa': 'ZA',
  'nigeria': 'NG',
  'turkey': 'TR',
  'greece': 'GR',
  'portugal': 'PT',
  'ireland': 'IE',
  'new zealand': 'NZ',
  'saudi arabia': 'SA',
  'united arab emirates': 'AE',
  'uae': 'AE',
  // Additional common variations
  'czech republic': 'CZ',
  'slovakia': 'SK',
  'sweden': 'SE',
  'norway': 'NO',
  'denmark': 'DK',
  'finland': 'FI',
  'switzerland': 'CH',
  'austria': 'AT',
  'belgium': 'BE',
  'hungary': 'HU',
  'romania': 'RO',
  'bulgaria': 'BG',
  'croatia': 'HR',
  'serbia': 'RS',
  'israel': 'IL',
  'azerbaijan': 'AZ',
  'armenia': 'AM',
  'georgia': 'GE',
  'kazakhstan': 'KZ',
  'uzbekistan': 'UZ',
};

/**
 * Check if a tournament matches a country filter
 */
function matchesCountry(tournament: EventData, countryName: string): boolean {
  const countryLower = countryName.toLowerCase().trim();
  const countryUpper = countryName.toUpperCase().trim();
  
  // Get expected country code for the filter
  const filterCountryCode = COUNTRY_NAME_TO_CODE[countryLower] || 
    (countryUpper.length === 2 ? countryUpper : undefined);
  const normalizedFilterCode = filterCountryCode ? normalizeCountryCode(filterCountryCode) : undefined;
  
  // PRIORITY 1: Check structuredLocation.countryCode (most reliable)
  const normalizedStructuredCode = normalizeCountryCode(tournament.structuredLocation?.countryCode);
  if (normalizedStructuredCode && normalizedFilterCode) {
    // STRICT MATCH: If tournament has a country code, it must EXACTLY match
    // This prevents Indian tournaments (IN) from matching United States (US)
    if (normalizedStructuredCode === normalizedFilterCode) {
      return true;
    } else {
      // Tournament has a different country code - explicitly exclude it
      return false;
    }
  }
  
  // If tournament has structuredLocation.countryCode but it doesn't match, exclude it
  if (normalizedStructuredCode && normalizedFilterCode && normalizedStructuredCode !== normalizedFilterCode) {
    return false;
  }
  
  // PRIORITY 2: Check country field (legacy)
  const tournamentCountry = (tournament.country || '').toLowerCase().trim();
  if (tournamentCountry) {
    // If tournament has a country field that maps to a different country code, exclude it
    // (unless it's a variation of the same country)
    if (normalizedFilterCode) {
      const tournamentCountryCode = normalizeCountryCode(tournamentCountry.toUpperCase());
      const tournamentCountryCodeFromName = COUNTRY_NAME_TO_CODE[tournamentCountry];
      const tournamentCode = tournamentCountryCode || (tournamentCountryCodeFromName ? normalizeCountryCode(tournamentCountryCodeFromName) : null);
      
      // If tournament has a country code that's different from filter, exclude it
      if (tournamentCode && tournamentCode !== normalizedFilterCode) {
        // Exception: if filter is "United States" and tournament country is a US variation, allow it
        if (normalizedFilterCode === 'US' && ['usa', 'us', 'united states', 'united states of america'].includes(tournamentCountry)) {
          // This is a US variation, allow it
        } else {
          // Different country - exclude
          return false;
        }
      }
    }
    
    // Direct name match (case-insensitive, exact)
    if (tournamentCountry === countryLower) {
      return true;
    }
    
    // Check if both map to the same country code
    if (normalizedFilterCode) {
      const tournamentCountryCode = normalizeCountryCode(tournamentCountry.toUpperCase());
      if (tournamentCountryCode === normalizedFilterCode) {
        return true;
      }
      
      // Check if tournament country is a known variation of the filter country
      const tournamentCountryCodeFromName = COUNTRY_NAME_TO_CODE[tournamentCountry];
      if (tournamentCountryCodeFromName && normalizeCountryCode(tournamentCountryCodeFromName) === normalizedFilterCode) {
        return true;
      }
    }
    
    // Partial match - check if tournament country contains filter country or vice versa
    // But only if one is clearly a substring of the other (to avoid false positives)
    if (tournamentCountry.includes(countryLower) || countryLower.includes(tournamentCountry)) {
      // Additional check: if filter has a code, verify tournament also maps to same code
      if (normalizedFilterCode) {
        const tournamentCountryCode = normalizeCountryCode(tournamentCountry.toUpperCase());
        if (tournamentCountryCode === normalizedFilterCode) {
          return true;
        }
      }
    }
  }
  
  // PRIORITY 3: Handle country name variations
  const countryVariations: { [key: string]: string[] } = {
    'united states': ['usa', 'us', 'united states of america', 'u.s.a', 'u.s.'],
    'united kingdom': ['uk', 'britain', 'great britain', 'england'],
    'india': ['in', 'bharat', 'hindustan'],
  };
  
  const variations = countryVariations[countryLower] || [];
  if (variations.some(v => {
    const normalizedVariation = normalizeCountryCode(v);
    return (tournamentCountry === v || tournamentCountry.includes(v)) && 
           (normalizedStructuredCode && normalizedVariation && normalizedStructuredCode === normalizedVariation);
  })) {
    return true;
  }
  
  // LAST RESORT: Check location/venue field - STRICT matching only
  // Check location as fallback, but be very strict about matching
  // This prevents false positives (e.g., Indian tournaments matching "United States")
  // Also check structuredLocation.addressLine1 and venueName
  const location = (tournament.location || tournament.venue || 
                   tournament.structuredLocation?.addressLine1 || 
                   tournament.structuredLocation?.venueName || '').toLowerCase();
  if (location) {
    // IMPORTANT: If tournament has a country code set that's different from filter, exclude it
    // This prevents Indian tournaments from matching United States
    // BUT: Only exclude if we're confident the country code is correct
    // If structuredLocation.countryCode is missing, continue to check location text
    if (normalizedStructuredCode && normalizedFilterCode && normalizedStructuredCode !== normalizedFilterCode) {
      // Double-check: if location text suggests a different country, trust the location text
      // This handles cases where countryCode might be wrong or missing
      const hasConflictingLocation = (normalizedFilterCode === 'US' && 
        (location.includes('india') || location.includes('indian ') || 
         location.includes('bangalore') || location.includes('mumbai') ||
         location.includes('delhi') || location.includes('chennai') ||
         location.includes('hyderabad') || location.includes('kolkata')));
      
      if (hasConflictingLocation) {
        // Location text suggests different country - exclude
        return false;
      }
      
      // Otherwise, trust the countryCode
      return false; // Tournament has a different country code - exclude
    }
    
    // If tournament has country field that's different, also exclude
    if (tournamentCountry && normalizedFilterCode) {
      const tournamentCountryCode = normalizeCountryCode(tournamentCountry.toUpperCase());
      const tournamentCountryCodeFromName = COUNTRY_NAME_TO_CODE[tournamentCountry];
      const tournamentCode = tournamentCountryCode || (tournamentCountryCodeFromName ? normalizeCountryCode(tournamentCountryCodeFromName) : null);
      
      if (tournamentCode && tournamentCode !== normalizedFilterCode) {
        // Exception: US variations
        if (normalizedFilterCode === 'US' && ['usa', 'us', 'united states'].includes(tournamentCountry)) {
          // Allow US variations - continue to check location
        } else {
          return false; // Different country - exclude
        }
      }
    }
    
    // Parse location string (usually "City, State, Country" format)
    const parts = location.trim().split(',').map(p => p.trim().toLowerCase());
    const lastPart = parts.length > 0 ? parts[parts.length - 1] : '';
    
    if (parts.length > 0) {
      
      // STRICT: Only match if the LAST part of the location matches the country
      // This prevents "United States" from matching locations like "United States Street, India"
      
      // Check if last part exactly matches country name
      if (lastPart === countryLower) {
        return true;
      }
      
      // Check if last part matches country code (e.g., ", US" or ", IN")
      if (normalizedFilterCode) {
        const lastPartCode = normalizeCountryCode(lastPart.toUpperCase());
        if (lastPartCode === normalizedFilterCode) {
          return true;
        }
        // If last part is a different country code, explicitly exclude
        if (lastPartCode && lastPartCode !== normalizedFilterCode) {
          return false; // Location ends with a different country code
        }
      }
      
      // Special handling for United States - check for US state abbreviations at the end
      // Only if we're looking for US and the location ends with a US state
      if (normalizedFilterCode === 'US' || countryLower === 'united states' || countryLower === 'usa' || countryLower === 'us') {
        const usStateCodes = ['ca', 'ny', 'tx', 'fl', 'il', 'pa', 'oh', 'ga', 'nc', 'mi',
          'nj', 'va', 'wa', 'az', 'ma', 'tn', 'mo', 'md', 'wi', 'co', 'mn', 'sc', 'al',
          'la', 'ky', 'or', 'ok', 'ct', 'ia', 'ut', 'ar', 'nv', 'ms', 'ks', 'nm', 'ne',
          'wv', 'id', 'hi', 'nh', 'me', 'mt', 'ri', 'de', 'sd', 'nd', 'ak', 'dc', 'vt', 'wy'];
        
        // Check if last part is a US state code (but NOT "in" which could be Indiana OR India)
        // Be careful: "in" could be Indiana (US) or India (IN)
        if (lastPart.length === 2 && usStateCodes.includes(lastPart) && lastPart !== 'in') {
          return true;
        }
        // If last part is "in", check the second-to-last part for a US state
        // BUT also check if location contains "india" or "indian" to avoid false positives
        if (lastPart === 'in' && parts.length >= 2) {
          // If location contains "india" anywhere, it's likely India, not Indiana
          if (location.includes('india') || location.includes('indian ') || location.includes('chess india')) {
            return false; // Likely India, not US
          }
          const secondLastPart = parts[parts.length - 2];
          if (usStateCodes.includes(secondLastPart)) {
            return true; // Likely "City, IN" where IN is Indiana
          }
        }
        
        // Check for explicit US patterns at the end (case-insensitive)
        const usEndPatterns = [', usa', ', united states', ', united states of america', ', u.s.a', ', u.s.', 
                              ', USA', ', United States', ', UNITED STATES', ', U.S.A', ', U.S.'];
        if (usEndPatterns.some(pattern => location.endsWith(pattern.toLowerCase()) || location.endsWith(pattern))) {
          return true;
        }
        
        // Also check if location ends with ", us" or ", US" (case-insensitive)
        const locationTrimmed = location.trim();
        if (locationTrimmed.endsWith(', us') || locationTrimmed.endsWith(' us') ||
            locationTrimmed.endsWith(', US') || locationTrimmed.endsWith(' US')) {
          return true;
        }
        
        // Check if location ends with just "us" or "US" (as last part after comma)
        if ((lastPart === 'us' || lastPart === 'usa') && parts.length >= 2) {
          return true;
        }
        
        // More lenient: Check if "us" or "usa" appears anywhere in the last 2 parts
        // This handles cases like "City, State, US" or "Address, City, US"
        const lastTwoParts = parts.slice(-2);
        if (lastTwoParts.some(part => part === 'us' || part === 'usa' || part === 'united states')) {
          return true;
        }
        
        // More lenient: Check if any part of the location contains a US state code
        // This helps catch addresses like "123 Main St, Charlotte, NC" or "Charlotte, North Carolina"
        const hasUSState = parts.some(part => {
          const partLower = part.toLowerCase();
          // Check if part is a US state code
          if (partLower.length === 2 && usStateCodes.includes(partLower) && partLower !== 'in') {
            return true;
          }
          // Check for common US state names
          const usStateNames = ['north carolina', 'south carolina', 'north dakota', 'south dakota', 
            'new york', 'new jersey', 'new mexico', 'new hampshire', 'west virginia', 'rhode island',
            'california', 'texas', 'florida', 'illinois', 'pennsylvania', 'ohio', 'georgia', 
            'michigan', 'virginia', 'washington', 'arizona', 'massachusetts', 'tennessee', 
            'missouri', 'maryland', 'wisconsin', 'colorado', 'minnesota', 'alabama', 'louisiana',
            'kentucky', 'oregon', 'oklahoma', 'connecticut', 'iowa', 'utah', 'arkansas', 'nevada',
            'mississippi', 'kansas', 'nebraska', 'idaho', 'hawaii', 'maine', 'montana', 'delaware',
            'alaska', 'vermont', 'wyoming', 'district of columbia', 'washington dc'];
          return usStateNames.includes(partLower);
        });
        
        if (hasUSState) {
          // Additional check: make sure it's not India (e.g., "Kolkata, West Bengal, India")
          if (!location.includes('india') && !location.includes('indian ') && 
              !location.includes('bangalore') && !location.includes('mumbai') && 
              !location.includes('delhi') && !location.includes('chennai') &&
              !location.includes('hyderabad') && !location.includes('kolkata')) {
            console.log(`🔍 [matchesCountry] Tournament "${tournament.title}" matched by US state in location: ${location.substring(0, 80)}`);
            return true;
          }
        }
      }
    }
    
    // Final check: if location contains common US city/state patterns but no country code is set
    // This is a fallback for addresses that were updated but structuredLocation.countryCode wasn't set
    if (!normalizedStructuredCode && !tournamentCountry && normalizedFilterCode === 'US') {
      const locationLower = location.toLowerCase();
      // Check for common US patterns
      const usCityPatterns = ['charlotte', 'ballantyne', 'fort mill', 'new york', 'los angeles', 
                              'chicago', 'houston', 'phoenix', 'philadelphia', 'san antonio',
                              'san diego', 'dallas', 'san jose', 'austin', 'jacksonville'];
      const hasUSCity = usCityPatterns.some(city => locationLower.includes(city));
      
      // Check if location has a US state code
      const usStateCodes = ['ca', 'ny', 'tx', 'fl', 'il', 'pa', 'oh', 'ga', 'nc', 'mi',
        'nj', 'va', 'wa', 'az', 'ma', 'tn', 'mo', 'md', 'wi', 'co', 'mn', 'sc', 'al',
        'la', 'ky', 'or', 'ok', 'ct', 'ia', 'ut', 'ar', 'nv', 'ms', 'ks', 'nm', 'ne',
        'wv', 'id', 'hi', 'nh', 'me', 'mt', 'ri', 'de', 'sd', 'nd', 'ak', 'dc', 'vt', 'wy'];
      const hasUSStateCode = parts.some(part => {
        const partLower = part.toLowerCase();
        return partLower.length === 2 && usStateCodes.includes(partLower) && partLower !== 'in';
      });
      
      if (hasUSCity || hasUSStateCode) {
        // Additional safety: make sure it's not an Indian city with similar name
        if (!locationLower.includes('india') && !locationLower.includes('indian ')) {
          console.log(`🔍 [matchesCountry] Tournament "${tournament.title}" matched by US city/state pattern (no countryCode set): ${location.substring(0, 80)}`);
          return true;
        }
      }
    }
  }
  
  console.log(`🔍 [matchesCountry] Tournament "${tournament.title}" did NOT match country search "${countryName}":`, {
    structuredLocation_countryCode: tournament.structuredLocation?.countryCode || 'MISSING',
    country: tournament.country || 'MISSING',
    location: tournament.location?.substring(0, 80) || 'MISSING',
    venue: tournament.venue?.substring(0, 80) || 'MISSING',
    filterCountryCode: normalizedFilterCode
  });
  return false;
}

/**
 * Check if a tournament matches a city filter
 */
function matchesCity(tournament: EventData, cityName: string): boolean {
  const cityLower = cityName.toLowerCase().trim();
  const tournamentCity = (tournament.city || '').toLowerCase();
  const location = (tournament.location || tournament.venue || '').toLowerCase();
  
  if (tournamentCity && tournamentCity.includes(cityLower)) {
    return true;
  }
  if (location && location.includes(cityLower)) {
    return true;
  }
  return false;
}

/**
 * Apply country and city filters (highest priority)
 */
function applyGeographicFilters(tournaments: EventData[], filters: TournamentFilters): EventData[] {
  let filtered = [...tournaments];
  
  // Apply country filter
  if (filters.countries.length > 0) {
    const beforeCount = filtered.length;
    
    // Debug: log tournament country data
    if (beforeCount > 0 && beforeCount <= 10) {
      console.log(`🔍 [Geographic Filter] Checking ${beforeCount} tournaments against country filter: ${filters.countries.join(', ')}`);
      filtered.slice(0, 5).forEach((tournament, idx) => {
        const locationText = tournament.location || tournament.venue || '';
        console.log(`🔍 [Geographic Filter] Tournament ${idx + 1} "${tournament.title}" country data:`, {
          structuredLocation_countryCode: tournament.structuredLocation?.countryCode || 'MISSING',
          country: tournament.country || 'MISSING',
          location: locationText.substring(0, 80),
          locationEndsWith: locationText.split(',').pop()?.trim().toLowerCase() || 'N/A'
        });
      });
    }
    
    filtered = filtered.filter(tournament => {
      const matches = filters.countries.some(country => {
        const result = matchesCountry(tournament, country);
        // Log why tournaments don't match (only for first few to avoid spam)
        if (!result && beforeCount <= 10) {
          const locationText = tournament.location || tournament.venue || '';
          const lastPart = locationText.split(',').pop()?.trim().toLowerCase() || 'N/A';
          console.log(`🔍 [Geographic Filter] Tournament "${tournament.title}" did NOT match "${country}":`, {
            structuredLocation_countryCode: tournament.structuredLocation?.countryCode || 'MISSING',
            country: tournament.country || 'MISSING',
            location: locationText.substring(0, 80),
            locationLastPart: lastPart,
            hasUSStateCode: lastPart.length === 2 && ['ca', 'ny', 'tx', 'fl', 'il', 'pa', 'oh', 'ga', 'nc', 'mi', 'nj', 'va', 'wa', 'az', 'ma', 'tn', 'mo', 'md', 'wi', 'co', 'mn', 'sc', 'al', 'la', 'ky', 'or', 'ok', 'ct', 'ia', 'ut', 'ar', 'nv', 'ms', 'ks', 'nm', 'ne', 'wv', 'id', 'hi', 'nh', 'me', 'mt', 'ri', 'de', 'sd', 'nd', 'ak', 'dc', 'vt', 'wy'].includes(lastPart)
          });
        }
        return result;
      });
      return matches;
    });
    
    const afterCount = filtered.length;
    console.log(`🔍 [Geographic Filter] Country filter: ${beforeCount} → ${afterCount} tournaments`);
  }
  
  // Apply city filter
  if (filters.cities.length > 0) {
    filtered = filtered.filter(tournament => 
      filters.cities.some(city => matchesCity(tournament, city))
    );
  }
  
  return filtered;
}

/**
 * Apply search query (text search)
 */
function applySearchQuery(tournaments: EventData[], searchQuery: string): EventData[] {
  if (!searchQuery.trim()) {
    return tournaments;
  }
  
  const query = searchQuery.toLowerCase().trim();
  const queryCountryCode = COUNTRY_NAME_TO_CODE[query] || (query.length === 2 ? query.toUpperCase() : null);
  const isCountrySearch = !!queryCountryCode;
  
  // Check if search query is a city name
  let isCitySearch = false;
  if (!isCountrySearch && query.length >= 2) {
    try {
      const { getAllChessCities } = require('./chessCountries');
      const allCities = getAllChessCities();
      // Check if query matches any city (case-insensitive, exact or partial match)
      isCitySearch = allCities.some((city: string) => {
        const cityLower = city.toLowerCase();
        return cityLower === query || 
               cityLower.includes(query) ||
               query.includes(cityLower);
      });
    } catch (error) {
      // If we can't load cities, continue without city detection
      console.warn('Could not load cities for search detection:', error);
    }
  }
  
  const filtered = tournaments.filter(tournament => {
    // If searching for a country, only match country fields
    if (isCountrySearch) {
      return matchesCountry(tournament, query);
    }
    
    // If searching for a city, prioritize city matches but also check other fields
    if (isCitySearch) {
      const matches = matchesCity(tournament, query);
      if (!matches) {
        // Also check if city name appears in title, venue, or location (for tournaments named after cities)
        const title = (tournament.title || tournament.name || '').toLowerCase();
        const venue = (tournament.venue || tournament.location || '').toLowerCase();
        if (title.includes(query) || venue.includes(query)) {
          return true;
        }
      }
      return matches;
    }
    
    // Regular text search - check title, venue, city, description, organizer
    const title = (tournament.title || tournament.name || '').toLowerCase();
    const venue = (tournament.venue || tournament.location || '').toLowerCase();
    const city = (tournament.city || '').toLowerCase();
    const description = (tournament.description || '').toLowerCase();
    const organizer = (tournament.createdByEmail || '').toLowerCase();
    
    return title.includes(query) ||
           venue.includes(query) ||
           city.includes(query) ||
           description.includes(query) ||
           organizer.includes(query);
  });
  
  return filtered;
}

/**
 * Apply location/distance filtering (only if no country/city filters are active)
 */
function applyLocationFiltering(
  tournaments: EventData[],
  locationContext: LocationContext | null,
  hasGeographicFilters: boolean
): { tournaments: EventData[]; distanceInfo?: FilterResult['distanceInfo'] } {
  // If country/city filters are active, skip distance filtering
  if (hasGeographicFilters) {
    return { tournaments };
  }
  
  // If "anywhere" mode, return all tournaments
  if (!locationContext || locationContext.mode === 'anywhere' || !locationContext.center) {
    return { tournaments: tournaments.map(t => ({ ...t, _distanceMiles: null })) };
  }
  
  // Apply distance-based filtering - respect the user's selected radius exactly
  const { calculateDistanceMiles, filterByRadius } = require('./locationHelpers');
  const center = locationContext.center;
  const radiusMiles = locationContext.radiusMiles || 25;
  
  // Filter tournaments within the exact radius (no automatic expansion - respect user's choice)
  const filteredTournaments = filterByRadius(tournaments, center, radiusMiles);
  
  // Log for verification (only when radius filtering is applied)
  if (filteredTournaments.length !== tournaments.length) {
    console.log(`📍 [Location Filter] Applied distance filtering: ${filteredTournaments.length} tournaments within ${radiusMiles}mi of ${locationContext.label || 'your location'}`);
  }
  
  // Calculate distance for each tournament
  const tournamentsWithDistance = filteredTournaments.map((tournament: EventData) => {
    const coords = tournament.structuredLocation?.geo
      ? { lat: tournament.structuredLocation.geo.latitude, lng: tournament.structuredLocation.geo.longitude }
      : tournament.coordinates;
    
    let distanceMiles: number | null = null;
    if (coords) {
      distanceMiles = calculateDistanceMiles(center.lat, center.lng, coords.lat, coords.lng);
    }
    
    return { ...tournament, _distanceMiles: distanceMiles };
  });
  
  // No expansion info since we're using exact radius
  return {
    tournaments: tournamentsWithDistance,
    distanceInfo: undefined
  };
}

/**
 * Apply other filters (date, rating, time control, etc.)
 * Extracted from tournamentSearch.ts to avoid circular dependencies
 */
function applyOtherFilters(tournaments: EventData[], filters: TournamentFilters): EventData[] {
  let filtered = [...tournaments];
  
  // Apply date range filter
  if (filters.dateRange.start) {
    const startDate = new Date(filters.dateRange.start);
    filtered = filtered.filter((tournament) => {
      const tournamentDate = tournament.startDate
        ? new Date(tournament.startDate)
        : tournament.date
        ? new Date(tournament.date)
        : null;
      if (!tournamentDate || isNaN(tournamentDate.getTime())) return false;
      return tournamentDate >= startDate;
    });
  }

  if (filters.dateRange.end) {
    const endDate = new Date(filters.dateRange.end);
    filtered = filtered.filter((tournament) => {
      const tournamentDate = tournament.endDate
        ? new Date(tournament.endDate)
        : tournament.startDate
        ? new Date(tournament.startDate)
        : tournament.date
        ? new Date(tournament.date)
        : null;
      if (!tournamentDate || isNaN(tournamentDate.getTime())) return false;
      return tournamentDate <= endDate;
    });
  }

  // Apply rating filter
  if (filters.minRating !== null) {
    filtered = filtered.filter((tournament) => {
      if (tournament.minRating !== undefined && tournament.minRating !== null) {
        return tournament.minRating <= filters.minRating!;
      }
      if (tournament.sections && tournament.sections.length > 0) {
        return tournament.sections.some(
          (section) =>
            section.minRating === null || section.minRating === undefined || section.minRating <= filters.minRating!
        );
      }
      return true;
    });
  }

  if (filters.maxRating !== null) {
    filtered = filtered.filter((tournament) => {
      if (tournament.maxRating !== undefined && tournament.maxRating !== null) {
        return tournament.maxRating >= filters.maxRating!;
      }
      if (tournament.sections && tournament.sections.length > 0) {
        return tournament.sections.some(
          (section) =>
            section.maxRating === null || section.maxRating === undefined || section.maxRating >= filters.maxRating!
        );
      }
      return true;
    });
  }

  // Apply rating type filter
  if (filters.ratingTypes && filters.ratingTypes.length > 0) {
    filtered = filtered.filter((tournament) => {
      if (tournament.ratingType) {
        return filters.ratingTypes.includes(tournament.ratingType);
      }
      if (filters.ratingTypes.includes('FIDE') && tournament.fideRated) {
        return true;
      }
      return false;
    });
  }

  // Apply time control filter
  if (filters.timeControls.length > 0) {
    filtered = filtered.filter((tournament) => {
      let timeControlStr = '';
      if (tournament.timeControl) {
        if (typeof tournament.timeControl === 'string') {
          timeControlStr = tournament.timeControl.toLowerCase();
        } else if (typeof tournament.timeControl === 'object' && 'category' in tournament.timeControl) {
          const tc = tournament.timeControl;
          timeControlStr = (tc.customLabel || tc.format || tc.category || '').toLowerCase();
        }
      }
      return filters.timeControls.some((control) =>
        timeControlStr.includes(control.toLowerCase())
      );
    });
  }

  // Apply tournament level filter
  if (filters.tournamentLevels.length > 0) {
    filtered = filtered.filter((tournament) => {
      const level = (tournament.tournamentLevel || '').toLowerCase().trim();
      if (!level) return false;
      return filters.tournamentLevels.some((filterLevel) => {
        const filterLevelLower = filterLevel.toLowerCase().trim();
        return level === filterLevelLower || level.includes(filterLevelLower);
      });
    });
  }

  // Apply price range filter
  if (filters.priceRange.min !== null) {
    filtered = filtered.filter((tournament) => {
      if (tournament.sections && tournament.sections.length > 0) {
        const minSectionFee = Math.min(
          ...tournament.sections
            .filter((s) => s.entryFee !== null && s.entryFee !== undefined)
            .map((s) => s.entryFee!)
        );
        if (minSectionFee !== Infinity) {
          return minSectionFee >= filters.priceRange.min!;
        }
      }
      if (tournament.price) {
        const priceStr = tournament.price.replace(/[^0-9.]/g, '');
        const price = parseFloat(priceStr);
        if (!isNaN(price)) {
          return price >= filters.priceRange.min!;
        }
      }
      return false;
    });
  }

  if (filters.priceRange.max !== null) {
    filtered = filtered.filter((tournament) => {
      if (tournament.sections && tournament.sections.length > 0) {
        const maxSectionFee = Math.max(
          ...tournament.sections
            .filter((s) => s.entryFee !== null && s.entryFee !== undefined)
            .map((s) => s.entryFee!)
        );
        if (maxSectionFee !== -Infinity) {
          return maxSectionFee <= filters.priceRange.max!;
        }
      }
      if (tournament.price) {
        const priceStr = tournament.price.replace(/[^0-9.]/g, '');
        const price = parseFloat(priceStr);
        if (!isNaN(price)) {
          return price <= filters.priceRange.max!;
        }
      }
      return true;
    });
  }

  // Apply FIDE rated filter
  if (filters.fideRatedOnly) {
    filtered = filtered.filter((tournament) => tournament.fideRated === true);
  }

  // Apply prize fund filter
  if (filters.hasPrizeFund) {
    filtered = filtered.filter(
      (tournament) => tournament.prizeFund !== undefined && tournament.prizeFund > 0
    );
  }

  // Apply registration open filter
  if (filters.registrationOpen) {
    const now = new Date();
    filtered = filtered.filter((tournament) => {
      if (tournament.registrationDeadline) {
        const deadline = new Date(tournament.registrationDeadline);
        return deadline >= now;
      }
      const startDate = tournament.startDate
        ? new Date(tournament.startDate)
        : tournament.date
        ? new Date(tournament.date)
        : null;
      if (startDate && !isNaN(startDate.getTime())) {
        return startDate >= now;
      }
      return true;
    });
  }

  return filtered;
}

/**
 * Main unified filtering function
 * 
 * This is the single entry point for all tournament filtering.
 * It applies filters in the correct priority order:
 * 1. Geographic (country/city)
 * 2. Search query
 * 3. Location/distance (if no geographic filters)
 * 4. Other filters (date, rating, etc.)
 */
export function filterTournamentsUnified(
  tournaments: EventData[],
  options: {
    searchQuery?: string;
    filters: TournamentFilters;
    locationContext?: LocationContext | null;
  }
): FilterResult {
  const { searchQuery = '', filters, locationContext = null } = options;
  
  console.log(`🔍 [Unified Filter] Starting with ${tournaments.length} tournaments`, {
    searchQuery,
    countries: filters.countries,
    cities: filters.cities,
    locationMode: locationContext?.mode
  });
  
  // Step 1: Check if search query is a country/city search
  const query = searchQuery.toLowerCase().trim();
  const queryCountryCode = COUNTRY_NAME_TO_CODE[query] || (query.length === 2 ? query.toUpperCase() : null);
  const isCountrySearch = !!queryCountryCode;
  
  if (isCountrySearch) {
    console.log(`🔍 [Unified Filter] Search query "${searchQuery}" detected as country search (code: ${queryCountryCode})`);
  }
  
  // Check if search query is a city name
  let isCitySearch = false;
  if (!isCountrySearch && query.length >= 2) {
    try {
      const { getAllChessCities } = require('./chessCountries');
      const allCities = getAllChessCities();
      
      // City name aliases (e.g., "Bengaluru" = "Bangalore")
      const cityAliases: { [key: string]: string } = {
        'bengaluru': 'bangalore',
        'calcutta': 'kolkata',
        'bombay': 'mumbai',
        'madras': 'chennai',
      };
      
      // Check if query matches any city (case-insensitive, exact or partial match)
      const normalizedQuery = cityAliases[query] || query;
      const matchingCity = allCities.find((city: string) => {
        const cityLower = city.toLowerCase();
        return cityLower === normalizedQuery || 
               cityLower === query ||
               cityLower.includes(normalizedQuery) ||
               normalizedQuery.includes(cityLower) ||
               cityLower.includes(query) ||
               query.includes(cityLower);
      });
      isCitySearch = !!matchingCity;
    } catch (error) {
      // If we can't load cities, continue without city detection
      console.warn('Could not load cities for search detection:', error);
    }
  }
  
  // Step 2: Apply geographic filters (country/city) - HIGHEST PRIORITY
  const hasGeographicFilters = filters.countries.length > 0 || filters.cities.length > 0;
  let filtered = applyGeographicFilters(tournaments, filters);
  console.log(`🔍 [Unified Filter] After geographic filters: ${filtered.length} tournaments (from ${tournaments.length} total)`);
  
  // Step 3: Apply search query (within geographic scope if any)
  // If search query is the same as the country filter, skip search (already filtered)
  const searchMatchesFilter = hasGeographicFilters && 
    filters.countries.length > 0 && 
    isCountrySearch && 
    filters.countries.some(filterCountry => {
      const filterLower = filterCountry.toLowerCase();
      const queryLower = query.toLowerCase();
      return filterLower === queryLower || 
             (COUNTRY_NAME_TO_CODE[filterLower] === queryCountryCode && COUNTRY_NAME_TO_CODE[queryLower] === queryCountryCode);
    });
  
  if (searchMatchesFilter) {
    console.log(`🔍 [Unified Filter] Search query matches country filter - skipping redundant search`);
  } else {
    filtered = applySearchQuery(filtered, searchQuery);
    console.log(`🔍 [Unified Filter] After search query: ${filtered.length} tournaments`);
  }
  
  // Step 4: Apply location/distance filtering (only if no geographic filters AND not a country/city search)
  // When searching for a country or city, skip distance filtering - show all tournaments matching that location
  const shouldSkipLocationFilter = hasGeographicFilters || isCountrySearch || isCitySearch;
  
  const locationResult = applyLocationFiltering(filtered, locationContext, shouldSkipLocationFilter);
  filtered = locationResult.tournaments;
  
  // Log location filtering status for verification (keep this for deployment verification)
  if (locationContext && locationContext.mode !== 'anywhere' && !shouldSkipLocationFilter) {
    console.log(`📍 [Location Filter] Applied distance filtering: ${filtered.length} tournaments within ${locationContext.radiusMiles}mi of ${locationContext.label || 'your location'}`);
  }
  
  // Step 5: Apply other filters (date, rating, time control, etc.)
  const beforeOtherFilters = filtered.length;
  filtered = applyOtherFilters(filtered, filters);
  if (beforeOtherFilters !== filtered.length) {
    console.log(`🔍 [Unified Filter] After other filters: ${filtered.length} tournaments (from ${beforeOtherFilters})`);
  }
  
  console.log(`🔍 [Unified Filter] Final result: ${filtered.length} tournaments`);
  
  // Memoize distanceInfo to prevent unnecessary re-renders
  // Only return distanceInfo if it actually exists and has meaningful data
  const distanceInfo = locationResult.distanceInfo && locationResult.distanceInfo.expanded
    ? {
        expanded: locationResult.distanceInfo.expanded,
        message: locationResult.distanceInfo.message,
        finalRadiusMiles: locationResult.distanceInfo.finalRadiusMiles
      }
    : undefined;
  
  return {
    tournaments: filtered,
    distanceInfo
  };
}

