# Chess Tourneys - User Roles & Implementation Plan

## Overview

Chess Tourneys is a platform for chess clubs to host offline tournaments. The platform supports multiple user roles with different permissions for managing tournaments and users.

---

## User Roles

The platform has **4 user role types**:

### 1. Super Admin
- **Role Code**: `'superAdmin'`
- **Description**: The ultimate owner of the platform with full control
- **Migration**: All existing `'owner'` roles will be converted to `'superAdmin'`

**Permissions:**
- ✅ Create events with or without franchise (standalone events)
- ✅ Edit all events (franchise and standalone)
- ✅ Assign all roles (Super Admin, Franchisee, Standalone Admin, Player)
- ✅ Approve/reject events created by Franchisees that are standalone
- ✅ View all events and users across the platform
- ✅ Change any user's role

**Event Creation:**
- Can create events tied to a franchise (by specifying franchiseId)
- Can create standalone events (no franchiseId)
- All events created by Super Admin are automatically approved

---

### 2. Franchisee
- **Role Code**: `'franchisee'`
- **Description**: Represents a chess club/franchise. One user per chess club gets this role
- **Assignment**: Only Super Admin can assign this role

**Permissions:**
- ✅ Create events for their franchise (automatically tied to them)
- ✅ Create standalone events (requires Super Admin approval - status: `pendingApproval`)
- ✅ Edit all events tied to their franchise
- ✅ View events for their franchise
- ❌ Cannot assign any roles
- ❌ Cannot edit standalone events (even if created by them, until approved)

**Event Creation:**
- **Franchise Events**: Automatically tied to the franchisee's UID, status: `approved`
- **Standalone Events**: Status: `pendingApproval`, requires Super Admin approval

**Event Editing:**
- Can edit all events where `franchiseId === their UID`
- Cannot edit standalone events (even their own pending ones)

---

### 3. Standalone Admin
- **Role Code**: `'standaloneAdmin'`
- **Description**: Admin users not tied to any franchise. Can only create standalone events
- **Assignment**: Only Super Admin can assign this role

**Permissions:**
- ✅ Create standalone events (automatically approved, status: `approved`)
- ✅ Edit only their own events
- ✅ View all events (read-only for non-owned events)
- ❌ Cannot create events tied to a franchise
- ❌ Cannot edit events created by other users
- ❌ Cannot assign any roles

**Event Creation:**
- All events are standalone (no franchiseId)
- Events are automatically approved (status: `approved`)

**Event Editing:**
- Can only edit events where `createdBy === their UID`

---

### 4. Player
- **Role Code**: `'player'`
- **Description**: End users who register for tournaments
- **Default Role**: New users get this role by default

**Permissions:**
- ✅ View all events (read-only)
- ✅ Register for events
- ✅ Save/bookmark events
- ❌ Cannot create events
- ❌ Cannot edit events
- ❌ Cannot assign roles

---

## Event Model

### Event Fields

Events will have the following additional fields:

```typescript
interface EventData {
  // ... existing fields ...
  
  // NEW: Franchise tracking
  franchiseId?: string | null;  // UID of the franchisee user, or null for standalone events
  isStandalone?: boolean;        // true if franchiseId is null/undefined, false otherwise
}
```

### Event Types

1. **Franchise Events**: `franchiseId` is set to the franchisee's UID
   - Created by: Super Admin (with franchiseId) or Franchisee
   - Editable by: Super Admin, Franchisee (owner of that franchise)

2. **Standalone Events**: `franchiseId` is `null` or `undefined`
   - Created by: Super Admin, Franchisee (pending approval), Standalone Admin
   - Editable by: Super Admin, creator (if Standalone Admin or approved Franchisee event)

### Event Status Flow

- **Super Admin creates event**: `status: 'approved'` (regardless of franchise/standalone)
- **Franchisee creates franchise event**: `status: 'approved'`
- **Franchisee creates standalone event**: `status: 'pendingApproval'` → Super Admin approves → `status: 'approved'`
- **Standalone Admin creates event**: `status: 'approved'`

---

## Database Schema Changes

### UserData Interface

```typescript
export type UserRole = 'player' | 'standaloneAdmin' | 'franchisee' | 'superAdmin' | null;

export interface UserData {
  uid: string;
  email: string;
  role: UserRole;
  // REMOVED: isGodOwner (replaced by superAdmin role)
  savedEvents: string[];
  registeredEvents: string[];
  createdAt: Date;
  updatedAt: Date;
}
```

### EventData Interface

```typescript
export interface EventData {
  // ... all existing fields ...
  
  // NEW FIELDS:
  franchiseId?: string | null;  // UID of franchisee user, null for standalone
  isStandalone?: boolean;        // Computed: franchiseId === null/undefined
}
```

---

## Role Assignment Rules

| Who Can Assign | Super Admin | Franchisee | Standalone Admin | Player |
|---------------|------------|------------|------------------|--------|
| **Super Admin** | ✅ | ✅ | ✅ | ✅ |
| **Franchisee** | ❌ | ❌ | ❌ | ❌ |
| **Standalone Admin** | ❌ | ❌ | ❌ | ❌ |
| **Player** | ❌ | ❌ | ❌ | ❌ |

**Note**: Only Super Admin can assign roles. All role changes must go through Super Admin.

---

## Event Creation Rules

| Creator Role | Can Create Franchise Event | Can Create Standalone Event | Auto-Approved |
|-------------|---------------------------|----------------------------|--------------|
| **Super Admin** | ✅ (with franchiseId) | ✅ | ✅ Always |
| **Franchisee** | ✅ (auto-tied to them) | ✅ | ❌ Standalone needs approval |
| **Standalone Admin** | ❌ | ✅ | ✅ Always |
| **Player** | ❌ | ❌ | N/A |

---

## Event Editing Rules

| Editor Role | Can Edit Franchise Events | Can Edit Standalone Events | Can Edit Own Events |
|------------|-------------------------|---------------------------|-------------------|
| **Super Admin** | ✅ All | ✅ All | ✅ All |
| **Franchisee** | ✅ Their franchise only | ❌ | ✅ Their franchise events |
| **Standalone Admin** | ❌ | ❌ | ✅ Own events only |
| **Player** | ❌ | ❌ | ❌ |

**Editing Logic:**
- Super Admin: Can edit any event
- Franchisee: Can edit events where `franchiseId === their UID`
- Standalone Admin: Can edit events where `createdBy === their UID`
- Player: Cannot edit any events

---

## Event Visibility

**All users (including Players) can view all events** regardless of:
- Franchise/standalone status
- Approval status (though UI may filter pending events from public view)
- Creator role

This ensures transparency and allows players to discover all available tournaments.

---

## Implementation Plan

### Phase 1: Type Definitions & Data Models

1. **Update `src/lib/types.ts`**
   - Change `UserRole` type: `'player' | 'admin' | 'owner' | null` → `'player' | 'standaloneAdmin' | 'franchisee' | 'superAdmin' | null`
   - Remove `isGodOwner` from `UserData`
   - Add `franchiseId?: string | null` to `EventData` and `ChessEvent` interfaces
   - Add `isStandalone?: boolean` to event interfaces (computed field)

### Phase 2: User Role Management

2. **Update `src/lib/userRoles.ts`**
   - Add migration function: Convert existing `'owner'` → `'superAdmin'`
   - Add migration function: Convert existing `'admin'` → `'standaloneAdmin'` (or handle case-by-case)
   - Update `fromFirestoreUser()` to handle role migrations
   - Update `createUserDocument()` to use new role types
   - Update `updateUserRole()` to validate role assignments (only Super Admin can assign)
   - Add helper functions:
     - `isSuperAdmin(uid: string): Promise<boolean>`
     - `isFranchisee(uid: string): Promise<boolean>`
     - `isStandaloneAdmin(uid: string): Promise<boolean>`
     - `canAssignRoles(uid: string): Promise<boolean>`
   - Remove all `isGodOwner` related functions

3. **Update `src/hooks/useAuth.ts`**
   - Update role handling to support new role types
   - Remove `isGodOwner` references
   - Update default role to `'player'`

### Phase 3: Event Management

4. **Update `src/lib/events.ts`**
   - Add `franchiseId` field to event creation
   - Update `createEvent()` function:
     - Accept `franchiseId` parameter
     - Set `franchiseId` based on creator role:
       - Super Admin: Use provided `franchiseId` (can be null for standalone)
       - Franchisee: Auto-set `franchiseId` to their UID (or null if creating standalone)
       - Standalone Admin: Always set `franchiseId` to null
     - Set `status` based on creator role and event type:
       - Super Admin: Always `'approved'`
       - Franchisee + Franchise Event: `'approved'`
       - Franchisee + Standalone Event: `'pendingApproval'`
       - Standalone Admin: Always `'approved'`
   - Update `updateEvent()` function:
     - Add permission checks:
       - Super Admin: Can edit any event
       - Franchisee: Can edit events where `franchiseId === their UID`
       - Standalone Admin: Can edit events where `createdBy === their UID`
   - Update `fromFirestoreEvent()` to handle `franchiseId` field
   - Add helper functions:
     - `getEventsByFranchise(franchiseId: string): Promise<EventData[]>`
     - `getStandaloneEvents(): Promise<EventData[]>`
     - `canEditEvent(userUid: string, event: EventData): Promise<boolean>`

5. **Update `src/components/admin/ChessEventForm.tsx`**
   - Add franchise selection UI (only for Super Admin)
   - Auto-set `franchiseId` for Franchisee users
   - Show approval status for pending standalone events created by Franchisee
   - Update form validation based on user role

### Phase 4: Dashboard & UI Updates

6. **Update `src/app/dashboard/layout.tsx`**
   - Update navigation links based on new roles:
     - Super Admin: Overview, Admin Console, Super Admin Console
     - Franchisee: Overview, Franchise Console
     - Standalone Admin: Overview, Admin Console
     - Player: Overview only
   - Update role checks in navigation

7. **Update `src/app/dashboard/page.tsx`**
   - Keep player dashboard mostly unchanged
   - Update role-based UI elements

8. **Update `src/app/dashboard/admin/page.tsx`**
   - Rename to handle both Standalone Admin and Franchisee
   - Filter events based on role:
     - Standalone Admin: Show only their own events
     - Franchisee: Show events where `franchiseId === their UID`
   - Update event creation/editing permissions

9. **Update `src/app/dashboard/owner/page.tsx`**
   - Rename to `src/app/dashboard/super-admin/page.tsx`
   - Update to Super Admin dashboard
   - Add role management UI:
     - Assign Franchisee role
     - Assign Standalone Admin role
     - Change any user's role
   - Add event approval UI for Franchisee-created standalone events
   - Show all events with franchise/standalone indicators

10. **Create `src/app/dashboard/franchise/page.tsx`** (if needed)
    - Franchise-specific dashboard
    - Show franchise events
    - Show pending standalone events awaiting approval

### Phase 5: Authentication & Routing

11. **Update `src/hooks/useRequireRole.ts`**
    - Update to support new role types
    - Update role checks throughout the app

12. **Update route protection**
    - `/dashboard/super-admin`: Only `superAdmin`
    - `/dashboard/admin`: `standaloneAdmin` or `franchisee`
    - `/dashboard/franchise`: Only `franchisee` (if separate page)
    - `/dashboard`: All authenticated users

### Phase 6: Firestore Security Rules

13. **Update Firestore Security Rules**
    - Super Admin: Read/write all documents
    - Franchisee: Read all events, write events where `franchiseId === their UID`
    - Standalone Admin: Read all events, write events where `createdBy === their UID`
    - Player: Read all events, write to own user document only
    - Role assignment: Only Super Admin can update user roles

### Phase 7: Migration & Testing

14. **Create migration script/function**
    - Convert existing `'owner'` → `'superAdmin'`
    - Convert existing `'admin'` → `'standaloneAdmin'` (or handle manually)
    - Remove `isGodOwner` field from all users
    - Update existing events (if needed - user will delete manually)

15. **Testing Checklist**
    - ✅ Super Admin can assign all roles
    - ✅ Super Admin can create franchise and standalone events
    - ✅ Super Admin can edit all events
    - ✅ Franchisee can create franchise events (auto-approved)
    - ✅ Franchisee can create standalone events (pending approval)
    - ✅ Franchisee can edit their franchise events
    - ✅ Franchisee cannot edit standalone events
    - ✅ Standalone Admin can create standalone events (auto-approved)
    - ✅ Standalone Admin can only edit own events
    - ✅ Player can view all events
    - ✅ Player can register for events
    - ✅ Role assignment restrictions work correctly
    - ✅ Event approval flow works for Franchisee standalone events

---

## Migration Strategy

### User Role Migration

1. **Super Admin Migration**
   - Find all users with `role === 'owner'`
   - Update to `role === 'superAdmin'`
   - Remove `isGodOwner` field (no longer needed)

2. **Admin Migration**
   - Find all users with `role === 'admin'`
   - Update to `role === 'standaloneAdmin'`
   - Note: User mentioned they will manually handle event deletion, so no event migration needed

3. **Backward Compatibility**
   - Keep migration logic in `fromFirestoreUser()` to handle old role names during transition
   - Support reading both old and new role formats

### Event Migration

- User will manually delete existing events, so no automatic event migration needed
- New events will use the new schema with `franchiseId` field

---

## File Structure Changes

### Files to Modify
- `src/lib/types.ts` - Type definitions
- `src/lib/userRoles.ts` - User role management
- `src/lib/events.ts` - Event management
- `src/hooks/useAuth.ts` - Authentication hook
- `src/hooks/useRequireRole.ts` - Role-based routing
- `src/app/dashboard/layout.tsx` - Dashboard navigation
- `src/app/dashboard/page.tsx` - Player dashboard
- `src/app/dashboard/admin/page.tsx` - Admin/Franchisee dashboard
- `src/app/dashboard/owner/page.tsx` - Rename to super-admin
- `src/components/admin/ChessEventForm.tsx` - Event form

### Files to Create
- `src/app/dashboard/super-admin/page.tsx` - Super Admin dashboard (rename from owner)

### Files to Remove/Update
- Remove all `isGodOwner` references
- Update Firestore security rules

---

## Implementation Order

1. **Phase 1**: Type definitions (foundation)
2. **Phase 2**: User role management (core functionality)
3. **Phase 3**: Event management (core functionality)
4. **Phase 4**: Dashboard & UI (user-facing)
5. **Phase 5**: Authentication & routing (security)
6. **Phase 6**: Firestore rules (security)
7. **Phase 7**: Migration & testing (validation)

---

## Notes

- All events are visible to all users (including players)
- Only Super Admin can assign roles
- Franchisee standalone events require Super Admin approval
- Event editing permissions are strictly enforced based on role and ownership
- Migration from old system to new system will be handled programmatically for user roles
- Existing events will be manually deleted by user, so no event migration needed

