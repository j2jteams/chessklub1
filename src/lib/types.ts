// UPDATED: Chess Tourneys - New role system with Super Admin, Franchisee, Standalone Admin, Player
// UPDATED: Unified event model with add-ons support
export type UserRole = 'player' | 'standaloneAdmin' | 'franchisee' | 'superAdmin' | null;

export interface USCFRatings {
  // Standard Ratings
  regular?: string;
  regularFloor?: string;
  quick?: string;
  quickFloor?: string;
  blitz?: string;
  blitzFloor?: string;
  
  // Online Ratings
  onlineRegular?: string;
  onlineRegularGames?: string;
  onlineRegularFloor?: string;
  onlineQuick?: string;
  onlineQuickFloor?: string;
  onlineBlitz?: string;
  onlineBlitzFloor?: string;
  
  // Rankings
  overallRank?: string;
  overallTotal?: string;
  overallPercentile?: string;
  stateRank?: string;
  stateTotal?: string;
  statePercentile?: string;
  stateName?: string;
  
  // Membership Info
  membershipId?: string;
  status?: string;
  gender?: string;
  expires?: string;
  updated?: string;
  fideId?: string;
  fideCountry?: string;
  
  // Metadata
  lastSynced?: Date;
}

export interface UserData {
  uid: string;
  email: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  uscfId?: string; // Optional USCF ID for players
  uscfRatings?: USCFRatings; // USCF ratings and profile data
  franchiseId?: string | null; // Optional franchise ID for admins/franchisees
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

// Tournament Registration interface for detailed player registration
export interface TournamentRegistration {
  id: string;                    // Registration ID
  tournamentId: string;          // Event ID
  userId: string;                // Player UID
  userEmail: string;             // Player email
  displayName: string;           // Player name
  phoneNumber?: string;           // Player phone number
  sectionId?: string;            // Selected section (if applicable)
  fideId?: string;              // Player's FIDE ID
  fideRating?: number;          // Current FIDE rating
  nationalFederationId?: string; // USCF, ELO, etc.
  nationalRating?: number;      // National rating
  registrationDate: Date | string;        // When they registered
  status: 'pending' | 'confirmed' | 'cancelled';
  paymentStatus?: 'pending' | 'paid' | 'refunded';
  selectedAddOns?: string[];     // Array of add-on IDs
  notes?: string;               // Additional notes from player
}

// Pricing tier for multi-tier pricing support
export interface PricingTier {
  id: string;
  name: string;              // e.g., "Early Bird", "Standard", "Late Registration"
  price: number;              // required price in dollars
  description?: string;       // optional description
}

export interface TimeControl {
  category: "Classical" | "Rapid" | "Blitz" | "Other";
  format?: string;            // e.g. "60+5", "25+5", "G/30; d5"
  customLabel?: string;        // e.g. "Club Rapid", "Holiday Blitz"
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
  timeControl?: TimeControl | string; // Time control object (new) or string (legacy)
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
  // NEW: Global tournament search fields
  country?: string;              // e.g., "USA", "India", "Germany"
  city?: string;                 // e.g., "New York", "Mumbai", "Berlin"
  region?: string;               // e.g., "North America", "Europe", "Asia"
  coordinates?: {                // For map integration
    lat: number;
    lng: number;
  };
  tournamentLevel?: string;       // "Local", "Regional", "National", "International"
  fideRated?: boolean;           // Is this FIDE-rated? (legacy field)
  ratingType?: 'FIDE' | 'USCF' | 'Club' | null; // Rating type for the tournament
  maxPlayers?: number;           // Tournament capacity
  registrationDeadline?: Date | string; // Registration deadline
  minRating?: number;            // Minimum rating requirement (tournament-wide)
  maxRating?: number;            // Maximum rating requirement (tournament-wide)
  prizeFund?: number;            // Prize money
  prizeCurrency?: string;        // "USD", "EUR", "INR", etc.
  // Additional UI/display fields
  heroImageUrl?: string;        // Hero image URL for tournament detail page
  venueType?: 'Online' | 'In-person' | string; // Venue type for display
  address?: string;             // Full address for in-person events
  tags?: string[];               // Tags for badges (e.g., 'rated', 'scholastic')
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
  timeControl?: TimeControl | string; // Time control object (new) or string (legacy)
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
  // NEW: Global tournament search fields
  country?: string;              // e.g., "USA", "India", "Germany"
  city?: string;                 // e.g., "New York", "Mumbai", "Berlin"
  region?: string;               // e.g., "North America", "Europe", "Asia"
  coordinates?: {                // For map integration
    lat: number;
    lng: number;
  };
  tournamentLevel?: string;       // "Local", "Regional", "National", "International"
  fideRated?: boolean;           // Is this FIDE-rated? (legacy field)
  ratingType?: 'FIDE' | 'USCF' | 'Club' | null; // Rating type for the tournament
  maxPlayers?: number;           // Tournament capacity
  registrationDeadline?: Date | string; // Registration deadline
  minRating?: number;            // Minimum rating requirement (tournament-wide)
  maxRating?: number;            // Maximum rating requirement (tournament-wide)
  prizeFund?: number;            // Prize money
  prizeCurrency?: string;        // "USD", "EUR", "INR", etc.
  // Additional UI/display fields
  heroImageUrl?: string;        // Hero image URL for tournament detail page
  venueType?: 'Online' | 'In-person' | string; // Venue type for display
  address?: string;             // Full address for in-person events
  ageLimit?: string;            // Age limit (e.g., "All ages", "18+")
  equipmentProvided?: string;   // Equipment information (e.g., "All chess sets provided")
}

