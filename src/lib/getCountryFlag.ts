/**
 * Simple, direct country flag utility
 * Handles all country code resolution and flag generation in one place
 */

/**
 * Map common country names/aliases to ISO-2 codes
 */
const COUNTRY_MAP: Record<string, string> = {
  // United States
  'usa': 'US',
  'united states': 'US',
  'united states of america': 'US',
  'us': 'US',
  
  // United Kingdom
  'uk': 'GB',
  'united kingdom': 'GB',
  'britain': 'GB',
  'great britain': 'GB',
  'england': 'GB',
  'gb': 'GB',
  
  // India
  'india': 'IN',
  'in': 'IN',
  
  // Canada
  'canada': 'CA',
  'ca': 'CA',
};

/**
 * Normalize country code to ISO-2 format
 */
function normalizeCode(input?: string | null): string | undefined {
  if (!input) return undefined;
  
  const trimmed = input.trim().toUpperCase();
  
  // Already a valid ISO-2 code
  if (/^[A-Z]{2}$/.test(trimmed)) {
    return trimmed === 'UK' ? 'GB' : trimmed;
  }
  
  // Try mapping
  const mapped = COUNTRY_MAP[input.toLowerCase().trim()];
  if (mapped) {
    return mapped;
  }
  
  return undefined;
}

/**
 * Generate flag emoji from ISO-2 country code
 */
function generateFlagEmoji(code: string): string {
  if (!code || code.length !== 2) {
    console.warn('🏳️ [generateFlagEmoji] Invalid code:', code);
    return '';
  }
  
  try {
    const codePoints = code
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    
    const flag = String.fromCodePoint(...codePoints);
    return flag;
  } catch (error) {
    console.error('🏳️ [generateFlagEmoji] Error generating flag:', error, { code });
    return '';
  }
}

/**
 * Get country flag emoji from tournament data
 * Tries multiple sources in order of preference
 */
export function getCountryFlagFromTournament(tournament: {
  structuredLocation?: { countryCode?: string | null } | string | null;
  countryCode?: string | null;
  country?: string | null;
  location?: string | null;
  venue?: string | null;
  title?: string | null;
  name?: string | null;
}): string {
  // Priority 1: structuredLocation.countryCode
  // Handle case where structuredLocation might be a string (legacy data)
  let structuredLoc = tournament.structuredLocation;
  if (typeof structuredLoc === 'string') {
    const normalized = normalizeCode(structuredLoc);
    if (normalized) {
      const flag = generateFlagEmoji(normalized);
      return flag;
    }
  } else if (structuredLoc && typeof structuredLoc === 'object') {
    const code = structuredLoc.countryCode;
    if (code) {
      const normalized = normalizeCode(code);
      if (normalized) {
        const flag = generateFlagEmoji(normalized);
        return flag;
      }
    }
  }
  
  // Priority 2: direct countryCode field
  let code = tournament.countryCode;
  if (code) {
    const normalized = normalizeCode(code);
    if (normalized) {
      const flag = generateFlagEmoji(normalized);
      return flag;
    }
  }
  
  // Priority 3: legacy country field
  code = tournament.country;
  if (code) {
    const normalized = normalizeCode(code);
    if (normalized) {
      const flag = generateFlagEmoji(normalized);
      return flag;
    }
  }
  
  // Try to extract from location string as last resort
  const location = (tournament as any).location || (tournament as any).venue || '';
  if (location) {
    const locationLower = location.toLowerCase();
    
    // Simple patterns for common countries
    if (locationLower.includes(', usa') || locationLower.includes(', us') || 
        locationLower.includes('charlotte') || locationLower.includes('ballantyne') ||
        locationLower.includes('fort mill') || locationLower.includes('newark')) {
      const flag = generateFlagEmoji('US');
      return flag;
    }
    
    if (locationLower.includes('india') || locationLower.includes('bengaluru') || 
        locationLower.includes('bangalore') || locationLower.includes('mumbai') ||
        locationLower.includes('delhi') || locationLower.includes('chennai')) {
      const flag = generateFlagEmoji('IN');
      return flag;
    }
    
    // Check title too
    const title = (tournament as any).title || (tournament as any).name || '';
    const titleLower = title.toLowerCase();
    if (titleLower.includes('india')) {
      const flag = generateFlagEmoji('IN');
      return flag;
    }
  }
  return '';
}

/**
 * Get country code from tournament data (for display)
 */
export function getCountryCodeFromTournament(tournament: {
  structuredLocation?: { countryCode?: string | null };
  countryCode?: string | null;
  country?: string | null;
  location?: string | null;
  venue?: string | null;
  title?: string | null;
  name?: string | null;
}): string | undefined {
  // Priority 1: structuredLocation.countryCode
  let code = tournament.structuredLocation?.countryCode;
  if (code) {
    const normalized = normalizeCode(code);
    if (normalized) return normalized;
  }
  
  // Priority 2: direct countryCode field
  code = tournament.countryCode;
  if (code) {
    const normalized = normalizeCode(code);
    if (normalized) return normalized;
  }
  
  // Priority 3: legacy country field
  code = tournament.country;
  if (code) {
    const normalized = normalizeCode(code);
    if (normalized) return normalized;
  }
  
  // Priority 4: Infer from location/venue string
  const location = tournament.location || tournament.venue || '';
  if (location) {
    const locationLower = location.toLowerCase();
    if (locationLower.includes(', usa') || locationLower.includes(', us') || 
        locationLower.includes('charlotte') || locationLower.includes('ballantyne') ||
        locationLower.includes('fort mill') || locationLower.includes('newark')) {
      return 'US';
    }
    if (locationLower.includes('india') || locationLower.includes('bengaluru') || 
        locationLower.includes('bangalore') || locationLower.includes('mumbai') ||
        locationLower.includes('delhi') || locationLower.includes('chennai')) {
      return 'IN';
    }
  }
  
  // Priority 5: Infer from title
  const title = tournament.title || tournament.name || '';
  const titleLower = title.toLowerCase();
  if (titleLower.includes('india')) {
    return 'IN';
  }
  
  return undefined;
}

