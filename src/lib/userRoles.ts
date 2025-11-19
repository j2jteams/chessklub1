import { doc, getDoc, setDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { UserData, UserRole } from './types';

/**
 * Get user role from Firestore
 */
export async function getUserRole(uid: string): Promise<UserRole> {
  try {
    // Check if Firestore is available
    if (!db) {
      console.warn('Firestore database not initialized');
      return null;
    }
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      const userData = userDoc.data() as UserData;
      return userData.role || null;
    }
    return null;
  } catch (error: any) {
    // Handle case where Firestore database doesn't exist yet
    if (error.code === 'failed-precondition' || error.code === 'not-found') {
      console.warn('Firestore database not set up yet. Please create the database in Firebase Console.');
      return null;
    }
    console.error('Error getting user role:', error);
    return null;
  }
}

/**
 * Create or update user document in Firestore
 */
export async function createUserDocument(uid: string, email: string, role: UserRole = null): Promise<void> {
  try {
    // Check if Firestore is available
    if (!db) {
      console.warn('Firestore database not initialized. User document not created.');
      return;
    }
    const userData: UserData = {
      uid,
      email,
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await setDoc(doc(db, 'users', uid), userData);
  } catch (error: any) {
    // Handle case where Firestore database doesn't exist yet
    if (error.code === 'failed-precondition' || error.code === 'not-found') {
      console.warn('Firestore database not set up yet. User document not created. Please create the database in Firebase Console.');
      // Don't throw error - allow user to sign up even if Firestore isn't set up
      return;
    }
    console.error('Error creating user document:', error);
    // Don't throw error - allow user to sign up even if Firestore fails
    // The user can still use Firebase Auth, just won't have role-based features
  }
}

/**
 * Update user role (only owners can do this)
 */
export async function updateUserRole(uid: string, newRole: UserRole): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', uid), {
      role: newRole,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
}

/**
 * Get all users (for admin management)
 */
export async function getAllUsers(): Promise<UserData[]> {
  try {
    const usersSnapshot = await getDocs(collection(db, 'users'));
    return usersSnapshot.docs.map(doc => ({
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as UserData[];
  } catch (error) {
    console.error('Error getting all users:', error);
    throw error;
  }
}

/**
 * Check if user has owner role
 */
export async function isOwner(uid: string): Promise<boolean> {
  const role = await getUserRole(uid);
  return role === 'owner';
}

/**
 * Check if user has admin or owner role
 */
export async function isAdminOrOwner(uid: string): Promise<boolean> {
  const role = await getUserRole(uid);
  return role === 'admin' || role === 'owner';
}

