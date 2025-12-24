'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { EventData } from '@/lib/types';
import { getEventsByIds } from '@/lib/events';
import { updateUserProfile } from '@/lib/userRoles';
import MyCalendar from '@/components/dashboard/MyCalendar';

function SectionWrapper({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
        {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function EventsGrid({ events, emptyLabel }: { events: EventData[]; emptyLabel: string }) {
  if (!events.length) {
    return (
      <div className="text-center py-10 text-gray-500 text-sm">{emptyLabel}</div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {events.map((event) => (
        <Link
          key={event.id}
          href={`/events/${event.id}`}
          className="block border border-gray-100 rounded-xl p-4 hover:shadow-md hover:border-orange-300 transition cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">{event.date}</p>
              <h3 className="text-lg font-semibold text-slate-900">{event.title}</h3>
            </div>
            <span className="text-sm font-semibold text-orange-600">{event.price}</span>
          </div>
          <p className="text-sm text-gray-500 mt-2 line-clamp-2">{event.description}</p>
          <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
            <span>📍 {event.location}</span>
            <span className="capitalize">{event.status}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default function UserDashboardPage() {
  const { user, profile, role, loading } = useAuth();
  const router = useRouter();
  const [savedEvents, setSavedEvents] = useState<EventData[]>([]);
  const [registeredEvents, setRegisteredEvents] = useState<EventData[]>([]);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [editingIds, setEditingIds] = useState(false);
  const [uscfId, setUscfId] = useState('');
  const [lichessUsername, setLichessUsername] = useState('');
  const [fideId, setFideId] = useState('');
  const [savingIds, setSavingIds] = useState(false);
  const [idsError, setIdsError] = useState<string | null>(null);
  const [activeRatingTab, setActiveRatingTab] = useState<'uschess' | 'fide' | 'lichess'>('uschess');
  const [editingUscfId, setEditingUscfId] = useState(false);
  const [editingFideId, setEditingFideId] = useState(false);
  const [editingLichessUsername, setEditingLichessUsername] = useState(false);

  // Reset edit states when switching tabs
  useEffect(() => {
    setEditingUscfId(false);
    setEditingFideId(false);
    setEditingLichessUsername(false);
    setIdsError(null);
  }, [activeRatingTab]);

  const savedEventIds = useMemo(() => profile?.savedEvents ?? [], [profile]);
  const registeredEventIds = useMemo(() => profile?.registeredEvents ?? [], [profile]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }
    const loadEvents = async () => {
      if (!profile) return;
      setFetchLoading(true);
      try {
        const [saved, registered] = await Promise.all([
          getEventsByIds(savedEventIds),
          getEventsByIds(registeredEventIds),
        ]);
        setSavedEvents(saved);
        setRegisteredEvents(registered);
      } finally {
        setFetchLoading(false);
      }
    };

    loadEvents();
  }, [user, profile, savedEventIds, registeredEventIds, loading, router]);

  // Initialize ID fields from profile
  useEffect(() => {
    if (profile) {
      setUscfId(profile.uscfId || '');
      setLichessUsername(profile.lichessUsername || '');
      // FIDE ID can be in profile or synced from USCF ratings
      setFideId(profile.fideId || profile.uscfRatings?.fideId || '');
    }
  }, [profile]);

  const handleSaveIds = async () => {
    if (!user) return;
    
    setSavingIds(true);
    setIdsError(null);
    
    try {
      await updateUserProfile(user.uid, {
        uscfId: uscfId.trim() || undefined,
        lichessUsername: lichessUsername.trim() || undefined,
        fideId: fideId.trim() || undefined,
      });
      setEditingIds(false);
          // Reload page to show updated data
          window.location.reload();
        } catch (error: any) {
      setIdsError(error.message || 'Failed to update IDs');
        } finally {
      setSavingIds(false);
        }
      };

  if (!user || loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <p className="text-gray-500">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-500">Welcome back</p>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-slate-900">
            {profile?.firstName && profile?.lastName
              ? `${profile.firstName} ${profile.lastName}`
              : user.email
            }
          </h1>
          {profile?.uscfId && (
            <a
              href={`https://ratings.uschess.org/player/${profile.uscfId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-sm font-medium hover:bg-blue-100 hover:border-blue-300 transition cursor-pointer"
            >
              USCF: {profile.uscfId}
            </a>
          )}
        </div>
        <p className="text-gray-500 mt-2">
          Track your registered events, saved competitions, and stay up-to-date with Chess Tourneys.
        </p>
      </div>

      {/* Player Ratings Section - Moved to top */}
      <SectionWrapper title="Player Ratings" description="Your chess ratings across different platforms">
        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveRatingTab('uschess')}
              className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                activeRatingTab === 'uschess'
                  ? 'text-orange-600 border-b-2 border-orange-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              USChess
            </button>
            <button
              onClick={() => setActiveRatingTab('fide')}
              className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                activeRatingTab === 'fide'
                  ? 'text-orange-600 border-b-2 border-orange-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              FIDE
            </button>
            <button
              onClick={() => setActiveRatingTab('lichess')}
              className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                activeRatingTab === 'lichess'
                  ? 'text-orange-600 border-b-2 border-orange-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              LiChess
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeRatingTab === 'uschess' && (
          <>
            {/* USCF ID Display/Edit */}
            <div className="mb-4 pb-4 border-b border-gray-100">
              {profile?.uscfId && !editingUscfId ? (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">USCF ID</p>
                    <p className="text-sm text-gray-500 mt-0.5">{profile.uscfId}</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingUscfId(true);
                      setUscfId(profile?.uscfId || '');
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition"
                  >
                    Edit
                  </button>
                </div>
              ) : editingUscfId ? (
                <div>
                  <label htmlFor="editUscfId" className="block text-sm font-medium text-gray-700 mb-2">
                    USCF ID
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="editUscfId"
                      type="text"
                      value={uscfId}
                      onChange={(e) => setUscfId(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-sm"
                      placeholder="Enter your USCF ID"
                    />
                    <button
                      onClick={async () => {
                        if (!user) return;
                        setSavingIds(true);
                        setIdsError(null);
                        try {
                          await updateUserProfile(user.uid, {
                            uscfId: uscfId.trim() || undefined,
                          });
                          setEditingUscfId(false);
                          window.location.reload();
                        } catch (error: any) {
                          setIdsError(error.message || 'Failed to update USCF ID');
                        } finally {
                          setSavingIds(false);
                        }
                      }}
                      disabled={savingIds}
                      className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      {savingIds ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => {
                        setEditingUscfId(false);
                        setIdsError(null);
                        setUscfId(profile?.uscfId || '');
                      }}
                      disabled={savingIds}
                      className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium rounded-lg disabled:opacity-50 transition"
                    >
                      Cancel
                    </button>
                  </div>
                  {idsError && (
                    <p className="text-xs text-red-600 mt-2">{idsError}</p>
                  )}
                </div>
              ) : (
                <div>
                  <label htmlFor="uscfIdInput" className="block text-sm font-medium text-gray-700 mb-2">
                    Enter your USCF ID to view ratings
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="uscfIdInput"
                      type="text"
                      value={uscfId}
                      onChange={(e) => setUscfId(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-sm"
                      placeholder="Enter your USCF ID"
                    />
                    <button
                      onClick={async () => {
                        if (!user || !uscfId.trim()) return;
                        setSavingIds(true);
                        setIdsError(null);
                        try {
                          await updateUserProfile(user.uid, {
                            uscfId: uscfId.trim() || undefined,
                          });
                          window.location.reload();
                        } catch (error: any) {
                          setIdsError(error.message || 'Failed to update USCF ID');
                        } finally {
                          setSavingIds(false);
                        }
                      }}
                      disabled={savingIds || !uscfId.trim()}
                      className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      {savingIds ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                  {idsError && (
                    <p className="text-xs text-red-600 mt-2">{idsError}</p>
                  )}
                </div>
              )}
            </div>

            {profile?.uscfId && profile?.uscfRatings ? (
            <div>
              {/* Single Row: Ratings on Left, Rankings on Right */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Left: RATINGS Section (2 columns) */}
                {(profile.uscfRatings.regular || profile.uscfRatings.quick || profile.uscfRatings.blitz || 
                  profile.uscfRatings.onlineRegular || profile.uscfRatings.onlineQuick || profile.uscfRatings.onlineBlitz) && (
                  <div className="lg:col-span-2">
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className="text-sm font-semibold text-gray-900">RATINGS</h3>
                      <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {/* Left Column: Standard Ratings */}
                      <div className="space-y-1.5">
                        {/* Regular Rating */}
                        {profile.uscfRatings.regular ? (
                          <div className="bg-white border border-gray-200 rounded p-2 relative overflow-hidden hover:shadow-sm transition-shadow">
                            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-500"></div>
                            <div className="pl-2 flex items-center justify-between">
                              <div>
                                <p className="text-lg font-bold text-gray-900">{profile.uscfRatings.regular}</p>
                                <p className="text-[10px] text-gray-500 uppercase tracking-wide font-medium">REGULAR</p>
                              </div>
                              {profile.uscfRatings.regularFloor && (
                                <p className="text-[10px] text-gray-400">{profile.uscfRatings.regularFloor}</p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="bg-white border border-gray-200 rounded p-2 relative overflow-hidden opacity-50">
                            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gray-300"></div>
                            <div className="pl-2">
                              <p className="text-lg font-bold text-gray-400">----</p>
                              <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">REGULAR</p>
                            </div>
                          </div>
                        )}
                        
                        {/* Quick Rating */}
                        {profile.uscfRatings.quick ? (
                          <div className="bg-white border border-gray-200 rounded p-2 relative overflow-hidden hover:shadow-sm transition-shadow">
                            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-500"></div>
                            <div className="pl-2 flex items-center justify-between">
                              <div>
                                <p className="text-lg font-bold text-gray-900">{profile.uscfRatings.quick}</p>
                                <p className="text-[10px] text-gray-500 uppercase tracking-wide font-medium">QUICK</p>
                              </div>
                              {profile.uscfRatings.quickFloor && (
                                <p className="text-[10px] text-gray-400">{profile.uscfRatings.quickFloor}</p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="bg-white border border-gray-200 rounded p-2 relative overflow-hidden opacity-50">
                            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gray-300"></div>
                            <div className="pl-2">
                              <p className="text-lg font-bold text-gray-400">----</p>
                              <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">QUICK</p>
                            </div>
                          </div>
                        )}
                        
                        {/* Blitz Rating */}
                        {profile.uscfRatings.blitz ? (
                          <div className="bg-white border border-gray-200 rounded p-2 relative overflow-hidden hover:shadow-sm transition-shadow">
                            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-yellow-400"></div>
                            <div className="pl-2 flex items-center justify-between">
                              <div>
                                <p className="text-lg font-bold text-gray-900">{profile.uscfRatings.blitz}</p>
                                <p className="text-[10px] text-gray-500 uppercase tracking-wide font-medium">BLITZ</p>
                              </div>
                              {profile.uscfRatings.blitzFloor && (
                                <p className="text-[10px] text-gray-400">{profile.uscfRatings.blitzFloor}</p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="bg-white border border-gray-200 rounded p-2 relative overflow-hidden opacity-50">
                            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gray-300"></div>
                            <div className="pl-2">
                              <p className="text-lg font-bold text-gray-400">----</p>
                              <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">BLITZ</p>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Right Column: Online Ratings */}
                      <div className="space-y-1.5">
                        {/* Online Regular */}
                        {profile.uscfRatings.onlineRegular ? (
                          <div className="bg-white border border-gray-200 rounded p-2 relative overflow-hidden hover:shadow-sm transition-shadow">
                            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-500"></div>
                            <div className="pl-2 flex items-center justify-between">
                              <div>
                                <p className="text-lg font-bold text-gray-900">
                                  {profile.uscfRatings.onlineRegular}
                                  {profile.uscfRatings.onlineRegularGames && (
                                    <span className="text-xs font-normal text-gray-500 ml-1">/ {profile.uscfRatings.onlineRegularGames}</span>
                                  )}
                                </p>
                                <p className="text-[10px] text-gray-500 uppercase tracking-wide font-medium">ONLINE-REGULAR</p>
                              </div>
                              {profile.uscfRatings.onlineRegularFloor && (
                                <p className="text-[10px] text-gray-400">{profile.uscfRatings.onlineRegularFloor}</p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="bg-white border border-gray-200 rounded p-2 relative overflow-hidden opacity-50">
                            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gray-300"></div>
                            <div className="pl-2">
                              <p className="text-lg font-bold text-gray-400">----</p>
                              <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">ONLINE-REGULAR</p>
                            </div>
                          </div>
                        )}
                        
                        {/* Online Quick */}
                        {profile.uscfRatings.onlineQuick ? (
                          <div className="bg-white border border-gray-200 rounded p-2 relative overflow-hidden hover:shadow-sm transition-shadow">
                            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-500"></div>
                            <div className="pl-2 flex items-center justify-between">
                              <div>
                                <p className="text-lg font-bold text-gray-900">{profile.uscfRatings.onlineQuick}</p>
                                <p className="text-[10px] text-gray-500 uppercase tracking-wide font-medium">ONLINE-QUICK</p>
                              </div>
                              {profile.uscfRatings.onlineQuickFloor && (
                                <p className="text-[10px] text-gray-400">{profile.uscfRatings.onlineQuickFloor}</p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="bg-white border border-gray-200 rounded p-2 relative overflow-hidden opacity-50">
                            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gray-300"></div>
                            <div className="pl-2">
                              <p className="text-lg font-bold text-gray-400">----</p>
                              <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">ONLINE-QUICK</p>
                            </div>
                          </div>
                        )}
                        
                        {/* Online Blitz */}
                        {profile.uscfRatings.onlineBlitz ? (
                          <div className="bg-white border border-gray-200 rounded p-2 relative overflow-hidden hover:shadow-sm transition-shadow">
                            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-yellow-400"></div>
                            <div className="pl-2 flex items-center justify-between">
                              <div>
                                <p className="text-lg font-bold text-gray-900">{profile.uscfRatings.onlineBlitz}</p>
                                <p className="text-[10px] text-gray-500 uppercase tracking-wide font-medium">ONLINE-BLITZ</p>
                              </div>
                              {profile.uscfRatings.onlineBlitzFloor && (
                                <p className="text-[10px] text-gray-400">{profile.uscfRatings.onlineBlitzFloor}</p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="bg-white border border-gray-200 rounded p-2 relative overflow-hidden opacity-50">
                            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gray-300"></div>
                            <div className="pl-2">
                              <p className="text-lg font-bold text-gray-400">----</p>
                              <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">ONLINE-BLITZ</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Right: RANKING Section */}
                {(profile.uscfRatings.overallRank || profile.uscfRatings.stateRank) && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className="text-sm font-semibold text-gray-900">RANKING</h3>
                      <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="space-y-2">
                      {profile.uscfRatings.overallRank && (
                        <div className="bg-white border border-gray-200 rounded p-3 hover:shadow-sm transition-shadow">
                          <p className="text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">OVERALL</p>
                          <p className="text-xl font-bold text-gray-900 mb-1">
                            {parseInt(profile.uscfRatings.overallRank).toLocaleString()}
                          </p>
                          {profile.uscfRatings.overallTotal && (
                            <p className="text-xs text-gray-600 mb-0.5">
                              out of {parseInt(profile.uscfRatings.overallTotal).toLocaleString()}
                            </p>
                          )}
                          {profile.uscfRatings.overallPercentile && (
                            <p className="text-[10px] text-gray-500 italic">
                              {profile.uscfRatings.overallPercentile}th percentile
                            </p>
                          )}
                        </div>
                      )}
                      {profile.uscfRatings.stateRank && (
                        <div className="bg-white border border-gray-200 rounded p-3 hover:shadow-sm transition-shadow">
                          <p className="text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
                            {profile.uscfRatings.stateName || 'STATE'}
                          </p>
                          <p className="text-xl font-bold text-gray-900 mb-1">
                            {parseInt(profile.uscfRatings.stateRank).toLocaleString()}
                          </p>
                          {profile.uscfRatings.stateTotal && (
                            <p className="text-xs text-gray-600 mb-0.5">
                              out of {parseInt(profile.uscfRatings.stateTotal).toLocaleString()}
                            </p>
                          )}
                          {profile.uscfRatings.statePercentile && (
                            <p className="text-[10px] text-gray-500 italic">
                              {profile.uscfRatings.statePercentile}th percentile
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Last Synced */}
              {profile.uscfRatings.lastSynced && (
                <p className="text-xs text-gray-500 text-right mt-4">
                  Last synced: {new Date(profile.uscfRatings.lastSynced).toLocaleString()}
                </p>
              )}
            </div>
            ) : (
              <div className="text-center py-10 text-gray-500 text-sm">
                <p>No USCF ratings data available.</p>
              </div>
            )}
            {!profile?.uscfId && (
              <div className="text-center py-10 text-gray-500 text-sm">
                <p>Add your USCF ID in Player IDs section to view ratings.</p>
              </div>
            )}
          </>
        )}

        {activeRatingTab === 'fide' && (
          <>
            {/* FIDE ID Display/Edit */}
            <div className="mb-4 pb-4 border-b border-gray-100">
              {(profile?.fideId || profile?.uscfRatings?.fideId) && !editingFideId ? (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">FIDE ID</p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {profile.fideId || profile.uscfRatings?.fideId}
                    </p>
                    {profile?.uscfRatings?.fideId && !profile?.fideId && (
                      <p className="text-xs text-gray-400 mt-0.5 italic">(Synced from USCF)</p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setEditingFideId(true);
                      setFideId(profile?.fideId || profile?.uscfRatings?.fideId || '');
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition"
                  >
                    Edit
                  </button>
                </div>
              ) : editingFideId ? (
                <div>
                  <label htmlFor="editFideId" className="block text-sm font-medium text-gray-700 mb-2">
                    FIDE ID
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="editFideId"
                      type="text"
                      value={fideId}
                      onChange={(e) => setFideId(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-sm"
                      placeholder="Enter your FIDE ID"
                    />
                    <button
                      onClick={async () => {
                        if (!user) return;
                        setSavingIds(true);
                        setIdsError(null);
                        try {
                          await updateUserProfile(user.uid, {
                            fideId: fideId.trim() || undefined,
                          });
                          setEditingFideId(false);
                          window.location.reload();
                        } catch (error: any) {
                          setIdsError(error.message || 'Failed to update FIDE ID');
                        } finally {
                          setSavingIds(false);
                        }
                      }}
                      disabled={savingIds}
                      className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      {savingIds ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => {
                        setEditingFideId(false);
                        setIdsError(null);
                        setFideId(profile?.fideId || profile?.uscfRatings?.fideId || '');
                      }}
                      disabled={savingIds}
                      className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium rounded-lg disabled:opacity-50 transition"
                    >
                      Cancel
                    </button>
                  </div>
                  {idsError && (
                    <p className="text-xs text-red-600 mt-2">{idsError}</p>
                  )}
                </div>
              ) : (
                <div>
                  <label htmlFor="fideIdInput" className="block text-sm font-medium text-gray-700 mb-2">
                    Enter your FIDE ID to view ratings
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="fideIdInput"
                      type="text"
                      value={fideId}
                      onChange={(e) => setFideId(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-sm"
                      placeholder="Enter your FIDE ID"
                    />
                    <button
                      onClick={async () => {
                        if (!user || !fideId.trim()) return;
                        setSavingIds(true);
                        setIdsError(null);
                        try {
                          await updateUserProfile(user.uid, {
                            fideId: fideId.trim() || undefined,
                          });
                          window.location.reload();
                        } catch (error: any) {
                          setIdsError(error.message || 'Failed to update FIDE ID');
                        } finally {
                          setSavingIds(false);
                        }
                      }}
                      disabled={savingIds || !fideId.trim()}
                      className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      {savingIds ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                  {idsError && (
                    <p className="text-xs text-red-600 mt-2">{idsError}</p>
                  )}
                </div>
              )}
            </div>

            <div className="text-center py-10 text-gray-500 text-sm">
              <p>FIDE ratings coming soon.</p>
            </div>
          </>
        )}

        {activeRatingTab === 'lichess' && (
          <>
            {/* LiChess Username Display/Edit */}
            <div className="mb-4 pb-4 border-b border-gray-100">
              {profile?.lichessUsername && !editingLichessUsername ? (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">LiChess Username</p>
                    <p className="text-sm text-gray-500 mt-0.5">{profile.lichessUsername}</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingLichessUsername(true);
                      setLichessUsername(profile?.lichessUsername || '');
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition"
                  >
                    Edit
                  </button>
                </div>
              ) : editingLichessUsername ? (
                <div>
                  <label htmlFor="editLichessUsername" className="block text-sm font-medium text-gray-700 mb-2">
                    LiChess Username
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="editLichessUsername"
                      type="text"
                      value={lichessUsername}
                      onChange={(e) => setLichessUsername(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-sm"
                      placeholder="Enter your LiChess username"
                    />
                    <button
                      onClick={async () => {
                        if (!user) return;
                        setSavingIds(true);
                        setIdsError(null);
                        try {
                          await updateUserProfile(user.uid, {
                            lichessUsername: lichessUsername.trim() || undefined,
                          });
                          setEditingLichessUsername(false);
                          window.location.reload();
                        } catch (error: any) {
                          setIdsError(error.message || 'Failed to update LiChess username');
                        } finally {
                          setSavingIds(false);
                        }
                      }}
                      disabled={savingIds}
                      className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      {savingIds ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => {
                        setEditingLichessUsername(false);
                        setIdsError(null);
                        setLichessUsername(profile?.lichessUsername || '');
                      }}
                      disabled={savingIds}
                      className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium rounded-lg disabled:opacity-50 transition"
                    >
                      Cancel
                    </button>
                  </div>
                  {idsError && (
                    <p className="text-xs text-red-600 mt-2">{idsError}</p>
                  )}
                </div>
              ) : (
                <div>
                  <label htmlFor="lichessUsernameInput" className="block text-sm font-medium text-gray-700 mb-2">
                    Enter your LiChess username to view ratings
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="lichessUsernameInput"
                      type="text"
                      value={lichessUsername}
                      onChange={(e) => setLichessUsername(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-sm"
                      placeholder="Enter your LiChess username"
                    />
                    <button
                      onClick={async () => {
                        if (!user || !lichessUsername.trim()) return;
                        setSavingIds(true);
                        setIdsError(null);
                        try {
                          await updateUserProfile(user.uid, {
                            lichessUsername: lichessUsername.trim() || undefined,
                          });
                          window.location.reload();
                        } catch (error: any) {
                          setIdsError(error.message || 'Failed to update LiChess username');
                        } finally {
                          setSavingIds(false);
                        }
                      }}
                      disabled={savingIds || !lichessUsername.trim()}
                      className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      {savingIds ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                  {idsError && (
                    <p className="text-xs text-red-600 mt-2">{idsError}</p>
                  )}
                </div>
              )}
            </div>

            <div className="text-center py-10 text-gray-500 text-sm">
              <p>LiChess ratings coming soon.</p>
            </div>
          </>
        )}
      </SectionWrapper>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-100 rounded-2xl p-6">
          <p className="text-sm text-gray-500">Registered Events</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{registeredEventIds.length}</p>
          <p className="text-xs text-gray-400 mt-1">Events you have registered for</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-6">
          <p className="text-sm text-gray-500">Saved Events</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{savedEventIds.length}</p>
          <p className="text-xs text-gray-400 mt-1">Events bookmarked to revisit later</p>
        </div>
      </div>

      {/* My Calendar Section */}
      <MyCalendar events={registeredEvents} />

      {/* Player IDs Section - Only for players - HIDDEN: Now integrated into Player Ratings tabs */}
      {false && (role === 'player' || role === null) && (
        <SectionWrapper title="Player IDs" description="Manage your chess platform identifiers">
          {editingIds ? (
            <div className="space-y-4">
              <div>
                <label htmlFor="uscfId" className="block text-sm font-medium text-gray-700 mb-2">
                  USCF ID
                </label>
                <input
                  id="uscfId"
                  type="text"
                  value={uscfId}
                  onChange={(e) => setUscfId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                  placeholder="Enter your USCF ID"
                />
              </div>
              
              <div>
                <label htmlFor="lichessUsername" className="block text-sm font-medium text-gray-700 mb-2">
                  LiChess Username
                </label>
                <input
                  id="lichessUsername"
                  type="text"
                  value={lichessUsername}
                  onChange={(e) => setLichessUsername(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                  placeholder="Enter your LiChess username"
                />
              </div>
              
              <div>
                <label htmlFor="fideId" className="block text-sm font-medium text-gray-700 mb-2">
                  FIDE ID
                </label>
                <input
                  id="fideId"
                  type="text"
                  value={fideId}
                  onChange={(e) => setFideId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                  placeholder="Enter your FIDE ID"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Note: FIDE ID may also be synced from USCF ratings
                </p>
              </div>
              
              {idsError && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
                  {idsError}
                </div>
              )}
              
              <div className="flex gap-3">
                <button
                  onClick={handleSaveIds}
                  disabled={savingIds}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {savingIds ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => {
                    setEditingIds(false);
                    setIdsError(null);
                    // Reset to original values
                    setUscfId(profile?.uscfId || '');
                    setLichessUsername(profile?.lichessUsername || '');
                    setFideId(profile?.fideId || '');
                  }}
                  disabled={savingIds}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg disabled:opacity-50 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div>
                  <p className="text-sm font-medium text-gray-700">USCF ID</p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {profile?.uscfId || 'Not set'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div>
                  <p className="text-sm font-medium text-gray-700">LiChess Username</p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {profile?.lichessUsername || 'Not set'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div>
                  <p className="text-sm font-medium text-gray-700">FIDE ID</p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {profile?.fideId || profile?.uscfRatings?.fideId || 'Not set'}
                  </p>
                  {profile?.uscfRatings?.fideId && !profile?.fideId && (
                    <p className="text-xs text-gray-400 mt-0.5 italic">
                      (Synced from USCF)
                    </p>
                  )}
                </div>
              </div>
              
              <button
                onClick={() => setEditingIds(true)}
                className="mt-4 w-full px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition"
              >
                Edit IDs
              </button>
            </div>
          )}
        </SectionWrapper>
      )}

      {/* Request Admin Access - Only for players */}
      {/* DISABLED: Removed button from player dashboard. Functionality preserved for future use. */}
      {/* To re-enable, uncomment the section below */}
      {/* {(role === 'player' || role === null) && (
        <div className="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-1">Want to become an Admin?</h3>
              <p className="text-sm text-gray-600">
                Request admin access to create and manage events. An owner will review your request.
              </p>
            </div>
            <Link
              href="/request-admin"
              className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition shadow-lg"
            >
              Request Admin Access
            </Link>
          </div>
        </div>
      )} */}

      <SectionWrapper title="Registered Events">
        {fetchLoading ? (
          <div className="text-center py-10 text-gray-500 text-sm">Loading events...</div>
        ) : (
          <EventsGrid
            events={registeredEvents}
            emptyLabel="You haven't registered for any events yet. Browse tournaments to get started."
          />
        )}
      </SectionWrapper>

      <SectionWrapper title="Saved Events">
        {fetchLoading ? (
          <div className="text-center py-10 text-gray-500 text-sm">Loading events...</div>
        ) : (
          <EventsGrid
            events={savedEvents}
            emptyLabel="No saved events yet. Tap the bookmark icon on an event to save it here."
          />
        )}
      </SectionWrapper>
    </div>
  );
}

