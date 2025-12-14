import { EventData } from './types';
import { TournamentFilters } from '@/components/tournaments/FilterPanel';

/**
 * Filters tournaments based on search query and filter criteria
 */
export function filterTournaments(
  tournaments: EventData[],
  searchQuery: string,
  filters: TournamentFilters
): EventData[] {
  let filtered = [...tournaments];

  // Apply search query
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase().trim();
    filtered = filtered.filter((tournament) => {
      const title = (tournament.title || tournament.name || '').toLowerCase();
      const description = (tournament.description || '').toLowerCase();
      const venue = (tournament.venue || tournament.location || '').toLowerCase();
      const city = (tournament.city || '').toLowerCase();
      const country = (tournament.country || '').toLowerCase();
      const organizer = (tournament.createdByEmail || '').toLowerCase();

      return (
        title.includes(query) ||
        description.includes(query) ||
        venue.includes(query) ||
        city.includes(query) ||
        country.includes(query) ||
        organizer.includes(query)
      );
    });
  }

  // Apply country filter
  if (filters.countries.length > 0) {
    filtered = filtered.filter((tournament) => {
      const tournamentCountry = (tournament.country || '').toLowerCase();
      const location = (tournament.location || tournament.venue || '').toLowerCase();
      
      return filters.countries.some((country) => {
        const countryLower = country.toLowerCase();
        
        // Check exact country field
        if (tournamentCountry && (
          tournamentCountry === countryLower || 
          tournamentCountry.includes(countryLower) ||
          countryLower.includes(tournamentCountry)
        )) {
          return true;
        }
        
        // Also check location/venue field for country name (e.g., "Charlotte, NC, USA")
        if (location && location.includes(countryLower)) {
          return true;
        }
        
        // Handle common country variations
        const countryVariations: { [key: string]: string[] } = {
          'united states': ['usa', 'us', 'united states of america', 'u.s.a', 'u.s.'],
          'united kingdom': ['uk', 'britain', 'great britain', 'england'],
        };
        
        // Check if tournament country matches any variation of the selected country
        const variations = countryVariations[countryLower] || [];
        if (variations.some(v => 
          tournamentCountry === v || 
          tournamentCountry.includes(v) || 
          location.includes(v)
        )) {
          return true;
        }
        
        // Reverse check: if tournament has a variation, check if it matches selected country
        for (const [key, vars] of Object.entries(countryVariations)) {
          if (vars.some(v => tournamentCountry === v || tournamentCountry.includes(v))) {
            if (key === countryLower || countryLower.includes(key)) {
              return true;
            }
          }
        }
        
        return false;
      });
    });
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

