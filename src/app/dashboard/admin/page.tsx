// UPDATED: role-based routing and approval flows - Phase 0.5
'use client';

import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRequireRole } from '@/hooks/useRequireRole';
import { EventData } from '@/lib/types';
import { getEventsCreatedBy } from '@/lib/events';

export default function AdminDashboardPage() {
  // Protect route - allow both admin and owner
  useRequireRole(['admin', 'owner']);
  
  const { user, role, loading } = useAuth();
  const [events, setEvents] = useState<EventData[]>([]);
  const [fetchLoading, setFetchLoading] = useState(false);

  const loadEvents = useCallback(async () => {
    if (!user) return;
    setFetchLoading(true);
    try {
      // UPDATED: Owners can see ALL events, admins see only their own
      if (role === 'owner') {
        const { getAllEvents } = await import('@/lib/events');
        const data = await getAllEvents();
        setEvents(data);
      } else {
        const data = await getEventsCreatedBy(user.uid);
        setEvents(data);
      }
    } catch (error: any) {
      console.error('Error loading events:', error);
      // If it's an index error, show a helpful message
      if (error.code === 'failed-precondition') {
        console.error('Missing Firestore index! The query requires an index for createdBy + createdAt.');
        console.error('Check the browser console for a link to create the index, or see FIREBASE_INDEXES_NEEDED.md');
        // Set events to empty array to prevent UI errors
        setEvents([]);
      }
    } finally {
      setFetchLoading(false);
    }
  }, [user, role]);

  useEffect(() => {
    if (!loading && user && (role === 'admin' || role === 'owner')) {
      loadEvents();
    }
  }, [user, role, loading, loadEvents]);

  if (!user || loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <p className="text-gray-500">Loading admin console...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">Admin Console</p>
          <h1 className="text-3xl font-bold text-slate-900">Manage Events</h1>
          <p className="text-gray-500 mt-2">
            Create and manage events. Owner will review and approve submissions automatically if required.
          </p>
        </div>
        <Link
          href="/admin/events/create"
          className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-orange-500 text-white font-semibold hover:bg-orange-600 transition"
        >
          + Create Event
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Total Events</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{events.length}</p>
          <p className="text-xs text-gray-400 mt-1">{role === 'owner' ? 'All events' : 'Created by you'}</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Pending Approval</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">
            {events.filter((event) => event.status === 'pendingApproval').length}
          </p>
          <p className="text-xs text-gray-400 mt-1">Awaiting owner review</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Approved Events</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">
            {events.filter((event) => event.status === 'approved').length}
          </p>
          <p className="text-xs text-gray-400 mt-1">Visible on the site</p>
        </div>
      </div>

      <section className="bg-white border border-gray-100 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{role === 'owner' ? 'All Events' : 'Your Events'}</h2>
            <p className="text-sm text-gray-500">{role === 'owner' ? 'View, edit, or delete any event' : 'Edit details or track approval status'}</p>
          </div>
          <Link href="/admin/events" className="text-sm text-orange-600 font-medium hover:text-orange-700">
            View all
          </Link>
        </div>
        {fetchLoading ? (
          <div className="text-center py-10 text-gray-500">Loading events...</div>
        ) : events.length === 0 ? (
          <div className="text-center py-10 text-gray-500">No events yet. Create your first event to get started.</div>
        ) : (
          <div className="space-y-3">
            {events.map((event) => (
              <div
                key={event.id}
                className="flex flex-col md:flex-row md:items-center md:justify-between border border-gray-100 rounded-xl p-4"
              >
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">{event.date}</p>
                  <h3 className="text-lg font-semibold text-slate-900">{event.title}</h3>
                  <p className="text-sm text-gray-500">{event.location}</p>
                </div>
                <div className="flex items-center gap-3 mt-3 md:mt-0">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                      event.status === 'approved'
                        ? 'bg-green-100 text-green-700'
                        : event.status === 'pendingApproval'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {event.status}
                  </span>
                  {(role === 'owner' || event.createdBy === user?.uid) && (
                    <Link
                      href={`/admin/events/edit/${event.id}`}
                      className="px-3 py-1 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
                    >
                      Edit
                    </Link>
                  )}
                  {role === 'owner' && (
                    <button
                      onClick={async () => {
                        if (!confirm(`Are you sure you want to delete "${event.title}"?`)) return;
                        try {
                          const { deleteEvent } = await import('@/lib/events');
                          await deleteEvent(event.id!);
                          await loadEvents();
                        } catch (error: any) {
                          console.error('Error deleting event:', error);
                          alert('Failed to delete event: ' + (error.message || 'Unknown error'));
                        }
                      }}
                      className="px-3 py-1 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

