// UPDATED: role-based routing and approval flows - Phase 0.5
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRequireRole } from '@/hooks/useRequireRole';
import { getAllEvents, approveEvent, rejectEvent, deleteEvent } from '@/lib/events';
import { EventData } from '@/lib/types';
import Link from 'next/link';

export default function EventsManagementPage() {
  // Protect route - allow both admin and owner
  useRequireRole(['admin', 'owner']);
  
  const { user, role, loading: authLoading } = useAuth();
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // UPDATED: role-based routing and approval flows - Phase 0.5
  const [filter, setFilter] = useState<'all' | 'pendingApproval' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    if (!authLoading && user && (role === 'admin' || role === 'owner')) {
      loadEvents();
    }
  }, [user, role, authLoading, filter]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const allEvents = await getAllEvents();
      setEvents(allEvents);
    } catch (err: any) {
      setError(err.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (eventId: string) => {
    if (!user || role !== 'owner') return;
    try {
      await approveEvent(eventId, user.uid);
      await loadEvents();
    } catch (err: any) {
      setError(err.message || 'Failed to approve event');
    }
  };

  const handleReject = async (eventId: string) => {
    if (!user || role !== 'owner') return;
    try {
      await rejectEvent(eventId);
      await loadEvents();
    } catch (err: any) {
      setError(err.message || 'Failed to reject event');
    }
  };

  const handleDelete = async (eventId: string) => {
    if (!user || (role !== 'owner' && role !== 'admin')) return;
    if (!confirm('Are you sure you want to delete this event?')) return;
    try {
      await deleteEvent(eventId);
      await loadEvents();
    } catch (err: any) {
      setError(err.message || 'Failed to delete event');
    }
  };

  const filteredEvents = events.filter(event => {
    if (filter === 'all') return true;
    return event.status === filter;
  });

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || (role !== 'owner' && role !== 'admin')) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-slate-900">Events Management</h1>
            <div className="flex gap-4">
              <Link
                href="/admin/events/create"
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md font-semibold transition"
              >
                Create Event
              </Link>
              {role === 'owner' && (
                <Link
                  href="/admin"
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md font-semibold transition"
                >
                  Manage Admins
                </Link>
              )}
              <Link
                href="/"
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md font-semibold transition"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Filter Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {(['all', 'pendingApproval', 'approved', 'rejected'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                  filter === tab
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab} ({events.filter(e => tab === 'all' ? true : e.status === tab).length})
              </button>
            ))}
          </nav>
        </div>

        {/* Events List */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          {filteredEvents.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No events found.</p>
          ) : (
            <div className="space-y-4">
              {filteredEvents.map((event) => (
                <div
                  key={event.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-slate-900">{event.title}</h3>
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            event.status === 'approved'
                              ? 'bg-green-100 text-green-800'
                              : event.status === 'pendingApproval' || event.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {event.status === 'pending' ? 'pendingApproval' : event.status}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-2">{event.description}</p>
                      <div className="flex gap-4 text-sm text-gray-500">
                        <span>📅 {event.date}</span>
                        <span>📍 {event.location}</span>
                        <span>💰 {event.price}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        Created by: {event.createdByEmail} on{' '}
                        {event.createdAt.toLocaleDateString()}
                        {event.approvedBy && (
                          <> • Approved on {event.approvedAt?.toLocaleDateString()}</>
                        )}
                      </p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      {role === 'owner' && (event.status === 'pendingApproval' || event.status === 'pending') && (
                        <>
                          <button
                            onClick={() => handleApprove(event.id!)}
                            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm font-semibold transition"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(event.id!)}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm font-semibold transition"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {(role === 'owner' || (role === 'admin' && event.createdBy === user.uid)) && (
                        <Link
                          href={`/admin/events/edit/${event.id}`}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm font-semibold transition"
                        >
                          Edit
                        </Link>
                      )}
                      {(role === 'owner' || (role === 'admin' && event.createdBy === user.uid)) && (
                        <button
                          onClick={() => handleDelete(event.id!)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm font-semibold transition"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

