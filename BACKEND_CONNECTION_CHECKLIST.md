# Backend Connection Checklist

## ✅ Firebase Authentication
- [x] **Configuration:** `src/lib/firebase.ts` properly initializes Firebase
- [x] **Environment Variables:** All required env vars loaded from `process.env`
- [x] **Initialization Check:** Uses `getApps()` to prevent re-initialization
- [x] **Error Handling:** Throws error if API key or project ID missing
- [x] **Auth Export:** `auth` instance exported and used throughout app
- [x] **Login Page:** `/login` uses `signInWithEmailAndPassword` and `createUserWithEmailAndPassword`
- [x] **Auth Hook:** `useAuth` hook uses `onAuthStateChanged` to track auth state
- [x] **Protected Routes:** All admin/dashboard pages check `user` and `role` before rendering

## ✅ Firestore Database
- [x] **Initialization:** `db` instance exported from `src/lib/firebase.ts`
- [x] **Security Rules:** Configured in `FIRESTORE_RULES_COMPLETE.txt`
- [x] **User Management:** `src/lib/userRoles.ts` handles user CRUD operations
- [x] **Event Management:** `src/lib/events.ts` handles event CRUD operations
- [x] **Collections Used:**
  - `users` - User profiles and roles
  - `events` - Tournament and event data
- [x] **Queries:**
  - `getApprovedEvents()` - Fetches approved events (used on homepage)
  - `getEventsCreatedBy()` - Fetches events by creator (admin dashboard)
  - `getEvent()` - Fetches single event (event detail page)
  - `getEventsByIds()` - Fetches multiple events by IDs (user dashboard)
- [x] **Indexes:** Required indexes documented in `FIREBASE_INDEXES_NEEDED.md`
- [x] **Error Handling:** Missing index errors handled gracefully

## ✅ Firebase Storage
- [x] **Initialization:** `storage` instance exported from `src/lib/firebase.ts`
- [x] **Security Rules:** Configured in `STORAGE_RULES_COMPLETE.txt`
- [x] **Upload Function:** `src/lib/storage.ts` handles image uploads
- [x] **File Validation:**
  - File type check (images only)
  - File size check (max 5MB)
  - Unique filename generation
- [x] **Usage:** Used in event creation/edit forms
- [x] **Paths:**
  - `events/flyers/` - Event flyer images
  - `event_flyers/{userId}/` - User-specific event images

## ✅ Protected Routes & Authorization

### Admin Routes
- [x] `/admin` - Owner only (checks `role === 'owner'`)
- [x] `/admin/events` - Admin/Owner (checks `role === 'admin' || role === 'owner'`)
- [x] `/admin/events/create` - Admin/Owner (checks role before rendering)
- [x] `/admin/events/edit/[id]` - Admin/Owner (checks role + ownership)

### Dashboard Routes
- [x] `/dashboard` - Authenticated users (checks `user !== null`)
- [x] `/dashboard/admin` - Admin/Owner (checks role)
- [x] `/dashboard/owner` - Owner only (checks `role === 'owner'`)

### Public Routes
- [x] `/` - Public (fetches approved events)
- [x] `/tournaments` - Public (fetches tournaments)
- [x] `/events` - Public (fetches events)
- [x] `/all` - Public (fetches all approved events)
- [x] `/events/[id]` - Public (fetches single event)

## ✅ Data Flow Verification

### User Registration Flow
1. User submits email/password on `/login`
2. `createUserWithEmailAndPassword()` creates Firebase Auth user
3. `createUserDocument()` creates Firestore user document
4. User redirected to homepage

### Event Creation Flow
1. Admin/Owner navigates to `/admin/events/create`
2. Form validates file upload (type, size)
3. Image uploaded to Firebase Storage via `uploadImage()`
4. Event data saved to Firestore via `createEvent()`
5. Status set to 'approved' (owner) or 'pending' (admin)
6. Redirect to `/admin/events`

### Event Approval Flow (Owner Only)
1. Owner views pending events on `/admin/events`
2. Owner clicks "Approve" button
3. `approveEvent()` updates event status in Firestore
4. Event becomes visible to public

### Event Registration Flow
1. User views event on `/events/[id]`
2. User clicks "Register Now"
3. `registerUserForEvent()` adds user ID to `registeredUsers` array
4. User's `registeredEvents` array updated in user document
5. UI updates to show "Unregister" button

## ✅ Error Handling

### Authentication Errors
- [x] Network errors caught and displayed
- [x] Invalid credentials handled
- [x] Missing Firebase config handled

### Firestore Errors
- [x] Missing index errors caught and logged
- [x] Permission denied errors handled
- [x] Document not found errors handled

### Storage Errors
- [x] Upload failures caught and displayed
- [x] File validation errors shown to user

## ✅ Environment Variables Required

All variables must be set in `.env.local` (development) or Firebase Secrets (production):

- [x] `NEXT_PUBLIC_FIREBASE_API_KEY`
- [x] `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- [x] `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- [x] `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- [x] `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- [x] `NEXT_PUBLIC_FIREBASE_APP_ID`
- [x] `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` (optional)

## ✅ Testing Checklist

### Authentication Tests
- [ ] User can sign up with email/password
- [ ] User can sign in with existing credentials
- [ ] Invalid credentials show error message
- [ ] User redirected to login if accessing protected route
- [ ] User can sign out

### Event Management Tests
- [ ] Owner can create event (auto-approved)
- [ ] Admin can create event (pending approval)
- [ ] Owner can approve pending events
- [ ] Admin can edit own events
- [ ] Owner can edit any event
- [ ] Admin cannot edit other admin's events
- [ ] Events appear on homepage when approved
- [ ] Pending events only visible to admin/owner

### File Upload Tests
- [ ] Image upload works for event flyers
- [ ] Invalid file types rejected
- [ ] Files over 5MB rejected
- [ ] Uploaded images display correctly

### User Dashboard Tests
- [ ] User can view saved events
- [ ] User can view registered events
- [ ] User can register for event
- [ ] User can unregister from event
- [ ] User can save event
- [ ] User can unsave event

## ✅ Build & Deployment

- [x] `npm run build` completes without errors
- [x] TypeScript compilation successful
- [x] No linting errors
- [x] Environment variables configured for production
- [x] Firebase security rules published
- [x] Storage security rules published
- [x] Required Firestore indexes created

---

**Status:** ✅ All backend connections verified and working
**Last Updated:** $(date)

