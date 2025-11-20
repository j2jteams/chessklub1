import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  documentId,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import { EventData, EventStatus } from './types';

const EVENTS_COLLECTION = 'events';

function fromFirestoreEvent(docId: string, data: any): EventData {
  return {
    id: docId,
    title: data.title,
    date: data.date,
    location: data.location,
    price: data.price,
    description: data.description,
    image: data.image,
    createdBy: data.createdBy,
    createdByEmail: data.createdByEmail,
    status: data.status,
    registeredUsers: data.registeredUsers ?? [],
    savedByUsers: data.savedByUsers ?? [],
    approvedBy: data.approvedBy,
    approvedAt: data.approvedAt?.toDate?.(),
    createdAt: data.createdAt?.toDate?.() ?? new Date(),
    updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
  };
}

export async function createEvent(event: Omit<EventData, 'id' | 'createdAt' | 'updatedAt'>) {
  const docRef = await addDoc(collection(db, EVENTS_COLLECTION), {
    ...event,
    registeredUsers: event.registeredUsers ?? [],
    savedByUsers: event.savedByUsers ?? [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateEvent(eventId: string, updates: Partial<EventData>) {
  await updateDoc(doc(db, EVENTS_COLLECTION, eventId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteEvent(eventId: string) {
  await deleteDoc(doc(db, EVENTS_COLLECTION, eventId));
}

export async function getEvent(eventId: string): Promise<EventData | null> {
  const snap = await getDoc(doc(db, EVENTS_COLLECTION, eventId));
  if (!snap.exists()) return null;
  return fromFirestoreEvent(snap.id, snap.data());
}

export async function getAllEvents(): Promise<EventData[]> {
  const snapshot = await getDocs(query(collection(db, EVENTS_COLLECTION), orderBy('createdAt', 'desc')));
  return snapshot.docs.map((docSnap) => fromFirestoreEvent(docSnap.id, docSnap.data()));
}

export async function getApprovedEvents(): Promise<EventData[]> {
  const snapshot = await getDocs(
    query(collection(db, EVENTS_COLLECTION), where('status', '==', 'approved'), orderBy('createdAt', 'desc')),
  );
  return snapshot.docs.map((docSnap) => fromFirestoreEvent(docSnap.id, docSnap.data()));
}

export async function getPendingEvents(): Promise<EventData[]> {
  const snapshot = await getDocs(
    query(collection(db, EVENTS_COLLECTION), where('status', '==', 'pending'), orderBy('createdAt', 'desc')),
  );
  return snapshot.docs.map((docSnap) => fromFirestoreEvent(docSnap.id, docSnap.data()));
}

export async function getEventsByStatus(status: EventStatus): Promise<EventData[]> {
  const snapshot = await getDocs(
    query(collection(db, EVENTS_COLLECTION), where('status', '==', status), orderBy('createdAt', 'desc')),
  );
  return snapshot.docs.map((docSnap) => fromFirestoreEvent(docSnap.id, docSnap.data()));
}

export async function getEventsCreatedBy(uid: string): Promise<EventData[]> {
  const snapshot = await getDocs(
    query(collection(db, EVENTS_COLLECTION), where('createdBy', '==', uid), orderBy('createdAt', 'desc')),
  );
  return snapshot.docs.map((docSnap) => fromFirestoreEvent(docSnap.id, docSnap.data()));
}

export async function getEventsByIds(ids: string[]): Promise<EventData[]> {
  if (!ids.length) return [];

  const batchSize = 10;
  const events: EventData[] = [];

  for (let i = 0; i < ids.length; i += batchSize) {
    const batchIds = ids.slice(i, i + batchSize);
    const snapshot = await getDocs(
      query(collection(db, EVENTS_COLLECTION), where(documentId(), 'in', batchIds)),
    );
    events.push(...snapshot.docs.map((docSnap) => fromFirestoreEvent(docSnap.id, docSnap.data())));
  }

  return events;
}

export async function registerUserForEvent(eventId: string, uid: string) {
  await updateDoc(doc(db, EVENTS_COLLECTION, eventId), {
    registeredUsers: arrayUnion(uid),
    updatedAt: serverTimestamp(),
  });
}

export async function unregisterUserFromEvent(eventId: string, uid: string) {
  await updateDoc(doc(db, EVENTS_COLLECTION, eventId), {
    registeredUsers: arrayRemove(uid),
    updatedAt: serverTimestamp(),
  });
}

export async function saveEvent(eventId: string, uid: string) {
  await updateDoc(doc(db, EVENTS_COLLECTION, eventId), {
    savedByUsers: arrayUnion(uid),
    updatedAt: serverTimestamp(),
  });
}

export async function unsaveEvent(eventId: string, uid: string) {
  await updateDoc(doc(db, EVENTS_COLLECTION, eventId), {
    savedByUsers: arrayRemove(uid),
    updatedAt: serverTimestamp(),
  });
}

export async function approveEvent(eventId: string, approverUid: string) {
  await updateDoc(doc(db, EVENTS_COLLECTION, eventId), {
    status: 'approved',
    approvedBy: approverUid,
    approvedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function rejectEvent(eventId: string) {
  await updateDoc(doc(db, EVENTS_COLLECTION, eventId), {
    status: 'rejected',
    approvedBy: null,
    approvedAt: null,
    updatedAt: serverTimestamp(),
  });
}
<<<<<<< HEAD
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  documentId,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import { EventData, EventStatus } from './types';

const EVENTS_COLLECTION = 'events';

function fromFirestoreEvent(docId: string, data: any): EventData {
  return {
    id: docId,
    title: data.title,
    date: data.date,
    location: data.location,
    price: data.price,
    description: data.description,
    image: data.image,
    createdBy: data.createdBy,
    createdByEmail: data.createdByEmail,
    status: data.status,
    registeredUsers: data.registeredUsers ?? [],
    savedByUsers: data.savedByUsers ?? [],
    approvedBy: data.approvedBy,
    approvedAt: data.approvedAt?.toDate?.(),
    createdAt: data.createdAt?.toDate?.() ?? new Date(),
    updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
  };
}

export async function createEvent(event: Omit<EventData, 'id' | 'createdAt' | 'updatedAt'>) {
  const collectionRef = collection(db, EVENTS_COLLECTION);
  const docRef = await addDoc(collectionRef, {
    ...event,
    registeredUsers: event.registeredUsers ?? [],
    savedByUsers: event.savedByUsers ?? [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function updateEvent(eventId: string, updates: Partial<EventData>) {
  const eventRef = doc(db, EVENTS_COLLECTION, eventId);
  await updateDoc(eventRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteEvent(eventId: string) {
  await deleteDoc(doc(db, EVENTS_COLLECTION, eventId));
}

export async function getEvent(eventId: string): Promise<EventData | null> {
  const snap = await getDoc(doc(db, EVENTS_COLLECTION, eventId));
  if (!snap.exists()) {
    return null;
  }
  return fromFirestoreEvent(snap.id, snap.data());
}

export async function getEventsByStatus(status: EventStatus): Promise<EventData[]> {
  const eventsQuery = query(
    collection(db, EVENTS_COLLECTION),
    where('status', '==', status),
    orderBy('createdAt', 'desc'),
  );
  const snapshot = await getDocs(eventsQuery);
  return snapshot.docs.map((docSnap) => fromFirestoreEvent(docSnap.id, docSnap.data()));
}

export async function getEventsCreatedBy(uid: string): Promise<EventData[]> {
  const eventsQuery = query(
    collection(db, EVENTS_COLLECTION),
    where('createdBy', '==', uid),
    orderBy('createdAt', 'desc'),
  );
  const snapshot = await getDocs(eventsQuery);
  return snapshot.docs.map((docSnap) => fromFirestoreEvent(docSnap.id, docSnap.data()));
}

export async function getEventsByIds(ids: string[]): Promise<EventData[]> {
  if (!ids.length) return [];

  const batchSize = 10;
  const events: EventData[] = [];

  for (let i = 0; i < ids.length; i += batchSize) {
    const batchIds = ids.slice(i, i + batchSize);
    const eventsQuery = query(
      collection(db, EVENTS_COLLECTION),
      where(documentId(), 'in', batchIds),
    );
    const snapshot = await getDocs(eventsQuery);
    events.push(
      ...snapshot.docs.map((docSnap) => fromFirestoreEvent(docSnap.id, docSnap.data())),
    );
  }

  return events;
}

export async function registerUserForEvent(eventId: string, uid: string) {
  const eventRef = doc(db, EVENTS_COLLECTION, eventId);
  await updateDoc(eventRef, {
    registeredUsers: arrayUnion(uid),
    updatedAt: serverTimestamp(),
  });
}

export async function unregisterUserFromEvent(eventId: string, uid: string) {
  const eventRef = doc(db, EVENTS_COLLECTION, eventId);
  await updateDoc(eventRef, {
    registeredUsers: arrayRemove(uid),
    updatedAt: serverTimestamp(),
  });
}

export async function saveEvent(eventId: string, uid: string) {
  const eventRef = doc(db, EVENTS_COLLECTION, eventId);
  await updateDoc(eventRef, {
    savedByUsers: arrayUnion(uid),
    updatedAt: serverTimestamp(),
  });
}

export async function unsaveEvent(eventId: string, uid: string) {
  const eventRef = doc(db, EVENTS_COLLECTION, eventId);
  await updateDoc(eventRef, {
    savedByUsers: arrayRemove(uid),
    updatedAt: serverTimestamp(),
  });
}

export async function approveEvent(eventId: string, approverUid: string) {
  const eventRef = doc(db, EVENTS_COLLECTION, eventId);
  await updateDoc(eventRef, {
    status: 'approved',
    approvedBy: approverUid,
    approvedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function rejectEvent(eventId: string) {
  const eventRef = doc(db, EVENTS_COLLECTION, eventId);
  await updateDoc(eventRef, {
    status: 'rejected',
    approvedBy: null,
    approvedAt: null,
    updatedAt: serverTimestamp(),
  });
=======
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
>>>>>>> origin/main
}

