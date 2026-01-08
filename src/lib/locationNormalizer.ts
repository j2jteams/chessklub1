/**
 * Location Normalization Utility
 * 
 * Converts form data + autocomplete results into normalized EventLocation object
 * Computes geo, geohash, timezone, regionTag during create/edit
 * 
 * NOTE: This is called during form submission, NOT during listing queries
 */

import { EventLocation } from './types';
import * as ngeohash from 'ngeohash';

/**
 * Normalize country code to ISO-2 format
 * - Trims whitespace
 * - Converts to uppercase
 * - Maps UK -> GB
 * - Validates /^[A-Z]{2}$/
 * - Returns undefined if invalid/empty
 */
export function normalizeCountryCode(input?: string | null): string | undefined {
  if (!input) return undefined;
  const trimmed = input.trim();
  if (!trimmed) return undefined;
  
  let normalized = trimmed.toUpperCase();
  
  // Alias UK -> GB
  if (normalized === 'UK') {
    normalized = 'GB';
  }
  
  // Validate ISO-2 format (exactly 2 uppercase letters)
  if (!/^[A-Z]{2}$/.test(normalized)) {
    return undefined;
  }
  
  return normalized;
}

export interface LocationFormData {
  // User input fields
  venueName?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  admin1?: string; // State/Province
  postalCode?: string;
  countryCode?: string;
  locationType: 'in_person' | 'online' | 'hybrid';
  
  // Online-specific
  onlinePlatform?: 'Zoom' | 'Chess.com' | 'Lichess' | 'Custom';
  onlineAccessType?: 'public' | 'registered_only';
  onlineUrl?: string;
  
  // Autocomplete result (from Google Places / Mapbox)
  autocompleteResult?: {
    placeId?: string;
    coordinates?: { lat: number; lng: number };
    formattedAddress?: string;
    addressComponents?: {
      longName: string;
      shortName: string;
      types: string[];
    }[];
  };
  
  // Overrides
  timezone?: string;
  publicPrecision?: 'exact' | 'venue_city' | 'city_only';
}

/**
 * Normalize location data from form + autocomplete
 * 
 * This function:
 * 1. Extracts structured fields from form data
 * 2. Uses autocomplete result to fill in missing geo data
 * 3. Computes geo, geohash, timezone, regionTag
 * 4. Returns normalized EventLocation object
 */
export async function normalizeLocation(
  formData: LocationFormData
): Promise<EventLocation> {
  const location: EventLocation = {
    type: formData.locationType,
  };

  // For online events, only set online fields
  if (formData.locationType === 'online') {
    location.onlinePlatform = formData.onlinePlatform;
    location.onlineAccessType = formData.onlineAccessType || 'public';
    location.onlineUrl = formData.onlineUrl;
    // Set privacy precision for online events
    location.publicPrecision = formData.publicPrecision || 'venue_city';
    return location;
  }

  // For in_person or hybrid, set address fields
  if (formData.venueName) location.venueName = formData.venueName;
  if (formData.addressLine1) location.addressLine1 = formData.addressLine1;
  if (formData.addressLine2) location.addressLine2 = formData.addressLine2;
  if (formData.city) location.city = formData.city;
  if (formData.admin1) location.admin1 = formData.admin1;
  if (formData.postalCode) location.postalCode = formData.postalCode;
  // Normalize country code before storing
  const normalizedCountryCode = normalizeCountryCode(formData.countryCode);
  if (normalizedCountryCode) location.countryCode = normalizedCountryCode;

  // Set online fields for hybrid
  if (formData.locationType === 'hybrid') {
    location.onlinePlatform = formData.onlinePlatform;
    location.onlineAccessType = formData.onlineAccessType || 'public';
    location.onlineUrl = formData.onlineUrl;
  }

  // Extract coordinates from autocomplete or form
  let lat: number | undefined;
  let lng: number | undefined;

  if (formData.autocompleteResult?.coordinates) {
    lat = formData.autocompleteResult.coordinates.lat;
    lng = formData.autocompleteResult.coordinates.lng;
  }

  // Validate coordinates before computing geo metadata (0 is a valid coordinate)
  if (typeof lat === 'number' && typeof lng === 'number') {
    location.geo = { latitude: lat, longitude: lng };
    
    // Compute geohash for efficient geo queries
    location.geohash = ngeohash.encode(lat, lng, 9); // Precision 9 (~5m accuracy)
    
    // Get timezone from coordinates (simplified - use timezone API in production)
    // Always pass normalized country code internally
    const normalizedCountryCodeForGeo = normalizeCountryCode(formData.countryCode);
    if (formData.timezone) {
      location.timezone = formData.timezone;
    } else {
      // Fallback: estimate timezone from country/coordinates
      // In production, use a timezone lookup service
      location.timezone = estimateTimezone(lat, lng, normalizedCountryCodeForGeo);
    }
    
    // Compute region tag (always pass normalized country code)
    location.regionTag = computeRegionTag(lat, lng, normalizedCountryCodeForGeo);
  }

  // Set privacy precision
  location.publicPrecision = formData.publicPrecision || 'venue_city';

  return location;
}

/**
 * Estimate timezone from coordinates and country
 * Simplified version - in production use a proper timezone lookup service
 */
function estimateTimezone(
  lat: number,
  lng: number,
  countryCode?: string
): string {
  // Basic timezone estimation based on country and longitude
  // In production, use: https://github.com/evansiroky/timezone-boundary-builder
  // or a service like Google Time Zone API
  
  // Always normalize country code first
  const normalized = normalizeCountryCode(countryCode);
  
  if (normalized === 'US') {
    // Fixed US timezone estimation by longitude (west to east)
    if (lng <= -115) return 'America/Los_Angeles';
    if (lng <= -102) return 'America/Denver';
    if (lng <= -87) return 'America/Chicago';
    return 'America/New_York';
  }
  
  if (normalized === 'GB') {
    return 'Europe/London';
  }
  
  if (normalized === 'IN') {
    return 'Asia/Kolkata';
  }
  
  // Default to UTC if unknown
  return 'UTC';
}

/**
 * Compute region tag for discovery/grouping
 */
function computeRegionTag(
  lat: number,
  lng: number,
  countryCode?: string
): string {
  // Normalize country code
  const normalized = normalizeCountryCode(countryCode);
  if (!normalized) return 'Unknown';
  
  // US regions
  if (normalized === 'US') {
    if (lat >= 40 && lng < -85) return 'US-Northeast';
    if (lat >= 35 && lat < 40 && lng < -85) return 'US-Southeast';
    if (lat >= 40 && lng >= -100 && lng < -85) return 'US-Midwest';
    if (lat >= 30 && lat < 40 && lng >= -100) return 'US-Southwest';
    if (lat >= 40 && lng >= -125) return 'US-West';
    return 'US-Other';
  }
  
  // Europe regions
  if (['GB', 'IE', 'FR', 'DE', 'ES', 'IT', 'NL', 'BE', 'PT'].includes(normalized)) {
    if (lng < 0) return 'Europe-West';
    if (lng < 15) return 'Europe-Central';
    return 'Europe-East';
  }
  
  // Asia regions
  if (['IN', 'PK', 'BD', 'LK'].includes(normalized)) {
    return 'Asia-South';
  }
  
  if (['CN', 'JP', 'KR'].includes(normalized)) {
    return 'Asia-East';
  }
  
  // Default: use normalized country code
  return normalized;
}

/**
 * Extract coordinates from existing event data (for migration/backward compatibility)
 */
export function extractCoordinatesFromEvent(event: {
  coordinates?: { lat: number; lng: number };
  structuredLocation?: EventLocation;
  city?: string;
  country?: string;
}): { lat: number; lng: number } | null {
  // Priority: structuredLocation > coordinates > null
  if (event.structuredLocation?.geo) {
    return {
      lat: event.structuredLocation.geo.latitude,
      lng: event.structuredLocation.geo.longitude
    };
  }
  
  if (event.coordinates) {
    return event.coordinates;
  }
  
  return null;
}

