// UPDATED: role-based routing and approval flows - Phase 0.5
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRequireRole } from '@/hooks/useRequireRole';
import { EventData, UserData } from '@/lib/types';
import { approveEvent, getEventsByStatus, rejectEvent } from '@/lib/events';
import { getAllUsers, updateUserRole } from '@/lib/userRoles';
import { getPendingAdminRequests, approveAdminRequest, rejectAdminRequest, AdminRequest } from '@/lib/adminRequests';

export default function OwnerDashboardPage() {
  // Protect route - only super admins can access
  useRequireRole(['superAdmin']);
  
  const { user, role, loading } = useAuth();
  const [pendingEvents, setPendingEvents] = useState<EventData[]>([]);
  const [pendingAdminRequests, setPendingAdminRequests] = useState<AdminRequest[]>([]);
  const [team, setTeam] = useState<UserData[]>([]);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user && role === 'superAdmin') {
      const loadData = async () => {
        setFetchLoading(true);
        try {
          // UPDATED: role-based routing and approval flows - Phase 0.5
          const [pending, adminRequests, users] = await Promise.all([
            getEventsByStatus('pendingApproval'),
            getPendingAdminRequests(),
            getAllUsers(),
          ]);
          setPendingEvents(pending);
          setPendingAdminRequests(adminRequests);
          setTeam(users);
        } finally {
          setFetchLoading(false);
        }
      };

      loadData();
    }
  }, [user, role, loading]);

  const handleApprove = async (eventId: string) => {
    if (!user) return;
    setActionLoading(eventId);
    try {
      await approveEvent(eventId, user.uid);
      setPendingEvents((prev) => prev.filter((event) => event.id !== eventId));
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (eventId: string) => {
    setActionLoading(eventId);
    try {
      await rejectEvent(eventId);
      setPendingEvents((prev) => prev.filter((event) => event.id !== eventId));
    } finally {
      setActionLoading(null);
    }
  };

  const handleRoleChange = async (uid: string, newRole: 'player' | 'standaloneAdmin') => {
    if (!user) return;
    setActionLoading(uid);
    try {
      await updateUserRole(user.uid, uid, newRole);
      setTeam((prev) =>
        prev.map((member) =>
          member.uid === uid ? { ...member, role: newRole } : member,
        ),
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveAdminRequest = async (requestId: string) => {
    if (!user) return;
    setActionLoading(requestId);
    try {
      await approveAdminRequest(requestId, user.uid);
      setPendingAdminRequests((prev) => prev.filter((req) => req.id !== requestId));
      // Reload team to show updated roles
      const users = await getAllUsers();
      setTeam(users);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectAdminRequest = async (requestId: string) => {
    if (!user) return;
    setActionLoading(requestId);
    try {
      await rejectAdminRequest(requestId, user.uid);
      setPendingAdminRequests((prev) => prev.filter((req) => req.id !== requestId));
    } finally {
      setActionLoading(null);
    }
  };

  if (!user || loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <p className="text-gray-500">Loading owner console...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-500">Owner Console</p>
        <h1 className="text-3xl font-bold text-slate-900">Manage Chess Klub</h1>
        <p className="text-gray-500 mt-2">
          Approve events, manage admins, and oversee community activity.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Pending Event Approvals</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{pendingEvents.length}</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Pending Admin Requests</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{pendingAdminRequests.length}</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Admins</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">
            {team.filter((member) => member.role === 'standaloneAdmin').length}
          </p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Members</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{team.length}</p>
        </div>
      </div>

      {/* Pending Admin Requests Section */}
      <section className="bg-white border border-gray-100 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Pending Admin Requests</h2>
            <p className="text-sm text-gray-500">Review requests from players who want to become admins.</p>
          </div>
        </div>
        {fetchLoading ? (
          <div className="text-center py-10 text-gray-500">Loading admin requests...</div>
        ) : pendingAdminRequests.length === 0 ? (
          <div className="text-center py-10 text-gray-500">No pending admin requests.</div>
        ) : (
          <div className="space-y-3">
            {pendingAdminRequests.map((request) => (
              <div
                key={request.id}
                className="flex flex-col md:flex-row md:items-center md:justify-between border border-gray-100 rounded-xl p-4"
              >
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {request.displayName || request.email}
                  </h3>
                  <p className="text-sm text-gray-500">{request.email}</p>
                  {request.reason && (
                    <p className="text-sm text-gray-600 mt-2">{request.reason}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    Requested on {request.createdAt.toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3 mt-3 md:mt-0">
                  <button
                    onClick={() => handleApproveAdminRequest(request.id!)}
                    disabled={actionLoading === request.id}
                    className="px-4 py-2 rounded-lg bg-green-500 text-white text-sm font-semibold hover:bg-green-600 disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleRejectAdminRequest(request.id!)}
                    disabled={actionLoading === request.id}
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

      <section className="bg-white border border-gray-100 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Pending Event Approvals</h2>
            <p className="text-sm text-gray-500">Review and publish events submitted by admins.</p>
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
                  <p className="text-xs text-gray-400 mt-1">Submitted by {event.createdByEmail}</p>
                </div>
                <div className="flex items-center gap-3 mt-3 md:mt-0">
                  <button
                    onClick={() => handleApprove(event.id!)}
                    disabled={actionLoading === event.id}
                    className="px-4 py-2 rounded-lg bg-green-500 text-white text-sm font-semibold hover:bg-green-600 disabled:opacity-50"
                  >
                    Approve
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

      <section className="bg-white border border-gray-100 rounded-2xl p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Team Management</h2>
          <p className="text-sm text-gray-500">Promote members to admins or remove access.</p>
        </div>
        {fetchLoading ? (
          <div className="text-center py-10 text-gray-500">Loading team data...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Member</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {team.map((member) => (
                  <tr key={member.uid}>
                    <td className="px-4 py-3 text-sm text-slate-900">{member.email}</td>
                    <td className="px-4 py-3 text-sm capitalize">{member.role}</td>
                    <td className="px-4 py-3 text-sm">
                      {member.uid === user.uid ? (
                        <span className="text-gray-400 text-xs">You</span>
                      ) : member.role === 'standaloneAdmin' ? (
                        <button
                          onClick={() => handleRoleChange(member.uid, 'player')}
                          disabled={actionLoading === member.uid}
                          className="px-3 py-1 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                        >
                          Remove Admin
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRoleChange(member.uid, 'standaloneAdmin')}
                          disabled={actionLoading === member.uid}
                          className="px-3 py-1 rounded-lg bg-orange-500 text-white text-xs font-semibold hover:bg-orange-600 disabled:opacity-50"
                        >
                          Make Admin
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

