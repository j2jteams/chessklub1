import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from './firebase';
import { EventData } from './types';

/**
 * Create a new event
 */
export async function createEvent(eventData: Omit<EventData, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    const event: Omit<EventData, 'id'> = {
      ...eventData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const docRef = await addDoc(collection(db, 'events'), event);
    return docRef.id;
  } catch (error) {
    console.error('Error creating event:', error);
    throw error;
  }
}

/**
 * Get all events
 */
export async function getAllEvents(): Promise<EventData[]> {
  try {
    const eventsSnapshot = await getDocs(query(collection(db, 'events'), orderBy('createdAt', 'desc')));
    return eventsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      approvedAt: doc.data().approvedAt?.toDate(),
    })) as EventData[];
  } catch (error) {
    console.error('Error getting events:', error);
    throw error;
  }
}

/**
 * Get approved events only (for public display)
 */
export async function getApprovedEvents(): Promise<EventData[]> {
  try {
    const eventsSnapshot = await getDocs(
      query(
        collection(db, 'events'),
        where('status', '==', 'approved'),
        orderBy('createdAt', 'desc')
      )
    );
    return eventsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      approvedAt: doc.data().approvedAt?.toDate(),
    })) as EventData[];
  } catch (error) {
    console.error('Error getting approved events:', error);
    throw error;
  }
}

/**
 * Get pending events (for owner approval)
 */
export async function getPendingEvents(): Promise<EventData[]> {
  try {
    const eventsSnapshot = await getDocs(
      query(
        collection(db, 'events'),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      )
    );
    return eventsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as EventData[];
  } catch (error) {
    console.error('Error getting pending events:', error);
    throw error;
  }
}

/**
 * Update event
 */
export async function updateEvent(eventId: string, updates: Partial<EventData>): Promise<void> {
  try {
    await updateDoc(doc(db, 'events', eventId), {
      ...updates,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Error updating event:', error);
    throw error;
  }
}

/**
 * Approve event (owner only)
 */
export async function approveEvent(eventId: string, approvedBy: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'events', eventId), {
      status: 'approved',
      approvedBy,
      approvedAt: new Date(),
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Error approving event:', error);
    throw error;
  }
}

/**
 * Reject event (owner only)
 */
export async function rejectEvent(eventId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'events', eventId), {
      status: 'rejected',
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Error rejecting event:', error);
    throw error;
  }
}

/**
 * Delete event
 */
export async function deleteEvent(eventId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'events', eventId));
  } catch (error) {
    console.error('Error deleting event:', error);
    throw error;
  }
}

