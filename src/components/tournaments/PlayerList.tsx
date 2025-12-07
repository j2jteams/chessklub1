'use client';

import { TournamentRegistration, UserRole } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';

interface PlayerListProps {
  registrations: TournamentRegistration[];
  sections?: Array<{ id: string; name: string }>;
}

export default function PlayerList({ registrations, sections }: PlayerListProps) {
  const { role } = useAuth();
  
  // Check if user is admin/organizer (can view sensitive info)
  const canViewSensitiveInfo = role === 'superAdmin' || role === 'franchisee' || role === 'standaloneAdmin';
  
  if (registrations.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Registered Players</h3>
        <p className="text-gray-600 text-center py-8">No players registered yet.</p>
      </div>
    );
  }

  // Group registrations by section if sections exist
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
    if (sectionId === 'no-section' || sectionId === 'all') return 'All Players';
    const section = sections?.find((s) => s.id === sectionId);
    return section?.name || 'Unknown Section';
  };

  // Sort registrations by rating (highest first) within each section
  Object.keys(groupedBySection).forEach((sectionId) => {
    groupedBySection[sectionId].sort((a, b) => {
      const ratingA = a.fideRating || a.nationalRating || 0;
      const ratingB = b.fideRating || b.nationalRating || 0;
      return ratingB - ratingA;
    });
  });

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900">Registered Players</h3>
        <p className="text-sm text-gray-600 mt-1">
          {registrations.length} {registrations.length === 1 ? 'player' : 'players'} registered
        </p>
      </div>

      <div className="space-y-6">
        {Object.entries(groupedBySection).map(([sectionId, sectionRegistrations]) => (
          <div key={sectionId}>
            {Object.keys(groupedBySection).length > 1 && (
              <h4 className="text-lg font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-200">
                {getSectionName(sectionId)}
                <span className="ml-2 text-sm font-normal text-gray-600">
                  ({sectionRegistrations.length})
                </span>
              </h4>
            )}

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">#</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Player</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">FIDE</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">National</th>
                    {canViewSensitiveInfo && (
                      <>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Contact</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                      </>
                    )}
                    {!canViewSensitiveInfo && (
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {sectionRegistrations.map((registration, index) => {
                    const displayRating = registration.fideRating || registration.nationalRating || null;
                    const ratingType = registration.fideRating ? 'FIDE' : registration.nationalRating ? 'National' : null;

                    return (
                      <tr
                        key={registration.id}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-3 px-4 text-sm text-gray-600">{index + 1}</td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{registration.displayName}</p>
                            {/* Player name only - contact info shown in separate column for admins */}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {registration.fideId || registration.fideRating ? (
                            <div>
                              {registration.fideId && (
                                <p className="text-xs text-gray-600">ID: {registration.fideId}</p>
                              )}
                              {registration.fideRating && (
                                <p className="text-sm font-semibold text-gray-900">{registration.fideRating}</p>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {registration.nationalFederationId || registration.nationalRating ? (
                            <div>
                              {registration.nationalFederationId && (
                                <p className="text-xs text-gray-600">{registration.nationalFederationId}</p>
                              )}
                              {registration.nationalRating && (
                                <p className="text-sm font-semibold text-gray-900">{registration.nationalRating}</p>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                        {/* Contact column - only visible to admins/organizers */}
                        {canViewSensitiveInfo && (
                          <td className="py-3 px-4">
                            <div>
                              {registration.userEmail && (
                                <p className="text-xs text-gray-600">{registration.userEmail}</p>
                              )}
                              {registration.phoneNumber && (
                                <p className="text-xs text-gray-600">{registration.phoneNumber}</p>
                              )}
                              {!registration.userEmail && !registration.phoneNumber && (
                                <span className="text-xs text-gray-400">—</span>
                              )}
                            </div>
                          </td>
                        )}
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              registration.status === 'confirmed'
                                ? 'bg-green-100 text-green-800'
                                : registration.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {registration.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

