// UPDATED: Chess Tourneys - Super Admin Dashboard
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useRequireRole } from '@/hooks/useRequireRole';
import { EventData, UserData, UserRole } from '@/lib/types';
import { approveEvent, getEventsByStatus, rejectEvent, getAllEvents } from '@/lib/events';
import { getAllUsers, updateUserRole } from '@/lib/userRoles';
import Link from 'next/link';

export default function SuperAdminDashboardPage() {
  useRequireRole(['superAdmin']);
  
  const { user, role, loading } = useAuth();
  const router = useRouter();
  const [pendingEvents, setPendingEvents] = useState<EventData[]>([]);
  const [allEvents, setAllEvents] = useState<EventData[]>([]);
  const [team, setTeam] = useState<UserData[]>([]);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedUserForRoleChange, setSelectedUserForRoleChange] = useState<{ uid: string; email: string } | null>(null);
  const [newRole, setNewRole] = useState<UserRole>('player');

  useEffect(() => {
    if (!loading && role !== 'superAdmin') {
      // Also check for old 'owner' role for migration
      if (role !== 'owner') {
        router.push('/dashboard');
        return;
      }
    }

    if (user && (role === 'superAdmin' || role === 'owner')) {
      const loadData = async () => {
        setFetchLoading(true);
        try {
          // Get pending events (franchisee standalone events)
          const pending = await getEventsByStatus('pendingApproval');
          // Filter to only show standalone events (franchiseId is null)
          const standalonePending = pending.filter(e => !e.franchiseId || e.franchiseId === null);
          
          const [all, users] = await Promise.all([
            getAllEvents(),
            getAllUsers(),
          ]);
          setPendingEvents(standalonePending);
          setAllEvents(all);
          setTeam(users);
        } finally {
          setFetchLoading(false);
        }
      };

      loadData();
    }
  }, [user, role, loading, router]);

  const handleApprove = async (eventId: string) => {
    if (!user) return;
    setActionLoading(eventId);
    try {
      await approveEvent(eventId, user.uid);
      setPendingEvents((prev) => prev.filter((event) => event.id !== eventId));
      setSuccessMessage('Event approved successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      alert(`Failed to approve event: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (eventId: string) => {
    setActionLoading(eventId);
    try {
      await rejectEvent(eventId);
      setPendingEvents((prev) => prev.filter((event) => event.id !== eventId));
      setSuccessMessage('Event rejected.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      alert(`Failed to reject event: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRoleChange = async () => {
    if (!user || !selectedUserForRoleChange) return;
    
    if (!confirm(`Are you sure you want to change ${selectedUserForRoleChange.email}'s role to ${newRole}?`)) {
      return;
    }
    
    setActionLoading(selectedUserForRoleChange.uid);
    try {
      await updateUserRole(user.uid, selectedUserForRoleChange.uid, newRole);
      setSuccessMessage(`Role updated successfully! ${selectedUserForRoleChange.email} is now ${newRole}.`);
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // Reload team data
      const users = await getAllUsers();
      setTeam(users);
      setSelectedUserForRoleChange(null);
    } catch (error: any) {
      alert(`Failed to update role: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  if (!user || loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <p className="text-gray-500">Loading super admin console...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{successMessage}</span>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-green-600 hover:text-green-800"
          >
            ✕
          </button>
        </div>
      )}

      <div>
        <p className="text-sm text-gray-500">Super Admin Console</p>
        <h1 className="text-3xl font-bold text-slate-900">Manage Chess Tourneys</h1>
        <p className="text-gray-500 mt-2">
          Approve events, manage user roles, and oversee the platform.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Pending Approvals</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{pendingEvents.length}</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Franchisees</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">
            {team.filter((member) => member.role === 'franchisee').length}
          </p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Standalone Admins</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">
            {team.filter((member) => member.role === 'standaloneAdmin').length}
          </p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Total Users</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{team.length}</p>
        </div>
      </div>

      {/* Pending Event Approvals Section */}
      <section className="bg-white border border-gray-100 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Pending Event Approvals</h2>
            <p className="text-sm text-gray-500">Review standalone events created by Franchisees.</p>
          </div>
        </div>
        {fetchLoading ? (
          <div className="text-center py-10 text-gray-500">Loading pending events...</div>
        ) : pendingEvents.length === 0 ? (
          <div className="text-center py-10 text-gray-500">No pending events. You're all caught up!</div>
        ) : (
          <div className="space-y-3">
            {pendingEvents.map((event) => (
              <div
                key={event.id}
                className="flex flex-col md:flex-row md:items-center md:justify-between border border-gray-100 rounded-xl p-4"
              >
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">{event.date}</p>
                  <h3 className="text-lg font-semibold text-slate-900">{event.title}</h3>
                  <p className="text-sm text-gray-500">{event.location}</p>
                  <p className="text-xs text-gray-400 mt-1">Created by {event.createdByEmail}</p>
                  {event.isStandalone && (
                    <span className="inline-block mt-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                      Standalone Event
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-3 md:mt-0">
                  <Link
                    href={`/events/${event.id}`}
                    className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200"
                  >
                    View
                  </Link>
                  <button
                    onClick={() => handleApprove(event.id!)}
                    disabled={actionLoading === event.id}
                    className="px-4 py-2 rounded-lg bg-green-500 text-white text-sm font-semibold hover:bg-green-600 disabled:opacity-50"
                  >
                    {actionLoading === event.id ? 'Processing...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => handleReject(event.id!)}
                    disabled={actionLoading === event.id}
                    className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* User Role Management Section */}
      <section className="bg-white border border-gray-100 rounded-2xl p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">User Role Management</h2>
          <p className="text-sm text-gray-500">Assign roles to users. Only Super Admin can change roles.</p>
        </div>
        
        {fetchLoading ? (
          <div className="text-center py-10 text-gray-500">Loading users...</div>
        ) : (
          <div className="space-y-3">
            {team.map((member) => (
              <div
                key={member.uid}
                className="flex flex-col md:flex-row md:items-center md:justify-between border border-gray-100 rounded-xl p-4"
              >
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{member.email}</h3>
                  <p className="text-sm text-gray-500 capitalize">
                    Current Role: {member.role || 'player'}
                  </p>
                </div>
                <div className="flex items-center gap-3 mt-3 md:mt-0">
                  <select
                    value={member.role || 'player'}
                    onChange={(e) => {
                      setSelectedUserForRoleChange({ uid: member.uid, email: member.email });
                      setNewRole(e.target.value as UserRole);
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="player">Player</option>
                    <option value="standaloneAdmin">Standalone Admin</option>
                    <option value="franchisee">Franchisee</option>
                    <option value="superAdmin">Super Admin</option>
                  </select>
                  {selectedUserForRoleChange?.uid === member.uid && 
                   selectedUserForRoleChange?.uid !== user?.uid && (
                    <button
                      onClick={handleRoleChange}
                      disabled={actionLoading === member.uid || (member.role === newRole)}
                      className="px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {actionLoading === member.uid ? 'Updating...' : 'Update Role'}
                    </button>
                  )}
                  {member.uid === user?.uid && (
                    <span className="text-xs text-gray-400">(You)</span>
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

