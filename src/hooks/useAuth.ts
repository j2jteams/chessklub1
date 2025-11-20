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
    role: 'user',
    loading: true,
  });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setState({
          user: null,
          profile: null,
          role: 'user',
          loading: false,
        });
        return;
      }

      try {
        const profile = await getUserData(firebaseUser.uid);
        setState({
          user: firebaseUser,
          profile: profile ?? null,
          role: profile?.role ?? 'user',
          loading: false,
        });
      } catch (error) {
        console.error('Failed to load user profile', error);
        setState({
          user: firebaseUser,
          profile: null,
          role: 'user',
          loading: false,
        });
      }
    });

    return () => unsub();
  }, []);

  return state;
}

