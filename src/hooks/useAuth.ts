// UPDATED: role-based routing and approval flows - Phase 0.5
'use client';

import { useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getUserData, getPlayerRatings } from '@/lib/userRoles';
import { UserData, UserRole, PlayerRatings } from '@/lib/types';

interface AuthState {
  user: User | null;
  profile: UserData | null;
  playerRatings: PlayerRatings | null;
  role: UserRole;
  loading: boolean;
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    playerRatings: null,
    role: 'player' as UserRole,  // Explicit assertion in initial state
    loading: true,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setState({
          user: null,
          profile: null,
          playerRatings: null,
          role: 'player' as UserRole,  // Explicit assertion
          loading: false,
        });
        return;
      }

      try {
        const [profile, playerRatings] = await Promise.all([
          getUserData(firebaseUser.uid),
          getPlayerRatings(firebaseUser.uid),
        ]);
        // Ensure role is explicitly typed as UserRole to prevent TypeScript narrowing
        const role: UserRole = (profile?.role ?? 'player') as UserRole;
        setState({
          user: firebaseUser,
          profile: profile ?? null,
          playerRatings: playerRatings ?? null,
          role,  // Already typed as UserRole, so this is safe
          loading: false,
        });
      } catch (error) {
        console.error('Failed to load user profile', error);
        setState({
          user: firebaseUser,
          profile: null,
          playerRatings: null,
          role: 'player' as UserRole,  // Explicit assertion
          loading: false,
        });
      }
    });

    return () => unsubscribe();
  }, []);

  return state;
}

