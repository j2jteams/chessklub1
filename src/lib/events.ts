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
import { EventData, EventStatus, EventCategory, TournamentSection, EventAddOn, ChessEvent, TournamentRegistration, TimeControl, PricingTier } from './types';
import { Timestamp } from 'firebase/firestore';
import { normalizeCountryCode } from './locationNormalizer';
import { resolveCountryCode } from './countryResolver';

const EVENTS_COLLECTION = 'events';
const USERS_COLLECTION = 'users';
const REGISTRATIONS_COLLECTION = 'tournamentRegistrations';

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
  
  // Parse pricing tiers array if present
  let pricingTiers: PricingTier[] | undefined = undefined;
  if (data.pricingTiers && Array.isArray(data.pricingTiers)) {
    const parsedTiers = data.pricingTiers.map((tier: any) => ({
      id: tier.id || '',
      name: tier.name || '',
      price: typeof tier.price === 'number' ? tier.price : (typeof tier.price === 'string' ? parseFloat(tier.price) || 0 : 0),
      description: tier.description || '',
      countryCode: tier.countryCode || undefined,
      currency: tier.currency || 'USD',
    }));
    // Only include if non-empty
    if (parsedTiers.length > 0) {
      pricingTiers = parsedTiers;
    }
  }

  // NEW: Franchise tracking
  const franchiseId = data.franchiseId ?? null;
  const isStandalone = franchiseId === null || franchiseId === undefined;
  
  // PERMANENT: Remove tags field if it exists in the database (migration)
  // This ensures tags are automatically removed when events are read
  if (data.tags !== undefined) {
    // Asynchronously remove tags from database (don't block the read)
    const eventRef = doc(db, EVENTS_COLLECTION, docId);
    updateDoc(eventRef, { tags: deleteField() }).catch((error) => {
      console.warn(`Failed to remove tags from event ${docId}:`, error);
      // Non-critical error - continue with event read
    });
    // Also remove from data object so it's not included in the returned EventData
    delete data.tags;
  }
  
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
    // Handle timeControl - support both new object format and legacy string
    timeControl: (() => {
      if (data.timeControl) {
        if (typeof data.timeControl === 'object' && data.timeControl.category) {
          // New format: TimeControl object
          return data.timeControl as TimeControl;
        } else if (typeof data.timeControl === 'string') {
          // Legacy format: string - convert to TimeControl object
          return data.timeControl;
        }
      }
      return undefined;
    })(),
    sections: sections.length > 0 ? sections : undefined,
    // Add-ons (new unified model)
    addOns: addOns.length > 0 ? addOns : undefined,
    // Pricing tiers (new system)
    pricingTiers: pricingTiers,
    // Structured location (new system) - preserve as-is from Firestore
    structuredLocation: data.structuredLocation || undefined,
    // Unified type field (maps from category or type)
    type: data.type || (data.category === 'tournament' ? 'tournament' : 'other'),
    // NEW: Franchise tracking
    franchiseId: franchiseId,
    isStandalone: isStandalone,
    // Global tournament search fields
    country: data.country,
    countryCode: data.structuredLocation?.countryCode || resolveCountryCode(data.country),
    city: data.city,
    region: data.region,
    coordinates: data.coordinates,
    tournamentLevel: data.tournamentLevel,
    fideRated: data.fideRated,
    ratingType: data.ratingType,
    maxPlayers: data.maxPlayers,
    registrationDeadline: data.registrationDeadline,
    minRating: data.minRating,
    maxRating: data.maxRating,
    prizeFund: data.prizeFund,
    prizeCurrency: data.prizeCurrency,
    heroImageUrl: data.heroImageUrl,
    venueType: data.venueType,
    address: data.address,
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
    let role: 'superAdmin' | 'franchisee' | 'standaloneAdmin' | undefined = creatorRole;
    
    // If role not provided, fetch from Firestore
    if (!role) {
      const firestoreRole = await getUserRole(event.createdBy);
      console.log(`[createEvent] Role not provided, fetched from Firestore: ${firestoreRole} for user ${event.createdBy}`);
      // Only use valid admin roles (filter out 'player' and null)
      if (firestoreRole === 'superAdmin' || firestoreRole === 'franchisee' || firestoreRole === 'standaloneAdmin') {
        role = firestoreRole;
      } else {
        console.warn(`[createEvent] User ${event.createdBy} does not have a valid admin role. Role: ${firestoreRole}`);
      }
    } else {
      // Defensive check: Verify role from Firestore matches passed role
      const firestoreRole = await getUserRole(event.createdBy);
      console.log(`[createEvent] Role provided: ${role}, Firestore role: ${firestoreRole} for user ${event.createdBy}`);
      
      // Special case: If passed role is superAdmin, trust it (might be from client-side auth)
      // Only override if Firestore has a different valid admin role
      if (role === 'superAdmin') {
        if (firestoreRole !== 'superAdmin' && (firestoreRole === 'franchisee' || firestoreRole === 'standaloneAdmin')) {
          console.warn(`[createEvent] Role mismatch: passed=superAdmin, Firestore=${firestoreRole}. Using passed superAdmin role.`);
          // Keep superAdmin role - don't override
        } else if (firestoreRole === 'superAdmin') {
          console.log(`[createEvent] Role confirmed: superAdmin matches Firestore`);
        }
      } else if (firestoreRole !== role && (firestoreRole === 'superAdmin' || firestoreRole === 'franchisee' || firestoreRole === 'standaloneAdmin')) {
        console.warn(`[createEvent] Role mismatch: passed=${role}, Firestore=${firestoreRole}. Using Firestore role.`);
        // Use Firestore role as source of truth
        role = firestoreRole;
      }
    }
    
    // Determine franchiseId and status based on role
    let finalFranchiseId: string | null | undefined = franchiseId;
    let finalStatus: EventStatus = event.status;
    
    console.log(`[createEvent] Final role determined: ${role}, initial status: ${finalStatus}`);
    
    if (role === 'superAdmin') {
      // Super Admin can create with or without franchise — always approved
      finalStatus = 'approved';
      console.log(`[createEvent] Super Admin detected - setting status to 'approved'`);
    } else if (role === 'franchisee') {
      // All franchisee-created events are auto-approved; preserve franchise linkage
      finalStatus = 'approved';
      if (finalFranchiseId === null || finalFranchiseId === undefined) {
        finalFranchiseId = null;
        console.log(`[createEvent] Franchisee creating standalone event - status: approved`);
      } else {
        finalFranchiseId = finalFranchiseId || event.createdBy;
        console.log(`[createEvent] Franchisee creating franchise-linked event - status: approved`);
      }
    } else if (role === 'standaloneAdmin') {
      // All standalone-admin-created events are auto-approved
      finalStatus = 'approved';
      if (finalFranchiseId === null || finalFranchiseId === undefined) {
        finalFranchiseId = null;
        console.log(`[createEvent] Standalone Admin creating standalone event - status: approved`);
      } else {
        console.log(`[createEvent] Standalone Admin creating franchise-linked event - status: approved`);
      }
    } else {
      console.error(`[createEvent] Invalid role: ${role}. User: ${event.createdBy}`);
      throw new Error('Only Super Admin, Franchisee, or Standalone Admin can create events');
    }
    
    console.log(`[createEvent] Final status before saving: ${finalStatus}, role: ${role}`);
    
    // SAFETY CHECK: If role is still undefined but we have a createdBy, try one more time to get role
    // This handles edge cases where role detection might have failed
    if (!role && event.createdBy) {
      console.warn(`[createEvent] Role is still undefined after all checks. Attempting final role fetch for user: ${event.createdBy}`);
      const { getUserRole } = await import('./userRoles');
      const finalRoleCheck = await getUserRole(event.createdBy);
      console.log(`[createEvent] Final role check result: ${finalRoleCheck}`);
      if (finalRoleCheck === 'superAdmin') {
        role = 'superAdmin';
        finalStatus = 'approved';
        console.log(`[createEvent] Final check: Super Admin detected - forcing status to 'approved'`);
      } else if (finalRoleCheck === 'franchisee' || finalRoleCheck === 'standaloneAdmin') {
        role = finalRoleCheck;
        finalStatus = 'approved';
        console.log(`[createEvent] Final check: ${finalRoleCheck} detected - forcing status to 'approved'`);
      }
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
      ...(event.createdByName && { createdByName: event.createdByName }),
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
        if (typeof event.timeControl === 'object' && 'category' in event.timeControl) {
          // New format: TimeControl object
          eventData.timeControl = event.timeControl as TimeControl;
        } else if (typeof event.timeControl === 'string') {
          // Legacy format: string
          eventData.timeControl = event.timeControl.trim();
        }
      }

      // Structured location (new system)
      if (event.structuredLocation !== undefined && event.structuredLocation !== null) {
        eventData.structuredLocation = event.structuredLocation;
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

    // Pricing tiers (for all event types)
    if (event.pricingTiers && Array.isArray(event.pricingTiers) && event.pricingTiers.length > 0) {
      eventData.pricingTiers = event.pricingTiers
        .map(tier => {
          // Sanitize tier fields
          let price = typeof tier.price === 'number' ? tier.price : (typeof tier.price === 'string' ? parseFloat(tier.price) : 0);
          
          // Skip invalid tiers (price must be a valid number)
          if (isNaN(price) || price < 0) {
            return null;
          }
          
          // Round to 2 decimal places to avoid floating point precision issues
          // Use a more precise rounding method to avoid 500 becoming 499.99
          price = Math.round(price * 100 + Number.EPSILON) / 100;
          
          // If the value is very close to a whole number (within 0.001), round to whole number
          // This prevents 499.99999999999994 from being stored as 499.99
          const nearestWhole = Math.round(price);
          if (Math.abs(price - nearestWhole) < 0.001) {
            price = nearestWhole;
          }
          
          const normalizedCountryCode = normalizeCountryCode(tier.countryCode);
          const tierObj: PricingTier = {
            id: tier.id || `tier-${Date.now()}-${Math.random()}`,
            name: tier.name || '',
            price: price,
            // Normalize country code
            countryCode: normalizedCountryCode,
            // Default currency to USD if missing
            currency: tier.currency || 'USD',
          };
          // Only include description if it exists
          if (tier.description) {
            tierObj.description = tier.description;
          }
          return tierObj;
        })
        .filter((tier): tier is PricingTier => tier !== null);
      // Only include if we have valid tiers
      if (eventData.pricingTiers.length === 0) {
        delete eventData.pricingTiers;
      }
    }

    // Unified type field
    if (event.type) {
      eventData.type = event.type;
    } else if (event.category === 'tournament') {
      eventData.type = 'tournament';
    }
    
    // Final cleanup: Remove any undefined values (Firestore doesn't accept undefined)
    const cleanEventData = (obj: any): any => {
      if (obj === null || obj === undefined) return null;
      if (Array.isArray(obj)) {
        return obj.map(cleanEventData).filter(item => item !== undefined);
      }
      if (typeof obj === 'object' && obj.constructor === Object) {
        const cleaned: any = {};
        for (const [key, value] of Object.entries(obj)) {
          if (value !== undefined) {
            const cleanedValue = cleanEventData(value);
            if (cleanedValue !== undefined) {
              cleaned[key] = cleanedValue;
            }
          }
        }
        return cleaned;
      }
      return obj;
    };
    
    const finalEventData = cleanEventData(eventData);
    
    const docRef = await addDoc(collection(db, EVENTS_COLLECTION), finalEventData);
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
  let editorRole: 'superAdmin' | 'franchisee' | 'standaloneAdmin' | null = null;
  if (editorUid) {
    const { getUserRole } = await import('./userRoles');
    const { getEvent } = await import('./events');
    
    const role = await getUserRole(editorUid);
    // Only allow admin roles, filter out 'player'
    if (role === 'superAdmin' || role === 'franchisee' || role === 'standaloneAdmin') {
      editorRole = role;
    }
    const event = await getEvent(eventId);
    
    if (!event) {
      throw new Error('Event not found');
    }
    
    // Permission checks
    if (editorRole === 'superAdmin') {
      // Super Admin can edit all events
      console.log(`[updateEvent] Super Admin detected - will auto-approve event`);
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
  // PERMANENT: Always remove tags field when updating events
  const updateData: any = {
    updatedAt: serverTimestamp(),
    tags: deleteField(), // Permanently remove tags field on every update
  };
  
  // Only include required fields that are defined
  if (updates.title !== undefined) updateData.title = updates.title;
  if (updates.date !== undefined) updateData.date = updates.date;
  if (updates.location !== undefined) updateData.location = updates.location;
  if (updates.price !== undefined) updateData.price = updates.price;
  if (updates.category !== undefined) updateData.category = updates.category;
  
  // Handle status: Super Admin always auto-approves (unless explicitly setting to something else)
  if (updates.status !== undefined) {
    // If status is explicitly provided, use it (but Super Admin should auto-approve)
    if (editorRole === 'superAdmin' && updates.status === 'pendingApproval') {
      // Super Admin tried to set to pending - auto-approve instead
      console.log(`[updateEvent] Super Admin attempted to set status to pendingApproval - auto-approving instead`);
      updateData.status = 'approved';
    } else {
      updateData.status = updates.status;
    }
  } else if (editorRole === 'superAdmin') {
    // Super Admin updating event but status not provided - auto-approve
    console.log(`[updateEvent] Super Admin updating event - auto-setting status to 'approved'`);
    updateData.status = 'approved';
  }
  // For other roles, don't change status if not provided
  
  // Structured location (new system)
  if (updates.structuredLocation !== undefined) {
    if (updates.structuredLocation !== null) {
      // Clean undefined values from structuredLocation
      const cleanLocation = (obj: any): any => {
        if (obj === null || obj === undefined) return null;
        if (Array.isArray(obj)) {
          return obj.map(cleanLocation).filter(item => item !== undefined);
        }
        if (typeof obj === 'object' && obj.constructor === Object) {
          const cleaned: any = {};
          for (const [key, value] of Object.entries(obj)) {
            if (value !== undefined) {
              const cleanedValue = cleanLocation(value);
              if (cleanedValue !== undefined) {
                cleaned[key] = cleanedValue;
              }
            }
          }
          return cleaned;
        }
        return obj;
      };
      updateData.structuredLocation = cleanLocation(updates.structuredLocation);
    } else {
      updateData.structuredLocation = deleteField();
    }
  }
  
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
    if (typeof updates.timeControl === 'object' && 'category' in updates.timeControl) {
      // New format: TimeControl object
      updateData.timeControl = updates.timeControl as TimeControl;
    } else if (typeof updates.timeControl === 'string') {
      // Legacy format: string
      const timeControlValue = updates.timeControl.trim();
      if (timeControlValue) {
        updateData.timeControl = timeControlValue;
      } else {
        updateData.timeControl = deleteField();
      }
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

  // Pricing tiers
  if (updates.pricingTiers !== undefined) {
    if (updates.pricingTiers && Array.isArray(updates.pricingTiers) && updates.pricingTiers.length > 0) {
      const sanitizedTiers = updates.pricingTiers
        .map(tier => {
          const price = typeof tier.price === 'number' ? tier.price : (typeof tier.price === 'string' ? parseFloat(tier.price) : 0);
          // Skip invalid tiers
          if (isNaN(price) || price < 0) {
            return null;
          }
          const normalizedCountryCode = normalizeCountryCode(tier.countryCode);
          const tierObj: PricingTier = {
            id: tier.id || `tier-${Date.now()}-${Math.random()}`,
            name: tier.name || '',
            price: price,
            // Normalize country code
            countryCode: normalizedCountryCode,
            // Default currency to USD if missing
            currency: tier.currency || 'USD',
          };
          // Only include description if it exists
          if (tier.description) {
            tierObj.description = tier.description;
          }
          return tierObj;
        })
        .filter((tier): tier is PricingTier => tier !== null);
      
      if (sanitizedTiers.length > 0) {
        updateData.pricingTiers = sanitizedTiers;
      } else {
        updateData.pricingTiers = deleteField();
      }
    } else {
      updateData.pricingTiers = deleteField();
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
  
  // Final cleanup: Remove any undefined values (Firestore doesn't accept undefined)
  const cleanUpdateData = (obj: any): any => {
    if (obj === null || obj === undefined) return null;
    if (Array.isArray(obj)) {
      return obj.map(cleanUpdateData).filter(item => item !== undefined);
    }
    if (typeof obj === 'object' && obj.constructor === Object) {
      const cleaned: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined) {
          const cleanedValue = cleanUpdateData(value);
          if (cleanedValue !== undefined) {
            cleaned[key] = cleanedValue;
          }
        }
      }
      return cleaned;
    }
    return obj;
  };
  
  const finalUpdateData = cleanUpdateData(updateData);
  
  await updateDoc(doc(db, EVENTS_COLLECTION, eventId), finalUpdateData);
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
    // Prevent data loss: preserve pricingTiers and structuredLocation
    pricingTiers: eventData.pricingTiers || [],
    structuredLocation: eventData.structuredLocation,
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

// Tournament Registration Functions
function fromFirestoreRegistration(docId: string, data: any): TournamentRegistration {
  return {
    id: docId,
    tournamentId: data.tournamentId || '',
    userId: data.userId || '',
    userEmail: data.userEmail || '',
    displayName: data.displayName || '',
    phoneNumber: data.phoneNumber || undefined,
    sectionId: data.sectionId || undefined,
    fideId: data.fideId || undefined,
    fideRating: data.fideRating || undefined,
    nationalFederationId: data.nationalFederationId || undefined,
    nationalRating: data.nationalRating || undefined,
    registrationDate: data.registrationDate?.toDate?.() || data.registrationDate || new Date(),
    status: data.status || 'pending',
    paymentStatus: data.paymentStatus || undefined,
    selectedAddOns: data.selectedAddOns || [],
    notes: data.notes || undefined,
  };
}

export async function createTournamentRegistration(
  registration: Omit<TournamentRegistration, 'id' | 'registrationDate'>
): Promise<string> {
  try {
    const registrationData: any = {
      tournamentId: registration.tournamentId,
      userId: registration.userId,
      userEmail: registration.userEmail,
      displayName: registration.displayName,
      status: registration.status || 'pending',
      registrationDate: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    if (registration.sectionId) registrationData.sectionId = registration.sectionId;
    if (registration.phoneNumber) registrationData.phoneNumber = registration.phoneNumber;
    if (registration.fideId) registrationData.fideId = registration.fideId;
    if (registration.fideRating !== undefined) registrationData.fideRating = registration.fideRating;
    if (registration.nationalFederationId) registrationData.nationalFederationId = registration.nationalFederationId;
    if (registration.nationalRating !== undefined) registrationData.nationalRating = registration.nationalRating;
    if (registration.paymentStatus) registrationData.paymentStatus = registration.paymentStatus;
    if (registration.selectedAddOns && registration.selectedAddOns.length > 0) {
      registrationData.selectedAddOns = registration.selectedAddOns;
    }
    if (registration.notes) registrationData.notes = registration.notes;

    const docRef = await addDoc(collection(db, REGISTRATIONS_COLLECTION), registrationData);

    // Also update the event's registeredUsers array for backward compatibility
    await updateDoc(doc(db, EVENTS_COLLECTION, registration.tournamentId), {
      registeredUsers: arrayUnion(registration.userId),
      updatedAt: serverTimestamp(),
    });

    // Update user's registeredEvents array
    await updateDoc(doc(db, USERS_COLLECTION, registration.userId), {
      registeredEvents: arrayUnion(registration.tournamentId),
      updatedAt: serverTimestamp(),
    });

    return docRef.id;
  } catch (error: any) {
    console.error('Error creating tournament registration:', error);
    throw new Error(`Failed to create registration: ${error.message || 'Unknown error'}`);
  }
}

export async function getTournamentRegistrations(tournamentId: string): Promise<TournamentRegistration[]> {
  try {
    // Query without orderBy to avoid requiring a composite index
    // We'll sort in memory instead
    const snapshot = await getDocs(
      query(
        collection(db, REGISTRATIONS_COLLECTION),
        where('tournamentId', '==', tournamentId)
      )
    );
    const registrations = snapshot.docs.map((docSnap) => fromFirestoreRegistration(docSnap.id, docSnap.data()));
    
    // Sort by registrationDate in memory (descending - newest first)
    return registrations.sort((a, b) => {
      const dateA = a.registrationDate instanceof Date ? a.registrationDate : new Date(a.registrationDate);
      const dateB = b.registrationDate instanceof Date ? b.registrationDate : new Date(b.registrationDate);
      return dateB.getTime() - dateA.getTime();
    });
  } catch (error: any) {
    console.error('Error fetching tournament registrations:', error);
    // Don't throw - return empty array so page still loads
    // The error is logged for debugging
    return [];
  }
}

export async function getUserRegistration(tournamentId: string, userId: string): Promise<TournamentRegistration | null> {
  try {
    const snapshot = await getDocs(
      query(
        collection(db, REGISTRATIONS_COLLECTION),
        where('tournamentId', '==', tournamentId),
        where('userId', '==', userId)
      )
    );
    if (snapshot.empty) {
      return null;
    }
    return fromFirestoreRegistration(snapshot.docs[0].id, snapshot.docs[0].data());
  } catch (error: any) {
    console.error('Error fetching user registration:', error);
    throw new Error(`Failed to fetch registration: ${error.message || 'Unknown error'}`);
  }
}

export async function cancelTournamentRegistration(registrationId: string, tournamentId: string, userId: string): Promise<void> {
  try {
    await updateDoc(doc(db, REGISTRATIONS_COLLECTION, registrationId), {
      status: 'cancelled',
      updatedAt: serverTimestamp(),
    });

    // Also update the event's registeredUsers array for backward compatibility
    await updateDoc(doc(db, EVENTS_COLLECTION, tournamentId), {
      registeredUsers: arrayRemove(userId),
      updatedAt: serverTimestamp(),
    });

    // Update user's registeredEvents array
    await updateDoc(doc(db, USERS_COLLECTION, userId), {
      registeredEvents: arrayRemove(tournamentId),
      updatedAt: serverTimestamp(),
    });
  } catch (error: any) {
    console.error('Error cancelling tournament registration:', error);
    throw new Error(`Failed to cancel registration: ${error.message || 'Unknown error'}`);
  }
}

