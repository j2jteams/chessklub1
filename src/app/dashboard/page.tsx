'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { EventData } from '@/lib/types';
import { getEventsByIds } from '@/lib/events';

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
          Track your registered events, saved competitions, and stay up-to-date with Chess Klub.
        </p>
      </div>

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

