// UPDATED: Chess Tourneys - Super Admin Dashboard
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useRequireRole } from '@/hooks/useRequireRole';
import { UserData, UserRole } from '@/lib/types';
import { getAllUsers, updateUserRole } from '@/lib/userRoles';
import { getPendingAdminRequests, approveAdminRequest, rejectAdminRequest, AdminRequest } from '@/lib/adminRequests';

export default function SuperAdminDashboardPage() {
  useRequireRole(['superAdmin']);
  
  const { user, role, loading } = useAuth();
  const router = useRouter();
  const [team, setTeam] = useState<UserData[]>([]);
  const [pendingAdminRequests, setPendingAdminRequests] = useState<AdminRequest[]>([]);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedUserForRoleChange, setSelectedUserForRoleChange] = useState<{ uid: string; email: string } | null>(null);
  const [newRole, setNewRole] = useState<UserRole>('player');
  const [selectedView, setSelectedView] = useState<'franchisees' | 'standaloneAdmins' | 'totalUsers' | null>(null);

  useEffect(() => {
    if (!loading && role !== 'superAdmin') {
      router.push('/dashboard');
      return;
    }

    if (user && role === 'superAdmin') {
      const loadData = async () => {
        setFetchLoading(true);
        try {
          const [users, adminRequests] = await Promise.all([
            getAllUsers(),
            getPendingAdminRequests(),
          ]);
          setTeam(users);
          setPendingAdminRequests(adminRequests);
        } finally {
          setFetchLoading(false);
        }
      };

      loadData();
    }
  }, [user, role, loading, router]);


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

  const handleApproveAdminRequest = async (requestId: string) => {
    if (!user) return;
    setActionLoading(requestId);
    try {
      await approveAdminRequest(requestId, user.uid);
      setPendingAdminRequests((prev) => prev.filter((req) => req.id !== requestId));
      setSuccessMessage('Admin request approved successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // Reload data
      const [users, adminRequests] = await Promise.all([
        getAllUsers(),
        getPendingAdminRequests(),
      ]);
      setTeam(users);
      setPendingAdminRequests(adminRequests);
    } catch (error: any) {
      alert(`Failed to approve admin request: ${error.message}`);
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
      setSuccessMessage('Admin request rejected.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      alert(`Failed to reject admin request: ${error.message}`);
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
          Manage user roles, approve admin requests, and oversee the platform.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Pending Admin Requests</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{pendingAdminRequests.length}</p>
        </div>
        <button
          onClick={() => setSelectedView(selectedView === 'franchisees' ? null : 'franchisees')}
          className={`bg-white border rounded-2xl p-5 text-left transition-all hover:shadow-lg cursor-pointer ${
            selectedView === 'franchisees' ? 'border-orange-500 shadow-md' : 'border-gray-100'
          }`}
        >
          <p className="text-xs text-gray-500 uppercase tracking-wide">Franchisees</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">
            {team.filter((member) => member.role === 'franchisee').length}
          </p>
        </button>
        <button
          onClick={() => setSelectedView(selectedView === 'standaloneAdmins' ? null : 'standaloneAdmins')}
          className={`bg-white border rounded-2xl p-5 text-left transition-all hover:shadow-lg cursor-pointer ${
            selectedView === 'standaloneAdmins' ? 'border-orange-500 shadow-md' : 'border-gray-100'
          }`}
        >
          <p className="text-xs text-gray-500 uppercase tracking-wide">Standalone Admins</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">
            {team.filter((member) => member.role === 'standaloneAdmin').length}
          </p>
        </button>
        <button
          onClick={() => setSelectedView(selectedView === 'totalUsers' ? null : 'totalUsers')}
          className={`bg-white border rounded-2xl p-5 text-left transition-all hover:shadow-lg cursor-pointer ${
            selectedView === 'totalUsers' ? 'border-orange-500 shadow-md' : 'border-gray-100'
          }`}
        >
          <p className="text-xs text-gray-500 uppercase tracking-wide">Total Users</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{team.length}</p>
        </button>
      </div>

      {/* Detailed Tables */}
      {selectedView && (
        <section className="bg-white border border-gray-100 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {selectedView === 'franchisees' && 'Franchisees'}
                {selectedView === 'standaloneAdmins' && 'Standalone Admins'}
                {selectedView === 'totalUsers' && 'All Users'}
              </h2>
              <p className="text-sm text-gray-500">
                {selectedView === 'franchisees' && 'All franchisee accounts in the system.'}
                {selectedView === 'standaloneAdmins' && 'All standalone admin accounts in the system.'}
                {selectedView === 'totalUsers' && 'Complete list of all users in the system.'}
              </p>
            </div>
            <button
              onClick={() => setSelectedView(null)}
              className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200"
            >
              Close
            </button>
          </div>

          {selectedView === 'franchisees' && (
            <div className="overflow-x-auto">
              {fetchLoading ? (
                <div className="text-center py-10 text-gray-500">Loading franchisees...</div>
              ) : team.filter((member) => member.role === 'franchisee').length === 0 ? (
                <div className="text-center py-10 text-gray-500">No franchisees found.</div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Email</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Name</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Franchise Name</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Created</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {team
                      .filter((member) => member.role === 'franchisee')
                      .map((member) => (
                        <tr key={member.uid} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 text-sm font-medium text-slate-900">{member.email}</td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {member.firstName} {member.lastName}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {member.franchiseId || '-'}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {member.createdAt?.toLocaleDateString() || '-'}
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-block px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded capitalize">
                              {member.role}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {selectedView === 'standaloneAdmins' && (
            <div className="overflow-x-auto">
              {fetchLoading ? (
                <div className="text-center py-10 text-gray-500">Loading standalone admins...</div>
              ) : team.filter((member) => member.role === 'standaloneAdmin').length === 0 ? (
                <div className="text-center py-10 text-gray-500">No standalone admins found.</div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Email</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Name</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Created</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {team
                      .filter((member) => member.role === 'standaloneAdmin')
                      .map((member) => (
                        <tr key={member.uid} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 text-sm font-medium text-slate-900">{member.email}</td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {member.firstName} {member.lastName}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {member.createdAt?.toLocaleDateString() || '-'}
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded capitalize">
                              {member.role}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {selectedView === 'totalUsers' && (
            <div className="overflow-x-auto">
              {fetchLoading ? (
                <div className="text-center py-10 text-gray-500">Loading users...</div>
              ) : team.length === 0 ? (
                <div className="text-center py-10 text-gray-500">No users found.</div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Email</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Name</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Role</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Franchise Name</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">USCF ID</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {team.map((member) => (
                      <tr key={member.uid} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm font-medium text-slate-900">
                          {member.email}
                          {member.uid === user?.uid && (
                            <span className="ml-2 text-xs text-gray-400">(You)</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {member.firstName} {member.lastName}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-block px-2 py-1 text-xs rounded capitalize ${
                            member.role === 'superAdmin' ? 'bg-red-100 text-red-800' :
                            member.role === 'franchisee' ? 'bg-purple-100 text-purple-800' :
                            member.role === 'standaloneAdmin' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {member.role || 'player'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {member.franchiseId || '-'}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {member.uscfId || '-'}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {member.createdAt?.toLocaleDateString() || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </section>
      )}

      {/* Pending Admin Signup Requests Section */}
      <section className="bg-white border border-gray-100 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Pending Admin Signup Requests</h2>
            <p className="text-sm text-gray-500">Review and approve admin account requests.</p>
          </div>
        </div>
        {fetchLoading ? (
          <div className="text-center py-10 text-gray-500">Loading admin requests...</div>
        ) : pendingAdminRequests.length === 0 ? (
          <div className="text-center py-10 text-gray-500">No pending admin requests. You're all caught up!</div>
        ) : (
          <div className="space-y-3">
            {pendingAdminRequests.map((request) => (
              <div
                key={request.id}
                className="flex flex-col md:flex-row md:items-center md:justify-between border border-gray-100 rounded-xl p-4"
              >
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">
                    {request.createdAt.toLocaleDateString()}
                  </p>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {request.firstName} {request.lastName}
                  </h3>
                  <p className="text-sm text-gray-500">{request.email}</p>
                  {request.franchiseId ? (
                    <span className="inline-block mt-2 px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">
                      Franchise Admin (Name: {request.franchiseId})
                    </span>
                  ) : (
                    <span className="inline-block mt-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                      Standalone Admin
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-3 md:mt-0">
                  <button
                    onClick={() => request.id && handleApproveAdminRequest(request.id)}
                    disabled={actionLoading === request.id}
                    className="px-4 py-2 rounded-lg bg-green-500 text-white text-sm font-semibold hover:bg-green-600 disabled:opacity-50"
                  >
                    {actionLoading === request.id ? 'Processing...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => request.id && handleRejectAdminRequest(request.id)}
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

