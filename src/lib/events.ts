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
import { EventData, EventStatus, EventCategory, TournamentSection, EventAddOn, ChessEvent } from './types';
import { Timestamp } from 'firebase/firestore';

const EVENTS_COLLECTION = 'events';
const USERS_COLLECTION = 'users';

// UPDATED: role-based routing and approval flows - Phase 0.5
// UPDATED: Tournament data standardization
function fromFirestoreEvent(docId: string, data: any): EventData {
  // Migration: Convert old 'pending' status to 'pendingApproval' for backward compatibility
  let eventStatus = data.status ?? 'approved';
  if (eventStatus === 'pending') {
    eventStatus = 'pendingApproval';
  }
  
  // Handle tournament-specific fields with backward compatibility
  let startDate: Date | string | undefined;
  let endDate: Date | string | undefined;
  
  if (data.startDate) {
    // Handle Firestore Timestamp
    if (data.startDate.toDate) {
      startDate = data.startDate.toDate();
    } else if (data.startDate instanceof Date) {
      startDate = data.startDate;
    } else {
      startDate = data.startDate;
    }
  }
  
  if (data.endDate) {
    // Handle Firestore Timestamp
    if (data.endDate.toDate) {
      endDate = data.endDate.toDate();
    } else if (data.endDate instanceof Date) {
      endDate = data.endDate;
    } else {
      endDate = data.endDate;
    }
  }
  
  // Parse sections array if present
  let sections: TournamentSection[] = [];
  if (data.sections && Array.isArray(data.sections)) {
    sections = data.sections.map((section: any) => ({
      id: section.id || '',
      name: section.name || '',
      minRating: section.minRating ?? null,
      maxRating: section.maxRating ?? null,
      entryFee: section.entryFee ?? null,
    }));
  }

  // Parse add-ons array if present
  let addOns: EventAddOn[] = [];
  if (data.addOns && Array.isArray(data.addOns)) {
    addOns = data.addOns.map((addOn: any) => ({
      id: addOn.id || '',
      name: addOn.name || '',
      description: addOn.description || '',
      price: addOn.price ?? null,
      isRequired: addOn.isRequired || false,
      appliesToSections: Array.isArray(addOn.appliesToSections) ? addOn.appliesToSections : [],
    }));
  }
  
  // NEW: Franchise tracking
  const franchiseId = data.franchiseId ?? null;
  const isStandalone = franchiseId === null || franchiseId === undefined;
  
  return {
    id: docId,
    title: data.title || data.name || '',
    name: data.name || data.title || '', // Include both for compatibility
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
    status: eventStatus as EventStatus,
    registeredUsers: data.registeredUsers ?? [],
    savedByUsers: data.savedByUsers ?? [],
    approvedBy: data.approvedBy,
    approvedAt: data.approvedAt?.toDate?.(),
    createdAt: data.createdAt?.toDate?.() ?? new Date(),
    updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
    // Tournament-specific fields (backward compatible - only if present)
    venue: data.venue,
    startDate: startDate,
    endDate: endDate,
    startTime: data.startTime,
    endTime: data.endTime,
    timeControl: data.timeControl,
    sections: sections.length > 0 ? sections : undefined,
    // Add-ons (new unified model)
    addOns: addOns.length > 0 ? addOns : undefined,
    // Unified type field (maps from category or type)
    type: data.type || (data.category === 'tournament' ? 'tournament' : 'other'),
    // NEW: Franchise tracking
    franchiseId: franchiseId,
    isStandalone: isStandalone,
  };
}

export async function createEvent(
  event: Omit<EventData, 'id' | 'createdAt' | 'updatedAt'>,
  creatorRole?: 'superAdmin' | 'franchisee' | 'standaloneAdmin',
  franchiseId?: string | null
) {
  try {
    // Import getUserRole to determine creator role if not provided
    const { getUserRole } = await import('./userRoles');
    const role = creatorRole || await getUserRole(event.createdBy);
    
    // Determine franchiseId and status based on role
    let finalFranchiseId: string | null | undefined = franchiseId;
    let finalStatus: EventStatus = event.status;
    
    if (role === 'superAdmin') {
      // Super Admin can create with or without franchise
      // Status is always approved
      finalStatus = 'approved';
      // Use provided franchiseId (can be null for standalone)
    } else if (role === 'franchisee') {
      // Franchisee: if franchiseId is explicitly null (standalone event), needs approval
      // Otherwise, default to their own UID (franchise event), auto-approve
      if (finalFranchiseId === null || finalFranchiseId === undefined) {
        // Explicitly set to null/undefined - standalone event - needs approval
        finalStatus = 'pendingApproval';
        finalFranchiseId = null;
      } else {
        // Franchise event - auto-approve
        finalStatus = 'approved';
        // Use provided franchiseId or default to creator's UID
        finalFranchiseId = finalFranchiseId || event.createdBy;
      }
    } else if (role === 'standaloneAdmin') {
      // Standalone Admin: if franchiseId is provided (franchise event), needs approval
      // Otherwise, standalone event (null), auto-approve
      if (finalFranchiseId !== null && finalFranchiseId !== undefined) {
        // Standalone admin creating franchise event - needs approval
        finalStatus = 'pendingApproval';
        // Keep the provided franchiseId
      } else {
        // Standalone admin creating standalone event - auto-approve
        finalFranchiseId = null;
        finalStatus = 'approved';
      }
    } else {
      throw new Error('Only Super Admin, Franchisee, or Standalone Admin can create events');
    }
    
    // Filter out undefined values (Firestore doesn't accept undefined)
    const eventData: any = {
      title: event.title,
      date: event.date,
      location: event.location,
      price: event.price,
      category: event.category || 'event', // Default to 'event' if not specified
      createdBy: event.createdBy,
      createdByEmail: event.createdByEmail,
      status: finalStatus,
      registeredUsers: event.registeredUsers ?? [],
      savedByUsers: event.savedByUsers ?? [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    // Add franchiseId if provided
    if (finalFranchiseId !== undefined) {
      eventData.franchiseId = finalFranchiseId;
    }
    
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
    
    // Tournament-specific fields (only for tournaments)
    // Required fields: venue, startDate, endDate, timeControl
    // Optional fields: sections
    if (event.category === 'tournament') {
      // Venue (required for tournaments - validated in form)
      if (event.venue !== undefined && event.venue !== null) {
        const venueStr = typeof event.venue === 'string' ? event.venue.trim() : String(event.venue).trim();
        if (venueStr) {
          eventData.venue = venueStr;
        }
      }
      
      // Start date (required for tournaments - validated in form)
      if (event.startDate) {
        if (event.startDate instanceof Date) {
          eventData.startDate = Timestamp.fromDate(event.startDate);
        } else if (typeof event.startDate === 'string') {
          const startDateObj = new Date(event.startDate);
          if (!isNaN(startDateObj.getTime())) {
            eventData.startDate = Timestamp.fromDate(startDateObj);
          }
        }
      }
      
      // End date (required for tournaments - validated in form)
      if (event.endDate) {
        if (event.endDate instanceof Date) {
          eventData.endDate = Timestamp.fromDate(event.endDate);
        } else if (typeof event.endDate === 'string') {
          const endDateObj = new Date(event.endDate);
          if (!isNaN(endDateObj.getTime())) {
            eventData.endDate = Timestamp.fromDate(endDateObj);
          }
        }
      }
      
      // Time control (required for tournaments - validated in form)
      if (event.timeControl !== undefined && event.timeControl !== null) {
        const timeControlStr = typeof event.timeControl === 'string' ? event.timeControl.trim() : String(event.timeControl).trim();
        if (timeControlStr) {
          eventData.timeControl = timeControlStr;
        }
      }

      // Time fields
      if (event.startTime !== undefined && event.startTime !== null) {
        const startTimeStr = typeof event.startTime === 'string' ? event.startTime.trim() : String(event.startTime).trim();
        if (startTimeStr) {
          eventData.startTime = startTimeStr;
        }
      }
      if (event.endTime !== undefined && event.endTime !== null) {
        const endTimeStr = typeof event.endTime === 'string' ? event.endTime.trim() : String(event.endTime).trim();
        if (endTimeStr) {
          eventData.endTime = endTimeStr;
        }
      }
      
      // Sections array (optional - only if provided)
      if (event.sections && Array.isArray(event.sections) && event.sections.length > 0) {
        eventData.sections = event.sections.map(section => ({
          id: section.id || `section-${Date.now()}-${Math.random()}`,
          name: section.name || '',
          minRating: section.minRating ?? null,
          maxRating: section.maxRating ?? null,
          entryFee: section.entryFee ?? null,
        }));
      }
    }

    // Add-ons (for all event types)
    if (event.addOns && Array.isArray(event.addOns) && event.addOns.length > 0) {
      eventData.addOns = event.addOns.map(addOn => ({
        id: addOn.id || `addon-${Date.now()}-${Math.random()}`,
        name: addOn.name || '',
        description: addOn.description || '',
        price: addOn.price ?? null,
        isRequired: addOn.isRequired || false,
        appliesToSections: Array.isArray(addOn.appliesToSections) ? addOn.appliesToSections : [],
      }));
    }

    // Unified type field
    if (event.type) {
      eventData.type = event.type;
    } else if (event.category === 'tournament') {
      eventData.type = 'tournament';
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

export async function updateEvent(
  eventId: string,
  updates: Partial<EventData>,
  editorUid?: string
) {
  // Check permissions if editorUid is provided
  if (editorUid) {
    const { getUserRole } = await import('./userRoles');
    const { getEvent } = await import('./events');
    
    const editorRole = await getUserRole(editorUid);
    const event = await getEvent(eventId);
    
    if (!event) {
      throw new Error('Event not found');
    }
    
    // Permission checks
    if (editorRole === 'superAdmin') {
      // Super Admin can edit all events
    } else if (editorRole === 'franchisee') {
      // Franchisee can only edit events where franchiseId === their UID
      if (event.franchiseId !== editorUid) {
        throw new Error('You can only edit events for your franchise');
      }
    } else if (editorRole === 'standaloneAdmin') {
      // Standalone Admin can only edit their own events
      if (event.createdBy !== editorUid) {
        throw new Error('You can only edit your own events');
      }
    } else {
      throw new Error('You do not have permission to edit events');
    }
  }
  
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
  
  // Tournament-specific fields
  if (updates.venue !== undefined) {
    const venueValue = typeof updates.venue === 'string' ? updates.venue.trim() : updates.venue;
    if (venueValue && venueValue !== '') {
      updateData.venue = venueValue;
    } else {
      updateData.venue = deleteField();
    }
  }
  
  if (updates.startDate !== undefined) {
    if (updates.startDate instanceof Date) {
      updateData.startDate = Timestamp.fromDate(updates.startDate);
    } else if (typeof updates.startDate === 'string') {
      const startDateObj = new Date(updates.startDate);
      if (!isNaN(startDateObj.getTime())) {
        updateData.startDate = Timestamp.fromDate(startDateObj);
      }
    } else if (updates.startDate === null) {
      updateData.startDate = deleteField();
    }
  }
  
  if (updates.endDate !== undefined) {
    if (updates.endDate instanceof Date) {
      updateData.endDate = Timestamp.fromDate(updates.endDate);
    } else if (typeof updates.endDate === 'string') {
      const endDateObj = new Date(updates.endDate);
      if (!isNaN(endDateObj.getTime())) {
        updateData.endDate = Timestamp.fromDate(endDateObj);
      }
    } else if (updates.endDate === null) {
      updateData.endDate = deleteField();
    }
  }
  
  if (updates.timeControl !== undefined) {
    const timeControlValue = typeof updates.timeControl === 'string' ? updates.timeControl.trim() : updates.timeControl;
    if (timeControlValue && timeControlValue !== '') {
      updateData.timeControl = timeControlValue;
    } else {
      updateData.timeControl = deleteField();
    }
  }

  if (updates.startTime !== undefined) {
    const startTimeValue = typeof updates.startTime === 'string' ? updates.startTime.trim() : updates.startTime;
    if (startTimeValue && startTimeValue !== '') {
      updateData.startTime = startTimeValue;
    } else {
      updateData.startTime = deleteField();
    }
  }

  if (updates.endTime !== undefined) {
    const endTimeValue = typeof updates.endTime === 'string' ? updates.endTime.trim() : updates.endTime;
    if (endTimeValue && endTimeValue !== '') {
      updateData.endTime = endTimeValue;
    } else {
      updateData.endTime = deleteField();
    }
  }
  
  if (updates.sections !== undefined) {
    if (updates.sections && Array.isArray(updates.sections) && updates.sections.length > 0) {
      updateData.sections = updates.sections.map(section => ({
        id: section.id,
        name: section.name,
        minRating: section.minRating ?? null,
        maxRating: section.maxRating ?? null,
        entryFee: section.entryFee ?? null,
      }));
    } else {
      updateData.sections = deleteField();
    }
  }

  // Add-ons
  if (updates.addOns !== undefined) {
    if (updates.addOns && Array.isArray(updates.addOns) && updates.addOns.length > 0) {
      updateData.addOns = updates.addOns.map(addOn => ({
        id: addOn.id,
        name: addOn.name,
        description: addOn.description || '',
        price: addOn.price ?? null,
        isRequired: addOn.isRequired || false,
        appliesToSections: Array.isArray(addOn.appliesToSections) ? addOn.appliesToSections : [],
      }));
    } else {
      updateData.addOns = deleteField();
    }
  }

  // Unified type field
  if (updates.type !== undefined) {
    updateData.type = updates.type;
  }
  
  // NEW: Franchise tracking
  if (updates.franchiseId !== undefined) {
    updateData.franchiseId = updates.franchiseId;
  }
  
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

// UPDATED: Helper function to convert EventData to ChessEvent format
export function eventDataToChessEvent(eventData: EventData): ChessEvent {
  return {
    id: eventData.id || '',
    type: (eventData.type || (eventData.category === 'tournament' ? 'tournament' : 'other')) as any,
    name: eventData.title || '',
    description: eventData.description || '',
    venue: eventData.venue || eventData.location || '',
    startDate: eventData.startDate || new Date(eventData.date || Date.now()),
    endDate: eventData.endDate || new Date(eventData.date || Date.now()),
    startTime: eventData.startTime,
    endTime: eventData.endTime,
    timeControl: eventData.timeControl,
    status: eventData.status,
    sections: eventData.sections || [],
    addOns: eventData.addOns || [],
    createdBy: eventData.createdBy,
    createdByEmail: eventData.createdByEmail,
    createdAt: eventData.createdAt,
    updatedAt: eventData.updatedAt,
    approvedBy: eventData.approvedBy,
    approvedAt: eventData.approvedAt,
    // Legacy fields
    title: eventData.title,
    date: eventData.date,
    location: eventData.location,
    price: eventData.price,
    time: eventData.time,
    image: eventData.image,
    contactEmail: eventData.contactEmail,
    contactPhone: eventData.contactPhone,
    category: eventData.category,
    // NEW: Franchise tracking
    franchiseId: eventData.franchiseId,
    isStandalone: eventData.isStandalone ?? (eventData.franchiseId === null || eventData.franchiseId === undefined),
  };
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
  // UPDATED: Use 'pendingApproval' status - Phase 0.5
  // Also query for old 'pending' status for backward compatibility
  const [newPending, oldPending] = await Promise.all([
    getDocs(
      query(collection(db, EVENTS_COLLECTION), where('status', '==', 'pendingApproval'), orderBy('createdAt', 'desc')),
    ),
    getDocs(
      query(collection(db, EVENTS_COLLECTION), where('status', '==', 'pending'), orderBy('createdAt', 'desc')),
    ),
  ]);
  
  const allPending = [
    ...newPending.docs.map((docSnap) => fromFirestoreEvent(docSnap.id, docSnap.data())),
    ...oldPending.docs.map((docSnap) => fromFirestoreEvent(docSnap.id, docSnap.data())),
  ];
  
  // Remove duplicates by ID
  const uniquePending = Array.from(
    new Map(allPending.map(event => [event.id, event])).values()
  );
  
  return uniquePending;
}

export async function getEventsByStatus(status: EventStatus): Promise<EventData[]> {
  // UPDATED: role-based routing and approval flows - Phase 0.5
  // Handle migration from 'pending' to 'pendingApproval'
  if (status === 'pendingApproval') {
    // Query both new and old status for backward compatibility
    const [newPending, oldPending] = await Promise.all([
      getDocs(
        query(collection(db, EVENTS_COLLECTION), where('status', '==', 'pendingApproval'), orderBy('createdAt', 'desc')),
      ),
      getDocs(
        query(collection(db, EVENTS_COLLECTION), where('status', '==', 'pending'), orderBy('createdAt', 'desc')),
      ),
    ]);
    
    const allPending = [
      ...newPending.docs.map((docSnap) => fromFirestoreEvent(docSnap.id, docSnap.data())),
      ...oldPending.docs.map((docSnap) => fromFirestoreEvent(docSnap.id, docSnap.data())),
    ];
    
    // Remove duplicates by ID
    return Array.from(
      new Map(allPending.map(event => [event.id, event])).values()
    );
  }
  
  // For other statuses, query normally
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
  try {
    // Update event document - add user to registeredUsers
    await updateDoc(doc(db, EVENTS_COLLECTION, eventId), {
      registeredUsers: arrayUnion(uid),
      updatedAt: serverTimestamp(),
    });
  } catch (error: any) {
    console.error('Error updating event document:', error);
    throw new Error(`Failed to update event: ${error.message || 'Permission denied'}`);
  }
  
  try {
    // Update user document - add event to registeredEvents
    await updateDoc(doc(db, USERS_COLLECTION, uid), {
      registeredEvents: arrayUnion(eventId),
      updatedAt: serverTimestamp(),
    });
  } catch (error: any) {
    console.error('Error updating user document:', error);
    // Try to rollback event update
    try {
      await updateDoc(doc(db, EVENTS_COLLECTION, eventId), {
        registeredUsers: arrayRemove(uid),
        updatedAt: serverTimestamp(),
      });
    } catch (rollbackError) {
      console.error('Error rolling back event update:', rollbackError);
    }
    throw new Error(`Failed to update user: ${error.message || 'Permission denied'}`);
  }
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

// NEW: Helper functions for franchise queries
// Returns events linked to a franchise OR created by the franchisee (fallback for events without franchiseId set)
export async function getEventsByFranchise(franchiseId: string): Promise<EventData[]> {
  try {
    // Query 1: Events where franchiseId matches
    const franchiseQuery = query(
      collection(db, EVENTS_COLLECTION),
      where('franchiseId', '==', franchiseId),
      orderBy('createdAt', 'desc')
    );
    
    // Query 2: Events created by the franchisee (fallback for events without franchiseId)
    const createdByQuery = query(
      collection(db, EVENTS_COLLECTION),
      where('createdBy', '==', franchiseId),
      orderBy('createdAt', 'desc')
    );
    
    const [franchiseSnap, createdBySnap] = await Promise.all([
      getDocs(franchiseQuery).catch(() => ({ docs: [] })), // Catch index errors
      getDocs(createdByQuery).catch(() => ({ docs: [] })), // Catch index errors
    ]);
    
    // Combine results and remove duplicates
    const allEvents = [
      ...franchiseSnap.docs.map((docSnap) => fromFirestoreEvent(docSnap.id, docSnap.data())),
      ...createdBySnap.docs.map((docSnap) => fromFirestoreEvent(docSnap.id, docSnap.data())),
    ];
    
    // Remove duplicates by event ID
    const uniqueEvents = Array.from(
      new Map(allEvents.map(event => [event.id, event])).values()
    );
    
    // A franchisee should see ALL events they created, regardless of franchiseId
    // This includes:
    // 1. Events linked to their franchise (franchiseId === franchiseId)
    // 2. Standalone events they created (franchiseId === null and createdBy === franchiseId)
    // 3. Any other events they created
    return uniqueEvents.filter(event => 
      event.createdBy === franchiseId || event.franchiseId === franchiseId
    );
  } catch (error: any) {
    console.error('Error fetching franchise events:', error);
    // Fallback: just get events created by the franchisee
    try {
      const fallbackSnap = await getDocs(
        query(
          collection(db, EVENTS_COLLECTION),
          where('createdBy', '==', franchiseId),
          orderBy('createdAt', 'desc')
        )
      );
      return fallbackSnap.docs.map((docSnap) => fromFirestoreEvent(docSnap.id, docSnap.data()));
    } catch (fallbackError) {
      console.error('Fallback query also failed:', fallbackError);
      return [];
    }
  }
}

export async function getStandaloneEvents(): Promise<EventData[]> {
  const snapshot = await getDocs(
    query(
      collection(db, EVENTS_COLLECTION),
      where('franchiseId', '==', null),
      orderBy('createdAt', 'desc')
    )
  );
  return snapshot.docs.map((docSnap) => fromFirestoreEvent(docSnap.id, docSnap.data()));
}

/**
 * Check if a user can edit an event
 */
export async function canEditEvent(userUid: string, event: EventData): Promise<boolean> {
  const { getUserRole } = await import('./userRoles');
  const role = await getUserRole(userUid);
  
  if (role === 'superAdmin') {
    return true; // Super Admin can edit all events
  }
  
  if (role === 'franchisee') {
    // Franchisee can edit events where franchiseId === their UID
    return event.franchiseId === userUid;
  }
  
  if (role === 'standaloneAdmin') {
    // Standalone Admin can only edit their own events
    return event.createdBy === userUid;
  }
  
  return false;
}

