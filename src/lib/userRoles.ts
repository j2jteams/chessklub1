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
import { UserData, UserRole, USCFRatings, PlayerRatings, FIDERatings } from './types';

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

/**
 * Get player ratings from the playerRatings collection
 * @param uid - User's UID
 */
export async function getPlayerRatings(uid: string): Promise<PlayerRatings | null> {
  const ratingsRef = doc(db, 'playerRatings', uid);
  const snapshot = await getDoc(ratingsRef);

  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data();
  
  // Handle uschessRatings - Firestore returns nested maps as objects
  let uschessRatings = undefined;
  if (data.uschessRatings && typeof data.uschessRatings === 'object') {
    // Remove lastSynced if it exists (it's stored separately in parent lastSynced)
    const { lastSynced: _, ...uschessData } = data.uschessRatings;
    // Convert to plain object and ensure all fields are properly extracted
    uschessRatings = {
      ...uschessData,
    } as USCFRatings;
  }
  
  // Handle fideRatings - Firestore returns nested maps as objects
  let fideRatings = undefined;
  if (data.fideRatings && typeof data.fideRatings === 'object') {
    // Remove lastSynced if it exists (it's stored separately in parent lastSynced)
    const { lastSynced: _, ...fideData } = data.fideRatings;
    // Convert to plain object and ensure all fields are properly extracted
    fideRatings = {
      ...fideData,
    } as FIDERatings;
  }
  
  // Handle lichessRatings
  let lichessRatings = undefined;
  if (data.lichessRatings && typeof data.lichessRatings === 'object') {
    const { lastSynced: _, ...lichessData } = data.lichessRatings;
    lichessRatings = {
      ...lichessData,
    };
  }
  
  // Handle lastSynced - Firestore returns nested maps
  let lastSyncedObj: any = {};
  if (data.lastSynced && typeof data.lastSynced === 'object') {
    if (data.lastSynced.uschess) {
      lastSyncedObj.uschess = data.lastSynced.uschess?.toDate?.() ?? 
        (data.lastSynced.uschess instanceof Date ? data.lastSynced.uschess : undefined);
    }
    if (data.lastSynced.fide) {
      lastSyncedObj.fide = data.lastSynced.fide?.toDate?.() ?? 
        (data.lastSynced.fide instanceof Date ? data.lastSynced.fide : undefined);
    }
    if (data.lastSynced.lichess) {
      lastSyncedObj.lichess = data.lastSynced.lichess?.toDate?.() ?? 
        (data.lastSynced.lichess instanceof Date ? data.lastSynced.lichess : undefined);
    }
  }
  
  return {
    userId: data.userId || uid,
    uschessRatings,
    fideRatings,
    lichessRatings,
    lastSynced: Object.keys(lastSyncedObj).length > 0 ? lastSyncedObj : undefined,
  };
}

/**
 * Update player ratings in the playerRatings collection
 * @param uid - User's UID
 * @param updates - Ratings data to update
 */
export async function updatePlayerRatings(
  uid: string,
  updates: {
    uschessRatings?: USCFRatings;
    fideRatings?: any;
    lichessRatings?: any;
  }
): Promise<void> {
  const ratingsRef = doc(db, 'playerRatings', uid);
  const snapshot = await getDoc(ratingsRef);

  const updateData: any = {};

  if (updates.uschessRatings) {
    // Remove lastSynced from uschessRatings as it's stored separately
    const { lastSynced, ...uschessData } = updates.uschessRatings;
    updateData.uschessRatings = uschessData;
    updateData['lastSynced.uschess'] = serverTimestamp();
  }

  if (updates.fideRatings) {
    const { lastSynced, ...fideData } = updates.fideRatings;
    updateData.fideRatings = fideData;
    updateData['lastSynced.fide'] = serverTimestamp();
  }

  if (updates.lichessRatings) {
    const { lastSynced, ...lichessData } = updates.lichessRatings;
    updateData.lichessRatings = lichessData;
    updateData['lastSynced.lichess'] = serverTimestamp();
  }

  if (!snapshot.exists()) {
    // Create new document
    await setDoc(ratingsRef, {
      userId: uid,
      ...updateData,
    });
  } else {
    // Update existing document - use dot notation for nested fields
    const finalUpdate: any = {};
    if (updates.uschessRatings) {
      finalUpdate.uschessRatings = updateData.uschessRatings;
      finalUpdate['lastSynced.uschess'] = updateData['lastSynced.uschess'];
    }
    if (updates.fideRatings) {
      finalUpdate.fideRatings = updateData.fideRatings;
      finalUpdate['lastSynced.fide'] = updateData['lastSynced.fide'];
    }
    if (updates.lichessRatings) {
      finalUpdate.lichessRatings = updateData.lichessRatings;
      finalUpdate['lastSynced.lichess'] = updateData['lastSynced.lichess'];
    }
    await updateDoc(ratingsRef, finalUpdate);
  }
}
