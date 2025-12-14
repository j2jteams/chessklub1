'use client';

import { useState } from 'react';
import { TournamentRegistration } from '@/lib/types';

interface RegisteredPlayersSectionProps {
  registrations: TournamentRegistration[];
  sections?: Array<{ id: string; name: string }>;
}

export default function RegisteredPlayersSection({ registrations, sections }: RegisteredPlayersSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const INITIAL_DISPLAY_COUNT = 10;
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Show empty state only if truly no registrations
  if (registrations.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Registered Players</h2>
        <div className="flex flex-col items-center justify-center py-12">
          <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p className="text-base text-gray-600">No players registered yet. Be the first!</p>
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

  // Flatten all registrations for display
  const allRegistrations = Object.entries(groupedBySection).flatMap(([sectionId, sectionRegistrations]) =>
    sectionRegistrations.map(reg => ({ ...reg, sectionId }))
  );

  const displayedRegistrations = expanded || allRegistrations.length <= INITIAL_DISPLAY_COUNT
    ? allRegistrations
    : allRegistrations.slice(0, INITIAL_DISPLAY_COUNT);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">Registered Players</h2>
      
      {/* Simple table view for registered players */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#E2E2E2]">
              <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">Player</th>
              <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">Rating</th>
              {sections && sections.length > 0 && (
                <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">Section</th>
              )}
            </tr>
          </thead>
          <tbody>
            {displayedRegistrations.map((registration, index) => {
              const rating = registration.fideRating || registration.nationalRating;
              const ratingType = registration.fideRating ? 'FIDE' : registration.nationalRating ? 'National' : null;
              const sectionName = getSectionName(registration.sectionId || '');
              
              return (
                <tr
                  key={registration.id}
                  className={`border-b border-[#E2E2E2] hover:bg-gray-50 transition ${
                    index === displayedRegistrations.length - 1 ? 'border-b-0' : ''
                  }`}
                >
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#FF7A00] flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                        {getInitials(registration.displayName)}
                      </div>
                      <span className="text-base font-medium text-gray-900">{registration.displayName}</span>
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    {rating ? (
                      <span className="text-sm text-[#6A6A6A]">
                        {ratingType} {rating}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">—</span>
                    )}
                  </td>
                  {sections && sections.length > 0 && (
                    <td className="py-3 px-2">
                      {sectionName ? (
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                          {sectionName}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* View All / Show Less Button */}
      {allRegistrations.length > INITIAL_DISPLAY_COUNT && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-4 w-full text-center text-sm text-[#FF7A00] hover:text-[#E46800] font-medium transition"
        >
          {expanded ? 'Show Less' : `View All Players (${allRegistrations.length})`}
        </button>
      )}
    </div>
  );
}

