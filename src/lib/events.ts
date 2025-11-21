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
    time: data.time,
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

