# ChessTourneys – Current Implementation Overview (As-Is)

**Generated:** December 25, 2025  
**Codebase Version:** Synced with remote (commit 6aa7533) + local changes

---

## 1) Project Architecture (High Level)

### Framework/Routing
- **Framework:** Next.js 16.0.7 (App Router architecture)
- **Routing:** File-based routing using `src/app/` directory structure
- **Evidence:** `package.json` (Next.js 16.0.7), `src/app/` directory structure with `page.tsx` files

### State Management
- **Approach:** React hooks (`useState`, `useEffect`, `useMemo`, `useCallback`) - no external state management library
- **Client-side storage:** `localStorage` for location preferences (`lastLocationContext` key)
- **Evidence:** All components use React hooks; `src/lib/locationContext.ts` uses `localStorage`

### Data Layer
- **Database:** Firebase Firestore (NoSQL)
- **Collections:**
  - `events` - Main tournament/event documents
  - `users` - User profiles and roles
  - `tournamentRegistrations` - Player registrations for tournaments
  - `adminRequests` - Admin role requests
  - `playerRatings` - User rating data (USCF, FIDE, LiChess)
- **Evidence:** `src/lib/events.ts` lines 22-24, `firestore.rules` collection definitions

### Auth Approach
- **Provider:** Firebase Authentication
- **Methods:** Email/password (implied from login page)
- **Role system:** Stored in Firestore `users` collection (`role` field: `'player' | 'standaloneAdmin' | 'franchisee' | 'superAdmin'`)
- **Evidence:** `src/lib/firebase.ts` exports `auth`, `src/hooks/useAuth.ts` uses `onAuthStateChanged`, `src/lib/types.ts` line 3 defines `UserRole`

### Deployment/Hosting
- **Platform:** Firebase App Hosting
- **Config:** `apphosting.yaml` with Cloud Run backend configuration
- **Environment variables:** Stored as Firebase Secrets (mapped in `apphosting.yaml`)
- **Evidence:** `apphosting.yaml` file exists with `runConfig` and `env` sections

---

## 2) Core Collections & Data Model (As Implemented)

### Firestore Collections

**Collection: `events`**
- **Constant:** `EVENTS_COLLECTION = 'events'` (defined in `src/lib/events.ts:22`)

**Collection: `users`**
- **Constant:** `USERS_COLLECTION = 'users'` (defined in `src/lib/events.ts:23`)

**Collection: `tournamentRegistrations`**
- **Constant:** `REGISTRATIONS_COLLECTION = 'tournamentRegistrations'` (defined in `src/lib/events.ts:24`)

**Collection: `adminRequests`**
- **Constant:** `ADMIN_REQUESTS_COLLECTION = 'adminRequests'` (referenced in `src/lib/adminRequests.ts`)

**Collection: `playerRatings`**
- Referenced in `firestore.rules:146` and `src/lib/userRoles.ts`

### Event/Tournament Document Schema

**Primary Interface:** `EventData` (defined in `src/lib/types.ts:208-273`)

**Core Fields (Always Present):**
| Field | Type | Set In | Read In |
|-------|------|--------|---------|
| `id` | `string` | Auto (doc ID) | `fromFirestoreEvent()` (`src/lib/events.ts:28`) |
| `title` | `string` | `createEvent()` (`src/lib/events.ts:192`), `ChessEventForm` (`src/components/admin/ChessEventForm.tsx:654`) | `fromFirestoreEvent()` (`src/lib/events.ts:92`) |
| `name` | `string` | `ChessEventForm` (`src/components/admin/ChessEventForm.tsx:655`) | `fromFirestoreEvent()` (`src/lib/events.ts:93`) |
| `date` | `string` | `createEvent()` (`src/lib/events.ts:193`), `ChessEventForm` (`src/components/admin/ChessEventForm.tsx:662`) | `fromFirestoreEvent()` (`src/lib/events.ts:94`) |
| `location` | `string` | `createEvent()` (`src/lib/events.ts:194`), `ChessEventForm` (`src/components/admin/ChessEventForm.tsx:658`) | `fromFirestoreEvent()` (`src/lib/events.ts:96`) |
| `price` | `string` | `createEvent()` (`src/lib/events.ts:195`), `ChessEventForm` (`src/components/admin/ChessEventForm.tsx:671-673`) | `fromFirestoreEvent()` (`src/lib/events.ts:97`) |
| `category` | `EventCategory`` | `createEvent()` (`src/lib/events.ts:196`), `ChessEventForm` (`src/components/admin/ChessEventForm.tsx:663`) | `fromFirestoreEvent()` (`src/lib/events.ts:100`) |
| `status` | `EventStatus` | `createEvent()` (`src/lib/events.ts:199`) | `fromFirestoreEvent()` (`src/lib/events.ts:105`) |
| `createdBy` | `string` | `createEvent()` (`src/lib/events.ts:197`), `ChessEventForm` (`src/components/admin/ChessEventForm.tsx:665`) | `fromFirestoreEvent()` (`src/lib/events.ts:103`) |
| `createdByEmail` | `string` | `createEvent()` (`src/lib/events.ts:198`), `ChessEventForm` (`src/components/admin/ChessEventForm.tsx:666`) | `fromFirestoreEvent()` (`src/lib/events.ts:104`) |
| `createdAt` | `Timestamp` | `createEvent()` (`src/lib/events.ts:202`) | `fromFirestoreEvent()` (`src/lib/events.ts:110`) |
| `updatedAt` | `Timestamp` | `createEvent()` (`src/lib/events.ts:203`) | `fromFirestoreEvent()` (`src/lib/events.ts:111`) |
| `registeredUsers` | `string[]` | `createEvent()` (`src/lib/events.ts:200`), `ChessEventForm` (`src/components/admin/ChessEventForm.tsx:668`) | `fromFirestoreEvent()` (`src/lib/events.ts:106`) |
| `savedByUsers` | `string[]` | `createEvent()` (`src/lib/events.ts:201`), `ChessEventForm` (`src/components/admin/ChessEventForm.tsx:669`) | `fromFirestoreEvent()` (`src/lib/events.ts:107`) |

**Tournament-Specific Fields (Conditional):**
| Field | Type | Set In | Read In |
|-------|------|--------|---------|
| `venue` | `string` | `createEvent()` (`src/lib/events.ts:233-237`), `ChessEventForm` (`src/components/admin/ChessEventForm.tsx:657`) | `fromFirestoreEvent()` (`src/lib/events.ts:113`) |
| `startDate` | `Timestamp` | `createEvent()` (`src/lib/events.ts:241-250`), `ChessEventForm` (`src/components/admin/ChessEventForm.tsx:660`) | `fromFirestoreEvent()` (`src/lib/events.ts:39-48, 114`) |
| `endDate` | `Timestamp` | `createEvent()` (`src/lib/events.ts:253-262`), `ChessEventForm` (`src/components/admin/ChessEventForm.tsx:661`) | `fromFirestoreEvent()` (`src/lib/events.ts:50-59, 115`) |
| `startTime` | `string` | `createEvent()` (`src/lib/events.ts:281-286`), `ChessEventForm` (`src/components/admin/ChessEventForm.tsx:677-678`) | `fromFirestoreEvent()` (`src/lib/events.ts:116`) |
| `endTime` | `string` | `createEvent()` (`src/lib/events.ts:287-292`), `ChessEventForm` (`src/components/admin/ChessEventForm.tsx:680-681`) | `fromFirestoreEvent()` (`src/lib/events.ts:117`) |
| `timeControl` | `TimeControl` object or `string` | `createEvent()` (`src/lib/events.ts:265-273`), `ChessEventForm` (`src/components/admin/ChessEventForm.tsx:695-708`) | `fromFirestoreEvent()` (`src/lib/events.ts:119-130`) |
| `sections` | `TournamentSection[]` | `createEvent()` (`src/lib/events.ts:295-303`), `ChessEventForm` (`src/components/admin/ChessEventForm.tsx:761-769`) | `fromFirestoreEvent()` (`src/lib/events.ts:62-71, 131`) |
| `ratingType` | `'FIDE' \| 'USCF' \| 'Club'` | `ChessEventForm` (`src/components/admin/ChessEventForm.tsx:711-717`) | `fromFirestoreEvent()` - not explicitly mapped (available via `data.ratingType`) |
| `fideRated` | `boolean` | `ChessEventForm` (`src/components/admin/ChessEventForm.tsx:714-716`) | `fromFirestoreEvent()` - not explicitly mapped (available via `data.fideRated`) |

**Location Fields:**
| Field | Type | Set In | Read In |
|-------|------|--------|---------|
| `structuredLocation` | `EventLocation` object | `ChessEventForm` (`src/components/admin/ChessEventForm.tsx:659`) via `normalizeLocation()` | `fromFirestoreEvent()` - not explicitly mapped (available via `data.structuredLocation`) |
| `structuredLocation.countryCode` | `string` (ISO-2) | `normalizeLocation()` (`src/lib/locationNormalizer.ts:77`), `ChessEventForm` (`src/components/admin/ChessEventForm.tsx:635`) | `tournamentSearch.ts:40` (filtering), `tournamentHelpers.ts:123` (price matching) |
| `coordinates` | `{ lat: number, lng: number }` | `ChessEventForm` (`src/components/admin/ChessEventForm.tsx:740-745`) | `fromFirestoreEvent()` - not explicitly mapped |
| `country` | `string` | Not set in current create flow (legacy field) | `tournamentSearch.ts:39, 41` (filtering) |
| `city` | `string` | Not set in current create flow (legacy field) | `tournamentSearch.ts:21, 163` (filtering) |

**Pricing Fields:**
| Field | Type | Set In | Read In |
|-------|------|--------|---------|
| `pricingTiers` | `PricingTier[]` | `ChessEventForm` (`src/components/admin/ChessEventForm.tsx:749-758`) | `fromFirestoreEvent()` - not explicitly mapped (available via `data.pricingTiers`) |
| `pricingTiers[].countryCode` | `string` (ISO-2) | `ChessEventForm` (`src/components/admin/ChessEventForm.tsx:755`) | `tournamentHelpers.ts:129-131` (price matching) |
| `pricingTiers[].currency` | `string` | `ChessEventForm` (`src/components/admin/ChessEventForm.tsx:756`) | `tournamentHelpers.ts:135` (display) |
| `pricingTiers[].price` | `number` | `ChessEventForm` (`src/components/admin/ChessEventForm.tsx:753`) | `tournamentHelpers.ts:134` (display) |
| `sections[].entryFee` | `number \| null` | `ChessEventForm` (`src/components/admin/ChessEventForm.tsx:767`) - always set to `null` | `tournamentHelpers.ts:154-160` (price fallback) |

**Image/Flyer Fields:**
| Field | Type | Set In | Read In |
|-------|------|--------|---------|
| `image` | `string` (URL) | `createEvent()` (`src/lib/events.ts:218-220`), `ChessEventForm` (`src/components/admin/ChessEventForm.tsx:720-723`) | `fromFirestoreEvent()` (`src/lib/events.ts:99`) |
| `heroImageUrl` | `string` (URL) | `ChessEventForm` (`src/components/admin/ChessEventForm.tsx:722`) | `fromFirestoreEvent()` - not explicitly mapped |

**Metadata Fields:**
| Field | Type | Set In | Read In |
|-------|------|--------|---------|
| `franchiseId` | `string \| null` | `createEvent()` (`src/lib/events.ts:207-209`), `ChessEventForm` (`src/components/admin/ChessEventForm.tsx:602-621`) | `fromFirestoreEvent()` (`src/lib/events.ts:87-88, 137-138`) |
| `approvedBy` | `string` | `approveEvent()` (`src/lib/events.ts:733`) | `fromFirestoreEvent()` (`src/lib/events.ts:108`) |
| `approvedAt` | `Timestamp` | `approveEvent()` (`src/lib/events.ts:733`) | `fromFirestoreEvent()` (`src/lib/events.ts:109`) |

**Optional Fields:**
| Field | Type | Set In | Read In |
|-------|------|--------|---------|
| `description` | `string` | `createEvent()` (`src/lib/events.ts:215-217`), `ChessEventForm` (`src/components/admin/ChessEventForm.tsx:656`) | `fromFirestoreEvent()` (`src/lib/events.ts:98`) |
| `time` | `string` | `createEvent()` (`src/lib/events.ts:212-214`), `ChessEventForm` (`src/components/admin/ChessEventForm.tsx:688-692`) | `fromFirestoreEvent()` (`src/lib/events.ts:95`) |
| `contactEmail` | `string` | `createEvent()` (`src/lib/events.ts:221-223`), `ChessEventForm` (`src/components/admin/ChessEventForm.tsx:724-726`) | `fromFirestoreEvent()` (`src/lib/events.ts:101`) |
| `contactPhone` | `string` | `createEvent()` (`src/lib/events.ts:224-226`), `ChessEventForm` (`src/components/admin/ChessEventForm.tsx:727-729`) | `fromFirestoreEvent()` (`src/lib/events.ts:102`) |
| `addOns` | `EventAddOn[]` | `createEvent()` (`src/lib/events.ts:307-316`), `ChessEventForm` (`src/components/admin/ChessEventForm.tsx:772-781`) | `fromFirestoreEvent()` (`src/lib/events.ts:74-84, 133`) |
| `type` | `EventType` | `createEvent()` (`src/lib/events.ts:319-323`), `ChessEventForm` (`src/components/admin/ChessEventForm.tsx:664`) | `fromFirestoreEvent()` (`src/lib/events.ts:135`) |

---

## 3) Admin/Organizer Flow (Create/Edit)

### Component: `ChessEventForm`
**File:** `src/components/admin/ChessEventForm.tsx`

### Create Flow

**1. Form State Initialization**
- **Location:** `src/components/admin/ChessEventForm.tsx:39-72`
- **State object:** `formData` includes all form fields including:
  - `locationCountryCode: ''` (line 70) - ISO-2 country code from autocomplete
  - `pricingTiers: []` (line 54) - Array of `PricingTier` objects
  - `timeControlCategory`, `timeControlFormat`, `timeControlCustomLabel` (lines 50-52)
  - `ratingType: ''` (line 53)

**2. Location Input & Normalization**
- **Component:** `LocationAutocomplete` (`src/components/admin/LocationAutocomplete.tsx`)
- **Behavior:**
  - Uses Google Places API for autocomplete (if API key present)
  - Falls back to manual input if API key missing
  - On place selection, calls `onPlaceSelect` callback with `{ placeId, coordinates, formattedAddress, addressComponents }`
- **Normalization:** `normalizeLocation()` (`src/lib/locationNormalizer.ts:55-119`)
  - Input: `LocationFormData` (includes `countryCode`, `autocompleteResult`)
  - Output: `EventLocation` object with:
    - `countryCode` (ISO-2) extracted from `formData.countryCode` or `autocompleteResult.addressComponents`
    - `geo: { latitude, longitude }` from `autocompleteResult.coordinates`
    - `geohash` computed via `ngeohash.encode()` (precision 9)
    - `timezone` estimated from coordinates/country
    - `regionTag` computed from coordinates/country
- **Set in form:** `src/components/admin/ChessEventForm.tsx:624-649`
  - Calls `normalizeLocation()` with form data
  - Stores result in `eventData.structuredLocation`

**3. Country ISO-2 Handling**
- **Input method:** 
  - Primary: Google Places autocomplete extracts country code from `addressComponents` (type: `"country"`, `short_name` is ISO-2)
  - Fallback: Manual entry via `locationCountryCode` field (line 70)
- **Normalization:** 
  - `normalizeLocation()` accepts `countryCode` as string (line 77)
  - No explicit uppercase/trim validation in normalization function
  - Country code stored as-is from autocomplete or form input
- **Validation:** 
  - No explicit ISO-2 format validation found in code
  - Country code can be any string (including empty)
- **Storage:** Stored in `structuredLocation.countryCode` field

**4. Currency Handling**
- **Input:** Dropdown in `ChessEventForm` (`src/components/admin/ChessEventForm.tsx:1365-1409`)
  - Dropdown options: USD, INR, EUR, GBP, CAD, AUD, JPY, CNY, KRW, BRL, MXN, ARS, ZAR, TRY, RUB, SGD, HKD, NZD, CHF, SEK, NOK, DKK, PLN, CZK, HUF, THB, MYR, IDR, PHP, VND, PKR, BDT, AED, SAR, EGP, NGN
  - Default: `'USD'` (line 303)
- **Storage:** 
  - Stored in `pricingTiers[].currency` field (line 756)
  - Defaults to `'USD'` if not provided (line 756: `tier.currency || 'USD'`)
- **Symbol derivation:** 
  - `formatPrice()` function (`src/lib/tournamentHelpers.ts:67-113`)
  - Maps currency code to symbol via `currencySymbols` object (lines 72-109)
  - Fallback: uses currency code as symbol if not in map (line 111)

**5. Pricing Tier Creation**
- **UI:** `src/components/admin/ChessEventForm.tsx:1325-1425`
- **Fields per tier:**
  - `name` (required) - e.g., "Early Bird", "Standard"
  - `price` (required, number) - numeric value
  - `currency` (dropdown, default USD) - currency code
  - `countryCode` (optional) - ISO-2 code via dropdown or manual input
  - `description` (optional) - text description
- **Country selection:**
  - Dropdown with common countries (lines 1396-1410)
  - Manual input field for ISO-2 code (lines 1417-1425)
  - Input is uppercased on change: `e.target.value.toUpperCase()` (line 1419)
  - Max length: 2 characters (line 1422)
- **Storage:** 
  - `updatePricingTier()` handles field updates (lines 316-338)
  - Saved to Firestore in `pricingTiers` array (lines 749-758)

**6. Form Submission Payload**
- **Location:** `src/components/admin/ChessEventForm.tsx:651-787`
- **Key payload structure:**
```typescript
{
  title: string,              // from formData.name
  name: string,               // from formData.name
  description: string,
  venue: string,
  location: string,            // from formData.venue (legacy)
  structuredLocation: EventLocation | undefined,  // normalized location
  startDate: Timestamp,       // from formData.startDate
  endDate: Timestamp,         // from formData.endDate
  date: string,               // legacy field (YYYY-MM-DD)
  category: 'tournament' | 'event',
  type: EventType,
  createdBy: string,          // user.uid
  createdByEmail: string,     // user.email
  status: 'pendingApproval',  // overridden by createEvent() based on role
  registeredUsers: [],
  savedByUsers: [],
  price: string,              // legacy: "$X.XX" format from first pricing tier
  pricingTiers: PricingTier[], // [{ id, name, price, currency, countryCode?, description? }]
  timeControl: TimeControl,   // { category, format, customLabel? }
  ratingType: 'FIDE' | 'USCF' | 'Club' | null,
  sections: TournamentSection[], // [{ id, name, minRating?, maxRating?, entryFee: null }]
  addOns: EventAddOn[],       // [{ id, name, description?, price?, isRequired, appliesToSections }]
  // ... other optional fields
}
```

**7. Firestore Write**
- **Function:** `createEvent()` (`src/lib/events.ts:142-341`)
- **Role-based status logic:**
  - Super Admin: `status = 'approved'` (line 159)
  - Franchisee: `status = 'approved'` if franchise event, `'pendingApproval'` if standalone (lines 161-173)
  - Standalone Admin: `status = 'approved'` if standalone event, `'pendingApproval'` if franchise event (lines 174-186)
- **Write operation:** `addDoc(collection(db, EVENTS_COLLECTION), eventData)` (line 325)
- **Returns:** Document ID (line 326)

### Edit Flow
- **Component:** Same `ChessEventForm` with `mode='edit'` prop
- **Initialization:** `src/components/admin/ChessEventForm.tsx:102-242`
  - Loads `initialData` (ChessEvent object)
  - Populates form state from existing event
  - Parses `pricingTiers` from `initialData.pricingTiers` or creates from legacy `price` field (lines 161-177)
  - Populates structured location fields from `initialData.structuredLocation` (lines 238-241)
- **Update operation:** `updateEvent()` (`src/lib/events.ts:342-557`)
  - Validates permissions (lines 344-360)
  - Uses `updateDoc()` to update specific fields (line 554)

---

## 4) Public/User Flow (Read/Display)

### Tournament Listing Pages

**Page: `/tournaments`**
- **File:** `src/app/tournaments/page.tsx`
- **Query:** `getApprovedEvents()` (non-superAdmin) or `getAllEvents()` (superAdmin)
  - **Function:** `src/lib/events.ts:610-615`
  - **Query:** `query(collection(db, EVENTS_COLLECTION), where('status', '==', 'approved'), orderBy('createdAt', 'desc'))`
  - **No pagination:** Fetches all approved events
- **Client-side filtering:** 
  - `basicFiltered` (lines 216-260): Filters by date (excludes finished events)
  - `locationFiltered` (lines 275-348): Applies location-based filtering via `progressiveRadiusExpansion()`
  - `filteredTournaments` (lines 347-363): Applies search query and filter criteria via `filterTournaments()`
- **Sorting:** `sortedTournaments` (lines 356-410)
  - Default: `'soonest'` (by `startDate`)
  - With location context: Distance-first, then `startDate`
  - Other options: `'newest'`, `'price-low'`, `'price-high'`

**Page: `/all`**
- **File:** `src/app/all/page.tsx`
- **Query:** Same as `/tournaments` (uses `getApprovedEvents()` or `getAllEvents()`)

**Page: `/events`**
- **File:** `src/app/events/page.tsx`
- **Query:** Same as `/tournaments`

**Page: `/` (Landing)**
- **File:** `src/app/page.tsx`
- **Query:** `getApprovedEvents()` (line 63)
- **Display:** Featured tournaments carousel + Upcoming tournaments grid

### Tournament Detail Page

**Page: `/events/[id]`**
- **File:** `src/app/events/[id]/page.tsx`
- **Query:** `getEvent(eventId)` (`src/lib/events.ts:562-605`)
  - **Function:** `getDoc(doc(db, EVENTS_COLLECTION, eventId))`
  - **Returns:** Single `EventData` object or `null`
- **Components:**
  - `TournamentOverviewCard` - Main tournament info
  - `PriceSection` - Displays pricing tiers
  - `EventDetailsCard` - Date, location, time control
  - `RegisteredPlayersSection` - List of registrations
  - `RegisterPanel` - Registration UI

### Price Display Logic

**Function:** `getTournamentPrice()` (`src/lib/tournamentHelpers.ts:121-177`)
- **Input:** `tournament: EventData`, optional `countryCode?: string`
- **Logic:**
  1. Check `pricingTiers` array
  2. If `countryCode` provided, find matching tier with `tier.countryCode === countryCode` (case-insensitive, lines 129-138)
  3. Fallback to global tier (no `countryCode`) or first tier (lines 142-149)
  4. Fallback to `sections[].entryFee` (minimum fee, lines 153-161)
  5. Fallback to legacy `price` field (lines 165-173)
- **Returns:** `{ price: number, currency: string, tier?: PricingTier } | null`

**Function:** `formatPrice()` (`src/lib/tournamentHelpers.ts:67-113`)
- **Input:** `price: number | null | undefined`, `currency: string = 'USD'`
- **Logic:**
  - Returns `'Free'` if price is null/undefined/0 (line 68-70)
  - Maps currency code to symbol via `currencySymbols` object (lines 72-109)
  - Format: `${symbol}${price.toFixed(0)}` (line 112)
- **Used in:** `TournamentCard` components, `PriceSection` component

**Country Display:**
- **Location:** Tournament cards show location via `tournament.venue || tournament.location`
- **Country code:** Not directly displayed in UI, used for filtering/matching only

---

## 5) Search / Filter / Matching Logic

### File: `src/lib/tournamentSearch.ts`

### Function: `filterTournaments()`
**Signature:** `filterTournaments(tournaments: EventData[], searchQuery: string, filters: TournamentFilters): EventData[]`

**Inputs:**
- `tournaments`: Array of `EventData` objects (already fetched from Firestore)
- `searchQuery`: String (user search input)
- `filters`: `TournamentFilters` object with:
  - `countries: string[]`
  - `cities: string[]`
  - `dateRange: { start: string, end: string }`
  - `minRating: number | null`
  - `maxRating: number | null`
  - `ratingTypes: ('FIDE' | 'USCF' | 'Club')[]`
  - `timeControls: string[]`
  - `tournamentLevels: string[]`
  - `priceRange: { min: number | null, max: number | null }`
  - `fideRatedOnly: boolean`
  - `hasPrizeFund: boolean`
  - `registrationOpen: boolean`

**Country Matching Logic** (`src/lib/tournamentSearch.ts:36-158`):

1. **Primary check:** `structuredLocation.countryCode` (line 40)
   - Extracts `tournament.structuredLocation?.countryCode?.toUpperCase()` (line 40)
   - Direct ISO-2 match: `structuredCountryCode === countryUpper` (line 51)
   - Name-to-code mapping: Maps filter country name (e.g., "India") to ISO-2 code (e.g., "IN") via `countryNameToCode` object (lines 56-101)
   - If filter is 2-letter code, direct match (lines 108-111)

2. **Fallback checks:**
   - Legacy `tournament.country` field (string match, lines 115-121)
   - `tournament.location` or `tournament.venue` fields (contains match, lines 123-126)
   - Country variations (e.g., "India" → ["in", "bharat", "hindustan"], lines 129-153)

3. **Matching behavior:**
   - Uses `.some()` - tournament matches if ANY filter country matches (line 44)
   - Case-insensitive matching (all comparisons use `.toLowerCase()` or `.toUpperCase()`)

**Filter Combination:**
- **Logic:** AND (all filters must pass)
- **Order:** Search query → Country → City → Date → Rating → Rating Type → Time Control → Tournament Level → Price → FIDE Rated → Prize Fund → Registration Open
- **Evidence:** Sequential `filtered.filter()` calls (lines 15-379)

**Sorting/Ranking:**
- **Not in `filterTournaments()`:** Sorting happens in page components
- **In `/tournaments` page:** `sortedTournaments` useMemo (lines 356-410)
  - With location context: Distance-first, then `startDate`
  - Without location: By `startDate`, `createdAt`, or price

**Assumptions/Missing Handling:**
- No validation that `countryCode` is valid ISO-2 format
- Country name-to-code mapping is incomplete (only ~30 countries mapped)
- If filter country name doesn't match any mapping, falls back to string matching (may produce false positives)

---

## 6) Roles, Permissions, and Approval Flow

### Role System

**Roles Defined:** `UserRole = 'player' | 'standaloneAdmin' | 'franchisee' | 'superAdmin' | null`
- **Source:** `src/lib/types.ts:3`

**Storage:**
- **Collection:** `users`
- **Field:** `role` (string)
- **Set:** `createUserDocument()` (`src/lib/userRoles.ts:47-84`), `updateUserRole()` (admin only)

**Enforcement:**

**1. Firestore Security Rules** (`firestore.rules`):
- **Read events:** Public can read `status == 'approved'` only; admins can read all (lines 90-92)
- **Create events:** `canManageEvents()` - Super Admin, Franchisee, or Standalone Admin (line 96)
- **Update events:** `canUpdateEvent()` - Super Admin can update any; Franchisee can update `franchiseId == uid`; Standalone Admin can update `createdBy == uid` (lines 44-54, 104-116)
- **Delete events:** Same as update (line 123)

**2. Route Guards:**
- **Admin pages:** `/admin/events/create`, `/admin/events/edit/[id]`
- **Enforcement:** Not found in codebase (likely handled by redirect in layout or component)

**3. UI Guards:**
- **"Post a Tournament" button:** `src/components/Header.tsx:336` - Links to `/admin/events/create` if user exists, `/login` otherwise
- **Delete button:** Only shown to superAdmin in tournament cards (`src/components/tournament/TournamentCard.tsx` - `isSuperAdmin` prop)

### Approval Workflow

**Status Transitions:**
- **Draft:** Not explicitly used in current code
- **Pending Approval:** Set when:
  - Franchisee creates standalone event (`src/lib/events.ts:166`)
  - Standalone Admin creates franchise event (`src/lib/events.ts:179`)
- **Approved:** Set when:
  - Super Admin creates any event (`src/lib/events.ts:159`)
  - Franchisee creates franchise event (`src/lib/events.ts:170`)
  - Standalone Admin creates standalone event (`src/lib/events.ts:184`)
  - `approveEvent()` function called (`src/lib/events.ts:733`)
- **Rejected:** Set via `rejectEvent()` function (`src/lib/events.ts:783`)

**Approval Functions:**
- **`approveEvent()`:** `src/lib/events.ts:733-738`
  - Sets `status = 'approved'`
  - Sets `approvedBy = editorUid`
  - Sets `approvedAt = serverTimestamp()`
- **`rejectEvent()`:** `src/lib/events.ts:783-789`
  - Sets `status = 'rejected'`
  - Sets `approvedBy = editorUid`

**Approval UI:**
- **Location:** Super Admin dashboard (`src/app/dashboard/super-admin/page.tsx`)
- **Functionality:** Lists pending events, provides approve/reject buttons

---

## 7) Feature Inventory (What Exists Today)

### Auth
- **File:** `src/app/login/page.tsx`, `src/hooks/useAuth.ts`
- **How it works:** Firebase Auth with `onAuthStateChanged` listener; user profile fetched from Firestore `users` collection
- **Evidence:** `useAuth()` hook returns `{ user, profile, role, loading }`

### Create/Edit Tournament
- **File:** `src/components/admin/ChessEventForm.tsx`
- **Routes:** `/admin/events/create`, `/admin/events/edit/[id]`
- **How it works:** Form component with state management; on submit, calls `createEvent()` or `updateEvent()`; supports structured location, pricing tiers, sections, add-ons
- **Evidence:** Form handles all tournament fields, location autocomplete, image upload

### Delete Tournament
- **File:** `src/lib/events.ts:558-560`
- **Function:** `deleteEvent(eventId: string, editorUid: string)`
- **How it works:** Calls `deleteDoc()` on event document; validates permissions via Firestore rules
- **Evidence:** Function exists and is called from admin dashboard

### Image Upload
- **File:** `src/lib/storage.ts`
- **Function:** `uploadImage(file: File, path: string = 'events/flyers/')`
- **How it works:** Uploads to Firebase Storage, returns download URL
- **Evidence:** Used in `ChessEventForm` (`src/components/admin/ChessEventForm.tsx:800-820`)

### Country ISO-2 Support
- **Files:** `src/lib/locationNormalizer.ts`, `src/components/admin/LocationAutocomplete.tsx`
- **How it works:** Google Places autocomplete extracts country code from address components; stored in `structuredLocation.countryCode`
- **Evidence:** `normalizeLocation()` accepts `countryCode`, stores in `EventLocation.countryCode`

### Currency Support
- **Files:** `src/lib/tournamentHelpers.ts:67-113`, `src/components/admin/ChessEventForm.tsx:1365-1409`
- **How it works:** Currency dropdown in pricing tier form; `formatPrice()` maps currency codes to symbols; 30+ currencies supported
- **Evidence:** Currency symbols map exists, pricing tier form includes currency dropdown

### Country-Based Filtering
- **File:** `src/lib/tournamentSearch.ts:36-158`
- **How it works:** `filterTournaments()` checks `structuredLocation.countryCode` first, then legacy fields; supports name-to-code mapping
- **Evidence:** Country matching logic in `filterTournaments()` function

### Geolocation "Near Me" Functionality
- **Files:** `src/lib/locationHelpers.ts:32-88`, `src/lib/locationContext.ts`, `src/components/tournaments/UnifiedLocationControl.tsx`
- **How it works:** 
  - `getUserLocation()` uses browser Geolocation API (only on explicit user action)
  - `LocationContext` system manages location preferences (stored in localStorage)
  - `progressiveRadiusExpansion()` filters tournaments by distance (25mi → 100mi → 300mi → country → global)
- **Evidence:** Location context system, radius expansion logic in `src/lib/locationHelpers.ts:329-423`

### Registration System
- **Files:** `src/lib/events.ts:930-1016`, `src/components/tournaments/RegistrationForm.tsx`
- **How it works:** Players register for tournaments; registration stored in `tournamentRegistrations` collection; updates `events.registeredUsers` array
- **Evidence:** `registerUserForEvent()` function, registration form component

### Rating Sync (USCF/FIDE)
- **Files:** `scripts/scrape-uscf.ts`, `scripts/scrape-fide.ts`, `.github/workflows/sync-uscf-ratings.yml`
- **How it works:** GitHub Actions workflow runs scripts to scrape USCF/FIDE ratings; stores in `playerRatings` collection
- **Evidence:** Scripts exist, workflow file exists

---

## 8) Known Gaps / Bugs / Risks (Code-Backed Only)

### Missing ISO-2 Validation
- **File:** `src/lib/locationNormalizer.ts:77`
- **Issue:** `countryCode` is stored as-is without validation
- **Risk:** Invalid country codes (e.g., "XX", "123", empty string) can be stored
- **Impact:** Country filtering may fail for invalid codes

### Inconsistent Schema Fields
- **File:** `src/lib/events.ts:28-140` (`fromFirestoreEvent()`)
- **Issue:** `structuredLocation`, `pricingTiers`, `ratingType` are not explicitly mapped in `fromFirestoreEvent()`
- **Risk:** These fields may not be available in TypeScript types even if present in Firestore
- **Impact:** Type safety issues, potential runtime errors

### Currency Formatting Ambiguity
- **File:** `src/lib/tournamentHelpers.ts:112`
- **Issue:** `price.toFixed(0)` always rounds to whole number (no decimals)
- **Risk:** Prices like $49.99 display as $50
- **Impact:** Pricing display accuracy

### Firestore Query/Index Risk
- **File:** `src/lib/events.ts:612`
- **Issue:** Query uses `where('status', '==', 'approved')` + `orderBy('createdAt', 'desc')`
- **Risk:** Requires composite index; query will fail if index not created
- **Impact:** Tournament listing page may fail to load

### Null/Undefined Crashes
- **File:** `src/lib/tournamentHelpers.ts:129-131`
- **Issue:** `countryCode.toUpperCase()` called without null check
- **Risk:** If `countryCode` is undefined, will throw TypeError
- **Impact:** Price matching may crash for tournaments without country code

### Country Name Mapping Incomplete
- **File:** `src/lib/tournamentSearch.ts:56-101`
- **Issue:** `countryNameToCode` object only maps ~30 countries
- **Risk:** Filtering by unmapped country names may fail or produce false positives
- **Impact:** Users in unmapped countries may not see their tournaments

### Location Context Hydration Mismatch
- **File:** `src/components/tournaments/UnifiedLocationControl.tsx:29-40`
- **Issue:** `getLocationContext()` called during SSR (returns default), then updated on client
- **Risk:** Hydration mismatch warnings in console
- **Impact:** React hydration errors (non-breaking but noisy)

### No Pagination
- **File:** `src/lib/events.ts:612`
- **Issue:** `getApprovedEvents()` fetches all events without limit
- **Risk:** Performance issues as event count grows
- **Impact:** Slow page loads with many tournaments

---

## 9) Trace Guide (For Debugging)

### To Trace Tournament Creation

**Start:** `/admin/events/create`

**Breakpoints:**
1. `src/components/admin/ChessEventForm.tsx:783` - Form submission handler
2. `src/components/admin/ChessEventForm.tsx:624` - Location normalization call
3. `src/lib/locationNormalizer.ts:55` - `normalizeLocation()` function entry
4. `src/lib/events.ts:142` - `createEvent()` function entry
5. `src/lib/events.ts:325` - Firestore `addDoc()` call

**What to log:**
- `formData.locationCountryCode` - Raw country code from form
- `structuredLocation.countryCode` - Normalized country code
- `eventData.pricingTiers` - Pricing tiers array with countryCode/currency
- `eventData` - Full payload before Firestore write

### To Trace Tournament Filtering

**Start:** `/tournaments`

**Breakpoints:**
1. `src/app/tournaments/page.tsx:69` - Event fetch
2. `src/lib/events.ts:610` - `getApprovedEvents()` query
3. `src/app/tournaments/page.tsx:275` - Location filtering
4. `src/lib/locationHelpers.ts:329` - `progressiveRadiusExpansion()` entry
5. `src/app/tournaments/page.tsx:347` - Search/filter application
6. `src/lib/tournamentSearch.ts:7` - `filterTournaments()` entry
7. `src/lib/tournamentSearch.ts:40` - Country code extraction
8. `src/lib/tournamentSearch.ts:51` - Country matching logic

**What to log:**
- `filters.countries` - Selected country filters
- `tournament.structuredLocation?.countryCode` - Tournament country code
- `structuredCountryCode` - Uppercased country code for matching
- `filtered.length` - Results after each filter step

### To Trace Price Display

**Start:** Any tournament card or detail page

**Breakpoints:**
1. `src/lib/tournamentHelpers.ts:121` - `getTournamentPrice()` entry
2. `src/lib/tournamentHelpers.ts:129` - Country-specific tier matching
3. `src/lib/tournamentHelpers.ts:142` - Global tier fallback
4. `src/lib/tournamentHelpers.ts:67` - `formatPrice()` entry

**What to log:**
- `tournament.pricingTiers` - All pricing tiers
- `countryCode` - Country code used for matching
- `countryTier` - Matched country-specific tier (if any)
- `globalTier` - Fallback global tier
- `currency` - Selected currency code
- `price` - Final price value

### To Trace Country Code Flow

**Start:** Admin form location input

**Breakpoints:**
1. `src/components/admin/LocationAutocomplete.tsx:151` - Place selection
2. `src/components/admin/ChessEventForm.tsx:635` - Country code extraction
3. `src/lib/locationNormalizer.ts:77` - Country code storage
4. `src/lib/events.ts:276` - Structured location write to Firestore

**What to log:**
- `autocompleteResult.addressComponents` - Raw address components
- `formData.locationCountryCode` - Form state country code
- `location.countryCode` - Normalized location country code
- `eventData.structuredLocation.countryCode` - Final stored value

---

## APPENDIX A: Key Files List

1. **`src/lib/types.ts`** - TypeScript type definitions for events, users, pricing, location
2. **`src/lib/events.ts`** - Firestore CRUD operations for events (create, read, update, delete, approve)
3. **`src/components/admin/ChessEventForm.tsx`** - Main admin form for creating/editing tournaments
4. **`src/lib/tournamentSearch.ts`** - Client-side filtering logic (search, country, city, date, rating, price)
5. **`src/lib/tournamentHelpers.ts`** - Price formatting, date formatting, price extraction with country matching
6. **`src/app/tournaments/page.tsx`** - Public tournaments listing page with filtering and location-based sorting
7. **`src/lib/locationNormalizer.ts`** - Normalizes location form data into structured EventLocation object with geo metadata
8. **`src/lib/locationContext.ts`** - Manages user location preferences (anywhere/GPS/place) with localStorage persistence
9. **`src/lib/locationHelpers.ts`** - Geolocation API wrapper, distance calculation, progressive radius expansion filtering
10. **`src/components/admin/LocationAutocomplete.tsx`** - Google Places autocomplete component for location input
11. **`src/components/tournaments/UnifiedLocationControl.tsx`** - UI component for location scope and proximity controls
12. **`src/app/events/[id]/page.tsx`** - Tournament detail page with registration functionality
13. **`src/lib/storage.ts`** - Firebase Storage image upload utility
14. **`firestore.rules`** - Firestore security rules for collections (events, users, registrations, ratings)
15. **`apphosting.yaml`** - Firebase App Hosting configuration with environment variable mappings

---

**Document End**

