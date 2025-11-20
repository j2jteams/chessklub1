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
}

