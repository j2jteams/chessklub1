// UPDATED: role-based routing and approval flows - Phase 0.5
'use client';

import { useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getUserData } from '@/lib/userRoles';
import { UserData, UserRole } from '@/lib/types';

interface AuthState {
  user: User | null;
  profile: UserData | null;
  role: UserRole;
  loading: boolean;
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    role: 'player',
    loading: true,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setState({
          user: null,
          profile: null,
          role: 'player',
          loading: false,
        });
        return;
      }

      try {
        const profile = await getUserData(firebaseUser.uid);
        // Migration: Convert old 'user' role to 'player' (handled in getUserData)
        const role = profile?.role ?? 'player';
        setState({
          user: firebaseUser,
          profile: profile ?? null,
          role,
          loading: false,
        });
      } catch (error) {
        console.error('Failed to load user profile', error);
        setState({
          user: firebaseUser,
          profile: null,
          role: 'player',
          loading: false,
        });
      }
    });

    return () => unsubscribe();
  }, []);

  return state;
}

