// UPDATED: role-based routing and approval flows - Phase 0.5
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './useAuth';
import { UserRole } from '@/lib/types';

/**
 * Hook to protect routes based on user role
 * @param allowedRoles - Array of roles that can access this route
 * @param redirectTo - Optional redirect path (defaults to '/login' or '/')
 */
export function useRequireRole(
  allowedRoles: UserRole[],
  redirectTo?: string
) {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) {
      // Still loading auth state, wait
      return;
    }

    if (!user) {
      // Not logged in, redirect to login
      router.push(redirectTo || '/login');
      return;
    }

    // Check if user's role is in allowed roles
    // null role is treated as 'player'
    const userRole = role ?? 'player';
    const normalizedAllowedRoles = allowedRoles.map(r => r ?? 'player');

    if (!normalizedAllowedRoles.includes(userRole)) {
      // User doesn't have required role, redirect to home or unauthorized page
      router.push(redirectTo || '/');
      return;
    }
  }, [user, role, loading, allowedRoles, redirectTo, router]);

  // Return loading state and authorization status
  return {
    loading,
    authorized: loading ? false : (user !== null && (allowedRoles.includes(role ?? 'player'))),
  };
}

