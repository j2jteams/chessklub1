'use client';

import { EventData, PricingTier } from '@/lib/types';
import { getTournamentPrice, formatPrice } from '@/lib/tournamentHelpers';
import { normalizeCountryCode } from '@/lib/locationNormalizer';

interface PriceSectionProps {
  event: EventData;
}

export default function PriceSection({ event }: PriceSectionProps) {
  // Get country-specific pricing (if available) or global pricing
  const eventCountryCode = event.structuredLocation?.countryCode || event.country;
  const normalizedEventCountry = normalizeCountryCode(eventCountryCode);
  const priceInfo = getTournamentPrice(event, normalizedEventCountry);
  
  // Determine if free
  const isFree = !priceInfo || priceInfo.price === 0;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      {/* Title */}
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-6 h-6 text-[#FF7A00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 className="text-2xl font-semibold">Pricing</h2>
      </div>

      {/* Divider */}
      <div className="border-b border-[#E2E2E2] mb-6"></div>

      {/* Price Display */}
      {event.pricingTiers && event.pricingTiers.length > 0 ? (
        <div className="space-y-4">
          {(() => {
            // Prioritize: country-specific tiers first, then global tiers if no country match
            const countrySpecificTiers = normalizedEventCountry
              ? event.pricingTiers.filter(tier => {
                  if (!tier.countryCode) return false;
                  const normalizedTierCountry = normalizeCountryCode(tier.countryCode);
                  return normalizedTierCountry === normalizedEventCountry;
                })
              : [];
            
            const globalTiers = event.pricingTiers.filter(tier => !tier.countryCode);
            
            // Show country-specific tiers if available, otherwise show global tiers
            const tiersToShow = countrySpecificTiers.length > 0 ? countrySpecificTiers : globalTiers;
            
            if (tiersToShow.length === 0) {
              // No matching tiers - show fallback from getTournamentPrice
              return (
                <div>
                  {isFree ? (
                    <p className="text-4xl font-bold text-[#FF7A00] mb-2">Free</p>
                  ) : priceInfo ? (
                    <p className="text-4xl font-bold text-[#FF7A00] mb-2">{formatPrice(priceInfo.price, priceInfo.currency)}</p>
                  ) : (
                    <p className="text-4xl font-bold text-[#FF7A00] mb-2">Free</p>
                  )}
                  <p className="text-sm text-[#6A6A6A]">
                    {event.category === 'tournament' && event.sections && event.sections.length > 0
                      ? 'per section'
                      : `per ${event.category === 'tournament' ? 'tournament' : 'event'}`}
                  </p>
                </div>
              );
            }
            
            return tiersToShow.map((tier, index) => {
              // Format price with proper currency
              const displayPrice = formatPrice(tier.price, tier.currency || 'USD');
              
              return (
                <div key={tier.id || index} className="border border-[#E2E2E2] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-base font-semibold text-gray-900">{tier.name}</span>
                    <span className="text-2xl font-bold text-[#FF7A00]">{displayPrice}</span>
                  </div>
                  {tier.description && (
                    <p className="text-sm text-[#6A6A6A]">{tier.description}</p>
                  )}
                  {tier.countryCode && (
                    <p className="text-xs text-[#6A6A6A] mt-1 italic">Price for {tier.countryCode}</p>
                  )}
                </div>
              );
            });
          })()}
        </div>
      ) : (
        <div>
          {isFree ? (
            <p className="text-4xl font-bold text-[#FF7A00] mb-2">Free</p>
          ) : priceInfo ? (
            <p className="text-4xl font-bold text-[#FF7A00] mb-2">{formatPrice(priceInfo.price, priceInfo.currency)}</p>
          ) : (
            <p className="text-4xl font-bold text-[#FF7A00] mb-2">Free</p>
          )}
          <p className="text-sm text-[#6A6A6A]">
            {event.category === 'tournament' && event.sections && event.sections.length > 0
              ? 'per section'
              : `per ${event.category === 'tournament' ? 'tournament' : 'event'}`}
          </p>
        </div>
      )}
    </div>
  );
}




