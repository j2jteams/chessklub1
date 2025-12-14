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
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
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
    // If tournament has coordinates, calculate distance
    if (tournament.coordinates && tournament.coordinates.lat && tournament.coordinates.lng) {
      const distance = calculateDistance(
        userLat,
        userLng,
        tournament.coordinates.lat,
        tournament.coordinates.lng
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

