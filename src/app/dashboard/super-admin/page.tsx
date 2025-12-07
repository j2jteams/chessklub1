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
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

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
      <section className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                User Role Management
              </h2>
              <p className="text-sm text-gray-500 mt-1">Assign and manage user roles across the platform</p>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            <div className="relative sm:w-48">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="appearance-none block w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 cursor-pointer"
              >
                <option value="all">All Roles</option>
                <option value="player">Player</option>
                <option value="standaloneAdmin">Standalone Admin</option>
                <option value="franchisee">Franchisee</option>
                <option value="superAdmin">Super Admin</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
        
        {fetchLoading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            <p className="text-gray-500 mt-4">Loading users...</p>
          </div>
        ) : (() => {
          // Filter users based on search and role filter
          const filteredTeam = team.filter((member) => {
            const matchesSearch = searchQuery === '' || 
              member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (member.firstName && member.firstName.toLowerCase().includes(searchQuery.toLowerCase())) ||
              (member.lastName && member.lastName.toLowerCase().includes(searchQuery.toLowerCase())) ||
              `${member.firstName || ''} ${member.lastName || ''}`.toLowerCase().includes(searchQuery.toLowerCase());
            
            const matchesRole = roleFilter === 'all' || member.role === (roleFilter as UserRole);
            
            return matchesSearch && matchesRole;
          });

          if (filteredTeam.length === 0) {
            return (
              <div className="text-center py-16">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className="mt-4 text-gray-500 font-medium">No users found</p>
                <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filter criteria</p>
              </div>
            );
          }

          return (
            <div className="space-y-3">
              <div className="text-sm text-gray-500 mb-2">
                Showing {filteredTeam.length} of {team.length} users
              </div>
              {filteredTeam.map((member) => {
              const isCurrentUser = member.uid === user?.uid;
              const isSelected = selectedUserForRoleChange?.uid === member.uid;
              const roleChanged = isSelected && member.role !== newRole;
              
              const getRoleBadge = (role: UserRole) => {
                const roleConfig = {
                  superAdmin: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: '👑', label: 'Super Admin' },
                  franchisee: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', icon: '🏢', label: 'Franchisee' },
                  standaloneAdmin: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: '⚙️', label: 'Standalone Admin' },
                  player: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', icon: '👤', label: 'Player' },
                };
                const config = roleConfig[role || 'player'] || roleConfig.player;
                return (
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border ${config.bg} ${config.text} ${config.border}`}>
                    <span>{config.icon}</span>
                    {config.label}
                  </span>
                );
              };

              const getInitials = (email: string, firstName?: string, lastName?: string) => {
                if (firstName && lastName) {
                  return `${firstName[0]}${lastName[0]}`.toUpperCase();
                }
                return email[0].toUpperCase();
              };

              return (
                <div
                  key={member.uid}
                  className={`group relative flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 ${
                    isCurrentUser 
                      ? 'bg-orange-50 border-orange-200 shadow-sm' 
                      : 'bg-white border-gray-100 hover:border-orange-200 hover:shadow-md'
                  }`}
                >
                  {/* Avatar */}
                  <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                    member.role === 'superAdmin' ? 'bg-gradient-to-br from-red-500 to-red-600' :
                    member.role === 'franchisee' ? 'bg-gradient-to-br from-purple-500 to-purple-600' :
                    member.role === 'standaloneAdmin' ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
                    'bg-gradient-to-br from-gray-500 to-gray-600'
                  }`}>
                    {getInitials(member.email, member.firstName, member.lastName)}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-semibold text-slate-900 truncate">
                        {member.firstName && member.lastName 
                          ? `${member.firstName} ${member.lastName}`
                          : member.email
                        }
                      </h3>
                      {isCurrentUser && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-700 border border-orange-200">
                          You
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 truncate mb-2">{member.email}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {getRoleBadge(member.role)}
                      {member.franchiseId && (
                        <span className="text-xs text-gray-500">• Franchise: {member.franchiseId}</span>
                      )}
                      {member.uscfId && (
                        <span className="text-xs text-gray-500">• USCF: {member.uscfId}</span>
                      )}
                    </div>
                  </div>

                  {/* Role Selector & Actions */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {!isCurrentUser ? (
                      <>
                        <div className="relative">
                          <select
                            value={isSelected ? (newRole || 'player') : (member.role || 'player')}
                            onChange={(e) => {
                              setSelectedUserForRoleChange({ uid: member.uid, email: member.email });
                              setNewRole((e.target.value || 'player') as UserRole);
                            }}
                            className={`appearance-none px-4 py-2.5 pr-10 rounded-lg border-2 text-sm font-medium transition-all ${
                              isSelected && roleChanged
                                ? 'border-orange-500 bg-orange-50 text-orange-900'
                                : 'border-gray-200 bg-white text-slate-700 hover:border-gray-300'
                            } focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 cursor-pointer`}
                          >
                            <option value="player">Player</option>
                            <option value="standaloneAdmin">Standalone Admin</option>
                            <option value="franchisee">Franchisee</option>
                            <option value="superAdmin">Super Admin</option>
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                        
                        {isSelected && roleChanged && (
                          <button
                            onClick={handleRoleChange}
                            disabled={actionLoading === member.uid}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-semibold hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all duration-200"
                          >
                            {actionLoading === member.uid ? (
                              <>
                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Updating...</span>
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span>Update Role</span>
                              </>
                            )}
                          </button>
                        )}
                      </>
                    ) : (
                      <div className="px-4 py-2.5 rounded-lg bg-gray-100 text-gray-500 text-sm font-medium">
                        Cannot change own role
                      </div>
                    )}
                  </div>
                </div>
              );
              })}
            </div>
          );
        })()}
      </section>
    </div>
  );
}

