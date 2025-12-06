// UPDATED: Chess Tourneys - Event Management Dashboard
'use client';

import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRequireRole } from '@/hooks/useRequireRole';
import { EventData, UserData, UserRole } from '@/lib/types';
import { getEventsCreatedBy, getEventsByFranchise, getAllEvents, approveEvent, rejectEvent, deleteEvent } from '@/lib/events';
import { getAllUsers } from '@/lib/userRoles';

export default function AdminDashboardPage() {
  // Protect route - allow standaloneAdmin, franchisee, and superAdmin (for migration)
  useRequireRole(['standaloneAdmin', 'franchisee', 'superAdmin', 'admin', 'owner']);
  
  const { user, role, loading } = useAuth();
  const [events, setEvents] = useState<EventData[]>([]);
  const [allUsers, setAllUsers] = useState<UserData[]>([]);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pendingApproval' | 'approved' | 'rejected'>('all');

  // Helper function to get creator info
  const getCreatorInfo = (event: EventData): { name: string; type: string; email: string } => {
    const creator = allUsers.find(u => u.uid === event.createdBy);
    if (creator) {
      const name = creator.firstName && creator.lastName 
        ? `${creator.firstName} ${creator.lastName}` 
        : creator.email;
      
      if (event.franchiseId && creator.role === 'franchisee') {
        return { name, type: 'Franchise', email: creator.email };
      } else if (!event.franchiseId && creator.role === 'standaloneAdmin') {
        return { name, type: 'Standalone Admin', email: creator.email };
      } else if (creator.role === 'franchisee') {
        return { name, type: 'Franchise', email: creator.email };
      } else if (creator.role === 'standaloneAdmin') {
        return { name, type: 'Standalone Admin', email: creator.email };
      } else if (creator.role === 'superAdmin') {
        return { name, type: 'Super Admin', email: creator.email };
      }
    }
    return { name: event.createdByEmail || 'Unknown', type: 'Unknown', email: event.createdByEmail || '' };
  };

  // Check if event needs approval (pending approval logic)
  const needsApproval = (event: EventData): boolean => {
    if (event.status !== 'pendingApproval') return false;
    
    const creator = allUsers.find(u => u.uid === event.createdBy);
    if (!creator) return false;

    // Pending if: franchisee created standalone event OR standalone admin created franchise event
    if (creator.role === 'franchisee' && (!event.franchiseId || event.franchiseId === null)) {
      return true; // Franchisee created standalone event
    }
    if (creator.role === 'standaloneAdmin' && event.franchiseId) {
      return true; // Standalone admin created franchise event
    }
    
    return false;
  };

  const loadEvents = useCallback(async () => {
    if (!user) return;
    setFetchLoading(true);
    try {
      // Migration: Handle old roles
      const userRole = (role ?? 'player') as UserRole;
      const isOldOwner = userRole === 'owner';
      const isOldAdmin = userRole === 'admin';
      
      // Load all users for creator info (only for super admin)
      if (userRole === 'superAdmin' || isOldOwner) {
        const users = await getAllUsers();
        setAllUsers(users);
      }
      
      // Super Admin (or old owner) can see ALL events
      if (userRole === 'superAdmin' || isOldOwner) {
        const { getAllEvents } = await import('@/lib/events');
        const data = await getAllEvents();
        setEvents(data);
      } 
      // Franchisee can see events for their franchise
      else if (userRole === 'franchisee') {
        const data = await getEventsByFranchise(user.uid);
        setEvents(data);
      } 
      // Standalone Admin (or old admin) can see only their own events
      else if (userRole === 'standaloneAdmin' || isOldAdmin) {
        const data = await getEventsCreatedBy(user.uid);
        setEvents(data);
      } else {
        setEvents([]);
      }
    } catch (error: any) {
      console.error('Error loading events:', error);
      if (error.code === 'failed-precondition') {
        console.error('Missing Firestore index! The query requires an index for createdBy + createdAt.');
        setEvents([]);
      }
    } finally {
      setFetchLoading(false);
    }
  }, [user, role]);

  useEffect(() => {
    if (!loading && user) {
      const userRole = (role ?? 'player') as UserRole;
      if (userRole === 'standaloneAdmin' || userRole === 'franchisee' || 
          userRole === 'superAdmin' || userRole === 'admin' || userRole === 'owner') {
      loadEvents();
      }
    }
  }, [user, role, loading, loadEvents]);

  const handleApprove = async (eventId: string) => {
    if (!user) return;
    setActionLoading(eventId);
    try {
      await approveEvent(eventId, user.uid);
      await loadEvents();
    } catch (error: any) {
      alert(`Failed to approve event: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (eventId: string) => {
    if (!user) return;
    setActionLoading(eventId);
    try {
      await rejectEvent(eventId);
      await loadEvents();
    } catch (error: any) {
      alert(`Failed to reject event: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    setActionLoading(eventId);
    try {
      await deleteEvent(eventId);
      await loadEvents();
    } catch (error: any) {
      alert(`Failed to delete event: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredEvents = events.filter(event => {
    if (filter === 'all') return true;
    return event.status === filter;
  });

  const pendingApprovalEvents = filteredEvents.filter(needsApproval);

  if (!user || loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <p className="text-gray-500">Loading event management...</p>
      </div>
    );
  }

  const userRole = (role ?? 'player') as UserRole;
  const isSuperAdmin = userRole === 'superAdmin' || userRole === 'owner';

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">Event Management</p>
          <h1 className="text-3xl font-bold text-slate-900">Manage Events</h1>
          <p className="text-gray-500 mt-2">
            {isSuperAdmin
              ? 'Create and manage all events. You can create franchise or standalone events.'
              : userRole === 'franchisee' 
              ? 'Create and manage events for your franchise. Standalone events require Super Admin approval.'
              : userRole === 'standaloneAdmin'
              ? 'Create and manage standalone events.'
              : 'Create and manage events.'}
          </p>
        </div>
        <Link
          href="/admin/events/create"
          className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-orange-500 text-white font-semibold hover:bg-orange-600 transition shadow-lg"
        >
          + Create Event
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Total Events</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{events.length}</p>
          <p className="text-xs text-gray-400 mt-1">
            {isSuperAdmin ? 'All events' : 
             userRole === 'franchisee' ? 'Franchise events' : 'Your events'}
          </p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Pending Approval</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">
            {isSuperAdmin ? pendingApprovalEvents.length : events.filter((event) => event.status === 'pendingApproval').length}
          </p>
          <p className="text-xs text-gray-400 mt-1">Awaiting review</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Approved Events</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">
            {events.filter((event) => event.status === 'approved').length}
          </p>
          <p className="text-xs text-gray-400 mt-1">Visible on the site</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {(['all', 'pendingApproval', 'approved', 'rejected'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize transition ${
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
      </div>

      {/* Super Admin Table View */}
      {isSuperAdmin ? (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-white">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">All Events</h2>
              <p className="text-sm text-gray-500">Complete overview of all events in the system</p>
            </div>
          </div>

          {fetchLoading ? (
            <div className="text-center py-12 text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
              Loading events...
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No events found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Event Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Created By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEvents.map((event) => {
                    const creatorInfo = getCreatorInfo(event);
                    const isPending = needsApproval(event);
                    
                    return (
                      <tr
                        key={event.id}
                        className={`hover:bg-gray-50 transition ${
                          isPending ? 'bg-yellow-50 border-l-4 border-l-yellow-400' : ''
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
          <div>
                              <div className="text-sm font-semibold text-slate-900">{event.title}</div>
                              {event.description && (
                                <div className="text-xs text-gray-500 mt-1 line-clamp-1">
                                  {event.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-slate-900 font-medium">{creatorInfo.name}</div>
                          <div className="text-xs text-gray-500">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              creatorInfo.type === 'Franchise'
                                ? 'bg-purple-100 text-purple-800'
                                : creatorInfo.type === 'Standalone Admin'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {creatorInfo.type}
                            </span>
                          </div>
                          <div className="text-xs text-gray-400 mt-1">{creatorInfo.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-slate-900">{event.location}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-slate-900">{event.date}</div>
                          {event.time && (
                            <div className="text-xs text-gray-500">{event.time}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              event.status === 'approved'
                                ? 'bg-green-100 text-green-800'
                                : event.status === 'pendingApproval'
                                ? 'bg-yellow-100 text-yellow-800'
                                : event.status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {event.status === 'pendingApproval' && isPending ? '⚠️ Needs Approval' : event.status}
                          </span>
                          {isPending && (
                            <div className="text-xs text-yellow-600 mt-1 font-medium">
                              {creatorInfo.type === 'Franchise' ? 'Standalone event' : 'Franchise event'}
          </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            {isPending && (
                              <>
                                <button
                                  onClick={() => event.id && handleApprove(event.id)}
                                  disabled={actionLoading === event.id}
                                  className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-semibold hover:bg-green-600 disabled:opacity-50 transition"
                                >
                                  {actionLoading === event.id ? '...' : 'Approve'}
                                </button>
                                <button
                                  onClick={() => event.id && handleReject(event.id)}
                                  disabled={actionLoading === event.id}
                                  className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-semibold hover:bg-red-600 disabled:opacity-50 transition"
                                >
                                  {actionLoading === event.id ? '...' : 'Reject'}
                                </button>
                              </>
                            )}
                            <Link
                              href={`/admin/events/edit/${event.id}`}
                              className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-xs font-semibold hover:bg-blue-600 transition"
                            >
                              Edit
          </Link>
                            <button
                              onClick={() => event.id && handleDelete(event.id)}
                              disabled={actionLoading === event.id}
                              className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-semibold hover:bg-red-600 disabled:opacity-50 transition"
                            >
                              {actionLoading === event.id ? '...' : 'Delete'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        // Non-Super Admin View (Card/List Layout)
        <div className="bg-white border border-gray-100 rounded-2xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-white">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {userRole === 'franchisee' ? 'Franchise Events' : 'Your Events'}
              </h2>
              <p className="text-sm text-gray-500">
                {userRole === 'franchisee' ? 'Edit events for your franchise' : 'Edit details or track approval status'}
              </p>
            </div>
        </div>

        {fetchLoading ? (
            <div className="text-center py-12 text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
              Loading events...
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No events found.</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredEvents.map((event) => (
              <div
                key={event.id}
                  className="p-6 hover:bg-gray-50 transition"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-slate-900">{event.title}</h3>
                  <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      event.status === 'approved'
                              ? 'bg-green-100 text-green-800'
                        : event.status === 'pendingApproval'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {event.status}
                  </span>
                      </div>
                      {event.description && (
                        <p className="text-gray-600 mb-2">{event.description}</p>
                      )}
                      <div className="flex gap-4 text-sm text-gray-500">
                        <span>📅 {event.date}</span>
                        {event.time && <span>🕐 {event.time}</span>}
                        <span>📍 {event.location}</span>
                        {event.price && <span>💰 {event.price}</span>}
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        Created by: {event.createdByEmail} on{' '}
                        {event.createdAt.toLocaleDateString()}
                        {event.approvedBy && event.approvedAt && (
                          <> • Approved on {event.approvedAt.toLocaleDateString()}</>
                        )}
                      </p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      {/* Check if user can edit this event */}
                      {((userRole === 'superAdmin' || userRole === 'owner') ||
                        (userRole === 'franchisee' && (event.franchiseId === user?.uid || event.createdBy === user?.uid)) ||
                        ((userRole === 'standaloneAdmin' || userRole === 'admin') && event.createdBy === user?.uid)) && (
                    <Link
                      href={`/admin/events/edit/${event.id}`}
                          className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-semibold transition"
                    >
                      Edit
                    </Link>
                  )}
                      {/* Check if user can delete this event */}
                      {((userRole === 'superAdmin' || userRole === 'owner') ||
                        (userRole === 'franchisee' && (event.franchiseId === user?.uid || event.createdBy === user?.uid)) ||
                        ((userRole === 'standaloneAdmin' || userRole === 'admin') && event.createdBy === user?.uid)) && (
                    <button
                          onClick={() => event.id && handleDelete(event.id)}
                          disabled={actionLoading === event.id}
                          className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-semibold disabled:opacity-50 transition"
                        >
                          {actionLoading === event.id ? '...' : 'Delete'}
                    </button>
                  )}
                    </div>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      )}
    </div>
  );
}
