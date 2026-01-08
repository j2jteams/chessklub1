/**
 * Generate country flag emoji from ISO-3166-1 alpha-2 country code
 * Uses Unicode regional indicator symbols for better compatibility
 */
export function getCountryFlagEmoji(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) {
    return '';
  }

  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0)); // Regional Indicator Symbol Letter A (🇦) is U+1F1E6

  return String.fromCodePoint(...codePoints);
}

/**
 * Get country flag emoji (thin wrapper around getCountryFlagEmoji)
 * Accepts ISO-2 country code only
 */
export function getCountryFlag(countryCode?: string): string {
  if (!countryCode) {
    return '';
  }

  return getCountryFlagEmoji(countryCode);
}
