import { EventData } from './types';
import { TournamentFilters } from '@/components/tournaments/FilterPanel';
import { normalizeCountryCode } from './locationNormalizer';

/**
 * Calculate simple similarity score between two strings (0-1)
 * Uses Levenshtein-like approach for typo tolerance
 */
function calculateSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1.0;
  if (!str1 || !str2) return 0;
  
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  // If one string is much longer, similarity is low
  if (longer.length > shorter.length * 2) return 0;
  
  // Check if shorter string is contained in longer (partial match)
  if (longer.includes(shorter)) return 0.8;
  
  // Calculate character overlap
  let matches = 0;
  const shorterChars = shorter.split('');
  const longerChars = longer.split('');
  
  for (const char of shorterChars) {
    if (longerChars.includes(char)) {
      matches++;
      const index = longerChars.indexOf(char);
      longerChars.splice(index, 1); // Remove to avoid double counting
    }
  }
  
  return matches / Math.max(shorter.length, longer.length);
}

/**
 * Check if query matches text with typo tolerance
 */
function fuzzyMatch(query: string, text: string, threshold: number = 0.6): boolean {
  const queryLower = query.toLowerCase();
  const textLower = text.toLowerCase();
  
  // Exact match
  if (textLower.includes(queryLower)) return true;
  
  // Word-by-word matching (handles "chess tournament" matching "Chess Tournament 2026")
  const queryWords = queryLower.split(/\s+/);
  const textWords = textLower.split(/\s+/);
  
  // If all query words are found in text, it's a match
  const allWordsMatch = queryWords.every(qWord => 
    textWords.some(tWord => tWord.includes(qWord) || qWord.includes(tWord))
  );
  if (allWordsMatch) return true;
  
  // Fuzzy similarity check
  const similarity = calculateSimilarity(queryLower, textLower);
  if (similarity >= threshold) return true;
  
  // Check individual words
  for (const qWord of queryWords) {
    for (const tWord of textWords) {
      if (calculateSimilarity(qWord, tWord) >= 0.7) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Common typo corrections for country names
 */
const countryTypoMap: { [key: string]: string } = {
  'indai': 'india',
  'indea': 'india',
  'united state': 'united states',
  'united state of america': 'united states',
  'united kindom': 'united kingdom',
  'united kindgom': 'united kingdom',
  'germeny': 'germany',
  'france': 'france', // Already correct
  'spain': 'spain', // Already correct
  'italy': 'italy', // Already correct
  'brazil': 'brazil', // Already correct
  'mexico': 'mexico', // Already correct
  'japan': 'japan', // Already correct
  'china': 'china', // Already correct
  'russia': 'russia', // Already correct
};

/**
 * Filters tournaments based on search query and filter criteria
 */
export function filterTournaments(
  tournaments: EventData[],
  searchQuery: string,
  filters: TournamentFilters
): EventData[] {
  let filtered = [...tournaments];
  
  // IMPORTANT: Apply country filter FIRST (before search) to ensure strict country filtering
  // When a country is selected, ONLY show events from that country, then apply search within those results
  if (filters.countries.length > 0) {
    const beforeCount = filtered.length;
    const nonMatchingTournaments: any[] = [];
    filtered = filtered.filter((tournament) => {
      // Normalize structuredLocation.countryCode (new system) - PRIMARY SOURCE OF TRUTH
      const normalizedStructuredCode = normalizeCountryCode(tournament.structuredLocation?.countryCode);
      const tournamentCountry = (tournament.country || '').toLowerCase();
      
      const matches = filters.countries.some((country) => {
        const countryLower = country.toLowerCase();
        const countryUpper = country.toUpperCase();
        
        // Map country name to code for filter (e.g., "India" -> "IN", "United States" -> "US")
        const countryNameToCode: { [key: string]: string } = {
          'india': 'IN',
          'united states': 'US',
          'united states of america': 'US',
          'usa': 'US',
          'us': 'US',
          'united kingdom': 'GB',
          'uk': 'GB',
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
          'netherlands': 'NL',
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
        };
        
        // Get expected code for the filter country name
        const filterCountryCode = countryNameToCode[countryLower] || (countryUpper.length === 2 ? countryUpper : undefined);
        const normalizedFilterCode = filterCountryCode ? normalizeCountryCode(filterCountryCode) : undefined;
        
        // PRIORITY 1: Check structuredLocation.countryCode (most reliable) - STRICT MATCH
        if (normalizedStructuredCode && normalizedFilterCode) {
          if (normalizedStructuredCode === normalizedFilterCode) {
            return true; // STRICT MATCH - tournament is in the selected country
          }
        }
        
        // PRIORITY 2: Check country field (legacy) - only if it matches the country code
        if (tournamentCountry && normalizedFilterCode) {
          const tournamentCountryCode = normalizeCountryCode(tournamentCountry.toUpperCase());
          if (tournamentCountryCode === normalizedFilterCode) {
            return true; // Country code matches
          }
          // Also check if country field is the country name itself
          if (tournamentCountry === countryLower || tournamentCountry === countryNameToCode[countryLower]?.toLowerCase()) {
            return true;
          }
        }
        
        // PRIORITY 3: Handle country name variations (for legacy data)
        const countryVariations: { [key: string]: string[] } = {
          'united states': ['usa', 'us', 'united states of america', 'u.s.a', 'u.s.'],
          'united kingdom': ['uk', 'britain', 'great britain', 'england'],
          'india': ['in', 'bharat', 'hindustan'],
        };
        
        const variations = countryVariations[countryLower] || [];
        if (variations.some(v => {
          const normalizedVariation = normalizeCountryCode(v);
          // Only check country field and structuredLocation, NOT location text
          return (tournamentCountry === v || tournamentCountry.includes(v)) && 
                 (normalizedStructuredCode && normalizedVariation && normalizedStructuredCode === normalizedVariation);
        })) {
          return true;
        }
        
        // LAST RESORT: Check location/venue field ONLY if structuredLocation.countryCode is missing
        // This is less reliable, so only use it when we don't have structuredLocation
        if (!normalizedStructuredCode && !tournamentCountry) {
          const location = (tournament.location || tournament.venue || '').toLowerCase();
          if (location) {
            const locationTrimmed = location.trim();
            // Split by comma and get the last part (country is usually last)
            const parts = locationTrimmed.split(',').map(p => p.trim().toLowerCase());
            if (parts.length > 0) {
              const lastPart = parts[parts.length - 1];
              // Only match if the last part is EXACTLY the country name
              if (lastPart === countryLower || lastPart.startsWith(countryLower + ' ')) {
                return true;
              }
            }
          }
        }
        
        return false;
      });
      
      // Track non-matching tournaments for debugging
      if (!matches) {
        nonMatchingTournaments.push({
          id: tournament.id,
          title: tournament.title || tournament.name,
          country: tournament.country || '(not set)',
          structuredCountryCode: tournament.structuredLocation?.countryCode || '(not set)',
          normalizedCode: normalizedStructuredCode || '(not set)',
        });
      }
      
      return matches;
    });
    
    const afterCount = filtered.length;
  }

  // Apply search query (AFTER country filter, so search works within the selected country)
  if (searchQuery.trim()) {
    let query = searchQuery.toLowerCase().trim();
    
    // Apply typo corrections
    if (countryTypoMap[query]) {
      query = countryTypoMap[query];
    }
    
    // Map country names to codes for search
    const countryNameToCode: { [key: string]: string } = {
      'india': 'IN',
      'united states': 'US',
      'united states of america': 'US',
      'usa': 'US',
      'us': 'US',
      'united kingdom': 'GB',
      'uk': 'GB',
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
      'netherlands': 'NL',
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
    };
    
    // Get country code if query is a country name
    const queryCountryCode = countryNameToCode[query] || (query.length === 2 ? query.toUpperCase() : null);
    
    // If searching for a country, ONLY match country fields (not tags, title, description, etc.)
    const isCountrySearch = !!queryCountryCode;
    
    if (isCountrySearch) {
      console.log(`🔍 [Search] Country search detected: "${query}" -> code: ${queryCountryCode}, tournaments to check: ${filtered.length}`);
    }
    
    // Calculate relevance scores for each tournament
    const tournamentsWithScores = filtered.map((tournament) => {
      const title = (tournament.title || tournament.name || '').toLowerCase();
      const description = (tournament.description || '').toLowerCase();
      const venue = (tournament.venue || '').toLowerCase();
      const location = (tournament.location || '').toLowerCase();
      const city = (tournament.city || '').toLowerCase();
      const country = (tournament.country || '').toLowerCase();
      const organizer = (tournament.createdByEmail || '').toLowerCase();
      
      // Check structuredLocation.countryCode
      const structuredCountryCode = tournament.structuredLocation?.countryCode?.toUpperCase() || '';
      const structuredCountryCodeLower = structuredCountryCode.toLowerCase();
      
      // Check if query matches country code - STRICT matching for country searches
      let countryMatch = false;
      if (queryCountryCode) {
        // Query is a country name or code - check against actual country fields AND location field
        const normalizedStructuredCode = normalizeCountryCode(structuredCountryCode);
        const normalizedQueryCode = normalizeCountryCode(queryCountryCode);
        
        // Check structuredLocation.countryCode (primary)
        countryMatch = 
          normalizedStructuredCode === normalizedQueryCode ||
          (!!structuredCountryCodeLower && structuredCountryCodeLower === queryCountryCode.toLowerCase());
        
        // Check country field (secondary)
        if (!countryMatch && country) {
          countryMatch = 
            country === queryCountryCode.toLowerCase() || 
            country === query ||
            country.includes(queryCountryCode.toLowerCase()) ||
            country.includes(query);
        }
        
        // Check location/venue field as fallback (tertiary) - same logic as country filter
        if (!countryMatch) {
          const locationText = location || venue;
          if (locationText) {
            const locationTrimmed = locationText.trim();
            // Split by comma and get the last part
            const parts = locationTrimmed.split(',').map(p => p.trim().toLowerCase());
            if (parts.length > 0) {
              const lastPart = parts[parts.length - 1];
              // Match if last part is exactly the country name or country code
              if (lastPart === query || lastPart === queryCountryCode.toLowerCase() || 
                  lastPart.startsWith(query + ' ') || lastPart.startsWith(queryCountryCode.toLowerCase() + ' ')) {
                countryMatch = true;
                if (isCountrySearch) {
                  console.log(`🔍 [Search] Country match found in location field (last part): "${lastPart}" for tournament: ${tournament.title || tournament.name}`);
                }
              }
            }
            // Also check whole word match in location
            if (!countryMatch) {
              const countryWordRegex = new RegExp(`\\b${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
              if (countryWordRegex.test(locationTrimmed)) {
                // For "India", make sure it's not part of "Indianapolis" or "Indiana"
                if (query === 'india') {
                  const indiaAtEndRegex = /[,\s]+india\s*$/i;
                  if (indiaAtEndRegex.test(locationTrimmed) || locationTrimmed.endsWith('india')) {
                    countryMatch = true;
                    if (isCountrySearch) {
                      console.log(`🔍 [Search] Country match found in location field (India regex): "${locationTrimmed}" for tournament: ${tournament.title || tournament.name}`);
                    }
                  }
                } else {
                  countryMatch = true;
                  if (isCountrySearch) {
                    console.log(`🔍 [Search] Country match found in location field (word match): "${locationTrimmed}" for tournament: ${tournament.title || tournament.name}`);
                  }
                }
              }
            }
          }
        }
        
        // Debug: Log why tournament didn't match
        if (isCountrySearch && !countryMatch) {
          console.log(`🔍 [Search] Tournament "${tournament.title || tournament.name}" did NOT match country "${query}":`, {
            structuredCountryCode: structuredCountryCode || '(not set)',
            country: country || '(not set)',
            location: location || '(not set)',
            venue: venue || '(not set)',
          });
        }
      } else {
        // Regular text search in country fields
        countryMatch = 
          country.includes(query) ||
          structuredCountryCodeLower.includes(query) ||
          (!!location && location.includes(query)) ||
          (!!venue && venue.includes(query));
      }

      // If this is a country search, ONLY include tournaments that match the country
      if (isCountrySearch && !countryMatch) {
        return { tournament, score: 0, matches: false };
      }

      // Calculate relevance score (0-100)
      let score = 0;
      
      // For country searches, prioritize country match and exclude other fields
      if (isCountrySearch) {
        // Country search - only score based on country match
        if (countryMatch) {
          score = 100; // Full score for country match
        }
      } else {
        // Regular search - check all fields
        
        // Title matches (highest weight)
        if (title === query) {
          score += 100; // Exact title match
        } else if (title.startsWith(query)) {
          score += 80; // Title starts with query
        } else if (title.includes(query)) {
          score += 60; // Title contains query
        } else if (fuzzyMatch(query, title)) {
          score += 40; // Fuzzy title match
        }
        
        // Venue matches (high weight)
        if (venue.includes(query)) {
          score += 50;
        } else if (fuzzyMatch(query, venue)) {
          score += 30;
        }
        
        // City matches (medium weight)
        if (city === query) {
          score += 40;
        } else if (city.includes(query)) {
          score += 30;
        } else if (fuzzyMatch(query, city)) {
          score += 20;
        }
        
        // Country match (medium weight)
        if (countryMatch) {
          score += 35;
        }
        
        // Description matches (lower weight) - but exclude if it's just matching tags
        const descriptionText = description;
        // Don't match if description only contains country name in tags context
        if (descriptionText.includes(query) && !descriptionText.includes('tournament') && !descriptionText.includes('event')) {
          score += 20;
        } else if (fuzzyMatch(query, descriptionText)) {
          score += 10;
        }
        
        // Organizer matches (lowest weight)
        if (organizer.includes(query)) {
          score += 15;
        } else if (fuzzyMatch(query, organizer)) {
          score += 5;
        }
      }
      
      return { tournament, score, matches: score > 0 };
    });
    
    // Filter out non-matching tournaments and sort by relevance
    filtered = tournamentsWithScores
      .filter(item => item.matches)
      .sort((a, b) => b.score - a.score) // Higher score first
      .map(item => item.tournament);
  }

  // Apply city filter
  if (filters.cities.length > 0) {
    filtered = filtered.filter((tournament) => {
      const tournamentCity = (tournament.city || '').toLowerCase();
      const location = (tournament.location || tournament.venue || '').toLowerCase();
      
      return filters.cities.some((city) => {
        const cityLower = city.toLowerCase().trim();
        // Check exact city field
        if (tournamentCity && tournamentCity.includes(cityLower)) {
          return true;
        }
        // Also check location/venue field for city name (e.g., "Charlotte, NC")
        if (location && location.includes(cityLower)) {
          return true;
        }
        return false;
      });
    });
  }

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
      // Check tournament-wide min rating
      if (tournament.minRating !== undefined && tournament.minRating !== null) {
        return tournament.minRating <= filters.minRating!;
      }
      // Check section min ratings
      if (tournament.sections && tournament.sections.length > 0) {
        return tournament.sections.some(
          (section) =>
            section.minRating === null || section.minRating === undefined || section.minRating <= filters.minRating!
        );
      }
      // If no rating requirement, include it
      return true;
    });
  }

  if (filters.maxRating !== null) {
    filtered = filtered.filter((tournament) => {
      // Check tournament-wide max rating
      if (tournament.maxRating !== undefined && tournament.maxRating !== null) {
        return tournament.maxRating >= filters.maxRating!;
      }
      // Check section max ratings
      if (tournament.sections && tournament.sections.length > 0) {
        return tournament.sections.some(
          (section) =>
            section.maxRating === null || section.maxRating === undefined || section.maxRating >= filters.maxRating!
        );
      }
      // If no rating requirement, include it
      return true;
    });
  }

  // Apply rating type filter
  if (filters.ratingTypes && filters.ratingTypes.length > 0) {
    filtered = filtered.filter((tournament) => {
      // Check if tournament has ratingType field
      if (tournament.ratingType) {
        return filters.ratingTypes.includes(tournament.ratingType);
      }
      // Legacy support: check fideRated field
      if (filters.ratingTypes.includes('FIDE') && tournament.fideRated) {
        return true;
      }
      // If no rating type specified, exclude from results
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
          // TimeControl object - use category or format
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
      if (!level) return false; // Exclude tournaments without a level if filtering
      return filters.tournamentLevels.some((filterLevel) => {
        const filterLevelLower = filterLevel.toLowerCase().trim();
        // Exact match or contains match
        return level === filterLevelLower || level.includes(filterLevelLower);
      });
    });
  }

  // Apply price range filter
  if (filters.priceRange.min !== null) {
    filtered = filtered.filter((tournament) => {
      // Check sections entry fees
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
      // Check base price
      if (tournament.price) {
        const priceStr = tournament.price.replace(/[^0-9.]/g, '');
        const price = parseFloat(priceStr);
        if (!isNaN(price)) {
          return price >= filters.priceRange.min!;
        }
      }
      // If no price info, exclude if min price is set
      return false;
    });
  }

  if (filters.priceRange.max !== null) {
    filtered = filtered.filter((tournament) => {
      // Check sections entry fees
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
      // Check base price
      if (tournament.price) {
        const priceStr = tournament.price.replace(/[^0-9.]/g, '');
        const price = parseFloat(priceStr);
        if (!isNaN(price)) {
          return price <= filters.priceRange.max!;
        }
      }
      // If no price info, include it (might be free)
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
      // If no deadline, check if tournament hasn't started
      const startDate = tournament.startDate
        ? new Date(tournament.startDate)
        : tournament.date
        ? new Date(tournament.date)
        : null;
      if (startDate && !isNaN(startDate.getTime())) {
        return startDate >= now;
      }
      return true; // Include if we can't determine
    });
  }

  return filtered;
}

/**
 * Extract unique countries from tournaments
 */
export function getUniqueCountries(tournaments: EventData[]): string[] {
  const countries = new Set<string>();
  tournaments.forEach((tournament) => {
    if (tournament.country) {
      countries.add(tournament.country);
    }
  });
  return Array.from(countries).sort();
}

/**
 * Extract unique cities from tournaments
 */
export function getUniqueCities(tournaments: EventData[]): string[] {
  const cities = new Set<string>();
  tournaments.forEach((tournament) => {
    if (tournament.city) {
      cities.add(tournament.city);
    }
  });
  return Array.from(cities).sort();
}

