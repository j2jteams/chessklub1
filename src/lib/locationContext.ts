/**
 * Location Context System
 * Manages user's location preferences for tournament discovery
 * 
 * LocationContext controls how listings are centered and filtered.
 * Never requests GPS on page load - only on explicit user action.
 */

export type LocationMode = 'anywhere' | 'gps' | 'place';

export interface LocationContext {
  mode: LocationMode;
  center: { lat: number; lng: number } | null;
  radiusMiles: number;
  label: string; // e.g. "Near Charlotte", "Near me", "Anywhere"
  countryCode?: string;
  source: 'gps' | 'search' | 'default';
}

const DEFAULT_CONTEXT: LocationContext = {
  mode: 'anywhere',
  center: null,
  radiusMiles: 25,
  label: 'No distance priority',
  source: 'default'
};

const STORAGE_KEY = 'lastLocationContext';
const LOCATION_HISTORY_KEY = 'locationHistory';

export interface LocationHistoryItem {
  label: string;
  center: { lat: number; lng: number };
  countryCode?: string;
  timestamp: number;
  mode: 'gps' | 'place';
}

/**
 * Get the current location context from localStorage or return default
 */
export function getLocationContext(): LocationContext {
  if (typeof window === 'undefined') {
    return DEFAULT_CONTEXT;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Validate structure
      if (parsed && typeof parsed.mode === 'string' && typeof parsed.radiusMiles === 'number') {
        return {
          ...DEFAULT_CONTEXT,
          ...parsed,
          // Ensure center is valid if mode requires it
          center: (parsed.mode !== 'anywhere' && parsed.center) ? parsed.center : null
        };
      }
    }
  } catch (error) {
    console.warn('Error reading location context from localStorage:', error);
  }

  return DEFAULT_CONTEXT;
}

/**
 * Save location context to localStorage
 */
export function setLocationContext(context: LocationContext): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(context));
    // Also add to history if it's a valid location (not "anywhere")
    if (context.mode !== 'anywhere' && context.center) {
      addToLocationHistory(context);
    }
  } catch (error) {
    console.error('Error saving location context to localStorage:', error);
  }
}

/**
 * Create a GPS-based location context (only call after user explicitly requests location)
 */
export async function createGPSContext(
  radiusMiles: number = 25
): Promise<LocationContext> {
  // Import here to avoid circular dependencies
  const { getUserLocation, getCountryFromCoordinates } = await import('./locationHelpers');
  
  try {
    const coords = await getUserLocation();
    const countryInfo = await getCountryFromCoordinates(coords.lat, coords.lng);
    
    return {
      mode: 'gps',
      center: coords,
      radiusMiles,
      label: 'Near me',
      countryCode: countryInfo?.code,
      source: 'gps'
    };
  } catch (error: any) {
    // Log as warning to avoid triggering Next.js error overlay
    console.warn('⚠️ GPS context creation failed (non-critical):', {
      message: error?.message || 'Unable to get location',
      code: error?.code,
      note: 'User can still use the app without location services'
    });
    // Re-throw so calling component can handle it gracefully
    throw error;
  }
}

/**
 * Create a place-based location context (from search/autocomplete)
 */
export function createPlaceContext(
  center: { lat: number; lng: number },
  label: string,
  radiusMiles: number = 25,
  countryCode?: string
): LocationContext {
  return {
    mode: 'place',
    center,
    radiusMiles,
    label: `Near ${label}`,
    countryCode,
    source: 'search'
  };
}

/**
 * Reset to default "anywhere" context
 */
export function resetLocationContext(): void {
  setLocationContext(DEFAULT_CONTEXT);
}

/**
 * Update radius for current context
 */
export function updateLocationRadius(context: LocationContext, radiusMiles: number): LocationContext {
  const updated = {
    ...context,
    radiusMiles,
    label: context.mode === 'anywhere' 
      ? 'Anywhere' 
      : context.mode === 'gps'
      ? 'Near me'
      : context.label.replace(/\s·\s\d+\smi/, '') + ` · ${radiusMiles} mi`
  };
  // Save to localStorage immediately
  setLocationContext(updated);
  return updated;
}

/**
 * Get location history (last 3 locations)
 */
export function getLocationHistory(): LocationHistoryItem[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const stored = localStorage.getItem(LOCATION_HISTORY_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        // Sort by timestamp (newest first) and return last 3
        return parsed
          .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
          .slice(0, 3)
          .filter(item => item.label && item.center);
      }
    }
  } catch (error) {
    console.warn('Error reading location history from localStorage:', error);
  }

  return [];
}

/**
 * Add location to history (keeps last 3)
 */
export function addToLocationHistory(context: LocationContext): void {
  if (typeof window === 'undefined' || context.mode === 'anywhere' || !context.center) {
    return;
  }

  try {
    const history = getLocationHistory();
    const newItem: LocationHistoryItem = {
      label: context.label,
      center: context.center,
      countryCode: context.countryCode,
      timestamp: Date.now(),
      mode: context.mode
    };

    // Remove duplicates (same label and similar coordinates)
    const filtered = history.filter(item => {
      const sameLabel = item.label === newItem.label;
      const similarCoords = item.center && newItem.center &&
        Math.abs(item.center.lat - newItem.center.lat) < 0.01 &&
        Math.abs(item.center.lng - newItem.center.lng) < 0.01;
      return !(sameLabel && similarCoords);
    });

    // Add new item at the beginning
    const updated = [newItem, ...filtered].slice(0, 3);
    localStorage.setItem(LOCATION_HISTORY_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving location history to localStorage:', error);
  }
}

/**
 * Create location context from history item
 */
export function createContextFromHistory(item: LocationHistoryItem, radiusMiles: number = 25): LocationContext {
  return {
    mode: item.mode === 'gps' ? 'gps' : 'place',
    center: item.center,
    radiusMiles,
    label: item.label,
    countryCode: item.countryCode,
    source: item.mode === 'gps' ? 'gps' : 'search'
  };
}

