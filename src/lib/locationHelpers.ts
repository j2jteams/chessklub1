/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Get user's current location using browser geolocation API
 */
export function getUserLocation(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        // Provide more detailed error information
        let errorMessage = 'Unable to get your location';
        let errorCode: number | undefined = undefined;
        
        // Handle GeolocationPositionError
        if (error) {
          errorCode = error.code;
          switch (error.code) {
            case 1: // PERMISSION_DENIED
            case error.PERMISSION_DENIED:
              errorMessage = 'Location permission denied by user';
              break;
            case 2: // POSITION_UNAVAILABLE
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable. Please check your device location settings.';
              break;
            case 3: // TIMEOUT
            case error.TIMEOUT:
              errorMessage = 'Location request timed out. Please try again.';
              break;
            default:
              errorMessage = error.message || 'Unknown location error';
              break;
          }
        }
        
        const detailedError: any = new Error(errorMessage);
        detailedError.code = errorCode;
        detailedError.name = 'GeolocationError';
        
        // Log error details (avoid logging the full error object which might not serialize)
        // Use console.warn instead of console.error to avoid triggering Next.js error overlay
        console.warn('⚠️ Geolocation API error (non-critical):', {
          code: errorCode,
          message: errorMessage,
          errorType: errorCode === 1 ? 'PERMISSION_DENIED' : errorCode === 2 ? 'POSITION_UNAVAILABLE' : errorCode === 3 ? 'TIMEOUT' : 'UNKNOWN',
          note: 'This is expected if location services are disabled. The app will continue to work without location.'
        });
        
        // Reject with a non-throwing error (components should catch this)
        reject(detailedError);
      },
      {
        enableHighAccuracy: false, // Set to false for faster response
        timeout: 8000, // Reduced from 10s to 8s
        maximumAge: 60000, // Accept cached location up to 1 minute old
      }
    );
  });
}

/**
 * Reverse geocode coordinates to get country code and name
 * Uses Nominatim (OpenStreetMap) - free, no API key required
 * Returns both country code and country name for better matching
 */
export async function getCountryFromCoordinates(
  lat: number,
  lng: number
): Promise<{ code: string; name: string } | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'ChessTourneys/1.0 (https://chessklub.com)',
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const countryCode = data.address?.country_code?.toUpperCase();
    const countryName = data.address?.country;
    
    if (countryCode) {
      return {
        code: countryCode,
        name: countryName || countryCode,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    return null;
  }
}

/**
 * Filter tournaments by distance from user location
 * Also includes tournaments without coordinates if they're in the same city/state (fallback)
 */
export function filterByDistance(
  tournaments: any[],
  userLat: number,
  userLng: number,
  maxDistanceKm: number = 160 // Default to 100 miles
): any[] {
  return tournaments.filter((tournament) => {
    // Get coordinates from structuredLocation or legacy coordinates field
    const coords = tournament.structuredLocation?.geo 
      ? { lat: tournament.structuredLocation.geo.latitude, lng: tournament.structuredLocation.geo.longitude }
      : tournament.coordinates;
    
    // Validate coordinates (0 is a valid coordinate, use typeof check)
    if (typeof coords?.lat === 'number' && typeof coords?.lng === 'number') {
      const distance = calculateDistance(
        userLat,
        userLng,
        coords.lat,
        coords.lng
      );
      return distance <= maxDistanceKm;
    }
    
    // If no coordinates, exclude from distance-based filtering
    // (will be included in country-based filtering instead)
    return false;
  });
}

/**
 * Get country name variations for matching
 * Maps country codes to common name variations
 */
function getCountryVariations(countryCode: string, countryName?: string): string[] {
  const normalizedCode = countryCode.toUpperCase();
  const variations: string[] = [normalizedCode];
  
  // Add country name if provided
  if (countryName) {
    variations.push(countryName.toUpperCase());
    // Also add without spaces and with hyphens
    variations.push(countryName.toUpperCase().replace(/\s+/g, ''));
    variations.push(countryName.toUpperCase().replace(/\s+/g, '-'));
  }

  // Map common country code variations for major countries
  const countryMap: Record<string, string[]> = {
    'US': ['US', 'USA', 'UNITED STATES', 'UNITED STATES OF AMERICA', 'U.S.', 'U.S.A.', 'AMERICA'],
    'GB': ['GB', 'UK', 'UNITED KINGDOM', 'GREAT BRITAIN', 'ENGLAND', 'SCOTLAND', 'WALES', 'BRITAIN'],
    'CA': ['CA', 'CANADA'],
    'AU': ['AU', 'AUSTRALIA'],
    'IN': ['IN', 'INDIA'],
    'RU': ['RU', 'RUSSIA', 'RUSSIAN FEDERATION'],
    'CN': ['CN', 'CHINA', 'PEOPLES REPUBLIC OF CHINA'],
    'UA': ['UA', 'UKRAINE'],
    'FR': ['FR', 'FRANCE'],
    'DE': ['DE', 'GERMANY', 'DEUTSCHLAND'],
    'ES': ['ES', 'SPAIN', 'ESPANA'],
    'PL': ['PL', 'POLAND'],
    'NL': ['NL', 'NETHERLANDS', 'HOLLAND'],
    'IT': ['IT', 'ITALY', 'ITALIA'],
    'BR': ['BR', 'BRAZIL', 'BRASIL'],
    'MX': ['MX', 'MEXICO'],
    'AR': ['AR', 'ARGENTINA'],
    'JP': ['JP', 'JAPAN'],
    'KR': ['KR', 'SOUTH KOREA', 'KOREA', 'REPUBLIC OF KOREA'],
    'PH': ['PH', 'PHILIPPINES'],
    'ID': ['ID', 'INDONESIA'],
    'VN': ['VN', 'VIETNAM', 'VIET NAM'],
    'TH': ['TH', 'THAILAND'],
    'MY': ['MY', 'MALAYSIA'],
    'SG': ['SG', 'SINGAPORE'],
    'BD': ['BD', 'BANGLADESH'],
    'PK': ['PK', 'PAKISTAN'],
    'EG': ['EG', 'EGYPT'],
    'ZA': ['ZA', 'SOUTH AFRICA'],
    'NG': ['NG', 'NIGERIA'],
    'TR': ['TR', 'TURKEY', 'TURKIYE'],
    'GR': ['GR', 'GREECE'],
    'PT': ['PT', 'PORTUGAL'],
    'IE': ['IE', 'IRELAND', 'EIRE'],
    'NZ': ['NZ', 'NEW ZEALAND'],
    'SA': ['SA', 'SAUDI ARABIA'],
    'AE': ['AE', 'UNITED ARAB EMIRATES', 'UAE'],
  };

  if (countryMap[normalizedCode]) {
    variations.push(...countryMap[normalizedCode]);
  }

  return [...new Set(variations)]; // Remove duplicates
}

/**
 * Filter tournaments by country
 * Works for any country by matching country codes and names in various formats
 */
export function filterByCountry(
  tournaments: any[],
  countryCode: string,
  countryName?: string
): any[] {
  const variations = getCountryVariations(countryCode, countryName);
  const variationsLower = variations.map(v => v.toLowerCase());

  return tournaments.filter((tournament) => {
    // Check explicit country field
    if (tournament.country) {
      const tournamentCountry = tournament.country.toUpperCase();
      if (variations.some(v => {
        const vUpper = v.toUpperCase();
        return tournamentCountry === vUpper || 
               tournamentCountry.includes(vUpper) ||
               vUpper.includes(tournamentCountry);
      })) {
        return true;
      }
    }

    // Fallback: check location/venue fields for country name or code
    const location = (tournament.location || tournament.venue || '').toLowerCase();
    
    // Check for any country variation in location
    for (const variation of variationsLower) {
      // Exact match or contains match
      if (location.includes(variation) || 
          location.includes(variation.replace(/\s+/g, '-')) ||
          location.includes(variation.replace(/\s+/g, ''))) {
        return true;
      }
    }

    // Special handling for US - check for state abbreviations
    if (countryCode.toUpperCase() === 'US') {
      const usStates = ['al', 'ak', 'az', 'ar', 'ca', 'co', 'ct', 'de', 'fl', 'ga', 'hi', 'id', 'il', 'in', 'ia', 'ks', 'ky', 'la', 'me', 'md', 'ma', 'mi', 'mn', 'ms', 'mo', 'mt', 'ne', 'nv', 'nh', 'nj', 'nm', 'ny', 'nc', 'nd', 'oh', 'ok', 'or', 'pa', 'ri', 'sc', 'sd', 'tn', 'tx', 'ut', 'vt', 'va', 'wa', 'wv', 'wi', 'wy', 'dc'];
      const locationParts = location.split(/[,\s]+/);
      if (locationParts.some((part: string) => usStates.includes(part.toLowerCase()))) {
        return true;
      }
    }

    return false;
  });
}

/**
 * Filter tournaments by nearby cities (within 200km but beyond 160km)
 * This represents "nearby cities" tier
 * 
 * @deprecated Use progressiveRadiusExpansion instead
 * Kept for backward compatibility during migration
 */
export function filterByNearbyCities(
  tournaments: any[],
  userLat: number,
  userLng: number,
  maxDistanceKm: number = 200
): any[] {
  return tournaments.filter((tournament) => {
    // Get coordinates from structuredLocation or legacy coordinates field
    const coords = tournament.structuredLocation?.geo 
      ? { lat: tournament.structuredLocation.geo.latitude, lng: tournament.structuredLocation.geo.longitude }
      : tournament.coordinates;
    
    // Validate coordinates (0 is a valid coordinate, use typeof check)
    if (typeof coords?.lat === 'number' && typeof coords?.lng === 'number') {
      const distance = calculateDistance(
        userLat,
        userLng,
        coords.lat,
        coords.lng
      );
      // Include tournaments within the "nearby cities" radius but beyond "nearby" radius
      return distance > 160 && distance <= maxDistanceKm;
    }
    return false;
  });
}

/**
 * Progressive Radius Expansion Query
 * 
 * Filters tournaments by expanding radius until minimum results are found.
 * 
 * Strategy:
 * 1) Query within initialRadius (default 25 miles)
 * 2) If results < minResults → expand to 100 miles
 * 3) If still < minResults → expand to 300 miles
 * 4) If still < minResults → fallback to countryCode
 * 5) Final fallback → return all (global)
 * 
 * @param tournaments - Array of tournaments to filter
 * @param center - Center point { lat, lng }
 * @param initialRadiusMiles - Starting radius in miles (default 25)
 * @param minResults - Minimum results before expanding (default 20)
 * @param countryCode - Optional country code for fallback
 * @returns Object with filtered tournaments, final radius used, and expansion info
 */
export interface RadiusExpansionResult {
  tournaments: any[];
  finalRadiusMiles: number;
  expanded: boolean;
  expansionMessage?: string;
}

export function progressiveRadiusExpansion(
  tournaments: any[],
  center: { lat: number; lng: number },
  initialRadiusMiles: number = 25,
  minResults: number = 20,
  countryCode?: string
): RadiusExpansionResult {
  const radiusSteps = [
    initialRadiusMiles,
    100,  // 100 miles
    300,  // 300 miles
  ];

  // Convert miles to km for distance calculation
  const milesToKm = (miles: number) => miles * 1.60934;

  // Separate tournaments with and without coordinates
  const tournamentsWithCoords: any[] = [];
  const tournamentsWithoutCoords: any[] = [];
  
  tournaments.forEach(t => {
    const coords = t.structuredLocation?.geo 
      ? { lat: t.structuredLocation.geo.latitude, lng: t.structuredLocation.geo.longitude }
      : t.coordinates;
    
    if (coords && typeof coords.lat === 'number' && typeof coords.lng === 'number') {
      tournamentsWithCoords.push(t);
    } else {
      tournamentsWithoutCoords.push(t);
    }
  });

  // Try each radius step for tournaments with coordinates
  for (let i = 0; i < radiusSteps.length; i++) {
    const radiusMiles = radiusSteps[i];
    const radiusKm = milesToKm(radiusMiles);
    
    const filtered = tournamentsWithCoords.filter(t => {
      const coords = t.structuredLocation?.geo 
        ? { lat: t.structuredLocation.geo.latitude, lng: t.structuredLocation.geo.longitude }
        : t.coordinates;
      if (!coords) return false;
      
      const distance = calculateDistance(center.lat, center.lng, coords.lat, coords.lng);
      return distance <= radiusKm;
    });

    if (filtered.length >= minResults || i === radiusSteps.length - 1) {
      // Found enough results or reached last step
      // Include tournaments without coordinates if we're showing country-level or global
      let finalTournaments = filtered;
      if (i === radiusSteps.length - 1 || filtered.length < minResults) {
        // If we expanded to max radius or didn't find enough, include country matches from tournaments without coords
        if (countryCode) {
          const countryMatches = filterByCountry(tournamentsWithoutCoords, countryCode);
          finalTournaments = [...filtered, ...countryMatches];
        } else {
          // No country filter - include all tournaments without coords at the end
          finalTournaments = [...filtered, ...tournamentsWithoutCoords];
        }
      }
      
      return {
        tournaments: finalTournaments,
        finalRadiusMiles: radiusMiles,
        expanded: i > 0,
        expansionMessage: i > 0 ? `Expanded to ${radiusMiles} miles to show more results.` : undefined
      };
    }
  }

  // Fallback to country if provided
  if (countryCode) {
    const countryFilteredWithCoords = filterByCountry(tournamentsWithCoords, countryCode);
    const countryFilteredWithoutCoords = filterByCountry(tournamentsWithoutCoords, countryCode);
    const allCountryMatches = [...countryFilteredWithCoords, ...countryFilteredWithoutCoords];
    
    if (allCountryMatches.length > 0) {
      return {
        tournaments: allCountryMatches,
        finalRadiusMiles: Infinity, // Indicates country-level
        expanded: true,
        expansionMessage: `Showing tournaments in your country.`
      };
    }
  }

  // Final fallback: return all tournaments (with and without coordinates)
  return {
    tournaments: tournaments, // Includes both with and without coords
    finalRadiusMiles: Infinity,
    expanded: true,
    expansionMessage: `Showing all tournaments.`
  };
}

/**
 * Filter tournaments within a specific radius (in miles)
 */
export function filterByRadius(
  tournaments: any[],
  center: { lat: number; lng: number },
  radiusMiles: number
): any[] {
  const radiusKm = radiusMiles * 1.60934;
  
  return tournaments.filter(t => {
    const coords = t.structuredLocation?.geo 
      ? { lat: t.structuredLocation.geo.latitude, lng: t.structuredLocation.geo.longitude }
      : t.coordinates;
    
    if (!coords || typeof coords.lat !== 'number' || typeof coords.lng !== 'number') {
      return false;
    }
    
    const distance = calculateDistance(center.lat, center.lng, coords.lat, coords.lng);
    return distance <= radiusKm;
  });
}

/**
 * Calculate distance in miles (wrapper for calculateDistance)
 */
export function calculateDistanceMiles(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const km = calculateDistance(lat1, lon1, lat2, lon2);
  return km / 1.60934;
}

