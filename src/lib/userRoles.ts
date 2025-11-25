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

// UPDATED: role-based routing and approval flows - Phase 0.5
function fromFirestoreUser(data: any): UserData {
  // Migration: Convert old 'user' role to 'player' for backward compatibility
  let userRole = data.role ?? 'player';
  if (userRole === 'user') {
    userRole = 'player';
  }
  
  return {
    uid: data.uid,
    email: data.email,
    role: userRole as UserRole,
    isGodOwner: data.isGodOwner ?? false, // UPDATED: God Owner system
    savedEvents: data.savedEvents ?? [],
    registeredEvents: data.registeredEvents ?? [],
    createdAt: data.createdAt?.toDate?.() ?? new Date(),
    updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
  };
}

export async function createUserDocument(uid: string, email: string, role: UserRole = 'player') {
  const userRef = doc(db, 'users', uid);
  const snapshot = await getDoc(userRef);

  if (snapshot.exists()) {
    return;
  }

  await setDoc(userRef, {
    uid,
    email,
    role,
    isGodOwner: false, // UPDATED: God Owner system - default to false
    savedEvents: [],
    registeredEvents: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function getUserRole(uid: string): Promise<UserRole> {
  const userRef = doc(db, 'users', uid);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    return 'player';
  }

  // Migration: Convert old 'user' role to 'player'
  const role = snapshot.data().role ?? 'player';
  return (role === 'user' ? 'player' : role) as UserRole;
}

export async function getUserData(uid: string): Promise<UserData | null> {
  const userRef = doc(db, 'users', uid);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    return null;
  }

  return fromFirestoreUser(snapshot.data());
}

export async function updateUserRole(uid: string, role: UserRole) {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    role,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Transfer God Owner status to another user (only God Owner can do this)
 * @param fromUid - Current God Owner's UID
 * @param toUid - New God Owner's UID
 */
export async function transferGodOwnership(fromUid: string, toUid: string): Promise<void> {
  // Verify current user is God Owner
  const currentUserRef = doc(db, 'users', fromUid);
  const currentUserSnap = await getDoc(currentUserRef);
  
  if (!currentUserSnap.exists()) {
    throw new Error('Current user not found');
  }
  
  const currentUserData = currentUserSnap.data();
  if (!currentUserData.isGodOwner) {
    throw new Error('Only God Owner can transfer ownership');
  }
  
  // Verify target user exists and is an owner
  const targetUserRef = doc(db, 'users', toUid);
  const targetUserSnap = await getDoc(targetUserRef);
  
  if (!targetUserSnap.exists()) {
    throw new Error('Target user not found');
  }
  
  const targetUserData = targetUserSnap.data();
  if (targetUserData.role !== 'owner') {
    throw new Error('Target user must be an owner to receive God Owner status');
  }
  
  // Transfer God Owner status
  await updateDoc(currentUserRef, {
    isGodOwner: false,
    updatedAt: serverTimestamp(),
  });
  
  await updateDoc(targetUserRef, {
    isGodOwner: true,
    role: 'owner', // Ensure they're an owner
    updatedAt: serverTimestamp(),
  });
}

/**
 * Promote an admin to owner (only God Owner can do this)
 * @param godOwnerUid - God Owner's UID
 * @param adminUid - Admin's UID to promote
 */
export async function promoteAdminToOwner(godOwnerUid: string, adminUid: string): Promise<void> {
  // Verify current user is God Owner
  const godOwnerRef = doc(db, 'users', godOwnerUid);
  const godOwnerSnap = await getDoc(godOwnerRef);
  
  if (!godOwnerSnap.exists()) {
    throw new Error('God Owner not found');
  }
  
  const godOwnerData = godOwnerSnap.data();
  if (!godOwnerData.isGodOwner) {
    throw new Error('Only God Owner can promote admins to owners');
  }
  
  // Verify target user exists and is an admin
  const adminRef = doc(db, 'users', adminUid);
  const adminSnap = await getDoc(adminRef);
  
  if (!adminSnap.exists()) {
    throw new Error('Admin user not found');
  }
  
  const adminData = adminSnap.data();
  if (adminData.role !== 'admin') {
    throw new Error('Target user must be an admin to be promoted to owner');
  }
  
  // Promote to owner
  await updateDoc(adminRef, {
    role: 'owner',
    updatedAt: serverTimestamp(),
  });
}

/**
 * Check if a user is God Owner
 */
export async function isGodOwner(uid: string): Promise<boolean> {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) {
    return false;
  }
  
  return userSnap.data().isGodOwner === true;
}

/**
 * Demote an owner to admin (only God Owner can do this)
 * @param godOwnerUid - God Owner's UID
 * @param ownerUid - Owner's UID to demote
 */
export async function demoteOwnerToAdmin(godOwnerUid: string, ownerUid: string): Promise<void> {
  // Verify current user is God Owner
  const godOwnerRef = doc(db, 'users', godOwnerUid);
  const godOwnerSnap = await getDoc(godOwnerRef);
  
  if (!godOwnerSnap.exists()) {
    throw new Error('God Owner not found');
  }
  
  const godOwnerData = godOwnerSnap.data();
  if (!godOwnerData.isGodOwner) {
    throw new Error('Only God Owner can demote owners');
  }
  
  // Cannot demote yourself
  if (godOwnerUid === ownerUid) {
    throw new Error('You cannot demote yourself');
  }
  
  // Verify target user exists and is an owner
  const ownerRef = doc(db, 'users', ownerUid);
  const ownerSnap = await getDoc(ownerRef);
  
  if (!ownerSnap.exists()) {
    throw new Error('Owner user not found');
  }
  
  const ownerData = ownerSnap.data();
  if (ownerData.role !== 'owner') {
    throw new Error('Target user is not an owner');
  }
  
  // Cannot demote if they are God Owner
  if (ownerData.isGodOwner) {
    throw new Error('Cannot demote God Owner. Transfer God Owner status first.');
  }
  
  // Demote to admin
  await updateDoc(ownerRef, {
    role: 'admin',
    updatedAt: serverTimestamp(),
  });
}

/**
 * Remove admin role (demote to player) - God Owner or regular owner can do this
 * @param currentUserUid - Current user's UID (must be owner)
 * @param adminUid - Admin's UID to demote
 */
export async function demoteAdminToPlayer(currentUserUid: string, adminUid: string): Promise<void> {
  // Verify current user is owner
  const currentUserRef = doc(db, 'users', currentUserUid);
  const currentUserSnap = await getDoc(currentUserRef);
  
  if (!currentUserSnap.exists()) {
    throw new Error('Current user not found');
  }
  
  const currentUserData = currentUserSnap.data();
  if (currentUserData.role !== 'owner') {
    throw new Error('Only owners can demote admins');
  }
  
  // Verify target user exists and is an admin
  const adminRef = doc(db, 'users', adminUid);
  const adminSnap = await getDoc(adminRef);
  
  if (!adminSnap.exists()) {
    throw new Error('Admin user not found');
  }
  
  const adminData = adminSnap.data();
  if (adminData.role !== 'admin') {
    throw new Error('Target user is not an admin');
  }
  
  // Demote to player
  await updateDoc(adminRef, {
    role: 'player',
    updatedAt: serverTimestamp(),
  });
}

export async function getAllUsers(): Promise<UserData[]> {
  const usersSnap = await getDocs(collection(db, 'users'));
  return usersSnap.docs.map((docSnap) => fromFirestoreUser(docSnap.data()));
}

export async function isOwner(uid: string) {
  const role = await getUserRole(uid);
  return role === 'owner';
}

export async function isAdminOrOwner(uid: string) {
  const role = await getUserRole(uid);
  return role === 'admin' || role === 'owner';
}

