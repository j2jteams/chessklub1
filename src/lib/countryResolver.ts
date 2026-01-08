/**
 * Country Code Resolver
 * 
 * Resolves country names/aliases to ISO-3166-1 alpha-2 codes
 * First tries normalizeCountryCode, then maps common aliases
 */

import { normalizeCountryCode } from './locationNormalizer';

/**
 * Map common country aliases/names to ISO-2 codes
 */
const countryAliasMap: { [key: string]: string } = {
  'usa': 'US',
  'united states': 'US',
  'united states of america': 'US',
  'uk': 'GB',
  'united kingdom': 'GB',
  'britain': 'GB',
  'great britain': 'GB',
  'england': 'GB',
  'india': 'IN',
};

/**
 * Resolve country code from input (code, alias, or name)
 * 
 * @param input - Country code, alias, or name (e.g., "US", "usa", "United States")
 * @returns ISO-3166-1 alpha-2 code or undefined
 */
export function resolveCountryCode(input?: string | null): string | undefined {
  if (!input) return undefined;
  
  // First try normalizeCountryCode (handles ISO-2 codes directly)
  const normalized = normalizeCountryCode(input);
  if (normalized) {
    return normalized;
  }
  
  // Try mapping common aliases/names
  const inputLower = input.toLowerCase().trim();
  const mapped = countryAliasMap[inputLower];
  if (mapped) {
    return normalizeCountryCode(mapped);
  }
  
  return undefined;
}



