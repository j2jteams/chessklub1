'use client';

import { useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getUserRole } from '@/lib/userRoles';
import { UserRole } from '@/lib/types';

interface AuthState {
  user: User | null;
  role: UserRole;
  loading: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    role: null,
    loading: true,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const role = await getUserRole(user.uid);
        setAuthState({ user, role, loading: false });
      } else {
        setAuthState({ user: null, role: null, loading: false });
      }
    });

    return () => unsubscribe();
  }, []);

  return authState;
}

