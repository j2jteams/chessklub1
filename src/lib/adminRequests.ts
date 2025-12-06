// UPDATED: role-based routing and approval flows - Phase 0.5
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

const ADMIN_REQUESTS_COLLECTION = 'adminRequests';

export interface AdminRequest {
  id?: string;
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  franchiseId?: string | null; // If provided, this is a franchise admin; if null, standalone admin
  displayName?: string; // Legacy field for backward compatibility
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  decidedAt?: Date | null;
  decidedBy?: string | null;
}

function fromFirestoreRequest(docId: string, data: any): AdminRequest {
  return {
    id: docId,
    userId: data.userId,
    email: data.email,
    firstName: data.firstName,
    lastName: data.lastName,
    franchiseId: data.franchiseId ?? null,
    displayName: data.displayName, // Legacy field
    reason: data.reason,
    status: data.status,
    createdAt: data.createdAt?.toDate?.() ?? new Date(),
    decidedAt: data.decidedAt?.toDate?.() ?? null,
    decidedBy: data.decidedBy ?? null,
  };
}

/**
 * Create a new admin request
 * @param userId - Firebase Auth UID
 * @param email - User email
 * @param firstName - User's first name
 * @param lastName - User's last name
 * @param franchiseId - Optional franchise ID (if null, this is a standalone admin request)
 * @param displayName - Optional display name (legacy field)
 * @param reason - Optional reason for requesting admin access
 */
export async function createAdminRequest(
  userId: string,
  email: string,
  firstName?: string,
  lastName?: string,
  franchiseId?: string | null,
  displayName?: string,
  reason?: string
): Promise<string> {
  // Check if user already has a pending request
  const existingRequest = await getPendingAdminRequestByUserId(userId);
  if (existingRequest) {
    throw new Error('You already have a pending admin request.');
  }

  const requestData: any = {
    userId,
    email,
    status: 'pending',
    createdAt: serverTimestamp(),
  };

  if (firstName) requestData.firstName = firstName;
  if (lastName) requestData.lastName = lastName;
  if (franchiseId !== undefined) requestData.franchiseId = franchiseId;
  if (displayName) requestData.displayName = displayName;
  if (reason) requestData.reason = reason;

  const docRef = await addDoc(collection(db, ADMIN_REQUESTS_COLLECTION), requestData);
  return docRef.id;
}

/**
 * Get pending admin request for a specific user
 */
export async function getPendingAdminRequestByUserId(userId: string): Promise<AdminRequest | null> {
  const snapshot = await getDocs(
    query(
      collection(db, ADMIN_REQUESTS_COLLECTION),
      where('userId', '==', userId),
      where('status', '==', 'pending')
    )
  );

  if (snapshot.empty) {
    return null;
  }

  return fromFirestoreRequest(snapshot.docs[0].id, snapshot.docs[0].data());
}

/**
 * Get all pending admin requests (for owner dashboard)
 */
export async function getPendingAdminRequests(): Promise<AdminRequest[]> {
  const snapshot = await getDocs(
    query(
      collection(db, ADMIN_REQUESTS_COLLECTION),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    )
  );

  return snapshot.docs.map((docSnap) => fromFirestoreRequest(docSnap.id, docSnap.data()));
}

/**
 * Approve an admin request (owner only)
 * This will also update the user's role to 'admin'
 */
export async function approveAdminRequest(
  requestId: string,
  ownerUid: string
): Promise<void> {
  const requestRef = doc(db, ADMIN_REQUESTS_COLLECTION, requestId);
  const requestSnap = await getDoc(requestRef);

  if (!requestSnap.exists()) {
    throw new Error('Admin request not found.');
  }

  const requestData = requestSnap.data();
  
  try {
    // Update the request status
    await updateDoc(requestRef, {
      status: 'approved',
      decidedAt: serverTimestamp(),
      decidedBy: ownerUid,
    });
  } catch (error: any) {
    console.error('Error updating admin request:', error);
    throw new Error(`Failed to update admin request: ${error.message || 'Permission denied'}`);
  }

  try {
    // Update the user's role based on whether they have a franchiseId
    const userRef = doc(db, 'users', requestData.userId);
    const userUpdateData: any = {
      updatedAt: serverTimestamp(),
    };

    // Determine role: if franchiseId exists, they're a franchisee; otherwise standaloneAdmin
    if (requestData.franchiseId) {
      userUpdateData.role = 'franchisee';
      userUpdateData.franchiseId = requestData.franchiseId;
    } else {
      userUpdateData.role = 'standaloneAdmin';
      userUpdateData.franchiseId = null;
    }

    // Add firstName and lastName if available
    if (requestData.firstName) userUpdateData.firstName = requestData.firstName;
    if (requestData.lastName) userUpdateData.lastName = requestData.lastName;

    await updateDoc(userRef, userUpdateData);
    
    // Verify the update worked
    const updatedUserSnap = await getDoc(userRef);
    if (updatedUserSnap.exists()) {
      const updatedRole = updatedUserSnap.data().role;
      console.log('User role updated to:', updatedRole);
      const expectedRole = requestData.franchiseId ? 'franchisee' : 'standaloneAdmin';
      if (updatedRole !== expectedRole) {
        throw new Error(`Role update verification failed. Expected '${expectedRole}', got '${updatedRole}'`);
      }
    }
  } catch (error: any) {
    console.error('Error updating user role:', error);
    throw new Error(`Failed to update user role: ${error.message || 'Permission denied'}`);
  }
}

/**
 * Reject an admin request (owner only)
 */
export async function rejectAdminRequest(
  requestId: string,
  ownerUid: string
): Promise<void> {
  const requestRef = doc(db, ADMIN_REQUESTS_COLLECTION, requestId);
  const requestSnap = await getDoc(requestRef);

  if (!requestSnap.exists()) {
    throw new Error('Admin request not found.');
  }

  await updateDoc(requestRef, {
    status: 'rejected',
    decidedAt: serverTimestamp(),
    decidedBy: ownerUid,
  });
}

/**
 * Get all admin requests (for owner dashboard - all statuses)
 */
export async function getAllAdminRequests(): Promise<AdminRequest[]> {
  const snapshot = await getDocs(
    query(
      collection(db, ADMIN_REQUESTS_COLLECTION),
      orderBy('createdAt', 'desc')
    )
  );

  return snapshot.docs.map((docSnap) => fromFirestoreRequest(docSnap.id, docSnap.data()));
}

/**
 * Check if an admin account is approved (for login validation)
 * Returns true if user is not an admin, or if admin and approved
 */
export async function isAdminApproved(userId: string): Promise<boolean> {
  const { getUserRole } = await import('./userRoles');
  const role = await getUserRole(userId);
  
  // If not an admin role, they're approved (players can always sign in)
  if (role !== 'standaloneAdmin' && role !== 'franchisee' && role !== 'admin') {
    return true;
  }

  // Check if there's an approved admin request for this user
  const snapshot = await getDocs(
    query(
      collection(db, ADMIN_REQUESTS_COLLECTION),
      where('userId', '==', userId),
      where('status', '==', 'approved')
    )
  );

  // If they have an approved request, they can sign in
  if (!snapshot.empty) {
    return true;
  }

  // If they're an admin but no approved request exists, check if they were created before the approval system
  // (for backward compatibility with existing admins)
  const allRequests = await getDocs(
    query(
      collection(db, ADMIN_REQUESTS_COLLECTION),
      where('userId', '==', userId)
    )
  );

  // If no requests exist at all, assume they're a legacy admin (approved)
  if (allRequests.empty) {
    return true;
  }

  // Otherwise, they need approval
  return false;
}

