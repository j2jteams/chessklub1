// UPDATED: role-based routing and approval flows - Phase 0.5
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { EventData, UserData } from '@/lib/types';
import { approveEvent, getEventsByStatus, rejectEvent, getAllEvents, deleteEvent } from '@/lib/events';
import { getAllUsers, updateUserRole, transferGodOwnership, promoteAdminToOwner, demoteOwnerToAdmin, demoteAdminToPlayer, isGodOwner } from '@/lib/userRoles';
import { getPendingAdminRequests, approveAdminRequest, rejectAdminRequest, AdminRequest } from '@/lib/adminRequests';
import Link from 'next/link';

export default function OwnerDashboardPage() {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  const [pendingEvents, setPendingEvents] = useState<EventData[]>([]);
  const [allEvents, setAllEvents] = useState<EventData[]>([]);
  const [pendingAdminRequests, setPendingAdminRequests] = useState<AdminRequest[]>([]);
  const [team, setTeam] = useState<UserData[]>([]);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isGodOwnerUser, setIsGodOwnerUser] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
        return;
      }
      if (role !== 'owner') {
        router.push('/dashboard');
        return;
      }

      const loadData = async () => {
        setFetchLoading(true);
        try {
          // UPDATED: role-based routing and approval flows - Phase 0.5
          const [pending, all, adminRequests, users, godOwnerStatus] = await Promise.all([
            getEventsByStatus('pendingApproval'),
            getAllEvents(),
            getPendingAdminRequests(),
            getAllUsers(),
            user ? isGodOwner(user.uid) : Promise.resolve(false),
          ]);
          setPendingEvents(pending);
          setAllEvents(all);
          setPendingAdminRequests(adminRequests);
          setTeam(users);
          setIsGodOwnerUser(godOwnerStatus);
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

  const handleRoleChange = async (uid: string, newRole: 'player' | 'admin') => {
    setActionLoading(uid);
    try {
      await updateUserRole(uid, newRole);
      setTeam((prev) =>
        prev.map((member) =>
          member.uid === uid ? { ...member, role: newRole } : member,
        ),
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleDemoteOwnerToAdmin = async (ownerUid: string, ownerEmail: string) => {
    if (!user || !isGodOwnerUser) return;
    if (!confirm(`Are you sure you want to demote ${ownerEmail} from Owner to Admin? They will lose owner permissions.`)) {
      return;
    }
    
    setActionLoading(ownerUid);
    try {
      await demoteOwnerToAdmin(user.uid, ownerUid);
      setSuccessMessage(`${ownerEmail} has been demoted to Admin successfully!`);
      setTimeout(() => setSuccessMessage(null), 5000);
      
      // Reload team data
      const users = await getAllUsers();
      setTeam(users);
    } catch (error: any) {
      console.error('Error demoting owner:', error);
      alert(`Failed to demote owner: ${error.message || 'Unknown error'}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDemoteAdminToPlayer = async (adminUid: string, adminEmail: string) => {
    if (!user) return;
    if (!confirm(`Are you sure you want to remove admin access from ${adminEmail}? They will become a regular player.`)) {
      return;
    }
    
    setActionLoading(adminUid);
    try {
      await demoteAdminToPlayer(user.uid, adminUid);
      setSuccessMessage(`${adminEmail} has been demoted to Player successfully!`);
      setTimeout(() => setSuccessMessage(null), 5000);
      
      // Reload team data
      const users = await getAllUsers();
      setTeam(users);
    } catch (error: any) {
      console.error('Error demoting admin:', error);
      alert(`Failed to demote admin: ${error.message || 'Unknown error'}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveAdminRequest = async (requestId: string) => {
    if (!user) {
      console.error('User not found');
      return;
    }
    if (!requestId) {
      console.error('Request ID is missing');
      return;
    }
    
    setActionLoading(requestId);
    try {
      console.log('Approving admin request:', requestId);
      await approveAdminRequest(requestId, user.uid);
      console.log('Admin request approved successfully');
      
      // Remove from pending list
      setPendingAdminRequests((prev) => prev.filter((req) => req.id !== requestId));
      
      // Reload team to show updated roles (wait a bit for Firestore to update)
      await new Promise(resolve => setTimeout(resolve, 500));
      const users = await getAllUsers();
      console.log('Reloaded users after approval:', users);
      console.log('Admins count:', users.filter(u => u.role === 'admin').length);
      setTeam(users);
      
      // Reload pending requests to refresh the list
      const updatedRequests = await getPendingAdminRequests();
      setPendingAdminRequests(updatedRequests);
      
      // Show success message with admin count
      const adminCount = users.filter(u => u.role === 'admin').length;
      setSuccessMessage(`Admin request approved successfully! The user is now an admin. (Total admins: ${adminCount})`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error: any) {
      console.error('Error approving admin request:', error);
      alert(`Failed to approve admin request: ${error.message || 'Unknown error'}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectAdminRequest = async (requestId: string) => {
    if (!user) {
      console.error('User not found');
      return;
    }
    if (!requestId) {
      console.error('Request ID is missing');
      return;
    }
    
    setActionLoading(requestId);
    try {
      console.log('Rejecting admin request:', requestId);
      await rejectAdminRequest(requestId, user.uid);
      console.log('Admin request rejected successfully');
      
      // Remove from pending list
      setPendingAdminRequests((prev) => prev.filter((req) => req.id !== requestId));
      
      // Reload pending requests to refresh the list
      const updatedRequests = await getPendingAdminRequests();
      setPendingAdminRequests(updatedRequests);
    } catch (error: any) {
      console.error('Error rejecting admin request:', error);
      alert(`Failed to reject admin request: ${error.message || 'Unknown error'}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handlePromoteAdminToOwner = async (adminUid: string, adminEmail: string) => {
    if (!user || !isGodOwnerUser) return;
    if (!confirm(`Are you sure you want to promote ${adminEmail} to Owner? They will have full owner permissions.`)) {
      return;
    }
    
    setActionLoading(adminUid);
    try {
      await promoteAdminToOwner(user.uid, adminUid);
      setSuccessMessage(`${adminEmail} has been promoted to Owner successfully!`);
      setTimeout(() => setSuccessMessage(null), 5000);
      
      // Reload team data
      const users = await getAllUsers();
      setTeam(users);
    } catch (error: any) {
      console.error('Error promoting admin to owner:', error);
      alert(`Failed to promote admin: ${error.message || 'Unknown error'}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleTransferGodOwnership = async (targetOwnerUid: string, targetEmail: string) => {
    if (!user || !isGodOwnerUser) return;
    if (!confirm(`WARNING: Are you sure you want to transfer God Owner status to ${targetEmail}? This action is permanent and you will lose God Owner privileges.`)) {
      return;
    }
    
    if (!confirm(`Final confirmation: Transfer God Owner status to ${targetEmail}? You will no longer be able to transfer ownership or promote users.`)) {
      return;
    }
    
    setActionLoading(targetOwnerUid);
    try {
      await transferGodOwnership(user.uid, targetOwnerUid);
      setSuccessMessage(`God Owner status has been transferred to ${targetEmail} successfully!`);
      setTimeout(() => setSuccessMessage(null), 5000);
      
      // Reload team data and God Owner status
      const [users, godOwnerStatus] = await Promise.all([
        getAllUsers(),
        isGodOwner(user.uid),
      ]);
      setTeam(users);
      setIsGodOwnerUser(godOwnerStatus);
    } catch (error: any) {
      console.error('Error transferring God Owner status:', error);
      alert(`Failed to transfer ownership: ${error.message || 'Unknown error'}`);
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
      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-green-600 hover:text-green-800"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

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
            {team.filter((member) => member.role === 'admin').length}
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
                    onClick={() => {
                      if (request.id) {
                        handleApproveAdminRequest(request.id);
                      } else {
                        console.error('Request ID is missing');
                        alert('Error: Request ID is missing');
                      }
                    }}
                    disabled={actionLoading === request.id || !request.id}
                    className="px-4 py-2 rounded-lg bg-green-500 text-white text-sm font-semibold hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {actionLoading === request.id ? (
                      <>
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      'Approve'
                    )}
                  </button>
                  <button
                    onClick={() => {
                      if (request.id) {
                        handleRejectAdminRequest(request.id);
                      } else {
                        console.error('Request ID is missing');
                        alert('Error: Request ID is missing');
                      }
                    }}
                    disabled={actionLoading === request.id || !request.id}
                    className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {actionLoading === request.id ? (
                      <>
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      'Reject'
                    )}
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

      {/* Owner Management - Only for God Owner */}
      {isGodOwnerUser && (
        <section className="bg-gradient-to-r from-purple-50 to-purple-100 border-2 border-purple-200 rounded-2xl p-6">
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              <h2 className="text-lg font-semibold text-purple-900">Owner Management (God Owner)</h2>
            </div>
            <p className="text-sm text-purple-700">As God Owner, you can promote admins to owners or transfer God Owner status to another owner.</p>
          </div>
          {fetchLoading ? (
            <div className="text-center py-10 text-purple-600">Loading owner data...</div>
          ) : (
            <div className="space-y-4">
              {/* Admins that can be promoted to Owner */}
              <div>
                <h3 className="text-sm font-semibold text-purple-800 mb-2">Promote Admin to Owner</h3>
                {team.filter(m => m.role === 'admin').length === 0 ? (
                  <p className="text-sm text-purple-600">No admins available to promote.</p>
                ) : (
                  <div className="space-y-2">
                    {team.filter(m => m.role === 'admin').map((admin) => (
                      <div key={admin.uid} className="flex items-center justify-between bg-white rounded-lg p-3 border border-purple-200">
                        <div>
                          <p className="font-medium text-slate-900">{admin.email}</p>
                          <p className="text-xs text-gray-500">Current role: Admin</p>
                        </div>
                        <button
                          onClick={() => handlePromoteAdminToOwner(admin.uid, admin.email)}
                          disabled={actionLoading === admin.uid}
                          className="px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {actionLoading === admin.uid ? 'Processing...' : 'Promote to Owner'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Other Owners - can demote or transfer God Owner status */}
              <div className="border-t border-purple-200 pt-4">
                <h3 className="text-sm font-semibold text-purple-800 mb-2">Manage Other Owners</h3>
                {team.filter(m => m.role === 'owner' && m.uid !== user.uid && !m.isGodOwner).length === 0 ? (
                  <p className="text-sm text-purple-600">No other owners to manage.</p>
                ) : (
                  <div className="space-y-2">
                    {team.filter(m => m.role === 'owner' && m.uid !== user.uid && !m.isGodOwner).map((owner) => (
                      <div key={owner.uid} className="flex items-center justify-between bg-white rounded-lg p-3 border border-purple-200">
                        <div>
                          <p className="font-medium text-slate-900">{owner.email}</p>
                          <p className="text-xs text-gray-500">Current role: Owner</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDemoteOwnerToAdmin(owner.uid, owner.email)}
                            disabled={actionLoading === owner.uid}
                            className="px-3 py-1 rounded-lg border border-orange-200 text-xs font-semibold text-orange-600 hover:bg-orange-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Demote to Admin
                          </button>
                          <button
                            onClick={() => handleTransferGodOwnership(owner.uid, owner.email)}
                            disabled={actionLoading === owner.uid}
                            className="px-3 py-1 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Transfer God Owner
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      )}

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
                    <td className="px-4 py-3 text-sm text-slate-900">
                      {member.email}
                      {member.isGodOwner && (
                        <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                          God Owner
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm capitalize">
                      {member.role}
                      {member.isGodOwner && ' (God)'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {member.uid === user.uid ? (
                        <span className="text-gray-400 text-xs">You</span>
                      ) : member.role === 'owner' && !member.isGodOwner ? (
                        // God Owner can demote regular owners to admin
                        isGodOwnerUser ? (
                          <button
                            onClick={() => handleDemoteOwnerToAdmin(member.uid, member.email)}
                            disabled={actionLoading === member.uid}
                            className="px-3 py-1 rounded-lg border border-red-200 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            Demote to Admin
                          </button>
                        ) : (
                          <span className="text-gray-400 text-xs">Owner</span>
                        )
                      ) : member.role === 'admin' ? (
                        // God Owner or regular owner can demote admins to player
                        <button
                          onClick={() => handleDemoteAdminToPlayer(member.uid, member.email)}
                          disabled={actionLoading === member.uid}
                          className="px-3 py-1 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                        >
                          Remove Admin
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRoleChange(member.uid, 'admin')}
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

