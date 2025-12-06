// UPDATED: Chess Tourneys - New role system with Super Admin, Franchisee, Standalone Admin, Player
// UPDATED: Unified event model with add-ons support
export type UserRole = 'player' | 'standaloneAdmin' | 'franchisee' | 'superAdmin' | null;

export interface UserData {
  uid: string;
  email: string;
  role: UserRole;
  savedEvents: string[];
  registeredEvents: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type EventStatus = 'draft' | 'pendingApproval' | 'approved' | 'rejected';
export type EventCategory = 'tournament' | 'event' | 'workshop' | 'simul' | 'other';

// UPDATED: Unified event type system
export type EventType = 'tournament' | 'camp' | 'class' | 'simul' | 'clubNight' | 'other';

// UPDATED: Event Add-On interface for optional paid extras
export interface EventAddOn {
  id: string;              // stable id (uuid or slug)
  name: string;            // e.g. "T-shirt", "Coaching Session", "Lunch"
  description?: string;
  price?: number | null;   // numeric, e.g. in dollars
  isRequired?: boolean;    // if true, always included in registration
  appliesToSections?: string[]; // optional list of section ids where this add-on is applicable (for tournaments)
}

// Tournament Section - for tournaments with multiple rating sections
// Also used as EventSection in unified model
export interface TournamentSection {
  id: string;                // section id (e.g. "open", "u1600")
  name: string;              // "Open", "U1600", etc.
  minRating?: number | null;
  maxRating?: number | null;
  entryFee?: number | null;  // in dollars (or cents, depending on existing price format)
}

// Alias for consistency in unified model
export type EventSection = TournamentSection;

// Pricing tier for multi-tier pricing support
export interface PricingTier {
  id: string;
  name: string;              // e.g., "Early Bird", "Standard", "Late Registration"
  price: number;              // required price in dollars
  description?: string;       // optional description
}

export interface EventData {
  id?: string;
  title: string;
  name?: string;              // UPDATED: Unified name field (maps to title for backward compatibility)
  date: string;
  time?: string; // e.g., "10:00 AM - 5:00 PM" or "9:00 AM"
  location: string;
  price: string;
  description?: string;
  image?: string;
  category: EventCategory; // Tournament, Event, Workshop, Simul, or Other
  contactEmail?: string; // Contact email for the event
  contactPhone?: string; // Contact phone for the event
  createdBy: string;
  createdByEmail: string;
  status: EventStatus;
  registeredUsers: string[];
  savedByUsers: string[];
  approvedBy?: string;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  // Tournament-specific fields (only populated when category === 'tournament')
  venue?: string;                    // Standardized venue field (preferred over location for tournaments)
  startDate?: Date | string;         // Standardized start date (preferred over date for tournaments)
  endDate?: Date | string;           // Standardized end date
  startTime?: string;                // Start time (e.g., "09:00" or "09:00 AM")
  endTime?: string;                  // End time (e.g., "17:00" or "5:00 PM")
  timeControl?: string;              // Time control type: "Classical", "Rapid", "Blitz"
  sections?: TournamentSection[];    // Tournament sections array
  // UPDATED: Add-ons support (for backward compatibility, optional in EventData)
  addOns?: EventAddOn[];
  // UPDATED: Multi-tier pricing support
  pricingTiers?: PricingTier[];
  // UPDATED: Unified type field (maps to category for backward compatibility)
  type?: EventType;
  // NEW: Franchise tracking for Chess Tourneys
  franchiseId?: string | null;  // UID of the franchisee user, or null for standalone events
  isStandalone?: boolean;        // Computed: true if franchiseId is null/undefined
}

// UPDATED: Unified ChessEvent interface - the new standard model
// This extends EventData concepts but uses a cleaner structure
export interface ChessEvent {
  id: string;                  // doc id
  type: EventType;             // "tournament" or other
  name: string;                // unified name field (maps to title in EventData)
  description: string;
  venue: string;               // unified venue field (preferred over location)
  startDate: Date | string | any; // Firestore Timestamp or Date
  endDate: Date | string | any;   // Firestore Timestamp or Date
  startTime?: string;          // Start time (e.g., "09:00" or "09:00 AM")
  endTime?: string;            // End time (e.g., "17:00" or "5:00 PM")
  timeControl?: string;        // required for tournaments, optional for others
  status: EventStatus;

  // Tournament-specific
  sections: EventSection[];    // can be [] for non-tournament events

  // Pricing
  pricingTiers?: PricingTier[]; // Multi-tier pricing (e.g., Early Bird, Standard, Late)

  // Add-ons
  addOns: EventAddOn[];        // [] if no add-ons

  // audit/ownership
  createdBy: string;           // uid
  createdByEmail?: string;     // email for display
  createdAt: Date | any;       // Firestore Timestamp or Date
  updatedAt?: Date | any;      // Firestore Timestamp or Date
  approvedBy?: string | null;
  approvedAt?: Date | any | null;

  // Legacy fields for backward compatibility (optional)
  title?: string;              // maps to name
  date?: string;               // legacy date field
  location?: string;           // legacy location (maps to venue)
  price?: string;              // legacy price field
  time?: string;               // legacy time field
  image?: string;              // image URL
  contactEmail?: string;
  contactPhone?: string;
  registeredUsers?: string[];
  savedByUsers?: string[];
  category?: EventCategory;   // maps to type
  // NEW: Franchise tracking for Chess Tourneys
  franchiseId?: string | null;  // UID of the franchisee user, or null for standalone events
  isStandalone?: boolean;        // Computed: true if franchiseId is null/undefined
}

