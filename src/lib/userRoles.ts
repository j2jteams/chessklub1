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
import { UserData, UserRole } from './types';

// UPDATED: Chess Tourneys - New role system with migration support
function fromFirestoreUser(data: any): UserData {
  // Migration: Convert old roles to new roles for backward compatibility
  let userRole = data.role ?? 'player';
  
  // Migrate old 'user' role to 'player'
  if (userRole === 'user') {
    userRole = 'player';
  }
  // Migrate old 'owner' role to 'superAdmin'
  if (userRole === 'owner') {
    userRole = 'superAdmin';
  }
  // Migrate old 'admin' role to 'standaloneAdmin' (default migration)
  // Note: This assumes existing admins should be standalone admins
  // If you need franchise admins, they should be manually assigned
  if (userRole === 'admin') {
    userRole = 'standaloneAdmin';
  }
  
  return {
    uid: data.uid,
    email: data.email,
    role: userRole as UserRole,
    firstName: data.firstName,
    lastName: data.lastName,
    uscfId: data.uscfId,
    franchiseId: data.franchiseId ?? null,
    savedEvents: data.savedEvents ?? [],
    registeredEvents: data.registeredEvents ?? [],
    createdAt: data.createdAt?.toDate?.() ?? new Date(),
    updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
  };
}

export async function createUserDocument(
  uid: string,
  email: string,
  role: UserRole = 'player',
  options?: {
    firstName?: string;
    lastName?: string;
    uscfId?: string;
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
  if (options?.franchiseId !== undefined) userData.franchiseId = options.franchiseId;

  await setDoc(userRef, userData);
}

export async function getUserRole(uid: string): Promise<UserRole> {
  const userRef = doc(db, 'users', uid);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    return 'player';
  }

  // Migration: Convert old roles to new roles
  const role = snapshot.data().role ?? 'player';
  if (role === 'user') return 'player';
  if (role === 'owner') return 'superAdmin';
  if (role === 'admin') return 'standaloneAdmin';
  return role as UserRole;
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
  
  // Migration: Handle old 'owner' role
  const isSuperAdmin = currentUserRole === 'superAdmin' || currentUserRole === 'owner';
  
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

// Legacy functions for backward compatibility (will be removed in future)
export async function isOwner(uid: string) {
  return isSuperAdmin(uid);
}

export async function isAdminOrOwner(uid: string) {
  const role = await getUserRole(uid);
  return role === 'standaloneAdmin' || role === 'franchisee' || role === 'superAdmin';
}
