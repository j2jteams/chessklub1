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
  displayName?: string;
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
    displayName: data.displayName,
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
 * @param displayName - Optional display name
 * @param reason - Optional reason for requesting admin access
 */
export async function createAdminRequest(
  userId: string,
  email: string,
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

  if (displayName) {
    requestData.displayName = displayName;
  }
  if (reason) {
    requestData.reason = reason;
  }

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
    // Update the user's role to admin
    const userRef = doc(db, 'users', requestData.userId);
    await updateDoc(userRef, {
      role: 'admin',
      updatedAt: serverTimestamp(),
    });
    
    // Verify the update worked
    const updatedUserSnap = await getDoc(userRef);
    if (updatedUserSnap.exists()) {
      const updatedRole = updatedUserSnap.data().role;
      console.log('User role updated to:', updatedRole);
      if (updatedRole !== 'admin') {
        throw new Error(`Role update verification failed. Expected 'admin', got '${updatedRole}'`);
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

