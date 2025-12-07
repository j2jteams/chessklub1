'use client';

import { TournamentRegistration } from '@/lib/types';

interface RegisteredPlayersSectionProps {
  registrations: TournamentRegistration[];
  sections?: Array<{ id: string; name: string }>;
}

export default function RegisteredPlayersSection({ registrations, sections }: RegisteredPlayersSectionProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  if (registrations.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Registered Players</h2>
        <div className="flex flex-col items-center justify-center py-12">
          <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p className="text-base text-gray-600">Be the first to register!</p>
        </div>
      </div>
    );
  }

  // Group by section if sections exist
  const groupedBySection = sections && sections.length > 0
    ? registrations.reduce((acc, reg) => {
        const sectionId = reg.sectionId || 'no-section';
        if (!acc[sectionId]) {
          acc[sectionId] = [];
        }
        acc[sectionId].push(reg);
        return acc;
      }, {} as Record<string, TournamentRegistration[]>)
    : { 'all': registrations };

  const getSectionName = (sectionId: string) => {
    if (sectionId === 'no-section' || sectionId === 'all') return null;
    const section = sections?.find((s) => s.id === sectionId);
    return section?.name || null;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">Registered Players</h2>
      
      <div className="space-y-6">
        {Object.entries(groupedBySection).map(([sectionId, sectionRegistrations]) => (
          <div key={sectionId}>
            {getSectionName(sectionId) && (
              <h3 className="text-lg font-medium text-gray-900 mb-4">{getSectionName(sectionId)}</h3>
            )}
            
            <div className="space-y-0">
              {sectionRegistrations.map((registration, index) => {
                const rating = registration.fideRating || registration.nationalRating;
                const ratingType = registration.fideRating ? 'FIDE' : registration.nationalRating ? 'National' : null;
                
                return (
                  <div
                    key={registration.id}
                    className={`flex items-center gap-4 py-4 ${
                      index < sectionRegistrations.length - 1 ? 'border-b border-[#E2E2E2]' : ''
                    }`}
                  >
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-[#FF7A00] flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                      {getInitials(registration.displayName)}
                    </div>

                    {/* Player Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-semibold text-gray-900 truncate">{registration.displayName}</p>
                      {rating && (
                        <p className="text-sm text-[#6A6A6A]">
                          {ratingType} {rating}
                        </p>
                      )}
                    </div>

                    {/* Section Badge */}
                    {getSectionName(registration.sectionId || '') && (
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                        {getSectionName(registration.sectionId || '')}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

