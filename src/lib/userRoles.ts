import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import { UserData, UserRole, USCFRatings } from './types';

// UPDATED: Chess Tourneys - New role system
function fromFirestoreUser(data: any): UserData {
  // Check for old 'user' role before type assertion (since 'user' is not in UserRole union)
  let rawRole = data.role ?? 'player';
  if (rawRole === 'user') {
    rawRole = 'player';
  }
  
  // Use explicit type annotation to prevent narrowing
  let r: UserRole = rawRole as UserRole;
  
  // Explicitly type the return to prevent TypeScript narrowing
  const result: UserData = {
    uid: data.uid,
    email: data.email,
    role: r as UserRole,  // Explicit assertion ensures full union
    firstName: data.firstName,
    lastName: data.lastName,
    uscfId: data.uscfId,
    lichessUsername: data.lichessUsername,
    fideId: data.fideId,
    uscfRatings: data.uscfRatings ? {
      ...data.uscfRatings,
      lastSynced: data.uscfRatings.lastSynced?.toDate?.() ?? undefined,
    } : undefined,
    franchiseId: data.franchiseId ?? null,
    savedEvents: data.savedEvents ?? [],
    registeredEvents: data.registeredEvents ?? [],
    createdAt: data.createdAt?.toDate?.() ?? new Date(),
    updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
  };
  return result;
}

export async function createUserDocument(
  uid: string,
  email: string,
  role: UserRole = 'player',
  options?: {
    firstName?: string;
    lastName?: string;
    uscfId?: string;
    lichessUsername?: string;
    franchiseId?: string | null;
  }
) {
  const userRef = doc(db, 'users', uid);
  const snapshot = await getDoc(userRef);

  if (snapshot.exists()) {
    return;
  }

  const userData: any = {
    uid,
    email,
    role,
    savedEvents: [],
    registeredEvents: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  // Add optional fields if provided
  if (options?.firstName) userData.firstName = options.firstName;
  if (options?.lastName) userData.lastName = options.lastName;
  if (options?.uscfId) userData.uscfId = options.uscfId;
  if (options?.lichessUsername) userData.lichessUsername = options.lichessUsername;
  if (options?.franchiseId !== undefined) userData.franchiseId = options.franchiseId;

  await setDoc(userRef, userData);
}

export async function getUserRole(uid: string): Promise<UserRole> {
  const userRef = doc(db, 'users', uid);
  const snapshot = await getDoc(userRef);

  // Check for old 'user' role before type assertion (since 'user' is not in UserRole union)
  let rawRole: string | null | undefined = snapshot.exists() 
    ? (snapshot.data().role ?? 'player')
    : 'player';
  if (rawRole === 'user') {
    rawRole = 'player';
  }

  // Use temp variable with explicit type to prevent narrowing
  let r: UserRole = rawRole as UserRole;
  
  // Single return with explicit assertion ensures full union type
  return r as UserRole;
}

export async function getUserData(uid: string): Promise<UserData | null> {
  const userRef = doc(db, 'users', uid);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    return null;
  }

  return fromFirestoreUser(snapshot.data());
}

/**
 * Update user role - Only Super Admin can assign roles
 * @param currentUserUid - Current user's UID (must be superAdmin)
 * @param targetUid - Target user's UID
 * @param newRole - New role to assign
 */
export async function updateUserRole(
  currentUserUid: string,
  targetUid: string,
  newRole: UserRole
): Promise<void> {
  // Verify current user is Super Admin
  const currentUserRef = doc(db, 'users', currentUserUid);
  const currentUserSnap = await getDoc(currentUserRef);
  
  if (!currentUserSnap.exists()) {
    throw new Error('Current user not found');
  }
  
  const currentUserData = currentUserSnap.data();
  const currentUserRole = currentUserData.role;
  
  // Check if user is Super Admin
  const isSuperAdmin = currentUserRole === 'superAdmin';
  
  if (!isSuperAdmin) {
    throw new Error('Only Super Admin can assign roles');
  }
  
  // Verify target user exists
  const targetUserRef = doc(db, 'users', targetUid);
  const targetUserSnap = await getDoc(targetUserRef);
  
  if (!targetUserSnap.exists()) {
    throw new Error('Target user not found');
  }
  
  // Update role
  await updateDoc(targetUserRef, {
    role: newRole,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Update user profile information (firstName, lastName, uscfId, lichessUsername, fideId)
 * Users can only update their own profile
 * @param uid - User's UID
 * @param updates - Profile fields to update
 */
export async function updateUserProfile(
  uid: string,
  updates: {
    firstName?: string;
    lastName?: string;
    uscfId?: string;
    lichessUsername?: string;
    fideId?: string;
  }
): Promise<void> {
  const userRef = doc(db, 'users', uid);
  const snapshot = await getDoc(userRef);
  
  if (!snapshot.exists()) {
    throw new Error('User not found');
  }
  
  const updateData: any = {
    updatedAt: serverTimestamp(),
  };
  
  // Only update fields that are provided
  if (updates.firstName !== undefined) {
    updateData.firstName = updates.firstName || null;
  }
  if (updates.lastName !== undefined) {
    updateData.lastName = updates.lastName || null;
  }
  if (updates.uscfId !== undefined) {
    updateData.uscfId = updates.uscfId || null;
  }
  if (updates.lichessUsername !== undefined) {
    updateData.lichessUsername = updates.lichessUsername || null;
  }
  if (updates.fideId !== undefined) {
    updateData.fideId = updates.fideId || null;
  }
  
  await updateDoc(userRef, updateData);
}

/**
 * Helper function to update user role (for backward compatibility)
 * Note: This function does NOT check permissions - use updateUserRole instead
 * @deprecated Use updateUserRole(currentUserUid, targetUid, newRole) instead
 */
export async function updateUserRoleLegacy(uid: string, role: UserRole) {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    role,
    updatedAt: serverTimestamp(),
  });
}

export async function getAllUsers(): Promise<UserData[]> {
  const usersSnap = await getDocs(collection(db, 'users'));
  return usersSnap.docs.map((docSnap) => fromFirestoreUser(docSnap.data()));
}

/**
 * Get all franchisee users
 * This function can be called by standalone admins and franchisees (per Firestore rules)
 */
export async function getFranchisees(): Promise<UserData[]> {
  try {
    const { query, where } = await import('firebase/firestore');
    const franchiseesQuery = query(
      collection(db, 'users'),
      where('role', '==', 'franchisee')
    );
    const franchiseesSnap = await getDocs(franchiseesQuery);
    return franchiseesSnap.docs.map((docSnap) => fromFirestoreUser(docSnap.data()));
  } catch (error: any) {
    console.error('Error fetching franchisees:', error);
    // If query fails (e.g., missing index or permission denied), return empty array
    // The UI will show manual input option
    return [];
  }
}

// Helper functions for role checks
export async function isSuperAdmin(uid: string): Promise<boolean> {
  const role = await getUserRole(uid);
  return role === 'superAdmin';
}

export async function isFranchisee(uid: string): Promise<boolean> {
  const role = await getUserRole(uid);
  return role === 'franchisee';
}

export async function isStandaloneAdmin(uid: string): Promise<boolean> {
  const role = await getUserRole(uid);
  return role === 'standaloneAdmin';
}

export async function isPlayer(uid: string): Promise<boolean> {
  const role = await getUserRole(uid);
  return role === 'player' || role === null;
}

export async function canAssignRoles(uid: string): Promise<boolean> {
  return isSuperAdmin(uid);
}

export async function canCreateEvents(uid: string): Promise<boolean> {
  const role = await getUserRole(uid);
  return role === 'superAdmin' || role === 'franchisee' || role === 'standaloneAdmin';
}
