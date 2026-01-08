import { EventData, PricingTier } from './types';
import { normalizeCountryCode } from './locationNormalizer';

/**
 * Format date for display (e.g., "Dec 5, 2025")
 */
export function formatDisplayDate(dateStr: string | Date | undefined): string {
  if (!dateStr) return '';
  try {
    const date = dateStr instanceof Date ? dateStr : new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return typeof dateStr === 'string' ? dateStr : '';
  }
}

/**
 * Get urgency label based on start date
 * Returns urgency text or null if not urgent
 */
export function getUrgencyLabel(tournament: EventData): { text: string; color: string } | null {
  if (!tournament.startDate && !tournament.date) return null;
  
  try {
    const startDate = tournament.startDate 
      ? (tournament.startDate instanceof Date ? tournament.startDate : new Date(tournament.startDate))
      : tournament.date
      ? new Date(tournament.date) // tournament.date is typed as string, so always convert to Date
      : null;
    
    if (!startDate || isNaN(startDate.getTime())) return null;
    
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const eventDate = new Date(startDate);
    eventDate.setHours(0, 0, 0, 0);
    
    const diffTime = eventDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { text: 'Event finished', color: 'text-gray-500' };
    } else if (diffDays === 0) {
      return { text: '🟢 Starts today', color: 'text-green-600' };
    } else if (diffDays <= 3) {
      return { text: `⏳ Starts in ${diffDays} day${diffDays !== 1 ? 's' : ''}`, color: 'text-orange-600' };
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Check if tournament is online
 */
export function isOnline(tournament: EventData): boolean {
  const hasLocation = tournament.coordinates || tournament.venue || 
    (tournament.location && !tournament.location.toLowerCase().includes('online'));
  const venueType = tournament.venueType || (hasLocation ? 'In-person' : 'Online');
  return venueType === 'Online' || venueType.toLowerCase() === 'online';
}

/**
 * Format price for display with currency symbol using Intl.NumberFormat
 */
export function formatPrice(price: number | null | undefined, currency: string = 'USD'): string {
  if (price === null || price === undefined || price === 0) {
    return 'Free';
  }
  
  // Normalize currency code (uppercase)
  const normalizedCurrency = currency.toUpperCase();
  
  // Round to 2 decimal places to avoid floating point precision issues
  const roundedPrice = Math.round(price * 100) / 100;
  
  // Check if price is a whole number (no decimal part)
  const isWholeNumber = roundedPrice % 1 === 0;
  
  try {
    // Use Intl.NumberFormat for proper currency formatting
    // If it's a whole number, don't show decimals
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: normalizedCurrency,
      minimumFractionDigits: isWholeNumber ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(roundedPrice);
  } catch (error) {
    // Fallback if currency code is invalid or not supported
    // Format with decimals only if needed
    if (isWholeNumber) {
      return `${normalizedCurrency} ${roundedPrice.toFixed(0)}`;
    }
    return `${normalizedCurrency} ${roundedPrice.toFixed(2)}`;
  }
}

/**
 * Get price value from tournament, considering location-based pricing
 * @param tournament - The tournament/event data
 * @param countryCode - Optional country code to match location-specific pricing (e.g., "IN" for India)
 * @returns Object with price, currency, and tier info, or null if free
 */
export function getTournamentPrice(
  tournament: EventData, 
  countryCode?: string
): { price: number; currency: string; tier?: PricingTier } | null {
  // Check pricing tiers first (new system)
  if (tournament.pricingTiers && Array.isArray(tournament.pricingTiers) && tournament.pricingTiers.length > 0) {
    // Normalize input country code
    const normalizedInputCode = countryCode ? normalizeCountryCode(countryCode) : undefined;
    
    // If normalized country code is provided, try to find a matching country-specific tier
    if (normalizedInputCode) {
      const countryTier = tournament.pricingTiers.find(tier => {
        if (!tier.countryCode) return false;
        // Normalize tier's country code for comparison
        const normalizedTierCode = normalizeCountryCode(tier.countryCode);
        return normalizedTierCode === normalizedInputCode;
      });
      
      if (countryTier && typeof countryTier.price === 'number' && countryTier.price > 0) {
        return {
          price: countryTier.price,
          currency: countryTier.currency || 'USD',
          tier: countryTier
        };
      }
    }
    
    // Fallback to global tier (no countryCode) or first tier
    const globalTier = tournament.pricingTiers.find(tier => !tier.countryCode) || tournament.pricingTiers[0];
    if (globalTier && typeof globalTier.price === 'number' && globalTier.price > 0) {
      return {
        price: globalTier.price,
        currency: globalTier.currency || 'USD',
        tier: globalTier
      };
    }
  }
  
  // Check sections (for tournaments with multiple rating sections)
  if (tournament.category === 'tournament' && tournament.sections && tournament.sections.length > 0) {
    const sectionsWithFee = tournament.sections.filter((s: any) => s.entryFee !== null && s.entryFee !== undefined);
    if (sectionsWithFee.length > 0) {
      const fees = sectionsWithFee.map((s: any) => s.entryFee!);
      return {
        price: Math.min(...fees),
        currency: 'USD' // Default for legacy sections
      };
    }
  }
  
  // Legacy price field
  if (tournament.price) {
    const priceStr = tournament.price.trim().replace(/[$₹€£]/, '');
    const numPrice = parseFloat(priceStr);
    if (!isNaN(numPrice) && numPrice > 0) {
      return {
        price: numPrice,
        currency: 'USD' // Default for legacy price
      };
    }
  }
  
  return null;
}

/**
 * Get tournament start date for sorting
 */
export function getTournamentStartDate(tournament: EventData): Date | null {
  try {
    if (tournament.startDate) {
      return tournament.startDate instanceof Date ? tournament.startDate : new Date(tournament.startDate);
    }
    if (tournament.date) {
      return new Date(tournament.date); // tournament.date is typed as string, so always convert to Date
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Get tournament creation date for sorting
 */
export function getTournamentCreatedDate(tournament: EventData): Date | null {
  try {
    if (tournament.createdAt) {
      return tournament.createdAt instanceof Date ? tournament.createdAt : new Date(tournament.createdAt);
    }
    return null;
  } catch {
    return null;
  }
}

