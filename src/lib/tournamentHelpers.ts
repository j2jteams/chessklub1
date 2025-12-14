import { EventData } from './types';

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
 * Format price for display
 */
export function formatPrice(price: number | null | undefined, currency: string = 'USD'): string {
  if (price === null || price === undefined || price === 0) {
    return 'Free';
  }
  const symbol = currency === 'USD' ? '$' : currency;
  return `${symbol}${price.toFixed(0)}`;
}

/**
 * Get price value from tournament
 */
export function getTournamentPrice(tournament: EventData): number | null {
  if (tournament.category === 'tournament' && tournament.sections && tournament.sections.length > 0) {
    const sectionsWithFee = tournament.sections.filter((s: any) => s.entryFee !== null && s.entryFee !== undefined);
    if (sectionsWithFee.length > 0) {
      const fees = sectionsWithFee.map((s: any) => s.entryFee!);
      return Math.min(...fees);
    }
  } else if (tournament.price) {
    const priceStr = tournament.price.trim().replace('$', '');
    const numPrice = parseFloat(priceStr);
    if (!isNaN(numPrice)) {
      return numPrice;
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

