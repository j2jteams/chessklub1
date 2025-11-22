import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  deleteField,
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
import { EventData, EventStatus, EventCategory } from './types';

const EVENTS_COLLECTION = 'events';
const USERS_COLLECTION = 'users';

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
    category: data.category || 'event', // Default to 'event' for existing records
    contactEmail: data.contactEmail,
    contactPhone: data.contactPhone,
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
  try {
    // Filter out undefined values (Firestore doesn't accept undefined)
    const eventData: any = {
      title: event.title,
      date: event.date,
      location: event.location,
      price: event.price,
      category: event.category || 'event', // Default to 'event' if not specified
      createdBy: event.createdBy,
      createdByEmail: event.createdByEmail,
      status: event.status,
      registeredUsers: event.registeredUsers ?? [],
      savedByUsers: event.savedByUsers ?? [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    // Only include optional fields if they have values (not undefined or empty)
    if (event.time !== undefined && event.time !== null && typeof event.time === 'string' && event.time.trim() !== '') {
      eventData.time = event.time.trim();
    }
    if (event.description !== undefined && event.description !== null && typeof event.description === 'string' && event.description.trim() !== '') {
      eventData.description = event.description.trim();
    }
    if (event.image !== undefined && event.image !== null && typeof event.image === 'string' && event.image.trim() !== '') {
      eventData.image = event.image.trim();
    }
    if (event.contactEmail !== undefined && event.contactEmail !== null && typeof event.contactEmail === 'string' && event.contactEmail.trim() !== '') {
      eventData.contactEmail = event.contactEmail.trim();
    }
    if (event.contactPhone !== undefined && event.contactPhone !== null && typeof event.contactPhone === 'string' && event.contactPhone.trim() !== '') {
      eventData.contactPhone = event.contactPhone.trim();
    }
    
    const docRef = await addDoc(collection(db, EVENTS_COLLECTION), eventData);
    return docRef.id;
  } catch (error: any) {
    console.error('Error creating event:', error);
    
    // Provide more specific error messages
    if (error.code === 'permission-denied') {
      throw new Error('Permission denied. Make sure you have admin or owner role, and Firestore security rules are set up correctly.');
    } else if (error.code === 'failed-precondition') {
      throw new Error('Missing index. Please check the browser console for a link to create the required Firestore index.');
    } else if (error.message) {
      throw new Error(`Failed to create event: ${error.message}`);
    } else {
      throw new Error('Failed to create event. Please check Firestore is set up and you have the correct permissions.');
    }
  }
}

export async function updateEvent(eventId: string, updates: Partial<EventData>) {
  // Filter out undefined values (Firestore doesn't accept undefined)
  const updateData: any = {
    updatedAt: serverTimestamp(),
  };
  
  // Only include required fields that are defined
  if (updates.title !== undefined) updateData.title = updates.title;
  if (updates.date !== undefined) updateData.date = updates.date;
  if (updates.location !== undefined) updateData.location = updates.location;
  if (updates.price !== undefined) updateData.price = updates.price;
  if (updates.category !== undefined) updateData.category = updates.category;
  if (updates.status !== undefined) updateData.status = updates.status;
  
  // For optional fields, only include if they have values (not empty strings)
  // If empty, we'll just omit the field (don't set it to null or deleteField)
  if (updates.time !== undefined) {
    const timeValue = typeof updates.time === 'string' ? updates.time.trim() : updates.time;
    if (timeValue && timeValue !== '') {
      updateData.time = timeValue;
    }
  }
  
  if (updates.description !== undefined) {
    const descValue = typeof updates.description === 'string' ? updates.description.trim() : updates.description;
    if (descValue && descValue !== '') {
      updateData.description = descValue;
    }
  }
  
  if (updates.image !== undefined) {
    const imageValue = typeof updates.image === 'string' ? updates.image.trim() : updates.image;
    if (imageValue && imageValue !== '') {
      updateData.image = imageValue;
    } else {
      updateData.image = deleteField(); // Delete field if empty
    }
  }
  
  if (updates.contactEmail !== undefined) {
    const emailValue = typeof updates.contactEmail === 'string' ? updates.contactEmail.trim() : updates.contactEmail;
    if (emailValue && emailValue !== '') {
      updateData.contactEmail = emailValue;
    } else {
      updateData.contactEmail = deleteField(); // Delete field if empty
    }
  }
  
  if (updates.contactPhone !== undefined) {
    const phoneValue = typeof updates.contactPhone === 'string' ? updates.contactPhone.trim() : updates.contactPhone;
    if (phoneValue && phoneValue !== '') {
      updateData.contactPhone = phoneValue;
    } else {
      updateData.contactPhone = deleteField(); // Delete field if empty
    }
  }
  
  await updateDoc(doc(db, EVENTS_COLLECTION, eventId), updateData);
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
  // Update event document - add user to registeredUsers
  await updateDoc(doc(db, EVENTS_COLLECTION, eventId), {
    registeredUsers: arrayUnion(uid),
    updatedAt: serverTimestamp(),
  });
  
  // Update user document - add event to registeredEvents
  await updateDoc(doc(db, USERS_COLLECTION, uid), {
    registeredEvents: arrayUnion(eventId),
    updatedAt: serverTimestamp(),
  });
}

export async function unregisterUserFromEvent(eventId: string, uid: string) {
  // Update event document - remove user from registeredUsers
  await updateDoc(doc(db, EVENTS_COLLECTION, eventId), {
    registeredUsers: arrayRemove(uid),
    updatedAt: serverTimestamp(),
  });
  
  // Update user document - remove event from registeredEvents
  await updateDoc(doc(db, USERS_COLLECTION, uid), {
    registeredEvents: arrayRemove(eventId),
    updatedAt: serverTimestamp(),
  });
}

export async function saveEvent(eventId: string, uid: string) {
  // Update event document - add user to savedByUsers
  await updateDoc(doc(db, EVENTS_COLLECTION, eventId), {
    savedByUsers: arrayUnion(uid),
    updatedAt: serverTimestamp(),
  });
  
  // Update user document - add event to savedEvents
  await updateDoc(doc(db, USERS_COLLECTION, uid), {
    savedEvents: arrayUnion(eventId),
    updatedAt: serverTimestamp(),
  });
}

export async function unsaveEvent(eventId: string, uid: string) {
  // Update event document - remove user from savedByUsers
  await updateDoc(doc(db, EVENTS_COLLECTION, eventId), {
    savedByUsers: arrayRemove(uid),
    updatedAt: serverTimestamp(),
  });
  
  // Update user document - remove event from savedEvents
  await updateDoc(doc(db, USERS_COLLECTION, uid), {
    savedEvents: arrayRemove(eventId),
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

