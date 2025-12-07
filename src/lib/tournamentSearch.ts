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
      const tournamentCountry = tournament.country || '';
      return filters.countries.some((country) =>
        tournamentCountry.toLowerCase().includes(country.toLowerCase())
      );
    });
  }

  // Apply city filter
  if (filters.cities.length > 0) {
    filtered = filtered.filter((tournament) => {
      const tournamentCity = tournament.city || '';
      return filters.cities.some((city) =>
        tournamentCity.toLowerCase().includes(city.toLowerCase())
      );
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

  // Apply time control filter
  if (filters.timeControls.length > 0) {
    filtered = filtered.filter((tournament) => {
      const timeControl = (tournament.timeControl || '').toLowerCase();
      return filters.timeControls.some((control) =>
        timeControl.includes(control.toLowerCase())
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

