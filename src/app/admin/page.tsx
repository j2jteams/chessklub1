// UPDATED: role-based routing and approval flows - Phase 0.5
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRequireRole } from '@/hooks/useRequireRole';
import { getAllUsers, updateUserRole } from '@/lib/userRoles';
import { UserData, UserRole } from '@/lib/types';
import Link from 'next/link';

export default function AdminPage() {
  // Protect route - only owners can access
  useRequireRole(['owner']);
  
  const { user, role, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && user && role === 'owner') {
      loadUsers();
    }
  }, [user, role, authLoading]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const allUsers = await getAllUsers();
      setUsers(allUsers);
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      await updateUserRole(userId, newRole);
      await loadUsers(); // Reload users
    } catch (err: any) {
      setError(err.message || 'Failed to update user role');
    }
  };

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-slate-900">Admin Management</h1>
            <div className="flex gap-4">
              <Link
                href="/dashboard/admin"
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md font-semibold transition"
              >
                Manage Events
              </Link>
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

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-6">User Roles Management</h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((userData) => (
                  <tr key={userData.uid}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {userData.email}
                      {userData.uid === user?.uid && (
                        <span className="ml-2 text-xs text-orange-500">(You)</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        userData.role === 'owner'
                          ? 'bg-purple-100 text-purple-800'
                          : userData.role === 'admin'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {userData.role || 'player'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {userData.uid !== user?.uid && (
                        <div className="flex gap-2">
                          {userData.role !== 'owner' && (
                            <button
                              onClick={() => handleRoleChange(userData.uid, 'admin')}
                              disabled={userData.role === 'admin'}
                              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-3 py-1 rounded text-xs font-semibold transition"
                            >
                              Make Admin
                            </button>
                          )}
                          <button
                            onClick={() => handleRoleChange(userData.uid, null)}
                            disabled={userData.role === null}
                            className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-3 py-1 rounded text-xs font-semibold transition"
                          >
                            Remove Role
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {users.length === 0 && (
            <p className="text-center text-gray-500 py-8">No users found.</p>
          )}
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Role Permissions:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li><strong>Owner:</strong> Can create events, manage admins, and approve events posted by admins</li>
            <li><strong>Admin:</strong> Can create and edit events (requires owner approval)</li>
            <li><strong>Player:</strong> Regular user with no special permissions (default role)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

